import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { uploadLocalFileToCloudinary } from '../services/cloudinary.js';

/**
 * Get all stock items (Owner View)
 */
export const getAllStock = async (req: Request, res: Response) => {
  try {
    const stock = await prisma.stockItem.findMany({
      include: {
        branch: { select: { id: true, name: true } },
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
 * Get all branches (for select inputs)
 */
export const getBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    res.json({ branches });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches', error });
  }
};

/**
 * Get single stock item detail
 */
export const getStockById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const item = await prisma.stockItem.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        stockHistory: {
          include: { addedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!item) return res.status(404).json({ message: 'Stock item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item detail', error });
  }
};

/**
 * Create new stock item
 */
export const createStock = async (req: Request, res: Response) => {
  const { branchId, name, category, description, purchasePrice, salePrice, quantity, lowStockThreshold } = req.body;
  const createdById = req.user?.id;

  if (!branchId || !createdById || !name || !purchasePrice || !salePrice) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const cloudinaryRes: any = await uploadLocalFileToCloudinary(req.file.path, 'stock-items');
      imageUrl = cloudinaryRes.secure_url;
      imagePublicId = cloudinaryRes.public_id;
    }

    const newItem = await prisma.stockItem.create({
      data: {
        branchId,
        name,
        category,
        description,
        purchasePrice: Number(purchasePrice),
        salePrice: Number(salePrice),
        quantity: parseInt(quantity || 0),
        lowStockThreshold: parseInt(lowStockThreshold || 5),
        createdById,
        imageUrl,
        imagePublicId
      }
    });

    // Create history entry if initial quantity is > 0
    if (parseInt(quantity) > 0) {
      await prisma.stockHistory.create({
        data: {
          stockItemId: newItem.id,
          quantityAdded: parseInt(quantity),
          addedById,
          notes: 'Initial stock'
        }
      });
    }

    res.status(201).json({ message: 'Stock item created', item: newItem });
  } catch (error) {
    res.status(500).json({ message: 'Error creating stock item', error });
  }
};

/**
 * Update stock item details
 */
export const updateStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, description, purchasePrice, salePrice, lowStockThreshold } = req.body;

  try {
    const existingItem = await prisma.stockItem.findUnique({ where: { id } });
    if (!existingItem) return res.status(404).json({ message: 'Item not found' });

    let imageUrl = existingItem.imageUrl;
    let imagePublicId = existingItem.imagePublicId;

    if (req.file) {
      const cloudinaryRes: any = await uploadLocalFileToCloudinary(req.file.path, 'stock-items');
      imageUrl = cloudinaryRes.secure_url;
      imagePublicId = cloudinaryRes.public_id;
    }

    const updatedItem = await prisma.stockItem.update({
      where: { id },
      data: {
        name: name || existingItem.name,
        category: category || existingItem.category,
        description: description || existingItem.description,
        purchasePrice: purchasePrice ? Number(purchasePrice) : existingItem.purchasePrice,
        salePrice: salePrice ? Number(salePrice) : existingItem.salePrice,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : existingItem.lowStockThreshold,
        imageUrl,
        imagePublicId
      }
    });

    res.json({ message: 'Stock item updated', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'Error updating stock item', error });
  }
};

/**
 * Add quantity to existing stock (creates history)
 */
export const addStockQuantity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, supplier, notes } = req.body;
  const addedById = req.user?.id;

  if (!quantity || !addedById) return res.status(400).json({ message: 'Quantity is required' });

  try {
    const item = await prisma.stockItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const updatedItem = await prisma.stockItem.update({
      where: { id },
      data: { quantity: { increment: parseInt(quantity) } }
    });

    await prisma.stockHistory.create({
      data: {
        stockItemId: id,
        quantityAdded: parseInt(quantity),
        supplier,
        notes,
        addedById
      }
    });

    res.json({ message: 'Stock quantity updated', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: 'Error adding stock quantity', error });
  }
};

/**
 * Delete stock item
 */
export const deleteStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Note: Stock history, sales, and claims might have foreign key constraints
    // Depending on the business logic, we might want to soft-delete or handle cascading
    await prisma.stockItem.delete({ where: { id } });
    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting stock item. It may be linked to sales or history.', error });
  }
};
