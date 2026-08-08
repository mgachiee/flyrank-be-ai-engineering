import express, { Express, Request, Response } from "express";
import swaggerUI from "swagger-ui-express";
import DB, { type Database } from "better-sqlite3";
import fs from "fs";
import YAML from "yaml";

const swaggerYaml = fs.readFileSync("./swagger.yaml", "utf-8");
const swaggerDocument = YAML.parse(swaggerYaml);

const app: Express = express();
const port: number = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Initialize database
const initializeDatabase = (path: string, databaseName: string): Database => {
  // Create the directory if it doesn't exist
  if (!fs.existsSync(path)) fs.mkdirSync(path);

  const db = new DB(`${path}/${databaseName}`);

  // Create tasks table if it doesn't exist
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT 0
    )
  `;
  db.exec(createTableQuery);

  return db;
};

const db = initializeDatabase("./data", "tasks.db");

// Define Task interface
interface TaskCreationAttributes {
  title: string;
  done: number; // 0 for false, 1 for true
}

interface TaskAttributes extends TaskCreationAttributes {
  id: number;
}

// Seed initial tasks if the table is empty
const seedTasks = () => {
  const countQuery = db.prepare("SELECT COUNT(*) as count FROM tasks");
  const countResult = countQuery.get() as { count: number };

  if (countResult.count === 0) {
    const insertQuery = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
    const tasksToInsert: TaskCreationAttributes[] = [
      { title: "Task 1: Read documentation", done: 0 },
      { title: "Task 2: Implement feature", done: 1 },
      { title: "Task 3: Write tests", done: 0 }
    ];

    const insertMany = db.transaction((tasks: TaskCreationAttributes[]) => {
      for (const task of tasks) insertQuery.run(task.title, task.done);
    });
    insertMany(tasksToInsert);
  }
};
seedTasks();

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

/**
 * IMPORTANT NOTE:
 * 
 * Most of the endpoints below are commented out because they are not fully implemented yet with the database.
 * The following commits will implement the remaining endpoints to interact with the database based on the assignment instructions.
 */

app.get("/stats", (_req: Request, res: Response) => {
  const totalTask = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };
  const tasks = db.prepare("SELECT * FROM tasks").all() as TaskAttributes[];
  const totalCompletedTasks: number = tasks.filter(t => t.done === 1).length;
  const totalIncompleteTasks: number = tasks.filter(t => t.done === 0).length;

  res.status(200).json({
    total: totalTask.count,
    done: totalCompletedTasks,
    open: totalIncompleteTasks
  });
});

// app.post("/reset", (_req: Request, res: Response) => {
//   tasks.splice(2, tasks.length - 3);
//   res.status(200).json({ message: "Tasks reset to initial state" });
// });

app.get("/tasks", (req: Request, res: Response) => {
  const queryDone = req.query.done as string | undefined;
  const querySearch = req.query.search as string | undefined;

  let sql = "SELECT * FROM tasks";
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  // Filter by title search term (case-insensitive using SQL LOWER)
  if (querySearch !== undefined && querySearch.trim().length > 0) {
    conditions.push("LOWER(title) LIKE LOWER(?)");
    params.push(`%${querySearch.trim()}%`);
  }

  // Filter by completion status (convert true/false/1/0 to numerical 1/0 for SQLite)
  if (queryDone !== undefined && queryDone.trim().length > 0) {
    const doneStr = queryDone.trim().toLowerCase();
    if (doneStr === "true" || doneStr === "1") {
      conditions.push("done = 1");
    } else if (doneStr === "false" || doneStr === "0") {
      conditions.push("done = 0");
    }
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  const tasks = db.prepare(sql + " ORDER BY title").all(...params) as TaskAttributes[];
  res.status(200).json(tasks);
});

app.get("/tasks/:id", (req: Request, res: Response) => {
  const taskId: number = parseInt(req.params.id as string, 10);

  // Fetch the task from the database
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?")
    .get(taskId) as TaskAttributes | undefined;

  if (!task) {
    res.status(404).json({ error: `Task ${taskId} not found` });
    return;
  }

  res.status(200).json(task);
});

app.post("/tasks", (req: Request, res: Response) => {
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
});

app.put("/tasks/:id", (req: Request, res: Response) => {
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
});

app.delete("/tasks/:id", (req: Request, res: Response) => {
  const taskId: number = parseInt(req.params.id as string, 10);

  // Fetch all tasks from the database
  const tasks = db.prepare("SELECT * FROM tasks").all() as TaskAttributes[];

  if (!tasks.some(task => task.id === taskId)) {
    res.status(404).json({ error: `Task ${taskId} not found` });
    return;
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});