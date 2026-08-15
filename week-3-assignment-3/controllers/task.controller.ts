import { Request, Response } from "express";
import { TaskAttributes, TaskCreationAttributes } from "../types/task";
import * as taskRepository from "../repository/task.repository";

export const getStats = async (req: Request, res: Response) => {
    try {
        const totalTask = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };
        const tasks = db.prepare("SELECT * FROM tasks").all() as TaskAttributes[];
        const totalCompletedTasks: number = tasks.filter(t => t.done === 1).length;
        const totalIncompleteTasks: number = tasks.filter(t => t.done === 0).length;

        res.status(200).json({
            total: totalTask.count,
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

        const tasks = await taskRepository.getAllTasks({
            search: querySearch?.trim(),
            done: isDone
        });

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

        // Fetch all tasks from the database
        const tasks = db.prepare("SELECT * FROM tasks").all() as TaskAttributes[];

        const newTask: TaskAttributes = {
            id: tasks.length + 1,
            title,
            done: 0
        };

        // Insert the new task into the database
        db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)").run(newTask.title, newTask.done);
        res.status(201).json(newTask);
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const updateTaskById = async (req: Request, res: Response) => {
    try {
        const taskId: number = parseInt(req.params.id as string, 10);

        // Fetch the task from the database
        const task = db.prepare("SELECT * FROM tasks WHERE id = ?")
            .get(taskId) as TaskAttributes | undefined;

        if (!task) {
            res.status(404).json({ error: `Task ${taskId} not found` });
            return;
        }

        const { title, done } = req.body;

        if (!title && done === undefined) {
            res.status(400).json({ error: "At least one of title or done is required" });
            return;
        }

        if (title !== undefined) task.title = title;
        if (done !== undefined) task.done = done;

        db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?")
            .run(task.title, task.done, task.id);

        res.status(200).json(task);
    } catch (error) {
        console.error("Error updating task by ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const deleteTaskById = async (req: Request, res: Response) => {
    try {
        const taskId: number = parseInt(req.params.id as string, 10);

        // Fetch all tasks from the database
        const tasks = db.prepare("SELECT * FROM tasks").all() as TaskAttributes[];

        if (!tasks.some(task => task.id === taskId)) {
            res.status(404).json({ error: `Task ${taskId} not found` });
            return;
        }

        db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting task by ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};