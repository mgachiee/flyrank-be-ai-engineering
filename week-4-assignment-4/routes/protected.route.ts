import { Router } from "express";
import { profile } from "../controllers/protected.controller";

const router = Router();

router.get("/profile", profile);

export default router;