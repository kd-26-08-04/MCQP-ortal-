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
npm run seed   # seeds DSA Levels 1–10 (100 questions)
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
| `JWT_SECRET` | **Yes in production** | Long random secret |
| `FRONTEND_URL` | Recommended | Your Vercel URL(s), comma-separated |
| `ADMIN_USERNAME` | Recommended | Admin login id (email **or** legacy id like `admin@2026`) |
| `ADMIN_PASSWORD` | Recommended | Strong password |
| `PORT` | No | Defaults to `5000` |
| `TEST_TIME_LIMIT_MINUTES` | No | Defaults to `20` |

**Security notes**
- Student registration always creates `role: student`.
- Admin accounts are provisioned via env bootstrap credentials on login.
- Auth endpoints are rate-limited. Helmet security headers are enabled.

---

## Deploy

### Backend (Render)

1. New Web Service → root directory `backend`
2. Build: `npm install`
3. Start: `npm start`
4. Set env vars (`NODE_ENV=production`, `FRONTEND_URL` = your Vercel URL)
5. After deploy, run seed once (Render shell or one-off job): `npm run seed`

### Frontend (Vercel)

1. Import repo → root directory `frontend`
2. Framework: Vite
3. Env: `VITE_API_URL` = your Render backend URL (no trailing slash)

### Smoke checklist after deploy

- [ ] `GET /api/health` returns `{ status: "ok" }`
- [ ] Student register + login works
- [ ] Admin login with `ADMIN_USERNAME` / `ADMIN_PASSWORD` works (including `admin@2026`-style ids)
- [ ] Courses → DSA levels load; Level 1–10 tests load questions
- [ ] Admin → Students stats + PDF; Questions CRUD; Reset progress

---

## Seed questions

```bash
cd backend
npm run seed
```

Seeds **10 questions for each of levels 1–10**. Admins can also add/edit/delete questions in the Admin console.
