import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getNextClassSuggestion = (value) => {
    const text = String(value ?? "").trim();
    const match = text.match(/^(\d+)(st|nd|rd|th)$/i);

    if (!match) {
        return text;
    }

    const nextNumber = Number(match[1]) + 1;
    if (nextNumber === 11 || nextNumber === 12 || nextNumber === 13) {
        return `${nextNumber}th`;
    }

    const unit = nextNumber % 10;
    if (unit === 1) return `${nextNumber}st`;
    if (unit === 2) return `${nextNumber}nd`;
    if (unit === 3) return `${nextNumber}rd`;
    return `${nextNumber}th`;
};

const enrollStudentToNewAcademic = asyncHandler(async (req, res) => {
    const { studentId, class: studentClass, totalfee } = req.body;

    if (!studentId || !studentClass || !totalfee) {
        throw new ApiError(400, "Missing required fields");
    }

    const [currentYearRows] = await pool.query("SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1");
    if (!currentYearRows || currentYearRows.length === 0) {
        throw new ApiError(404, "Current academic year not found");
    }

    const yearId = currentYearRows[0].id;

    const [existing] = await pool.query(
        "SELECT id FROM student_academics WHERE student_id = ? AND academic_year_id = ? LIMIT 1",
        [studentId, yearId]
    );

    if (existing && existing.length > 0) {
        throw new ApiError(400, "Student already enrolled to this year");
    }

    await pool.query(
        "INSERT INTO student_academics (student_id, class, academic_year_id, total_fee) VALUES (?, ?, ?, ?)",
        [studentId, studentClass, yearId, totalfee]
    );

    return res.status(200).json(new ApiResponse(200, null, "Student enrolled successfully"));
});

const getStudentAcademicYears = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    const [academicyears] = await pool.query(
        `SELECT
            ay.id AS year_id,
            ay.year_name,
            ay.is_current,
            ay.is_active,
            sa.class,
            sa.total_fee,
            sa.paid_amount,
            sa.due_amount
        FROM student_academics sa
        JOIN academic_years ay ON sa.academic_year_id = ay.id
        WHERE sa.student_id = ?
        ORDER BY ay.year_name DESC, ay.id DESC`,
        [studentId]
    );

    return res.status(200).json(new ApiResponse(200, academicyears, "Students found"));
});

