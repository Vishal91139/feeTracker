import { Router } from "express";
import { enrollStudentToNewAcademic,
    getStudentAcademicYears } from "../controllers/student-academics.controller.js";

const router = Router();

router.post("/enroll", enrollStudentToNewAcademic);
router.get("/student/:studentId", getStudentAcademicYears);

export default router;