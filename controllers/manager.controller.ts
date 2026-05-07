import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { Role } from '@prisma/client';
import { uploadLocalFileToCloudinary } from '../services/cloudinary.js';

/**
 * Get all employees belonging to the manager's branch
 */
export const getBranchEmployees = async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  if (!branchId) return res.status(400).json({ message: 'No branch associated' });

  try {
    const employees = await prisma.user.findMany({
      where: { branchId, role: 'EMPLOYEE' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error });
  }
};

/**
 * Create a new employee for the manager's branch
 */
export const createBranchEmployee = async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  const branchId = req.user?.branchId;

  if (!branchId) {
    return res.status(400).json({ message: 'No branch associated with your account' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role: Role.EMPLOYEE,
        branchId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({ message: 'Employee created successfully', employee: newUser });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Error creating employee', error });
  }
};

/**
 * Get all stock items in the manager's branch
 */
export const getBranchStock = async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  if (!branchId) return res.status(400).json({ message: 'No branch associated' });

  try {
    const stock = await prisma.stockItem.findMany({
      where: { branchId },
      include: {
        createdBy: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ stock });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock', error });
  }
};

/**
 * Create a new stock item with optional image
 */
export const createBranchStock = async (req: Request, res: Response) => {
  const { name, category, description, purchasePrice, salePrice, quantity, lowStockThreshold } = req.body;
  const branchId = req.user?.branchId;
  const createdById = req.user?.id;

  if (!branchId || !createdById) {
    return res.status(400).json({ message: 'Incomplete session data' });
  }

  try {
    let imageUrl = null;
    let imagePublicId = null;

    // Handle image upload if present
    if (req.file) {
      const cloudinaryRes: any = await uploadLocalFileToCloudinary(req.file.path, 'stock-items');
      imageUrl = cloudinaryRes.secure_url;
      imagePublicId = cloudinaryRes.public_id;
    }

    const newStock = await prisma.stockItem.create({
      data: {
        name,
        category,
        description,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        quantity: parseInt(quantity),
        lowStockThreshold: parseInt(lowStockThreshold || 5),
        branchId,
        createdById,
        imageUrl,
        imagePublicId
      }
    });

    res.status(201).json({ message: 'Stock item added successfully', stock: newStock });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ message: 'Error adding stock', error });
  }
};

/**
 * Get all customers registered at the manager's branch
 */
export const getBranchCustomers = async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  if (!branchId) return res.status(400).json({ message: 'No branch associated' });

  try {
    const customers = await prisma.customer.findMany({
      where: { branchId },
      orderBy: { name: 'asc' }
    });
    res.json({ customers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error });
  }
};

/**
 * Get all sales made at the manager's branch
 */
export const getBranchSales = async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  if (!branchId) return res.status(400).json({ message: 'No branch associated' });

  try {
    const sales = await prisma.sale.findMany({
      where: { branchId },
      include: {
        customer: { select: { name: true, phone: true } },
        item: { select: { name: true } },
        soldBy: { select: { name: true } }
      },
      orderBy: { saleDate: 'desc' }
    });
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales', error });
  }
};

/**
 * Get all recoveries collected at the manager's branch
 */
export const getBranchRecoveries = async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  if (!branchId) return res.status(400).json({ message: 'No branch associated' });

  try {
    const recoveries = await prisma.recovery.findMany({
      where: { branchId },
      include: {
        customer: { select: { name: true } },
        sale: { select: { itemId: true, item: { select: { name: true } } } },
        employee: { select: { name: true } }
      },
      orderBy: { collectionDate: 'desc' }
    });
    res.json({ recoveries });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recoveries', error });
  }
};

/**
 * Get all warranty claims reported at the manager's branch
 */
export const getBranchClaims = async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  if (!branchId) return res.status(400).json({ message: 'No branch associated' });

  try {
    const claims = await prisma.claim.findMany({
      where: { branchId },
      include: {
        customer: { select: { name: true } },
        item: { select: { name: true } },
        assignedTo: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ claims });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claims', error });
  }
};

/**
 * Get all expenses recorded at the manager's branch
 */
export const getBranchExpenses = async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  if (!branchId) return res.status(400).json({ message: 'No branch associated' });

  try {
    const expenses = await prisma.expense.findMany({
      where: { branchId },
      include: {
        addedBy: { select: { name: true } }
      },
      orderBy: { expenseDate: 'desc' }
    });
    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error });
  }
};
