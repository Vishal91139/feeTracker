import { Router } from "express";
import { addAcademicYear,
    getAllAcademicYears,
    deleteAcademicYearById } from "../controllers/academic-year.controller.js";

const router = Router();

router.route("/create").post(addAcademicYear);
router.route("/get").get(getAllAcademicYears);
router.route("/delete/:id").delete(deleteAcademicYearById);

export default router;