import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getOwnerDashboard = async (req: Request, res: Response) => {
  try {
    const [
      totalBranches,
      totalBranchManagers,
      totalEmployees,
      totalCustomers,
      totalStockItems,
      stockStats,
      salesStats,
      cashSalesStats,
      installmentSalesStats,
      recoveryStats,
      expenseStats,
      pendingClaimsCount,
      branches
    ] = await Promise.all([
      prisma.branch.count(),
      prisma.user.count({ where: { role: 'BRANCH_MANAGER' } }),
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.customer.count(),
      prisma.stockItem.count(),
      prisma.stockItem.aggregate({
        _sum: { quantity: true }
      }),
      prisma.sale.aggregate({
        _sum: { salePrice: true, paidAmount: true, remainingAmount: true }
      }),
      prisma.sale.aggregate({
        where: { saleType: 'CASH' },
        _sum: { salePrice: true }
      }),
      prisma.sale.aggregate({
        where: { saleType: 'INSTALLMENT' },
        _sum: { salePrice: true }
      }),
      prisma.recovery.aggregate({
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        _sum: { amount: true }
      }),
      prisma.claim.count({ where: { status: 'PENDING' } }),
      prisma.branch.findMany({
        select: {
          id: true,
          name: true,
          customers: { select: { id: true } },
          sales: { select: { salePrice: true, remainingAmount: true } },
          recoveries: { select: { amount: true } },
          expenses: { select: { amount: true } },
          stockItems: { select: { quantity: true } }
        }
      })
    ]);

    // Process branch-wise summary
    const branchWiseSummary = branches.map(branch => {
      const totalCustomers = branch.customers.length;
      const totalSalesAmount = branch.sales.reduce((acc, sale) => acc + Number(sale.salePrice), 0);
      const totalPendingAmount = branch.sales.reduce((acc, sale) => acc + Number(sale.remainingAmount), 0);
      const totalRecoveryAmount = branch.recoveries.reduce((acc, rec) => acc + Number(rec.amount), 0);
      const totalExpensesAmount = branch.expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
      const stockQuantity = branch.stockItems.reduce((acc, item) => acc + item.quantity, 0);

      return {
        branchId: branch.id,
        branchName: branch.name,
        totalCustomers,
        totalSalesAmount,
        totalRecoveryAmount,
        totalPendingAmount,
        totalExpensesAmount,
        stockQuantity
      };
    });

    res.json({
      totalBranches: totalBranches || 0,
      totalBranchManagers: totalBranchManagers || 0,
      totalEmployees: totalEmployees || 0,
      totalCustomers: totalCustomers || 0,
      totalStockItems: totalStockItems || 0,
      totalStockQuantity: stockStats._sum.quantity || 0,
      totalSalesAmount: salesStats._sum.salePrice || 0,
      totalCashSalesAmount: cashSalesStats._sum.salePrice || 0,
      totalInstallmentSalesAmount: installmentSalesStats._sum.salePrice || 0,
      totalRecoveryAmount: recoveryStats._sum.amount || 0,
      totalPendingAmount: salesStats._sum.remainingAmount || 0,
      totalExpensesAmount: expenseStats._sum.amount || 0,
      pendingClaimsCount: pendingClaimsCount || 0,
      branchWiseSummary
    });
  } catch (error) {
    console.error('Error fetching owner dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error });
  }
};

// Keep the old one for compatibility if needed, or replace it if it's generic
export const getDashboardStats = getOwnerDashboard;

export const getManagerDashboard = async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;

  if (!branchId) {
    return res.status(400).json({ message: 'No branch associated with this manager' });
  }

  try {
    const [
      totalEmployees,
      totalCustomers,
      totalStockItems,
      stockStats,
      salesStats,
      cashSalesStats,
      installmentSalesStats,
      recoveryStats,
      expenseStats,
      pendingClaimsCount
    ] = await Promise.all([
      prisma.user.count({ where: { branchId, role: 'EMPLOYEE' } }),
      prisma.customer.count({ where: { branchId } }),
      prisma.stockItem.count({ where: { branchId } }),
      prisma.stockItem.aggregate({
        where: { branchId },
        _sum: { quantity: true }
      }),
      prisma.sale.aggregate({
        where: { branchId },
        _sum: { salePrice: true, paidAmount: true, remainingAmount: true }
      }),
      prisma.sale.aggregate({
        where: { branchId, saleType: 'CASH' },
        _sum: { salePrice: true }
      }),
      prisma.sale.aggregate({
        where: { branchId, saleType: 'INSTALLMENT' },
        _sum: { salePrice: true }
      }),
      prisma.recovery.aggregate({
        where: { branchId },
        _sum: { amount: true }
      }),
      prisma.expense.aggregate({
        where: { branchId },
        _sum: { amount: true }
      }),
      prisma.claim.count({ where: { branchId, status: 'PENDING' } })
    ]);

    res.json({
      totalEmployees: totalEmployees || 0,
      totalCustomers: totalCustomers || 0,
      totalStockItems: totalStockItems || 0,
      totalStockQuantity: stockStats._sum.quantity || 0,
      totalSalesAmount: salesStats._sum.salePrice || 0,
      totalCashSalesAmount: cashSalesStats._sum.salePrice || 0,
      totalInstallmentSalesAmount: installmentSalesStats._sum.salePrice || 0,
      totalRecoveryAmount: recoveryStats._sum.amount || 0,
      totalPendingAmount: salesStats._sum.remainingAmount || 0,
      totalExpensesAmount: expenseStats._sum.amount || 0,
      pendingClaimsCount: pendingClaimsCount || 0
    });
  } catch (error) {
    console.error('Error fetching manager dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching manager dashboard stats', error });
  }
};
