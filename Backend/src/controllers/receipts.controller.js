import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const recalculatePaidAmount = async (connection, studentAcademicId) => {
    await connection.query(
        `UPDATE student_academics sa
         SET sa.paid_amount = (
            SELECT COALESCE(SUM(r.amount), 0)
            FROM receipts r
            WHERE r.student_academic_id = sa.id
         )
         WHERE sa.id = ?`,
        [studentAcademicId]
    );
};

const createReceipt = asyncHandler(async (req, res) => {
    const { studentId, studentClass, academicYearId, amount, paymentMode, paymentDate, remarks } = req.body;

    if(!studentId || !studentClass || !amount || !paymentMode || !paymentDate){
        throw new ApiError(400, "All fields are required");
    }

    const receiptAmount = toPositiveAmount(amount);

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let targetAcademicYearId = academicYearId;

        if(!targetAcademicYearId) {
            const [[currentYear]] = await connection.query(
                "SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1"
            );

            if(!currentYear) {
                throw new ApiError(404, "Current academic year not found");
            }

            targetAcademicYearId = currentYear.id;
        }

        const [[studentAcademic]] = await connection.query(
            `SELECT id, (total_fee - paid_amount) AS due_amount
             FROM student_academics
             WHERE student_id = ?
               AND class = ?
               AND academic_year_id = ?
             FOR UPDATE`,
            [studentId, studentClass, targetAcademicYearId]
        );

        if (!studentAcademic) {
            throw new ApiError(404, "Student academic record not found");
        }

        const dueAmount = Number(studentAcademic.due_amount ?? 0);
        if (receiptAmount > dueAmount) {
            throw new ApiError(400, `Payment exceeds due amount. Current due is ${dueAmount}`);
        }

        const [insertResult] = await connection.query(
            `INSERT INTO receipts
             (student_academic_id, receipt_number, amount, payment_mode, payment_date, remarks)
             VALUES (?, CONCAT('RCPT-', UPPER(LEFT(MD5(RAND()),6))), ?, ?, ?, ?)`,
            [studentAcademic.id, receiptAmount, paymentMode, paymentDate, remarks]
        );

        const receiptId = insertResult.insertId;

        const [[createdReceipt]] = await connection.query(
            "SELECT student_academic_id FROM receipts WHERE id = ?",
            [receiptId]
        );

        if (!createdReceipt?.student_academic_id) {
            throw new ApiError(500, "Failed to resolve created receipt");
        }

        await recalculatePaidAmount(connection, createdReceipt.student_academic_id);

        const [receiptDetails] = await connection.query(
            `SELECT 
                r.receipt_number,
                s.full_name,
                sa.class,
                ay.year_name,
                r.amount,
                r.payment_mode,
                DATE_FORMAT(r.payment_date, '%Y-%m-%d') AS payment_date,
                r.remarks
            FROM receipts r
            JOIN student_academics sa ON r.student_academic_id = sa.id
            JOIN students s ON s.id = sa.student_id
            JOIN academic_years ay ON ay.id = sa.academic_year_id
            WHERE r.id = ?`,
            [receiptId]
        );

        await connection.commit();

        return res.status(201)
            .json(
                new ApiResponse(201, receiptDetails, "Receipt created successfully")
            )
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

const getReceiptById = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    const [receipt] = await pool.query("SELECT r.receipt_number, s.full_name, sa.class, ay.year_name, r.amount, r.payment_mode, DATE_FORMAT(r.payment_date, '%Y-%m-%d') AS payment_date, r.remarks FROM receipts r JOIN student_academics sa ON r.student_academic_id = sa.id JOIN students s ON sa.student_id = s.id JOIN academic_years ay ON sa.academic_year_id = ay.id  WHERE r.id = ?", [receiptId]);

    if(!receipt || receipt.length === 0){
        throw new ApiError(404, "Receipt not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, receipt[0], "Receipt fetched successfully")
        )
});

// Get receipt by filter like year and receiptNo and class
const getReceipts = asyncHandler(async (req, res) => {
    const { year, receiptNo, class:studentClass } = req.query;

    // Fetch active year from DB if year is not provided
    let activeYear = year;
    if (!activeYear) {
        const [[currentYear]] = await pool.query(
            "SELECT year_name FROM academic_years WHERE is_active = 1 LIMIT 1"
        );

        if (!currentYear) {
            throw new ApiError(404, "No active academic year found");
        }

        activeYear = currentYear.year_name;
    }

    let query = `
        SELECT 
            r.id AS receipt_id, 
            r.receipt_number, 
            s.full_name, 
            sa.class, 
            ay.year_name, 
            r.amount, 
            r.payment_mode, 
            DATE_FORMAT(r.payment_date, '%Y-%m-%d') AS payment_date 
        FROM receipts r 
        JOIN student_academics sa ON r.student_academic_id = sa.id 
        JOIN students s ON sa.student_id = s.id 
        JOIN academic_years ay ON sa.academic_year_id = ay.id
        WHERE 1=1
    `;
    let params = [];

    if (activeYear) {
        query += " AND ay.year_name = ?";
        params.push(activeYear);
    }

    if(studentClass) {
        query += " AND sa.class = ?"
        params.push(studentClass);
    }

    if (receiptNo) {
        query += " AND r.receipt_number = ?";
        params.push(receiptNo);
    }

    query += " ORDER BY r.payment_date DESC";

    const [receipts] = await pool.query(query, params);

    return res.status(200).json(
        new ApiResponse(200, receipts, "Receipts fetched successfully")
    );
});

const updateReceipt = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;
    const { amount, paymentMode, paymentDate, remarks } = req.body;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    if (
        amount === undefined &&
        paymentMode === undefined &&
        paymentDate === undefined &&
        remarks === undefined
    ) {
        throw new ApiError(400, "No fields provided to update");
    }

        const clean = (v) => {
                if (v === undefined || v === null) return null;
                const normalized = String(v).trim();
                return normalized !== "" ? normalized : null;
        };

        const connection = await pool.getConnection();

        try {
                await connection.beginTransaction();

                const [[existingReceipt]] = await connection.query(
                    "SELECT student_academic_id, amount FROM receipts WHERE id = ? FOR UPDATE",
                        [receiptId]
                );

                if (!existingReceipt) {
                        throw new ApiError(404, "Receipt not found");
                }

                const normalizedAmount = clean(amount);
                const nextAmount = normalizedAmount === null ? null : toPositiveAmount(normalizedAmount);

                if (nextAmount !== null) {
                    const [[academic]] = await connection.query(
                        "SELECT total_fee, paid_amount FROM student_academics WHERE id = ? FOR UPDATE",
                        [existingReceipt.student_academic_id]
                    );

                    if (!academic) {
                        throw new ApiError(404, "Student academic record not found");
                    }

                    const totalFee = Number(academic.total_fee ?? 0);
                    const paidAmount = Number(academic.paid_amount ?? 0);
                    const existingAmount = Number(existingReceipt.amount ?? 0);
                    const maxAllowedAmount = totalFee - (paidAmount - existingAmount);

                    if (nextAmount > maxAllowedAmount) {
                        throw new ApiError(400, `Payment exceeds due amount. Current due is ${maxAllowedAmount}`);
                    }
                }

                const sql = `
                    UPDATE receipts
                    SET
                        amount = COALESCE(?, amount),
                        payment_mode = COALESCE(?, payment_mode),
                        payment_date = COALESCE(?, payment_date),
                        remarks = COALESCE(?, remarks)
                    WHERE id = ?
                `;

                const values = [
                    nextAmount,
                    clean(paymentMode),
                    clean(paymentDate),
                    clean(remarks),
                    receiptId
                ];

                await connection.query(sql, values);
                await recalculatePaidAmount(connection, existingReceipt.student_academic_id);

                await connection.commit();

                return res.status(200)
                        .json(
                                new ApiResponse(200,"", "Receipt updated successfully")
                        )
        } catch (error) {
                await connection.rollback();
                throw error;
        } finally {
                connection.release();
        }
});  

const deleteReceipt = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [[existingReceipt]] = await connection.query(
            "SELECT student_academic_id FROM receipts WHERE id = ?",
            [receiptId]
        );

        if (!existingReceipt) {
            throw new ApiError(404, "Receipt not found");
        }

        const [receipt] = await connection.query("DELETE FROM receipts WHERE id = ?", [receiptId]);

        if (receipt.affectedRows === 0) {
            throw new ApiError(404, "Receipt not found");
        }

        await recalculatePaidAmount(connection, existingReceipt.student_academic_id);
        await connection.commit();

        return res.status(200)
            .json(
                new ApiResponse(200, receipt, "Receipt deleted successfully")
            )
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});


export { 
    createReceipt, 
    getReceiptById, 
    getReceipts, 
    updateReceipt,
    deleteReceipt, 
};

const toPositiveAmount = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }
    return amount;
};