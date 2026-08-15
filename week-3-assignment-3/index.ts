import "dotenv/config";
import express, { Express, Request, Response } from "express";
import { connectRedis } from "./configs/redis";
import swaggerUI from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";
import { pool, initializeDatabase } from "./repository/task.repository";
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

app.get("/health", async (_req: Request, res: Response) => {
  const databaseStatus = await pool.query("SELECT 1");
  if (databaseStatus.rowCount === 1) res.status(200).json({ status: "ok", database: "connected" });
  res.status(500).json({ status: "error", database: "not connected" });
});

app.use("/", taskRoutes);

// app.post("/reset", (_req: Request, res: Response) => {
//   tasks.splice(2, tasks.length - 3);
//   res.status(200).json({ message: "Tasks reset to initial state" });
// });

const startServer = async () => {
  try {
    await connectRedis();
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
      console.log(`Swagger docs available at http://localhost:${port}/docs`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1); // Exit the process with an error code
  }
};

startServer();