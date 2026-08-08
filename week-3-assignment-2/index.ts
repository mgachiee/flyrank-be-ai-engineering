import express, { Express, Request, Response } from "express";
import swaggerUI from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";

const swaggerYaml = fs.readFileSync("./swagger.yaml", "utf-8");
const swaggerDocument = YAML.parse(swaggerYaml);

const app: Express = express();
const port: number = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

interface Task {
  id: number;
  title: string;
  done: boolean;
}

const tasks: Task[] = [
  { id: 1, title: "Task 1: Read documentation", done: false },
  { id: 2, title: "Task 2: Implement feature", done: true },
  { id: 3, title: "Task 3: Write tests", done: false }
];

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/stats", (_req: Request, res: Response) => {
  const totalTask: number = tasks.length;
  const totalCompletedTasks: number = tasks.filter(t => t.done === true).length;
  const totalIncompleteTasks: number = tasks.filter(t => t.done === false).length;

  res.status(200).json({
    total: totalTask,
    done: totalCompletedTasks,
    open: totalIncompleteTasks
  });
});

app.post("/reset", (_req: Request, res: Response) => {
  tasks.splice(2, tasks.length - 3);
  res.status(200).json({ message: "Tasks reset to initial state" });
});

app.get("/tasks", (req: Request, res: Response) => {
  const queryDone = req.query.done as string | undefined;
  const querySearch = req.query.search as "true" | "false";

  if (!queryDone && !querySearch) {
    res.status(200).json(tasks);
    return;
  }

  // Filter logic for query params
  const filteredTasks = tasks.filter(task => {
    let searchMatch: boolean;

    if (querySearch === undefined || querySearch.length === 0) {
      searchMatch = true; // No filter on title
    } else {
      searchMatch = task.title?.toLowerCase().includes(querySearch.toLowerCase()) ?? false;
    }

    const doneValue = task.done ? String(task.done) : "false";

    let doneMatch: boolean;

    if (queryDone === undefined || queryDone.length === 0) {
      doneMatch = true; // No filter on completion status
    } else {
      doneMatch = doneValue.toLowerCase() === queryDone.toLowerCase();
    }

    return searchMatch && doneMatch;
  })

  res.status(200).json(filteredTasks);
});

app.get("/tasks/:id", (req: Request, res: Response) => {
  const taskId: number = parseInt(req.params.id as string, 10);
  const task: Task | undefined = tasks.find(t => t.id === taskId);

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

  const newTask: Task = {
    id: tasks.length + 1,
    title,
    done: false
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put("/tasks/:id", (req: Request, res: Response) => {
  const taskId: number = parseInt(req.params.id as string, 10);
  const task: Task | undefined = tasks.find(t => t.id === taskId);

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

  res.status(200).json(task);
});

app.delete("/tasks/:id", (req: Request, res: Response) => {
  const taskId: number = parseInt(req.params.id as string, 10);
  const taskIndex: number = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    res.status(404).json({ error: `Task ${taskId} not found` });
    return;
  }

  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});