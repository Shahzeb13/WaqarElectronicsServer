import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const createBranch = async (req: Request, res: Response) => {
  const { name, address, phone } = req.body;

  try {
    if (!name || !address) {
      return res.status(400).json({ message: 'Branch name and address are required' });
    }

    const branch = await prisma.branch.create({
      data: { 
        name, 
        address, 
        phone: phone || null,
        isActive: true
      },
    });

    res.status(201).json({ message: 'Branch created successfully', branch });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating branch', error });
  }
};

export const getAllBranches = async (_req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { users: true, stocks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ branches });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching branches', error });
  }
};

export const getBranchById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true, phone: true } },
        _count: { 
          select: { 
            users: true, 
            stocks: true,
            sales: true 
          } 
        }
      }
    });

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching branch detail', error });
  }
};

export const assignManagerToBranch = async (req: Request, res: Response) => {
  const { branchId, managerId } = req.body;

  try {
    if (!branchId || !managerId) {
      return res.status(400).json({ message: 'branchId and managerId are required' });
    }

    // Verify user is a BRANCH_MANAGER
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager || manager.role !== 'BRANCH_MANAGER') {
      return res.status(400).json({ message: 'Selected user is not a Branch Manager' });
    }

    // Update the branch to assign the manager
    const branch = await prisma.branch.update({
      where: { id: branchId },
      data: { managerId },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });

    // Also set the manager's branchId
    await prisma.user.update({
      where: { id: managerId },
      data: { branchId },
    });

    res.json({ message: 'Manager assigned to branch successfully', branch });
  } catch (error) {
    res.status(500).json({ message: 'Server error assigning manager', error });
  }
};
