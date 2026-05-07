import { Router } from 'express';
import { 
  getBranchEmployees,
  createBranchEmployee,
  getBranchStock,
  createBranchStock,
  getBranchCustomers,
  getBranchSales,
  getBranchRecoveries,
  getBranchClaims,
  getBranchExpenses
} from '../controllers/manager.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// All routes here require BRANCH_MANAGER role
router.use(authenticate, authorize(['BRANCH_MANAGER']));

router.get('/employees', getBranchEmployees);
router.post('/employees', createBranchEmployee);
router.get('/stock', getBranchStock);
router.post('/stock', upload.single('image'), createBranchStock);
router.get('/customers', getBranchCustomers);
router.get('/sales', getBranchSales);
router.get('/recoveries', getBranchRecoveries);
router.get('/claims', getBranchClaims);
router.get('/expenses', getBranchExpenses);

export default router;
