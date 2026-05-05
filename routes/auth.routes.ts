import { Router } from 'express';
import { login, logout, createUser, getMe, getAllUsers } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorize(['OWNER']), getAllUsers);

// Owner can create Branch Managers and Employees
// Branch Manager can create Employees
router.post(
  '/create-user', 
  authenticate, 
  authorize(['OWNER', 'BRANCH_MANAGER']), 
  createUser
);

export default router;
