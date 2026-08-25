import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import { profile, dashboard } from "../controllers/protected.controller";

const router = Router();

router.get("/profile", authenticateToken, profile);
router.get("/dashboard", authenticateToken, dashboard);

export default router;