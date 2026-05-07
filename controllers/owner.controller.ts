import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

/**
 * Get all stock items across all branches (Owner view)
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
    res.status(500).json({ message: 'Error fetching global stock', error });
  }
};
