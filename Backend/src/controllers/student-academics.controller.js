import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const enrollStudentToNewAcademic = asyncHandler(async (req, res) => {
    const { studentId, class:studentClass, totalfee } = req.body;

    if (!studentId || !studentClass || !totalfee) {
        throw new ApiError(400, "Missing required fields");
    }

    const [currentYear] = await pool.query("SELECT * FROM academic_years WHERE is_current = 1");
    const yearId = currentYear[0].id;

    const[existing] = await pool.query("SELECT * FROM student_academics WHERE student_id = ? AND academic_year_id = ?", [studentId, yearId]); 

    if(existing && existing.length > 0){
        throw new ApiError(400, "Student already enrolled to this year");
    }

    await pool.query("INSERT INTO student_academics (student_id, class, academic_year_id, total_fee) VALUES (?, ?, ?, ?)", [studentId, studentClass, yearId, totalfee]);

    return res.status(200)
        .json(
        new ApiResponse(200, "Student enrolled successfully")
    )
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

    return res.status(200)
        .json(
        new ApiResponse(200, academicyears, "Students found")
    )
})

export {
    enrollStudentToNewAcademic,
    getStudentAcademicYears
}