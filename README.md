# Eistatech MCQ Portal

Full-stack MCQ assessment portal for progressive DSA level testing.

- **Backend**: Node.js + Express + MongoDB (Mongoose) + PDF reports
- **Frontend**: React (Vite) with custom CSS

---

## Local development

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, FRONTEND_URL
npm install
npm run seed   # seeds DSA Level 1 questions
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional: create `frontend/.env` with:

```
VITE_API_URL=http://localhost:5000
```

---

## Environment variables (backend)

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes (prod) | MongoDB Atlas or local URI |
| `JWT_SECRET` | **Yes in production** | Long random secret; server refuses to start without it in `NODE_ENV=production` |
| `FRONTEND_URL` | Recommended | Comma-separated allowed CORS origins |
| `ADMIN_USERNAME` | Recommended | Admin bootstrap email (login only) |
| `ADMIN_PASSWORD` | Recommended | Strong password; never commit real values |
| `PORT` | No | Defaults to `5000` |
| `TEST_TIME_LIMIT_MINUTES` | No | Defaults to `20` |

**Security notes**
- Student registration always creates `role: student`. Clients cannot self-promote to admin.
- Admin accounts are provisioned via env bootstrap credentials on login.
- Auth endpoints are rate-limited. Helmet security headers are enabled.
- Do not put real secrets in README, git, or screenshots.

---

## Deploy

### Backend (Render)

1. New Web Service → root directory `backend`
2. Build: `npm install`
3. Start: `npm start`
4. Set env vars from the table above (`NODE_ENV=production`, `FRONTEND_URL` = your Vercel URL)

### Frontend (Vercel)

1. Import repo → root directory `frontend`
2. Framework: Vite
3. Env: `VITE_API_URL` = your Render backend URL (no trailing slash)

---

## Seed questions

```bash
cd backend
npm run seed
```

Only Level 1 ships with curated questions. Additional levels need questions inserted into MongoDB before students can take those tests.
