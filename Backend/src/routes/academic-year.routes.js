import { Router } from "express";
import { addAcademicYear,
    getAllAcademicYears,
    deleteAcademicYearById,
    setActiveYear,
    renameAcademicYear } from "../controllers/academic-year.controller.js";

const router = Router();

router.route("/create").post(addAcademicYear);
router.route("/get").get(getAllAcademicYears);
router.route("/delete/:id").delete(deleteAcademicYearById);
router.route("/set-active/:id").patch(setActiveYear);
router.route("/rename/:id").patch(renameAcademicYear);

export default router;