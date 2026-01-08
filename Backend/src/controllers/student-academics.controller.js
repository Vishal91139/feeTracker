import { pool } from "../db/db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const enrollStudentToAcademic = asyncHandler(async (req, res) => {
    const { yearId } = req.params;
    const { studentId, class:studentClass, totalfee } = req.body;

    if (!yearId) {
        throw new ApiError(400, "Year is required");
    }
    if (!studentId || !studentClass || !totalfee) {
        throw new ApiError(400, "Missing required fields");
    }

    const[existing] = await pool.query("SELECT * FROM student_academics WHERE student_id = ? AND year = ?", [studentId, yearId]); 

    if(existing || existing.length > 0){
        throw new ApiError(400, "Student already exists");
    }

    await pool.query("INSERT INTO student_academics (student_id, class, academic_year_id, total_fee) VALUES (?, ?, ?, ?)", [studentId, studentClass, yearId, totalfee]);

    return res.status(200)
        .json(
        new ApiResponse(200, "Student enrolled successfully")
    )
});

const studentsOfAcademicYear = asyncHandler(async (req, res) => {
    const { yearId } = req.params;

    if (!yearId) {
        throw new ApiError(400, "Year is required");
    }

    const[students] = await pool.query("SELECT * FROM student_academics WHERE academic_year_id = ?", [yearId]);

    if(!students || students.length === 0){
        throw new ApiError(400, "No students found");
    }

    return res.status(200)
        .json(
        new ApiResponse(200, students, "Students found")
    )
})

export {
    enrollStudentToAcademic,
    studentsOfAcademicYear
}