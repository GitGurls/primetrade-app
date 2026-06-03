# Primetrade.ai – Task Manager API

**Backend Developer Intern Assignment** | Built with Node.js, Express, MongoDB & React

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (Access + Refresh Tokens) |
| Validation | express-validator |
| Security | Helmet, bcryptjs, express-rate-limit |
| API Docs | Swagger (OpenAPI 3.0) |
| Logging | Winston |
| Frontend | React 18, React Router v6, Axios|

---

## 📁 Project Structure

```
primetrade-app/
├── backend/
│   ├── src/
│   │   ├── config/         # DB + Swagger config
│   │   ├── controllers/    # Route handlers (auth, tasks, users, admin)
│   │   ├── middlewares/    # Auth, error handling, validation
│   │   ├── models/         # Mongoose schemas (User, Task)
│   │   ├── routes/v1/      # Versioned API routes
│   │   ├── utils/          # JWT utils, logger, API response helpers
│   │   ├── validators/     # express-validator schemas
│   │   └── app.js          # Express app entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/
    └── src/
        ├── components/     # Navbar, LoadingSpinner
        ├── context/        # AuthContext (global state)
        ├── pages/          # Login, Register, Dashboard, Tasks, AdminPanel
        ├── services/       # Axios API service + interceptors
        └── App.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or [Atlas](https://cloud.mongodb.com))

### Backend Setup

```bash
cd backend
cp .env.example .env      # Edit with your MongoDB URI + JWT secrets
npm install
npm run dev               # Starts on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install
npm start                 # Starts on http://localhost:3000
```

---

## 🔑 Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGO_URI=//
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

---

## 📚 API Documentation

Once the backend is running, visit:

```
http://localhost:5000/api-docs
```

Full interactive Swagger UI with all endpoints, request/response schemas, and built-in authorization.

---

## 🔐 Authentication Flow

```
POST /api/v1/auth/register   → Register + receive JWT
POST /api/v1/auth/login      → Login + receive JWT + refresh token
GET  /api/v1/auth/me         → Get current user (Bearer token required)
POST /api/v1/auth/refresh    → Get new access token via refresh token
PUT  /api/v1/auth/change-password
POST /api/v1/auth/logout
```

---

## 📋 API Endpoints Summary

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/v1/auth/register | Public |
| POST | /api/v1/auth/login | Public |
| GET | /api/v1/auth/me | Private |
| POST | /api/v1/auth/logout | Private |
| POST | /api/v1/auth/refresh | Public |
| PUT | /api/v1/auth/change-password | Private |

### Tasks (CRUD)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/v1/tasks | Private |
| POST | /api/v1/tasks | Private |
| GET | /api/v1/tasks/:id | Private |
| PUT | /api/v1/tasks/:id | Private |
| DELETE | /api/v1/tasks/:id | Private |
| GET | /api/v1/tasks/stats | Private |

### Admin (Role-Protected)
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/v1/admin/users | Admin |
| GET | /api/v1/admin/users/:id | Admin |
| PATCH | /api/v1/admin/users/:id/role | Admin |
| PATCH | /api/v1/admin/users/:id/status | Admin |
| GET | /api/v1/admin/stats | Admin |

---

## 🛡️ Security Features

- **Password Hashing** — bcrypt with 12 salt rounds
- **JWT Authentication** — Access tokens (7d) + Refresh tokens (30d)
- **Role-Based Access** — `user` and `admin` roles, enforced at middleware level
- **Rate Limiting** — Global (100 req/15min) + stricter auth limiter (20 req/15min)
- **Security Headers** — Helmet.js (XSS, HSTS, CSP, etc.)
- **Input Validation** — express-validator on all POST/PUT routes
- **Input Sanitization** — `trim()`, `normalizeEmail()`, size limits on all inputs
- **CORS** — Configured for specific frontend origin only
- **Token Rotation** — Refresh token invalidated on password change

---

## 📊 Database Schema

### User
```js
{
  name: String,         // 2-50 chars
  email: String,        // unique, indexed
  password: String,     // bcrypt hashed, never returned
  role: 'user'|'admin', // indexed
  isActive: Boolean,
  lastLogin: Date,
  passwordChangedAt: Date,
  refreshToken: String  // never returned
}
```

### Task
```js
{
  title: String,                              // 3-100 chars
  description: String,                        // max 500 chars
  status: 'pending'|'in-progress'|'completed',
  priority: 'low'|'medium'|'high',
  dueDate: Date,
  tags: [String],
  user: ObjectId,                             // ref: User, indexed
  completedAt: Date                           // auto-set
}
```

---

## 📈 Scalability Note

See [SCALABILITY.md](./SCALABILITY.md) for a detailed write-up.

**Quick summary:**
- API versioning (`/api/v1/`) allows non-breaking future changes
- Modular MVC structure — easy to split into microservices
- MongoDB horizontal scaling via Atlas sharding
- Stateless JWT auth — ready for multi-instance deployment behind a load balancer
- Redis caching layer can be added at the controller level (cache-aside pattern)
- Docker-ready structure (Dockerfile + docker-compose template included)

---

## 👤 Author

Built for **Primetrade.ai Backend Developer Intern Assignment**
