import express, { Express, Request, Response } from "express";

const app: Express = express();
const port: number = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get("/tasks", (_req: Request, res: Response) => {
  res.status(200).json(tasks);
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
  console.log("Request body:", req.body);
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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});