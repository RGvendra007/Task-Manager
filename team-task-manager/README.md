# ⚡ TaskFlow — Team Task Manager

> A production-grade full-stack web application for team project and task management with role-based access control.

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────┐
│                   CLIENT (React + Vite)              │
│  Auth · Dashboard · Projects · Kanban Board · Tasks  │
└────────────────────┬─────────────────────────────────┘
                     │ REST API (HTTPS)
┌────────────────────▼─────────────────────────────────┐
│              BACKEND (Node.js + Express)              │
│  JWT Auth · Rate Limiting · RBAC · Validation        │
└────────────────────┬─────────────────────────────────┘
                     │ Prisma ORM
┌────────────────────▼─────────────────────────────────┐
│             DATABASE (PostgreSQL)                     │
│  Users · Projects · ProjectMembers · Tasks           │
└──────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Authentication
- JWT-based auth (signup / login / protected routes)
- Secure bcrypt password hashing (cost factor 12)
- Token stored in localStorage, auto-attached via Axios interceptor
- Auto-redirect on token expiry

### Role-Based Access Control
| Action | ADMIN | MEMBER |
|---|---|---|
| View project & tasks | ✅ | ✅ |
| Create / edit tasks | ✅ | ✅ |
| Delete tasks (own) | ✅ | ✅ |
| Delete any task | ✅ | ❌ |
| Add / remove members | ✅ | ❌ |
| Update member roles | ✅ | ❌ |
| Delete project | Owner only | ❌ |

### Projects
- Create, edit, delete projects
- Color-coded project cards
- Project member management (add by email, set roles)

### Tasks
- Create, edit, delete tasks
- 4 statuses: **Todo · In Progress · In Review · Done**
- 4 priority levels: **Low · Medium · High · Urgent**
- Due date tracking with overdue highlighting
- Assign tasks to project members
- Kanban board view + list view

### Dashboard
- Real-time stats: tasks by status, overdue count
- Recent projects with your role
- Latest task activity across all projects

---

## 🗄 Database Schema

```
User ──< ProjectMember >── Project ──< Task
                                         ↑
                                    (assignee FK)
                                    (creator FK)
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL (local or Docker)

### 1. Clone & Install

```bash
git clone <repo>
cd team-task-manager

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET etc.
```

### 3. Run Migrations & Seed

```bash
cd backend
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Backend

```bash
cd backend
npm run dev   # starts on port 5000
```

### 5. Configure & Start Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm run dev   # starts on port 5173
```

### Demo Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@taskflow.dev | Admin@123 |
| Member | member@taskflow.dev | Member@123 |

---

## 🌐 Deploy to Railway

### Backend
1. Create a **New Project** on [railway.app](https://railway.app)
2. Add a **PostgreSQL** database service
3. Deploy backend from GitHub (root: `/backend`)
4. Set environment variables:
   - `DATABASE_URL` → auto-injected from PostgreSQL plugin
   - `JWT_SECRET` → long random string
   - `FRONTEND_URL` → your frontend Railway URL
   - `NODE_ENV` → `production`
5. Railway will run `npm run db:generate && npm run db:migrate` on build

### Frontend
1. Deploy frontend from GitHub (root: `/frontend`)
2. Set environment variables:
   - `VITE_API_URL` → your backend Railway URL + `/api`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |
| PATCH | `/api/auth/profile` | Private |

### Projects
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/projects` | Private |
| POST | `/api/projects` | Private |
| GET | `/api/projects/:id` | Member |
| PATCH | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Admin/Owner |
| POST | `/api/projects/:id/members` | Admin |
| PATCH | `/api/projects/:id/members/:uid` | Admin |
| DELETE | `/api/projects/:id/members/:uid` | Admin |

### Tasks
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/tasks/my` | Private |
| GET | `/api/tasks/project/:id` | Member |
| POST | `/api/tasks/project/:id` | Member |
| GET | `/api/tasks/:id` | Member |
| PATCH | `/api/tasks/:id` | Member |
| DELETE | `/api/tasks/:id` | Creator/Admin |

### Dashboard
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/dashboard` | Private |

---

## 🔒 Security

- **Helmet** — secure HTTP headers
- **CORS** — configurable allowed origins
- **Rate Limiting** — 100 req/15min global, 20 req/15min auth routes
- **Input Validation** — express-validator on all write endpoints
- **Password Hashing** — bcryptjs, cost 12
- **JWT** — short-lived tokens, verified on every request
- **Compression** — gzip responses

---

## 🛠 Tech Stack

**Frontend**: React 18, React Router 6, Axios, Vite  
**Backend**: Node.js, Express.js, Prisma ORM  
**Database**: PostgreSQL  
**Auth**: JWT + bcryptjs  
**Deployment**: Railway  

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema
│   │   └── seed.js             # Demo data
│   ├── src/
│   │   ├── app.js              # Express app
│   │   ├── controllers/        # Business logic
│   │   ├── middleware/         # Auth + RBAC
│   │   ├── routes/             # API routes
│   │   └── utils/              # JWT, response helpers
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/                # Axios client + services
    │   ├── components/         # Shared UI components
    │   ├── context/            # React Context (Auth)
    │   ├── pages/              # Route pages
    │   ├── styles/             # Global CSS
    │   └── utils/              # Helpers
    ├── index.html
    └── package.json
```
