import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

export const createUser = async (req: Request, res: Response) => {
  const { name, email, phone, password, role, branchId } = req.body;

  try {
    // 1. Basic validation
    if (!name || !email || !password || !role || !branchId) {
      return res.status(400).json({ message: 'Name, email, password, role, and branchId are required' });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 3. Role-specific validation
    if (!['BRANCH_MANAGER', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    // 4. Branch existence and manager check (if applicable)
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { manager: true }
    });

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    if (role === 'BRANCH_MANAGER' && branch.managerId) {
      return res.status(400).json({ 
        message: `Branch "${branch.name}" already has a manager: ${branch.manager?.name}` 
      });
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Create user and update branch in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role,
          branchId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          branchId: true,
          isActive: true,
          createdAt: true
        }
      });

      // Update the branch manager ONLY if role is BRANCH_MANAGER
      if (role === 'BRANCH_MANAGER') {
        await tx.branch.update({
          where: { id: branchId },
          data: { managerId: user.id }
        });
      }

      return user;
    });

    res.status(201).json({ 
      message: `${role.replace('_', ' ')} created successfully`, 
      user: result 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error creating user', error });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users', error });
  }
};
