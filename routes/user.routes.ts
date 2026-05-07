import { Router } from 'express';
import { createUser, getAllUsers } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Create user (Owner only)
router.post('/', authenticate, authorize(['OWNER']), createUser);

// Get all users (Owner only)
router.get('/', authenticate, authorize(['OWNER']), getAllUsers);

export default router;
