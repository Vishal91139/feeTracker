import { Router } from "express";
import { enrollStudentToNewAcademic,
    getStudentAcademicYears } from "../controllers/student-academics.controller.js";

const router = Router();

router.route("/enroll").post(enrollStudentToNewAcademic);
router.route("/student/:studentId").get(getStudentAcademicYears);

export default router;