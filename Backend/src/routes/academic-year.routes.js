import { Router } from "express";
import { addAcademicYear, getAcademicYears } from "../controllers/academic-year.controller.js";

const router = Router();

router.route("/create").post(addAcademicYear);
router.route("/get").get(getAcademicYears);

export default router;