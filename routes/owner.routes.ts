import { Router } from 'express';
import { 
  getAllStock, 
  getStockById, 
  createStock, 
  updateStock, 
  addStockQuantity, 
  deleteStock 
} from '../controllers/stock.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// All routes here require OWNER role
router.use(authenticate, authorize(['OWNER']));

// Global Stock Routes
router.get('/stock', getAllStock);
router.get('/stock/:id', getStockById);
router.post('/stock', upload.single('image'), createStock);
router.put('/stock/:id', upload.single('image'), updateStock);
router.patch('/stock/:id/add-quantity', addStockQuantity);
router.delete('/stock/:id', deleteStock);

export default router;
