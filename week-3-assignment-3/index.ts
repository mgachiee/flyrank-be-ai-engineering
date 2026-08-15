import "dotenv/config";
import express, { Express, Request, Response } from "express";
import swaggerUI from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";
import { initializeDatabase } from "./repository/task.repository";
import taskRoutes from "./routes/task.route";

const swaggerYaml = fs.readFileSync("./swagger.yaml", "utf-8");
const swaggerDocument = YAML.parse(swaggerYaml);

const app: Express = express();
const port: number = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/tasks", taskRoutes);

// app.post("/reset", (_req: Request, res: Response) => {
//   tasks.splice(2, tasks.length - 3);
//   res.status(200).json({ message: "Tasks reset to initial state" });
// });

app.listen(port, () => {
  // Initialize the database and seed it with initial tasks
  initializeDatabase().then(() => {
    console.log("Database initialized and seeded with initial tasks.");
  }).catch((error) => {
    console.error("Error initializing database:", error);
  });

  console.log(`Server is running at http://localhost:${port}`);
});