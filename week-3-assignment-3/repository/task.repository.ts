import { Pool } from "pg";
import { TaskAttributes } from "../types/task";

export const pool = new Pool({
    connectionString: String(process.env.DATABASE_URL),
});

export const initializeDatabase = async (): Promise<void> => {
    // Create the tasks table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE
        )
    `;
    await pool.query(createTableQuery);

    // Seed the database with initial tasks if the table is empty
    const countResult = await pool.query("SELECT COUNT(*) as count FROM tasks");
    const count = parseInt(countResult.rows[0].count, 10);

    if (count === 0) {
        const insertQuery = `
            INSERT INTO tasks (title, done) VALUES
            ('Task 1: Read documentation', FALSE),
            ('Task 2: Implement feature', TRUE),
            ('Task 3: Write tests', FALSE)
        `;
        await pool.query(insertQuery);
    }
};

export const getAllTasks = async (filters: { search?: string | undefined; done?: boolean | undefined } = {}): Promise<TaskAttributes[]> => {
    let sql = "SELECT * FROM tasks";
    const conditions: string[] = [];
    const params: (string | boolean)[] = [];
    
    // We use a paramIndex to track $1, $2 dynamically depending on how many filters are used
    let paramIndex = 1; 

    // Filter by title search (case-insensitive)
    if (filters.search) {
        conditions.push(`title ILIKE $${paramIndex}`);
        params.push(`%${filters.search}%`);
        paramIndex++;
    }

    // Filter by completion status (using native booleans)
    if (filters.done !== undefined) {
        conditions.push(`done = $${paramIndex}`);
        params.push(filters.done);
        paramIndex++;
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY title;";

    try {
        const result = await pool.query(sql, params);
        return result.rows as TaskAttributes[];
    } catch (error) {
        console.error("Database error fetching all tasks:", error);
        throw error;
    }
};

export const getTaskCount = async (): Promise<number> => {
    try {
        const result = await pool.query("SELECT COUNT(*) as count FROM tasks");
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error("Database error fetching task count:", error);
        throw error;
    }
};

export const getTaskById = async (id: number): Promise<TaskAttributes | null> => {
    try {
        const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
        if (result.rows.length === 0) return null;
        return result.rows[0] as TaskAttributes;
    } catch (error) {
        console.error(`Error fetching task with ID ${id}:`, error);
        throw error;
    }
};

export const createTask = async (task: Omit<TaskAttributes, "id">): Promise<TaskAttributes> => {
    try {
        const result = await pool.query(
            "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
            [task.title, task.done]
        );
        return result.rows[0] as TaskAttributes;
    } catch (error) {
        console.error("Error creating task:", error);
        throw error;
    }
};

export const updateTaskById = async (id: number, task: Partial<Omit<TaskAttributes, "id">>): Promise<TaskAttributes | null> => {
    try {
        const existingTask = await getTaskById(id);
        if (!existingTask) return null;

        const updatedTask = {
            ...existingTask,
            ...task
        };

        const result = await pool.query(
            "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
            [updatedTask.title, updatedTask.done, id]
        );
        return result.rows[0] as TaskAttributes;
    } catch (error) {
        console.error(`Error updating task with ID ${id}:`, error);
        throw error;
    }
};

export const deleteTaskById = async (id: number): Promise<boolean> => {
    try {
        const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);

        if (result.rowCount === 0) {
            console.warn(`Task with ID ${id} not found for deletion.`);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error(`Error deleting task with ID ${id}:`, error);
        throw error;
    }
};