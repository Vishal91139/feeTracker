import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createReceipt = asyncHandler(async (req, res) => {
    const { studentId, class:studentClass, academicYearId, amount, paymentMode, paymentDate, remarks } = req.body;

    if(!studentId || !studentClass || !academicYearId || !amount || !paymentMode || !paymentDate){
        throw new ApiError(400, "All fields are required");
    }

    const [studAcademic] = await pool.query("SELECT id FROM student_academic WHERE student_id = ? AND class = ? AND academic_year_id = ?", [studentId, studentClass, academicYearId]);

    if(!studAcademic || studAcademic.length === 0){
        throw new ApiError(404, "Student not found");
    }

    const studAcademicId = studAcademic[0].id;

    const [receipt] = await pool.query("INSERT INTO receipts (student_academic_id, amount, payment_mode, payment_date, remarks) VALUES (?, ?, ?, ?, ?, ?)", [studAcademicId, amount, paymentMode, paymentDate, remarks]);
    const receiptId = receipt.insertId;

    const receiptNo = `RCPT-${receiptId}`;
    await pool.query("UPDATE receipts SET receipt_number = ? WHERE id = ?", [receiptNo, receiptId]);

    const [receiptDetails] = await pool.query("SELECT r.receipt_number, s.full_name, sa.class, ay.year_name, r.amount, r.payment_mode, r.payment_date, r.remarks FROM students s JOIN student_academic sa ON s.id = sa.student_id JOIN academic_years ay ON sa.academic_year_id = ay.id JOIN receipts r ON sa.id = r.student_academic_id WHERE id = ?", [receiptId]);

    return res.status(201)
        .json(
            new ApiResponse(201, receiptDetails[0], "Receipt created successfully")
        )
});

const getReceiptById = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    const [receipt] = await pool.query("SELECT r.receipt_number, s.full_name, sa.class, ay.year_name, r.amount, r.payment_mode, r.payment_date, r.remarks FROM students s JOIN student_academic sa ON s.id = sa.student_id JOIN academic_years ay ON sa.academic_year_id = ay.id JOIN receipts r ON sa.id = r.student_academic_id WHERE id = ?", [receiptId]);

    if(!receipt || receipt.length === 0){
        throw new ApiError(404, "Receipt not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, receipt[0], "Receipt fetched successfully")
        )
});

const getAllReceipts = asyncHandler(async (req, res) => {
    const [receipts] = await pool.query("SELECT * FROM receipts");

    if(!receipts || receipts.length === 0){
        throw new ApiError(404, "Receipts not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, receipts, "Receipts fetched successfully")
        )
});

const updateReceipt = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;
    const { amount, paymentMode, paymentDate, remarks } = req.body;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    if(!amount || !paymentMode || !paymentDate){
        throw new ApiError(400, "All fields are required");
    }

    const [existingReceipt] = await pool.query("SELECT * FROM receipts WHERE id = ?", [receiptId]);

    if(!existingReceipt || existingReceipt.length === 0){
        throw new ApiError(404, "Receipt not found");
    }
    
    const [receipt] = await pool.query("UPDATE receipts SET  amount = ?, payment_mode = ?, payment_date = ?, remarks = ? WHERE id = ?", [amount, paymentMode, paymentDate, remarks, receiptId]);

    return res.status(200)
        .json(
            new ApiResponse(200, receipt, "Receipt updated successfully")
        )
});  

const deleteReceipt = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    const [existingReceipt] = await pool.query("SELECT * FROM receipts WHERE id = ?", [receiptId]);

    if(!existingReceipt || existingReceipt.length === 0){
        throw new ApiError(404, "Receipt not found");
    }

    const [receipt] = await pool.query("DELETE FROM receipts WHERE id = ?", [receiptId]);

    return res.status(200)
        .json(
            new ApiResponse(200, receipt, "Receipt deleted successfully")
        )
});

const searchReceipt = asyncHandler(async (req, res) => {
    const { receiptNo } = req.query;

    if(!receiptNo){
        throw new ApiError(400, "Receipt number is required");
    }

    const [receipts] = await pool.query("SELECT * FROM receipts WHERE receipt_number = ?", [receiptNo]);

    if(!receipts || receipts.length === 0){
        throw new ApiError(404, "Receipt not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, receipts, "Receipt fetched successfully")
        )
});

const getReceiptsByStudentAcademic = asyncHandler(async (req, res) => {
    const { academicId } = req.params;

    if(!academicId){
        throw new ApiError(400, "Academic id is required");
    }   

    const [receipts] = await pool.query("SELECT * FROM receipts WHERE student_academic_id = ?", [academicId]);

    if(!receipts || receipts.length === 0){
        throw new ApiError(404, "Receipts not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, receipts, "Receipts fetched successfully")
        )
});

export { createReceipt, 
    getReceiptById, 
    getAllReceipts, 
    updateReceipt,
    deleteReceipt,
    searchReceipt, 
    getReceiptsByStudentAcademic 
};