const getCarryForwardCandidates = asyncHandler(async (req, res) => {
    const sourceYearId = Number(req.query.sourceYearId);
    let targetYearId = Number(req.query.targetYearId);
    const classFilter = String(req.query.class ?? "").trim();
    const nameFilter = String(req.query.name ?? "").trim();

    if (!Number.isFinite(sourceYearId) || sourceYearId <= 0) {
        throw new ApiError(400, "sourceYearId is required");
    }

    const [[sourceYear]] = await pool.query(
        "SELECT id, year_name FROM academic_years WHERE id = ? LIMIT 1",
        [sourceYearId]
    );

    if (!sourceYear) {
        throw new ApiError(404, "Source academic year not found");
    }

    if (!Number.isFinite(targetYearId) || targetYearId <= 0) {
        const [[currentYear]] = await pool.query(
            "SELECT id, year_name FROM academic_years WHERE is_current = 1 LIMIT 1"
        );

        if (!currentYear) {
            throw new ApiError(404, "Current academic year not found");
        }

        targetYearId = Number(currentYear.id);
    }

    if (sourceYearId === targetYearId) {
        throw new ApiError(400, "Source and target academic year cannot be same");
    }

    const [[targetYear]] = await pool.query(
        "SELECT id, year_name FROM academic_years WHERE id = ? LIMIT 1",
        [targetYearId]
    );

    if (!targetYear) {
        throw new ApiError(404, "Target academic year not found");
    }

    const [sourceStudents] = await pool.query(
        `SELECT
            s.id AS studentId,
            s.full_name,
            s.parent_name,
            sa.class,
            sa.total_fee
         FROM student_academics sa
         JOIN students s ON s.id = sa.student_id
         WHERE sa.academic_year_id = ?
         ORDER BY s.full_name ASC`,
        [sourceYearId]
    );

    const [targetEnrollments] = await pool.query(
        `SELECT
            sa.student_id,
            sa.class,
            sa.total_fee
         FROM student_academics sa
         WHERE sa.academic_year_id = ?`,
        [targetYearId]
    );

    const targetByStudentId = new Map(targetEnrollments.map((row) => [Number(row.student_id), row]));

    let rows = sourceStudents.map((row) => {
        const studentId = Number(row.studentId);
        const enrollment = targetByStudentId.get(studentId) ?? null;

        return {
            studentId,
            full_name: row.full_name,
            parent_name: row.parent_name,
            previous_class: row.class,
            suggested_class: getNextClassSuggestion(row.class),
            previous_total_fee: Number(row.total_fee ?? 0),
            already_enrolled: !!enrollment,
            target_class: enrollment?.class ?? null,
            target_total_fee: enrollment ? Number(enrollment.total_fee ?? 0) : null,
        };
    });

    if (classFilter) {
        rows = rows.filter((item) => String(item.previous_class ?? "").toLowerCase() === classFilter.toLowerCase());
    }

    if (nameFilter) {
        rows = rows.filter((item) => String(item.full_name ?? "").toLowerCase().includes(nameFilter.toLowerCase()));
    }

    const sourceIds = new Set(rows.map((item) => Number(item.studentId)));
    const newJoinsCount = targetEnrollments.filter((row) => !sourceIds.has(Number(row.student_id))).length;
    const alreadyEnrolledCount = rows.filter((item) => item.already_enrolled).length;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                sourceYear,
                targetYear,
                rows,
                summary: {
                    source_count: rows.length,
                    eligible_count: rows.length - alreadyEnrolledCount,
                    already_enrolled_count: alreadyEnrolledCount,
                    new_joins_in_target_count: newJoinsCount,
                },
            },
            "Carry-forward candidates fetched"
        )
    );
});

const bulkContinueStudents = asyncHandler(async (req, res) => {
    const targetYearId = Number(req.body.targetYearId);
    const students = Array.isArray(req.body.students) ? req.body.students : [];

    if (!Number.isFinite(targetYearId) || targetYearId <= 0) {
        throw new ApiError(400, "targetYearId is required");
    }

    if (students.length === 0) {
        throw new ApiError(400, "students is required");
    }

    const [[targetYear]] = await pool.query(
        "SELECT id FROM academic_years WHERE id = ? LIMIT 1",
        [targetYearId]
    );

    if (!targetYear) {
        throw new ApiError(404, "Target academic year not found");
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let inserted = 0;
        let skipped = 0;
        const results = [];

        for (const student of students) {
            const studentId = Number(student?.studentId);
            const studentClass = String(student?.class ?? "").trim();
            const totalFee = Number(student?.totalfee);

            if (!Number.isFinite(studentId) || studentId <= 0 || !studentClass || !Number.isFinite(totalFee) || totalFee <= 0) {
                skipped += 1;
                results.push({ studentId: Number.isFinite(studentId) ? studentId : null, status: "skipped", reason: "invalid payload" });
                continue;
            }

            const [[existing]] = await connection.query(
                "SELECT id FROM student_academics WHERE student_id = ? AND academic_year_id = ? LIMIT 1",
                [studentId, targetYearId]
            );

            if (existing) {
                skipped += 1;
                results.push({ studentId, status: "skipped", reason: "already enrolled" });
                continue;
            }

            await connection.query(
                "INSERT INTO student_academics (student_id, class, academic_year_id, total_fee) VALUES (?, ?, ?, ?)",
                [studentId, studentClass, targetYearId, totalFee]
            );

            inserted += 1;
            results.push({ studentId, status: "inserted" });
        }

        await connection.commit();

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    targetYearId,
                    inserted,
                    skipped,
                    processed: students.length,
                    results,
                },
                "Students promoted successfully"
            )
        );
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export {
    enrollStudentToNewAcademic,
    getStudentAcademicYears,
    getCarryForwardCandidates,
    bulkContinueStudents,
};
