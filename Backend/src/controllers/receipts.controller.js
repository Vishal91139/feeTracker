import { pool } from "../db/db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createReceipt = asyncHandler(async (req, res) => {
    const { studAcademicId, receiptNo, amount, paymentMode, paymentDate, remarks } = req.body;

    if(!studAcademicId || !receiptNo || !amount || !paymentMode || !paymentDate){
        throw new ApiError(400, "All fields are required");
    }

    const [existingReceipt] = await pool.query("SELECT * FROM receipts WHERE receipt_no = ?", [receiptNo]);

    if(existingReceipt.length > 0){
        throw new ApiError(400, "Receipt already exists");
    }

    const [receipt] = await pool.query("INSERT INTO receipts (student_academic_id, receipt_number, amount, payment_mode, payment_date, remarks) VALUES (?, ?, ?, ?, ?, ?)", [studAcademicId, receiptNo, amount, paymentMode, paymentDate, remarks]);

    return res.status(201)
        .json(
            new ApiResponse(201, receipt, "Receipt created successfully")
        )
});

const getReceipt = asyncHandler(async (req, res) => {
    const { receiptId } = req.params;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    const [receipts] = await pool.query("SELECT * FROM receipts WHERE id = ?", [receiptId]);

    if(!receipts || receipts.length === 0){
        throw new ApiError(404, "Receipt not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, receipts, "Receipts fetched successfully")
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
    const { studAcademicId, receiptNo, amount, paymentMode, paymentDate, remarks } = req.body;

    if(!receiptId){
        throw new ApiError(400, "Receipt id is required");
    }

    if(!studAcademicId || !receiptNo || !amount || !paymentMode || !paymentDate){
        throw new ApiError(400, "All fields are required");
    }

    const [existingReceipt] = await pool.query("SELECT * FROM receipts WHERE id = ?", [receiptId]);

    if(!existingReceipt || existingReceipt.length === 0){
        throw new ApiError(404, "Receipt not found");
    }
    
    const [receipt] = await pool.query("UPDATE receipts SET student_academic_id = ?, receipt_number = ?, amount = ?, payment_mode = ?, payment_date = ?, remarks = ? WHERE id = ?", [studAcademicId, receiptNo, amount, paymentMode, paymentDate, remarks, receiptId]);

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
            new ApiResponse(200, receipts, "Receipts fetched successfully")
        )
});

export { createReceipt, getReceipt, getAllReceipts, updateReceipt, deleteReceipt, searchReceipt };