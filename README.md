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
- Access to the shared Supabase Dev project (credentials from team)

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Configure environment variables:**
   
   Copy the example files and add the shared dev Supabase credentials:
   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```
   
   **Frontend (.env):**
   ```
   VITE_SUPABASE_URL=<shared_dev_supabase_url>
   VITE_SUPABASE_ANON_KEY=<shared_dev_supabase_anon_key>
   ```
   
   **Backend (.env):**
   ```
   PORT=5000
   SUPABASE_URL=<shared_dev_supabase_url>
   SUPABASE_ANON_KEY=<shared_dev_supabase_anon_key>
   ```
   
   > **Note:** Get the actual credentials from your team lead. We use one shared Dev project for all team members.

## Supabase Setup Strategy

We use a **shared Supabase approach** for efficient team development:

### Development Environment
- **One shared "Dev" project** for the entire team
- All developers use the same database and test against the same dev data
- Credentials are distributed to team members (not in Git)
- Low schema churn = minimal conflicts between developers

### Production Environment  
- **Separate "Prod" project** with its own keys
- Production credentials are managed separately and securely

### Database Schema Management

**Initial Setup (one-time):**
If the database tables don't exist yet, create them in the shared Dev project:

```sql
-- Run this in Supabase SQL Editor (shared Dev project)
CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Migration Philosophy:**
- Database migrations are tracked in Git (when we add them)
- Any team member can reset/reseed the shared dev database
- Schema changes are coordinated through the team
- Migrations ensure reproducible database state across environments

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