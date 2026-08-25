# Auth - Login & Protect

A simple API for authentication built with Node.js, Express, TypeScript, and Supabase. It provides user registration, login, and access to protected routes using JWT bearer authentication.

## Environment Variables

To run this project, you need to set up your environment variables. 
Copy the provided `.env.example` file to create a new `.env` file:

```bash
cp .env.example .env
```

Open the `.env` file and fill in your configuration (specifically your Supabase URL and Anon Key):

```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
PORT=3000
```

## Running the Project

Once your environment variables are configured and dependencies are installed, you can start the development server with this single command:

```bash
npm run dev
```

## API Reference

Here is the reference table of the API endpoints available in this project:

| Endpoint | Method | Description | Requires Auth |
| :--- | :---: | :--- | :---: |
| `/public/info` | `GET` | Retrieve public info without authentication | No |
| `/auth/signup` | `POST` | Create a new user account with email and password | No |
| `/auth/login` | `POST` | Authenticate a user and receive an access token | No |
| `/auth/logout` | `POST` | Sign out the currently authenticated user | Yes |
| `/protected/profile` | `GET` | Retrieve the authenticated user's profile information | Yes |
| `/protected/dashboard` | `GET` | Access the protected dashboard | Yes |

## Swagger Documentation

Below is the screenshot of the Swagger UI documenting the API endpoints:

<img width="2560" height="1600" alt="Image" src="https://github.com/user-attachments/assets/ef474903-5a3c-492a-a833-c98ec4727eab" />
