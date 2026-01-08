import { Router } from "express";
import { enrollStudentToAcademic, studentsOfAcademicYear } from "../controllers/student-academics.controller.js";

const router = Router();

router.post("/:yearId/enroll", enrollStudentToAcademic);
router.get("/students/:yearId/", studentsOfAcademicYear);

export default router;