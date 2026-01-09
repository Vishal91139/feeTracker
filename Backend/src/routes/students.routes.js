import { Router } from "express";
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent } from "../controllers/students.controller.js";

const router = Router();

router.route("/").get(getStudents).post(createStudent);
router.route("/:id").get(getStudent).put(updateStudent).delete(deleteStudent);

export default router;