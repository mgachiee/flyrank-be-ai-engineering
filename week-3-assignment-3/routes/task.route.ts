import { Router } from "express";
import * as taskController from "../controllers/task.controller";

const router = Router();

/**
 * IMPORTANT NOTE:
 * Some endpoints are not working yet because they are not fully implemented with the database.
 * The following commits will implement the remaining endpoints to interact with the database based on the assignment instructions.
 */

router.get("/stats", taskController.getStats);
router.get("/tasks", taskController.getAllTasks);
router.get("/tasks/:id", taskController.getTaskById);
router.post("/tasks", taskController.createTask);
router.put("/tasks/:id", taskController.updateTaskById);

export default router;