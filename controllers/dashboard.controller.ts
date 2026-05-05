import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [branchCount, userCount, stockCount, saleCount] = await Promise.all([
      prisma.branch.count(),
      prisma.user.count(),
      prisma.stockItem.count(),
      prisma.sale.count(),
    ]);

    // Calculate "Total Assets" (sum of stock quantities * price)
    const stocks = await prisma.stockItem.findMany({
      select: { quantity: true, price: true }
    });
    
    const totalAssetsValue = stocks.reduce((acc, item) => acc + (item.quantity * Number(item.price)), 0);

    res.json({
      branchCount,
      userCount,
      stockCount,
      saleCount,
      totalAssetsValue,
      revenue: 0, // Placeholder until sales logic is fully implemented
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error });
  }
};
