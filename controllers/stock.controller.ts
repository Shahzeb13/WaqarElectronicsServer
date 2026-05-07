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
  console.log("Stock creation route hit:", req.body);
  const { branchId, name, category, description, purchasePrice, salePrice, quantity, lowStockThreshold } = req.body;
  const createdById = req.user?.id;

  // Added category to the check as it is required in the schema
  if (!branchId || !createdById || !name || !category || !purchasePrice || !salePrice) {
    return res.status(400).json({ 
      message: 'Missing required fields', 
      details: { branchId, name, category, purchasePrice, salePrice } 
    });
  }

  try {
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      try {
        const cloudinaryRes: any = await uploadLocalFileToCloudinary(req.file.path, 'stock-items');
        imageUrl = cloudinaryRes.secure_url;
        imagePublicId = cloudinaryRes.public_id;
      } catch (uploadErr) {
        console.error("Cloudinary upload failed:", uploadErr);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    const parsedQty = parseInt(quantity) || 0;
    const parsedThreshold = parseInt(lowStockThreshold) || 5;

    const newItem = await prisma.stockItem.create({
      data: {
        branchId,
        name,
        category,
        description,
        purchasePrice: parseFloat(purchasePrice),
        salePrice: parseFloat(salePrice),
        quantity: parsedQty,
        lowStockThreshold: parsedThreshold,
        createdById,
        imageUrl,
        imagePublicId
      }
    });

    // Create history entry if initial quantity is > 0
    if (parsedQty > 0) {
      await prisma.stockHistory.create({
        data: {
          stockItemId: newItem.id,
          quantityAdded: parsedQty,
          addedById: createdById,
          notes: 'Initial stock'
        }
      });
    }

    res.status(201).json({ message: 'Stock item created', item: newItem });
  } catch (error: any) {
    console.error("Prisma Create Stock Error:", error);
    res.status(500).json({ 
      message: 'Error creating stock item', 
      error: error.message || error 
    });
  }
};

/**
 * Update stock item details
 */
export const updateStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, description, purchasePrice, salePrice, lowStockThreshold, branchId } = req.body;

  try {
    const existingItem = await prisma.stockItem.findUnique({ where: { id } });
    if (!existingItem) return res.status(404).json({ message: 'Item not found' });

    let imageUrl = existingItem.imageUrl;
    let imagePublicId = existingItem.imagePublicId;

    if (req.file) {
      try {
        const cloudinaryRes: any = await uploadLocalFileToCloudinary(req.file.path, 'stock-items');
        imageUrl = cloudinaryRes.secure_url;
        imagePublicId = cloudinaryRes.public_id;
      } catch (uploadErr) {
        console.error("Cloudinary upload failed during update:", uploadErr);
        return res.status(500).json({ message: 'Failed to upload new image' });
      }
    }

    const updatedItem = await prisma.stockItem.update({
      where: { id },
      data: {
        name: name || existingItem.name,
        category: category || existingItem.category,
        description: description !== undefined ? description : existingItem.description,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : existingItem.purchasePrice,
        salePrice: salePrice ? parseFloat(salePrice) : existingItem.salePrice,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : existingItem.lowStockThreshold,
        branchId: branchId || existingItem.branchId,
        imageUrl,
        imagePublicId
      }
    });

    res.json({ message: 'Stock item updated', item: updatedItem });
  } catch (error: any) {
    console.error("Prisma Update Stock Error:", error);
    res.status(500).json({ 
      message: 'Error updating stock item', 
      error: error.message || error 
    });
  }
};

/**
 * Add quantity to existing stock (creates history)
 */
export const addStockQuantity = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, supplier, notes } = req.body;
  const addedById = req.user?.id;

  const parsedQty = parseInt(quantity);
  if (!quantity || isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ message: 'A valid positive quantity is required' });
  }

  if (!addedById) return res.status(401).json({ message: 'User identity missing' });

  try {
    const item = await prisma.stockItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const updatedItem = await prisma.stockItem.update({
      where: { id },
      data: { quantity: { increment: parsedQty } }
    });

    await prisma.stockHistory.create({
      data: {
        stockItemId: id,
        quantityAdded: parsedQty,
        supplier,
        notes,
        addedById
      }
    });

    res.json({ message: 'Stock quantity updated', item: updatedItem });
  } catch (error: any) {
    console.error("Add Stock Quantity Error:", error);
    res.status(500).json({ 
      message: 'Error adding stock quantity', 
      error: error.message || error 
    });
  }
};

/**
 * Delete stock item
 */
export const deleteStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // 1. Check if item exists and if it has dependent records like Sales or Claims
    const item = await prisma.stockItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sales: true, claims: true }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    if (item._count.sales > 0 || item._count.claims > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete item: It is linked to existing sales or claims. Try updating quantity to 0 instead.' 
      });
    }

    // 2. Delete related Stock History (this is safe to delete with the item)
    await prisma.stockHistory.deleteMany({
      where: { stockItemId: id }
    });

    // 3. Delete the stock item itself
    await prisma.stockItem.delete({ where: { id } });

    res.json({ message: 'Stock item deleted successfully' });
  } catch (error: any) {
    console.error("Delete Stock Error:", error);
    res.status(500).json({ 
      message: 'Error deleting stock item', 
      error: error.message || error 
    });
  }
};
