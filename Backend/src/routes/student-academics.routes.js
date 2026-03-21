import { Router } from "express";
import { enrollStudentToNewAcademic,
    getStudentAcademicYears,
    getCarryForwardCandidates,
    bulkContinueStudents } from "../controllers/student-academics.controller.js";

const router = Router();

router.route("/enroll").post(enrollStudentToNewAcademic);
router.route("/carry-forward-candidates").get(getCarryForwardCandidates);
router.route("/continue-bulk").post(bulkContinueStudents);
router.route("/promote-bulk").post(bulkContinueStudents);
router.route("/student/:studentId").get(getStudentAcademicYears);

export default router;