import "dotenv/config";
import express, { Express } from "express";
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

const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server is running and connected to Supabase at http://localhost:${port}`);
      console.log(`Swagger docs available at http://localhost:${port}/docs`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1); // Exit the process with an error code
  }
};

startServer();