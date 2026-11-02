# Tractor Rental Platform — Production Deployment Guide

This guide walks you through deploying the **Tractor Rental Platform** using the industry-standard free-tier architecture:
- **Backend API**: Hosted on [Render](https://render.com) (Node.js Web Service)
- **Frontend App**: Hosted on [Vercel](https://vercel.com) (React + Vite SPA)
- **Database**: Hosted on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free M0 Cluster)
- **Media Storage**: Hosted on [ImageKit](https://imagekit.io) (Free 20 GB CDN Storage)

---

## Architecture Overview

```
 [Farmer / Owner / Admin Browser]
                │
                ▼
       [Vercel Frontend] (React + Vite)
      https://your-app.vercel.app
                │ (API Calls via axios)
                ▼
       [Render Backend] (Node.js + Express)
      https://your-api.onrender.com
           │                │
           ▼                ▼
   [MongoDB Atlas]      [ImageKit.io]
 (Users, Tractors,    (Tractor & Profile
     Bookings)             Photos)
```

---

## Step 1: Set Up Free Cloud Database (MongoDB Atlas)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new free cluster (**M0 Free Sandbox**).
3. Under **Security > Database Access**:
   - Create a database user (e.g. `tractor_admin`) with a secure password.
   - Assign the **Read and write to any database** role.
4. Under **Security > Network Access**:
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) so that Render can connect.
5. Under **Deployment > Database**:
   - Click **Connect** > **Drivers** (Node.js).
   - Copy your connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.

---

## Step 2: Set Up Free Image Storage (ImageKit.io)

1. Log in to [ImageKit.io](https://imagekit.io).
2. Go to **Developer Options**:
   - Copy your **Public Key**
   - Copy your **Private Key**
   - Copy your **URL Endpoint** (e.g., `https://ik.imagekit.io/your_id`)

---

## Step 3: Deploy Backend on Render

### Option A: Using the `render.yaml` Blueprint (Easiest & Fastest)
1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure production deployment"
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository `AshuMaurya1/Tractor-Rental-App`.
5. Render reads `render.yaml` automatically and creates the `tractor-rental-backend` service.
6. Fill in the prompted Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string from Step 1.
   - `ADMIN_EMAIL`: Your initial superadmin email (e.g. `admin@tractorrental.com`).
   - `ADMIN_PASSWORD`: A strong password for superadmin.
   - `IMAGEKIT_PUBLIC_KEY`: From Step 2.
   - `IMAGEKIT_PRIVATE_KEY`: From Step 2.
   - `IMAGEKIT_URL_ENDPOINT`: From Step 2.
   - `CLIENT_URL`: `https://your-app.vercel.app` (you can update this after Step 4).
7. Click **Apply**.
8. Once built and healthy, copy your Render Web Service URL (e.g., `https://tractor-rental-backend.onrender.com`).
9. Test by opening `https://tractor-rental-backend.onrender.com/health` in your browser. It should return:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "uptime": 12,
     "timestamp": "2026-11-03T..."
   }
   ```

### Option B: Manual Web Service Setup on Render
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository `AshuMaurya1/Tractor-Rental-App`.
3. Configure the service settings:
   - **Name**: `tractor-rental-backend`
   - **Region**: Closest to you (e.g., Singapore or Oregon)
   - **Root Directory**: `Server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGODB_URI` = `mongodb+srv://...`
   - `JWT_SECRET` = `<generate any random 32+ char string>`
   - `ADMIN_EMAIL` = `admin@tractorrental.com`
   - `ADMIN_PASSWORD` = `AdminSecurePassword123!`
   - `IMAGEKIT_PUBLIC_KEY` = `...`
   - `IMAGEKIT_PRIVATE_KEY` = `...`
   - `IMAGEKIT_URL_ENDPOINT` = `https://ik.imagekit.io/...`
   - `CLIENT_URL` = `https://*.vercel.app`
5. Click **Create Web Service**.

---

## Step 4: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository: `AshuMaurya1/Tractor-Rental-App`.
4. In the project configuration modal:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: Click *Edit* and select `Client` (or leave as root; both work thanks to `vercel.json`).
5. Open the **Environment Variables** section and add:
   - `VITE_BASE_URL`: Your Render backend URL (e.g. `https://tractor-rental-backend.onrender.com`) without a trailing slash.
   - `VITE_CURRENCY`: `₹`
6. Click **Deploy**.
7. Vercel will build the frontend in ~20 seconds and assign you a production URL (e.g. `https://tractor-rental-app.vercel.app`).

---

## Step 5: Final Check & SuperAdmin Login

1. Open your Vercel URL in your browser.
2. Verify:
   - Home page hero banner and tractor listings load.
   - Language switch (Hindi/English) toggles properly.
   - Login with the SuperAdmin credentials:
     - **Email**: The `ADMIN_EMAIL` configured in Render
     - **Password**: The `ADMIN_PASSWORD` configured in Render
   - Open Admin / Owner Dashboard and test adding or booking a tractor!
