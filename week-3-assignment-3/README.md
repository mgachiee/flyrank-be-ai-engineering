# Task Management API

## What this is

This is a Task Management API built using Node.js, Express, TypeScript, and PostgreSQL. It allows users to perform CRUD (Create, Read, Update, Delete) operations on a list of tasks with persistent database storage.

## Environment Variables

Before running the application, you need to configure the environment variables.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. The `.env.example` file contains the required variables to configure the PostgreSQL database and connection string:
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `DATABASE_URL`

## How to Install & Run

Start the entire stack (API and Database) using Docker Compose with one command:

```bash
docker compose up
```

Running this command will start the server at `http://localhost:3000` with the PostgreSQL database fully configured and seeded.

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

## Screenshots

### Swagger API Documentation
<img width="2560" height="1600" alt="Swagger API Documentation" src="https://github.com/user-attachments/assets/47f6ac6d-e553-4243-b557-682a2a44814b" />

### Database Data (PostgreSQL)
<img width="303" height="266" alt="Image" src="https://github.com/user-attachments/assets/f8c446a0-0ad6-4464-8cf6-568c164aff96" />
