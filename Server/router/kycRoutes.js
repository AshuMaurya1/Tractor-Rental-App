import express from 'express';
import upload from '../Middlewere/multer.js';
import { protect, requireAdmin, authorizeRoles } from '../Middlewere/auth.js';
import {
  submitOwnerKyc,
  getOwnerKyc,
  listPendingKyc,
  reviewKyc,
} from '../controllers/kycController.js';

const kycRouter = express.Router();

kycRouter.post('/submit', protect, authorizeRoles('owner'), upload.array('documents', 5), submitOwnerKyc);
kycRouter.get('/mine', protect, authorizeRoles('owner'), getOwnerKyc);
kycRouter.get('/pending', protect, requireAdmin, listPendingKyc);
kycRouter.patch('/:id/review', protect, requireAdmin, reviewKyc);

export default kycRouter;
