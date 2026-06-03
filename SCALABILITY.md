# Scalability & Architecture Notes

## Current Architecture

```
Client (React) ──► Express API ──► MongoDB
                      │
                 JWT Middleware
                 Rate Limiting
                 Helmet Security
```

---

## Scaling Strategy

### 1. Horizontal Scaling & Load Balancing

The API is **stateless by design** — JWT tokens carry all session info, so no sticky sessions are needed.

```
                    ┌─────────────────────┐
   Clients ──►  Load Balancer (Nginx/AWS ALB)
                    ├─── API Instance 1
                    ├─── API Instance 2
                    └─── API Instance N
                              │
                        MongoDB Atlas
                     (Replica Set / Sharding)
```

Deployment options: **Docker Swarm**, **Kubernetes (K8s)**, or **AWS ECS/EKS**.

---

### 2. Microservices Decomposition

The current monolith is structured for easy extraction into microservices:

| Service | Responsibility |
|---------|---------------|
| `auth-service` | Registration, login, token management |
| `task-service` | Task CRUD, stats |
| `user-service` | Profile management |
| `admin-service` | User management, analytics |
| `notification-service` | Email alerts, due-date reminders |

Communication: **REST** for sync calls, **RabbitMQ/Kafka** for async events (e.g., "task completed" → notification).

---

### 3. Caching Layer (Redis)

```js
// Example: Cache task stats (invalidated on task mutation)
const getTaskStats = async (req, res) => {
  const cacheKey = `task:stats:${req.user._id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const stats = await Task.aggregate([...]);
  await redis.setex(cacheKey, 300, JSON.stringify(stats)); // 5 min TTL
  return res.json(stats);
};
```

**What to cache:**
- Task statistics (computed aggregations)
- User profiles (read-heavy, rarely mutated)
- Admin platform stats

---

### 4. Database Scaling

- **MongoDB Atlas** with replica sets for high availability
- **Indexes** already defined on frequently queried fields (`user`, `status`, `priority`, `email`)
- **Sharding** on `user` field for multi-tenant scale
- **Connection Pooling** via Mongoose (default pool size: 5, tunable)

---

### 5. API Versioning

All routes are prefixed with `/api/v1/`. When breaking changes are needed:
- Introduce `/api/v2/` alongside v1
- Deprecate v1 gradually with sunset headers
- No downtime for existing clients

---

### 6. Docker Deployment

```dockerfile
# Dockerfile (backend)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 5000
CMD ["node", "src/app.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    ports: ["5000:5000"]
    env_file: ./backend/.env
    depends_on: [mongo]
  
  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [api]
  
  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]
  
  redis:
    image: redis:7-alpine

volumes:
  mongo_data:
```

---

### 7. Logging & Monitoring

- **Winston** for structured logging (already integrated)
- **Morgan** for HTTP request logging
- Scale with: **ELK Stack** (Elasticsearch + Logstash + Kibana) or **Datadog**
- Health check endpoint at `GET /health` for load balancer probing

---

### 8. Performance Optimizations Already Implemented

| Optimization | Where |
|---|---|
| Database indexes | User (email, role), Task (user+status, user+priority) |
| Projection queries | `.lean()` for read-only queries (faster than full Mongoose docs) |
| `Promise.all()` | Parallel DB queries on Dashboard and Admin stats |
| Pagination | All list endpoints paginated (default 10/page) |
| Body size limit | 10kb limit on JSON payloads |
| Rate limiting | Prevents abuse at the API gateway level |
