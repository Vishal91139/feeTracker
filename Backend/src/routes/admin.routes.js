import { Router } from "express";
import { loginAdmin,
    logoutAdmin,
    changePassword } from "../controllers/admin.controller.js";

const router = Router();

router.route("/login").post(loginAdmin);
router.route("/logout").post(logoutAdmin);
router.route("/changePassword").post(changePassword);

export default router;
