import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// create a new student and enroll them in the current academic year
const createStudent = asyncHandler(async(req, res) => {
    const { name, email, mobile, parentName, studentClass, totalFee } = req.body;

    if(!name || !email || !mobile || !parentName || !studentClass || !totalFee){
        throw new ApiError(400, "All fields are required");
    }

    const [student] = await pool.query("INSERT INTO students (full_name, email, mobile, parent_name) VALUES (?, ?, ?, ?)", [name, email, mobile, parentName]);

    const [currentYear] = await pool.query("SELECT * FROM academic_years WHERE is_current = 1");

    if(!currentYear || currentYear.length===0){
        throw new ApiError(404, "Current academic year not found");
    }

    const [enrolledStudent] = await pool.query("INSERT INTO student_academics (student_id, academic_year_id, class, total_fee) VALUES (?, ?, ?, ?)", [student.insertId, currentYear[0].id, studentClass, totalFee]);

    return res.status(201)
        .json(
            new ApiResponse(201, enrolledStudent[0], "Student enrolled successfully")
        )
})

// get all students of a class in a particular year
const getAllStudents = asyncHandler(async(req, res) => {
    const { studentClass, yearId } = req.query;

    if(!studentClass || !yearId){
        throw new ApiError(400, "Class and year are required");
    }

    const [students] = await pool.query("SELECT s.id As studentId, s.full_name, sa.class, s.parent_name, ay.year_name, sa.due_amount FROM students s JOIN student_academics sa ON s.id = sa.student_id JOIN academic_years ay on ay.id = sa.academic_year_id WHERE sa.class = ? AND ay.id = ?", [studentClass, yearId]);
    
    if(!students || students.length===0){
        throw new ApiError(404, "No students found for this class and year");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, students, "Students fetched successfully")
        )
})

// get student details by their studentId
const getStudentById = asyncHandler(async(req, res) => {
    const { studentId } = req.params;
    const { yearId } = req.query;

    if(!studentId){
        throw new ApiError(400, "Student id is required");
    }

    let query;
    let queryParam;

    if(yearId){
        query = `SELECT s.id as studentId, s.full_name, sa.class, ay.year_name, s.parent_name, s.mobile, s.email, sa.total_fee, sa.paid_amount, sa.due_amount FROM students s JOIN student_academics sa on s.id = sa.student_id JOIN academic_years ay on ay.id = sa.academic_year_id WHERE s.id = ? AND ay.id = ?`;
        queryParam = [studentId, yearId];
    } else {
        query = `SELECT s.id as studentId, s.full_name, sa.class, ay.year_name, s.parent_name, s.mobile, s.email, sa.total_fee, sa.paid_amount, sa.due_amount FROM students s JOIN student_academics sa on s.id = sa.student_id JOIN academic_years ay on ay.id = sa.academic_year_id WHERE s.id = ? AND ay.is_current = 1`;
        queryParam = [studentId];
    }

    const [student] = await pool.query(query, queryParam);

    if(!student || student.length===0){
        throw new ApiError(404, "Student details not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, student[0], "Student fetched successfully")
        )
})

// update student details
const updateStudent = asyncHandler(async(req, res) => {
    const { studentId } = req.params;
    const { name, email, mobile, parentName } = req.body;

    if(!studentId){
        throw new ApiError(400, "Student id is required");
    }

    if (
        name === undefined &&
        email === undefined &&
        mobile === undefined &&
        parentName === undefined
    ) {
    throw new ApiError(400, "No fields provided to update");
    }

    const clean = (v) => (v && v.trim() !== "" ? v : null);

    const sql = `
      UPDATE students
      SET
        full_name   = COALESCE(?, full_name),
        email       = COALESCE(?, email),
        mobile      = COALESCE(?, mobile),
        parent_name = COALESCE(?, parent_name)
      WHERE id = ?
    `;

    const values = [
      clean(name),
      clean(email),
      clean(mobile),
      clean(parentName),
      studentId
    ];

    const [updatedDetails] = await pool.query(sql, values);

    if (updatedDetails.affectedRows === 0) {
      throw new ApiError(404, "Student not found")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, updatedDetails[0], "Student updated successfully")
        )
})

// delete the student
const deleteStudent = asyncHandler(async(req, res) => {
    const { studentId } = req.params;

    if (!studentId) {
        throw new ApiError(400, "Student id is required");
    }

    const [result] = await pool.query("DELETE FROM students WHERE id = ?",[studentId]);

    if (result.affectedRows === 0) {
        throw new ApiError(404, "Student not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, result[0], "Student deleted successfully")
        )
})

// search students by name, class and year
const searchStudent = asyncHandler(async(req, res) => {
    const { name:query, studentClass, yearId } = req.query;

    if(!query || !studentClass || !yearId){
        throw new ApiError(400, "Name is required");
    }

    const [student] = await pool.query("SELECT s.id as studentId, s.full_name, sa.class, s.parent_name, ay.year_name, sa.due_amount FROM students s JOIN student_academics sa ON s.id = sa.student_id JOIN academic_years ay ON ay.id = sa.academic_year_id WHERE s.full_name LIKE ? AND sa.class = ? AND ay.id = ?", [`%${query}%`, studentClass, yearId]);

    if(!student || student.length===0){
        throw new ApiError(404, "No students found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, student, "Students fetched successfully")
        )
})

const getReceiptsByStudentAcademic = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { studentClass, yearId } = req.query;

    if (!studentId || !studentClass || !yearId) {
        throw new ApiError(400, "studentId, class and yearId are required");
    }  

    const [receipts] = await pool.query("SELECT r.id AS receipt_id, r.receipt_number, s.full_name, sa.class, ay.year_name, r.amount, r.payment_mode, r.payment_date, r.remarks FROM receipts r JOIN student_academics sa ON r.student_academic_id = sa.id JOIN students s ON sa.student_id = s.id JOIN academic_years ay ON sa.academic_year_id = ay.id WHERE sa.student_id = ? AND sa.class = ? AND sa.academic_year_id = ? ORDER BY r.created_at DESC",[studentId, studentClass, yearId]);

    if(!receipts || receipts.length === 0){
        throw new ApiError(404, "Receipts not found for this student");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, receipts, "Receipts fetched successfully")
        )
});

export {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    searchStudent,
    getReceiptsByStudentAcademic
}