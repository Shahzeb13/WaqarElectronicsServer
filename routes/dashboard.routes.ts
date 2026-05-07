import { Router } from 'express';
import { getDashboardStats, getManagerDashboard } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', authenticate, authorize(['OWNER']), getDashboardStats);
router.get('/manager/stats', authenticate, authorize(['BRANCH_MANAGER']), getManagerDashboard);

export default router;
