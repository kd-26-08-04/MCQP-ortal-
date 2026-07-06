# Eistatech MCQ Portal - Deployment Guide

This repository contains the complete full-stack code for the MCQ Assessment Portal.
- **Backend**: Node.js Express server + MongoDB Mongoose models + PDF report generation.
- **Frontend**: React application built with Vite and custom Vanilla CSS.

---

## 1. Hosting the Backend on Render

Render is ideal for hosting Node.js Express APIs.

### Steps to Deploy:
1. Log in to [Render](https://render.com/) and click **New** -> **Web Service**.
2. Connect your GitHub repository: `https://github.com/kd-26-08-04/MCQP-ortal-.git`.
3. In the Web Service configuration settings:
   - **Name**: `mcq-portal-backend` (or your choice).
   - **Root Directory**: `backend` (This is critical since the backend is in a subfolder).
   - **Runtime**: `Node`.
   - **Build Command**: `npm install`.
   - **Start Command**: `npm start` (or `node server.js`).
4. Click **Advanced** and add the following **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random secret string (e.g. `your_custom_jwt_secret_key`).
   - `PORT`: `5000` (Render will automatically allocate a port, but defining it is safe).
   - `ADMIN_USERNAME`: `admin@2026`
   - `ADMIN_PASSWORD`: `1234567890`
5. Click **Create Web Service**. 
6. Once deployed, Render will provide a public URL (e.g., `https://mcq-portal-backend.onrender.com`). Copy this URL.

---

## 2. Hosting the Frontend on Vercel

Vercel is optimal for static frontends created with React/Vite.

### Steps to Deploy:
1. Log in to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
2. Import your GitHub repository: `https://github.com/kd-26-08-04/MCQP-ortal-.git`.
3. In the project configure settings:
   - **Root Directory**: Click "Edit" and select the **`frontend`** directory (this ensures Vercel compiles from the React folder).
   - **Framework Preset**: Vercel will automatically detect `Vite`.
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).
4. Expand the **Environment Variables** section and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://mcq-portal-backend.onrender.com` (Paste the Render backend URL you copied, without a trailing slash).
5. Click **Deploy**.
6. Once the build completes, Vercel will provide a live URL (e.g., `https://mcq-portal.vercel.app`) to access the application.
