import express from "express";
import { loginUser, registerUser, getUserData, getAllTractors, getTractorById, updateUserProfile } from "../controllers/userController.js";
import { protect, authorizeRoles } from '../Middlewere/auth.js'

const userRouter = express.Router(); 

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/cars', getAllTractors);
userRouter.get('/data', protect, getUserData);
userRouter.put('/profile', protect, updateUserProfile);
userRouter.get('/tractors', getAllTractors);
userRouter.get('/tractor/:id', getTractorById);
userRouter.get('/farmer/dashboard', protect, authorizeRoles('farmer'), (req, res) => res.json({ success: true, message: 'Farmer access confirmed.' }));
userRouter.get('/owner/dashboard', protect, authorizeRoles('owner'), (req, res) => res.json({ success: true, message: 'Owner access confirmed.' }));

export default userRouter;

