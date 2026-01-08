import { pool } from "../db/db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createStudent = asyncHandler(async(req, res) => {
    const { name, email, mobile, parentName } = req.body;

    if(!name || !email || !mobile || !parentName){
        throw new ApiError(400, "All fields are required");
    }

    const [row] = await pool.query("SELECT * FROM students WHERE full_name = ? AND (email = ? OR mobile = ?)", [name, email, mobile]);

    if(!row || row.length===0){
        throw new ApiError(409, "Student already exists");
    }

    const [result] = await pool.query("INSERT INTO students (full_name, email, mobile, parent_name) VALUES (?, ?, ?, ?)", [name, email, mobile, parentName]);

     return res.status(201)
        .json(
            new ApiResponse(201, result[0], "Student created successfully")
        )
})

const getAllStudents = asyncHandler(async(req, res) => {
    const [rows] = await pool.query("SELECT * FROM students");

    if(!rows || rows.length===0){
        throw new ApiError(404, "No students found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, rows, "Students fetched successfully")
        )
})

const getStudentById = asyncHandler(async(req, res) => {
    const { studentId } = req.params;

    if(!studentId){
        throw new ApiError(400, "Student id is required");
    }
    const [row] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);

    if(!row || row.length===0){
        throw new ApiError(404, "Student not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, row[0], "Student fetched successfully")
        )
})

const updateStudent = asyncHandler(async(req, res) => {
    const { studentId } = req.params;
    const { name, email, mobile, parentName } = req.body;

    if(!studentId){
        throw new ApiError(400, "Student id is required");
    }

    if(!name || !email || !mobile || !parentName){
        throw new ApiError(400, "All fields are required");
    }

    const [row] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);

    if(!row || row.length===0){
        throw new ApiError(404, "Student not found");
    }

    const [result] = await pool.query("UPDATE students SET full_name = ?, email = ?, mobile = ?, parent_name = ? WHERE id = ?", [name, email, mobile, parentName, studentId]);

    return res.status(200)
        .json(
            new ApiResponse(200, result[0], "Student updated successfully")
        )
})

const deleteStudent = asyncHandler(async(req, res) => {
    const { studentId } = req.params;

    if(!studentId){
        throw new ApiError(400, "Student id is required");
    }

    const [row] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);

    if(!row || row.length===0){
        throw new ApiError(404, "Student not found");
    }

    const [result] = await pool.query("DELETE FROM students WHERE id = ?", [studentId]);

    return res.status(200)
        .json(
            new ApiResponse(200, result[0], "Student deleted successfully")
        )
})

const searchStudent = asyncHandler(async(req, res) => {
    const { query } = req.query;

    if(!query){
        throw new ApiError(400, "Query is required");
    }

    const [rows] = await pool.query("SELECT * FROM students WHERE full_name LIKE ?", [`%${query}%`]);

    if(!rows || rows.length===0){
        throw new ApiError(404, "No students found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, rows, "Students fetched successfully")
        )
})

export {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    searchStudent
}