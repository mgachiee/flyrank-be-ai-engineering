import { Request, Response } from "express";
import redisClient from "../configs/redis";
import { TaskAttributes } from "../types/task";
import * as taskRepository from "../repository/task.repository";

export const getStats = async (req: Request, res: Response) => {
    try {
        const cacheKey = "task_stats";
        const cachedStats = await redisClient.get(cacheKey);

        if (cachedStats) {
            console.log("CACHE HIT: Returning cached task stats");
            return res.status(200).json(JSON.parse(cachedStats));
        }

        console.log("CACHE MISS: Fetching task stats from database");

        const tasks = await taskRepository.getAllTasks({}) as TaskAttributes[];
        const totalTasks = await taskRepository.getTaskCount();
        const totalCompletedTasks: number = tasks.filter(t => t.done === true).length;
        const totalIncompleteTasks: number = tasks.filter(t => t.done === false).length;

        await redisClient.setEx(cacheKey, 60, JSON.stringify({
            total: totalTasks,
            done: totalCompletedTasks,
            open: totalIncompleteTasks
        }));

        res.status(200).json({
            total: totalTasks,
            done: totalCompletedTasks,
            open: totalIncompleteTasks
        });
    } catch (error) {
        console.error("Error fetching task stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAllTasks = async (req: Request, res: Response) => {
    try {
        // Query parameters for filtering
        const querySearch = req.query.search as string | undefined;
        let isDone: boolean | undefined = undefined;

        // Parse the 'done' string into a native boolean
        if (typeof req.query.done === 'string') {
            const doneStr = req.query.done.trim().toLowerCase();
            if (doneStr === "true" || doneStr === "1") isDone = true;
            else if (doneStr === "false" || doneStr === "0") isDone = false;
        }

        const cacheKey = `tasks_${querySearch || "all"}_${isDone !== undefined ? isDone : "all"}`;
        const cachedTasks = await redisClient.get(cacheKey);

        if (cachedTasks) {
            console.log("CACHE HIT: Returning cached tasks");
            return res.status(200).json(JSON.parse(cachedTasks));
        }

        console.log("CACHE MISS: Fetching tasks from database");
        const tasks = await taskRepository.getAllTasks({
            search: querySearch?.trim(),
            done: isDone
        });

        await redisClient.setEx(cacheKey, 60, JSON.stringify(tasks));

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getTaskById = async (req: Request, res: Response) => {
    try {
        const taskId: number = parseInt(req.params.id as string, 10);

        // Fetch the task from the database
        const task = await taskRepository.getTaskById(taskId);

        if (!task) {
            res.status(404).json({ error: `Task ${taskId} not found` });
            return;
        }

        res.status(200).json(task);
    } catch (error) {
        console.error("Error fetching task by ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;

        if (!title || title.trim() === "") {
            res.status(400).json({ error: "Title is required" });
            return;
        }

        const newTask: TaskAttributes = await taskRepository.createTask({
            title: title.trim(),
            done: false // Default to not done
        });
        res.status(201).json(newTask);
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const updateTaskById = async (req: Request, res: Response) => {
    try {
        const taskId: number = parseInt(req.params.id as string, 10);
        const { title, done } = req.body;

        const updatedTask: TaskAttributes | null = await taskRepository.updateTaskById(taskId, {
            title: title?.trim(),
            done: done
        });

        if (!updatedTask) {
            res.status(404).json({ error: `Task ${taskId} not found` });
            return;
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error updating task by ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const deleteTaskById = async (req: Request, res: Response) => {
    try {
        const taskId: number = parseInt(req.params.id as string, 10);

        const deleted: boolean = await taskRepository.deleteTaskById(taskId);

        if (!deleted) {
            res.status(404).json({ error: `Task ${taskId} not found` });
            return;
        }

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting task by ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};