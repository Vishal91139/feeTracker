import { Router } from "express";
import { createStudent,
    getStudents,
    getStudentById, 
    updateStudent, 
    deleteStudent,
    getReceiptsByStudentAcademic } from "../controllers/students.controller.js";

const router = Router();

router.route("/create").post(createStudent);
router.route("/get").get(getStudents);
router.route("/:studentId").get(getStudentById).patch(updateStudent).delete(deleteStudent);
router.route("/:studentId/receipts").get(getReceiptsByStudentAcademic);

export default router;