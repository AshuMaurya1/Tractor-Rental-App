import express from "express";
import { addTractor, changeRoleToOwner, deleteTractor, getDashboardData, getOwnerTractors, toggleTractorAvailability, updateUserImage, updateTractor } from "../controllers/ownerController.js";
import { authorizeRoles, protect } from "../Middlewere/auth.js";
import upload from "../Middlewere/multer.js";

const ownerRouter = express.Router();

ownerRouter.use(protect, authorizeRoles('owner'));
ownerRouter.post("/change-role", changeRoleToOwner);
ownerRouter.post("/add-tractor", upload.fields([{ name: "images", maxCount: 5 }, { name: "image", maxCount: 1 }]), addTractor);
ownerRouter.get("/tractors", getOwnerTractors);
ownerRouter.put("/tractors/:tractorId/availability", toggleTractorAvailability);
ownerRouter.put("/tractors/:tractorId", updateTractor);
ownerRouter.delete("/tractors/:tractorId", deleteTractor);
ownerRouter.get("/dashboard", getDashboardData);
ownerRouter.post('/update-image', upload.single('image'), updateUserImage)

export default ownerRouter;
