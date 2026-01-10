import { pool } from "../db/db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

// create a new student and enroll them in the current academic year
const createStudent = asyncHandler(async(req, res) => {
    const { name, email, mobile, parentName, class:studentClass, totalFees } = req.body;

    if(!name || !email || !mobile || !parentName || !studentClass || !totalFees){
        throw new ApiError(400, "All fields are required");
    }

    const [existingStudent] = await pool.query("SELECT * FROM students WHERE full_name = ? AND (email = ? OR mobile = ?)", [name, email, mobile]);

    if(existingStudent || existingStudent.length > 0){
        throw new ApiError(409, "Student already exists");
    }

    const [student] = await pool.query("INSERT INTO students (full_name, email, mobile, parent_name) VALUES (?, ?, ?, ?)", [name, email, mobile, parentName]);

    const [currentYear] = await pool.query("SELECT * FROM academic_years WHERE is_current = 1");

    if(!currentYear || currentYear.length===0){
        throw new ApiError(404, "Current academic year not found");
    }

    const [enrolledStudent] = await pool.query("INSERT INTO student_academics (student_id, academic_year_id, class, total_fee) VALUES (?, ?, ?, ?)", [student.insertId, currentYear[0].id, studentClass, totalFees]);

    return res.status(201)
        .json(
            new ApiResponse(201, enrolledStudent[0], "Student enrolled successfully")
        )
})

// get all students of a class in a particular year
const getAllStudents = asyncHandler(async(req, res) => {
    const { class:studentClass, year } = req.query;

    if(!studentClass || !year){
        throw new ApiError(400, "Class and year are required");
    }

    const [academicYear] = await pool.query("SELECT * FROM academic_years WHERE year_name = ?", [year]);

    if(!academicYear || academicYear.length===0){
        throw new ApiError(404, "Academic year not found");
    }

    const [students] = await pool.query("SELECT s.id As studentId, s.full_name, sa.class, ay.year_name, sa.due_amount FROM students s JOIN student_academics sa ON s.id = sa.student_id JOIN academic_years ay on ay.id = sa.academic_year_id WHERE sa.class = ? AND ay.id = ?", [studentClass, academicYear[0].id]);
    
    if(!students || students.length===0){
        throw new ApiError(404, "No students found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, students, "Students fetched successfully")
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

    const [student] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);

    if(!student || student.length===0){
        throw new ApiError(404, "Student not found");
    }

    const [updatedDetails] = await pool.query("UPDATE students SET full_name = ?, email = ?, mobile = ?, parent_name = ? WHERE id = ?", [name, email, mobile, parentName, studentId]);

    return res.status(200)
        .json(
            new ApiResponse(200, updatedDetails[0], "Student updated successfully")
        )
})

const deleteStudent = asyncHandler(async(req, res) => {
    const { studentId } = req.params;

    if(!studentId){
        throw new ApiError(400, "Student id is required");
    }

    const [student] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);

    if(!student || student.length===0){
        throw new ApiError(404, "Student not found");
    }

    const [result] = await pool.query("DELETE FROM students WHERE id = ?", [studentId]);

    return res.status(200)
        .json(
            new ApiResponse(200, result[0], "Student deleted successfully")
        )
})

// search students by name, class and year
const searchStudent = asyncHandler(async(req, res) => {
    const { name:query, class:studentClass, year } = req.query;

    if(!query || !studentClass || !year){
        throw new ApiError(400, "Name is required");
    }

    const [student] = await pool.query("SELECT s.id as studentId, s.full_name, sa.class, ay.year_name, sa.due_amount FROM students s JOIN student_academics sa ON s.id = sa.student_id JOIN academic_years ay ON ay.id = sa.academic_year_id WHERE s.full_name LIKE ? AND sa.class = ? AND ay.year_name = ?", [`%${query}%`, studentClass, year]);

    if(!student || student.length===0){
        throw new ApiError(404, "No students found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, student, "Students fetched successfully")
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