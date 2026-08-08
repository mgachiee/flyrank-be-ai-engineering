# Task Management API

## What this is

This is a Task Management API built using Node.js, Express, TypeScript, and SQLite (via `better-sqlite3`). It allows users to perform CRUD (Create, Read, Update, Delete) operations on a list of tasks with persistent storage in a database. The application also includes interactive API documentation powered by Swagger UI.

## How to install & run it

You can install the dependencies and start the development server using the following documented command:

```bash
npm install && npm run dev
```

This will run the server at `http://localhost:3000`.

## Endpoints

The following endpoints are available in this API:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Returns basic API info and available endpoints. |
| `GET` | `/health` | Health check endpoint, returns status `ok`. |
| `GET` | `/tasks` | Retrieves tasks (supports filtering via `done` and `search` query parameters). |
| `GET` | `/tasks/:id` | Retrieves a specific task by its ID. |
| `POST` | `/tasks` | Creates a new task and saves it to the database. |
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

## Swagger Documentation Screenshot

<img width="2560" height="1600" alt="Screenshot 2026-07-18 132449" src="https://github.com/user-attachments/assets/47f6ac6d-e553-4243-b557-682a2a44814b" />

## Exploring SQLite with DB Browser

I ran the SQL query below and the DB Browser and my API return the same output.

```sql
SELECT * FROM tasks;
```

## Mortality Experiment

After creating new tasks and restarting the server, all newly created tasks are lost; only default items remain. This is because the application uses in-memory storage, which lacks persistence unlike a database.
