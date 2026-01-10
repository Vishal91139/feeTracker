import { Router } from "express";
import { loginAdmin,
    changePassword } from "../controllers/admin.controller.js";

const router = Router();

router.route("/login").post(loginAdmin);
router.route("/changePassword").post(changePassword);

export default router;
