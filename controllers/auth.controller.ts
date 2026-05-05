import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { canCreateRole } from '../types/auth.js';
import { Role } from '@prisma/client';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Login successful', user: payload, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role, branchId, phone } = req.body;
  const creator = req.user!;

  try {
    // 1. Validate permissions
    if (!canCreateRole(creator.role, role as Role)) {
      return res.status(403).json({ 
        message: `Your role (${creator.role}) is not authorized to create a ${role}` 
      });
    }

    // 2. Additional validation for Branch Manager
    if (creator.role === 'BRANCH_MANAGER') {
      // Branch manager can only create employees for THEIR branch
      if (branchId && branchId !== creator.branchId) {
        return res.status(403).json({ message: 'You can only create employees for your own branch' });
      }
    }

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 4. Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: hashedPassword,
        role: role as Role,
        branchId: branchId || creator.branchId, // Default to creator's branch if not specified
        isActive: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });

  } catch (error) {
    res.status(500).json({ message: 'Server error during user creation', error });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        isActive: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        isActive: true,
        phone: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};
