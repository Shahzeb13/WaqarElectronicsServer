import { Router } from 'express';
import { createBranch, getAllBranches, getBranchById, assignManagerToBranch } from '../controllers/branch.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Store: Create a new branch (Owner only)
router.post('/', authenticate, authorize(['OWNER']), createBranch);

// Retrieve: List all branches (Owner and Managers)
router.get('/', authenticate, authorize(['OWNER', 'BRANCH_MANAGER']), getAllBranches);

// Retrieve: Get single branch detail
router.get('/:id', authenticate, authorize(['OWNER', 'BRANCH_MANAGER']), getBranchById);

// Assign Manager
router.post('/assign-manager', authenticate, authorize(['OWNER']), assignManagerToBranch);

export default router;
