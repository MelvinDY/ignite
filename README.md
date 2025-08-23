# Full Stack Web Application

A full-stack web application with React + Vite frontend, TypeScript backend with REST API, and Supabase database.

## Project Structure

```
├── frontend/          # React + Vite + TypeScript frontend
├── backend/           # Node.js + Express + TypeScript backend
├── package.json       # Root package.json with dev scripts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Supabase account and project

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Configure environment variables:**
   
   Copy the example files and fill in your Supabase credentials:
   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```
   
   Update the `.env` files with your Supabase URL and keys.

3. **Set up Supabase database:**
   
   Create a `users` table in your Supabase project:
   ```sql
   CREATE TABLE users (
     id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
     name TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:5000

### Individual Commands

**Frontend:**
```bash
npm run frontend:dev    # Start frontend dev server
npm run frontend:build  # Build for production
```

**Backend:**
```bash
npm run backend:dev     # Start backend dev server with nodemon
npm run backend:build   # Compile TypeScript
npm run backend:start   # Start compiled backend
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

## Technologies Used

**Frontend:**
- React 18
- Vite
- TypeScript
- Supabase Client

**Backend:**
- Node.js
- Express
- TypeScript
- Supabase
- CORS middleware

## Features

- ✅ React + Vite frontend with TypeScript
- ✅ Express backend with TypeScript
- ✅ Supabase database integration
- ✅ REST API endpoints
- ✅ CORS configuration
- ✅ Development scripts for both frontend and backend
- ✅ Basic user CRUD operations