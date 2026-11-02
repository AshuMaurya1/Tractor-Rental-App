import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js";
import userRouter from "./router/userRoutes.js";
import ownerRouter from "./router/ownerRoutes.js";
import bookingRouter from "./router/bookingRoutes.js";
import adminRouter from './router/adminRoutes.js';
import locationRouter from './router/locationRoutes.js';
import notificationRouter from './router/notificationRoutes.js';
import kycRouter from './router/kycRoutes.js';
import paymentRouter from './router/paymentRoutes.js';
import superAdminRouter from './router/superAdminRoutes.js';
import { ensureAdminExists } from './config/seedSuperAdmin.js';
import { ensureLocationsSeeded } from './config/seedLocations.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:4173",
];
let dbReady = false;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
app.get("/", (_req, res) => {res.send("Server is running in development mode by Ashu Maurya");});
app.use("/api/user", userRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/superadmin", superAdminRouter);
app.use("/api/admin", adminRouter);
app.use("/api/locations", locationRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/payments", paymentRouter);


app.listen(PORT, () => {
  console.log(`Server is running on Ashu Singh http://localhost:${PORT}`);
});


// Do not block the HTTP server while MongoDB connects. Requests that need the
// database will return an error until the database connection is available.
connectDB()
  .then(async () => {
    dbReady = true;
    await ensureAdminExists();
    await ensureLocationsSeeded();
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

