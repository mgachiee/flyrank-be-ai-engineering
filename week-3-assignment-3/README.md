# Task Management API

## What this is

This is a Task Management API built using Node.js, Express, TypeScript, and SQLite (via `better-sqlite3`). It allows users to perform CRUD (Create, Read, Update, Delete) operations on a list of tasks with persistent database storage.

## Why SQLite Was Chosen

SQLite was chosen as the database solution for this project because:
- **Single File Storage**: The entire database lives in a lightweight local file (`tasks.db`), avoiding the complexity and overhead of managing a separate database server.
- **Zero Setup**: No installation of external database services or user authentication configuration is required.
- **Survives Restarts**: Data persists on disk across application and server restarts, solving the "Mortality Experiment" issue present in in-memory implementations.

## Database Location & Automatic Creation

- **Database File Location**: `./data/tasks.db`
- **Automatic Setup**: The application automatically checks for `./data` and `./data/tasks.db` on boot. If missing, it creates the folder, creates the `tasks` table schema, and seeds the default records with zero manual setup required.
- **Version Control (`.gitignore`)**: The `./data/tasks.db` file is listed in `.gitignore` so each repository clone starts fresh with automated setup and seeding.

## How to Install & Run

You can install the dependencies and start the development server using the following single command:

```bash
npm install && npm run dev
```

Running this command will start the server at `http://localhost:3000`, automatically initializing the database and seeding the 3 initial tasks.

## Endpoints

The following endpoints are available in this API:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Returns basic API info and available endpoints. |
| `GET` | `/health` | Health check endpoint, returns status `ok`. |
| `GET` | `/tasks` | Retrieves tasks (supports filtering via `done` and `search` query parameters). |
| `GET` | `/tasks/:id` | Retrieves a specific task by its ID. |
| `POST` | `/tasks` | Creates a new task and persists it to the database. |
| `PUT` | `/tasks/:id` | Updates an existing task by its ID in the database. |
| `DELETE` | `/tasks/:id` | Deletes a task by its ID from the database. |
| `GET` | `/docs` | Interactive Swagger UI API documentation. |

## Example `curl` Output

Here is an example output of making a `GET` request to the `/tasks` endpoint:

```bash
$ curl -i http://localhost:3000/tasks
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 172
ETag: W/"ac-U5R7/sD+M3pLwUo8q5j9z/hHnKg"
Date: Sat, 18 Jul 2026 05:37:00 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":1,"title":"Task 1: Read documentation","done":0},{"id":2,"title":"Task 2: Implement feature","done":1},{"id":3,"title":"Task 3: Write tests","done":0}]
```

## Stage 4: Example SQL Query

Below is an example SQL query executed in Stage 4 using DB Browser for SQLite to verify database state and operations:

```sql
SELECT id, title, done FROM tasks;
```

**Query Result Output:**

| id | title | done |
|---|---|---|
| 1 | Task 1: Read documentation | 0 |
| 2 | Task 2: Implement feature | 1 |
| 3 | Task 3: Write tests | 0 |

## Screenshots

### Swagger API Documentation
<img width="2560" height="1600" alt="Swagger API Documentation" src="https://github.com/user-attachments/assets/47f6ac6d-e553-4243-b557-682a2a44814b" />

### DB Browser for SQLite
<img width="1280" height="764" alt="DB Browser" src="https://github.com/user-attachments/assets/078e1385-ee9e-464a-8086-ec3373fca734" />

