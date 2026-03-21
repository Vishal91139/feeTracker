import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^\d{10}$/;

const normalizeString = (value) => String(value ?? "").trim();

// create a new student and enroll them in the current academic year
const createStudent = asyncHandler(async(req, res) => {
    const { name, email, mobile, parentName, class:studentClass, totalFee } = req.body;

    const normalizedName = normalizeString(name);
    const normalizedEmail = normalizeString(email).toLowerCase();
    const normalizedMobile = normalizeString(mobile);
    const normalizedParentName = normalizeString(parentName);
    const normalizedClass = normalizeString(studentClass);

    if(!normalizedName || !normalizedEmail || !normalizedMobile || !normalizedParentName || !normalizedClass || !totalFee){
        throw new ApiError(400, "All fields are required");
    }

    if (!emailRegex.test(normalizedEmail)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (!mobileRegex.test(normalizedMobile)) {
        throw new ApiError(400, "Mobile number must be exactly 10 digits");
    }

    const [student] = await pool.query("INSERT INTO students (full_name, email, mobile, parent_name) VALUES (?, ?, ?, ?)", [normalizedName, normalizedEmail, normalizedMobile, normalizedParentName]);
    
    if (!student || student.affectedRows === 0) {
      throw new ApiError(500, "Failed to create student");
    }

    const [currentYear] = await pool.query("SELECT * FROM academic_years WHERE is_current = 1");

    if(!currentYear || currentYear.length===0){
        throw new ApiError(404, "Current academic year not found");
    }

    const [enrolledStudent] = await pool.query("INSERT INTO student_academics (student_id, academic_year_id, class, total_fee) VALUES (?, ?, ?, ?)", [student.insertId, currentYear[0].id, normalizedClass, totalFee]);

    return res.status(201)
        .json(
            new ApiResponse(201, enrolledStudent[0], "Student enrolled successfully")
        )
})

// get all students of a class in a particular year also get student by name (filters)
const getStudents = asyncHandler(async(req, res) => {
    const { class:studentClass, year, name, feeStatus } = req.query;
    
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

    let query = "SELECT s.id As studentId, s.full_name, sa.class, s.parent_name, ay.year_name, sa.due_amount FROM students s JOIN student_academics sa ON s.id = sa.student_id JOIN academic_years ay on ay.id = sa.academic_year_id WHERE ay.year_name = ?"
    let params = [activeYear];

    if(studentClass) {
        query += " AND sa.class = ?"
        params.push(studentClass)
    }

    if(name) {
        query += " AND s.full_name LIKE ?"
        params.push(`%${name}%`)
    }

    const normalizedFeeStatus = String(feeStatus ?? "").trim().toLowerCase();
    if (normalizedFeeStatus === "due") {
        query += " AND sa.due_amount > 0";
    }

    if (normalizedFeeStatus === "cleared" || normalizedFeeStatus === "paid") {
        query += " AND sa.due_amount <= 0";
    }

    const [students] = await pool.query(query, params)
    
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
        query = `SELECT s.id as studentId, s.full_name, sa.class, ay.year_name, s.parent_name, s.mobile, s.email, sa.total_fee, sa.paid_amount, sa.due_amount FROM students s JOIN student_academics sa on s.id = sa.student_id JOIN academic_years ay on ay.id = sa.academic_year_id WHERE s.id = ? AND ay.is_active = 1`;
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

    const cleanedEmail = clean(email);
    const cleanedMobile = clean(mobile);

    if (cleanedEmail && !emailRegex.test(cleanedEmail)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (cleanedMobile && !mobileRegex.test(cleanedMobile)) {
        throw new ApiError(400, "Mobile number must be exactly 10 digits");
    }

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
            cleanedEmail,
            cleanedMobile,
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

const getReceiptsByStudentAcademic = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { class:studentClass, year } = req.query;

    if (!studentId || !studentClass || !year) {
        throw new ApiError(400, "studentId, class and yearId are required");
    }  

    const [receipts] = await pool.query("SELECT s.id as studentId, s.full_name, sa.class, ay.year_name, r.id As ReceiptId, r.receipt_number, r.amount, r.payment_mode, DATE_FORMAT(r.payment_date, '%Y-%m-%d') AS payment_date, r.remarks FROM receipts r JOIN student_academics sa ON sa.id = r.student_academic_id JOIN students s ON s.id = sa.student_id JOIN academic_years ay ON ay.id = sa.academic_year_id WHERE sa.student_id = ? AND sa.class = ? AND ay.year_name = ? ORDER BY r.created_at DESC",[studentId, studentClass, year]);

    return res.status(200)
        .json(
            new ApiResponse(200, receipts, "Receipts fetched successfully")
        )
});

export {
    createStudent,
    getStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getReceiptsByStudentAcademic
}