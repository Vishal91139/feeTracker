import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createReceipt = asyncHandler(async (req, res) => {
    const { studentId, studentClass, academicYearId, amount, paymentMode, paymentDate, remarks } = req.body;

    if(!studentId || !studentClass || !academicYearId || !amount || !paymentMode || !paymentDate){
        throw new ApiError(400, "All fields are required");
    }

    const insertSql = `
        INSERT INTO receipts
        (student_academic_id, receipt_number, amount, payment_mode, payment_date, remarks)
        SELECT
        sa.id,
        CONCAT('RCPT-', UUID_SHORT()),
        ?, ?, ?, ?
        FROM student_academics sa
        WHERE sa.student_id = ?
        AND sa.class = ?
        AND sa.academic_year_id = ?
    `;

    const [insertResult] = await pool.query(insertSql, [
        amount,
        paymentMode,
        paymentDate,
        remarks,
        studentId,
        studentClass,
        academicYearId
    ]);

    if (insertResult.affectedRows === 0) {
        throw new ApiError(404, "Student academic record not found");
    }

    const receiptId = insertResult.insertId;

    const [receiptDetails] = await pool.query(
        `SELECT 
            r.receipt_number,
            s.full_name,
            sa.class,
            ay.year_name,
            r.amount,
            r.payment_mode,
            r.payment_date,
            r.remarks
        FROM receipts r
        JOIN student_academics sa ON r.student_academic_id = sa.id
        JOIN students s ON s.id = sa.student_id
        JOIN academic_years ay ON ay.id = sa.academic_year_id
        WHERE r.id = ?`,
        [receiptId]
    );

    return res.status(201)
        .json(
            new ApiResponse(201, receiptDetails, "Receipt created successfully")
        )
});

const getReceiptById = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    const [receipt] = await pool.query("SELECT r.receipt_number, s.full_name, sa.class, ay.year_name, r.amount, r.payment_mode, r.payment_date, r.remarks FROM receipts r JOIN student_academics sa ON r.student_academic_id = sa.id JOIN students s ON sa.student_id = s.id JOIN academic_years ay ON sa.academic_year_id = ay.id  WHERE r.id = ?", [receiptId]);

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
            "SELECT year_name FROM academic_years WHERE is_current = 1 LIMIT 1"
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
            r.payment_date 
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

    if (!receipts || receipts.length === 0) {
        throw new ApiError(404, "Receipts not found");
    }

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

    const clean = (v) => (v && v.trim() !== "" ? v : null);

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
      clean(amount),
      clean(paymentMode),
      clean(paymentDate),
      clean(remarks),
      receiptId
    ];

    const [updatedDetails] = await pool.query(sql, values);

    if (updatedDetails.affectedRows === 0) {
      throw new ApiError(404, "Receipt not found")
    }
    return res.status(200)
        .json(
            new ApiResponse(200,"", "Receipt updated successfully")
        )
});  

const deleteReceipt = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    const [receipt] = await pool.query("DELETE FROM receipts WHERE id = ?", [receiptId]);

    if (receipt.affectedRows === 0) {
        throw new ApiError(404, "Receipt not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, receipt, "Receipt deleted successfully")
        )
});


export { 
    createReceipt, 
    getReceiptById, 
    getReceipts, 
    updateReceipt,
    deleteReceipt, 
};