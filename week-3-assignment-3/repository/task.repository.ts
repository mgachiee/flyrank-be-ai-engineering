import { Pool } from "pg";

const pool = new Pool({
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