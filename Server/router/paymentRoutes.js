import express from 'express';
import { protect } from '../Middlewere/auth.js';
import { createPaymentOrder, verifyPaymentSignature } from '../controllers/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', protect, createPaymentOrder);
paymentRouter.post('/verify', protect, verifyPaymentSignature);

export default paymentRouter;
