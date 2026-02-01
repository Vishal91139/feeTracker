import { Router } from "express";
import { createStudent,
    getAllStudents,
    getStudentById, 
    updateStudent, 
    deleteStudent,
    searchStudent } from "../controllers/students.controller.js";

const router = Router();

router.route("/create").post(createStudent);
router.route("/get").get(getAllStudents);
router.route("/").get(searchStudent);
router.route("/:studentId").get(getStudentById).patch(updateStudent).delete(deleteStudent);
router.route("/:studentId/receipts");

export default router;