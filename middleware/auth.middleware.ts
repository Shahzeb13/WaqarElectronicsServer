import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../types/auth.js';
import chalk from 'chalk';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    console.error(chalk.red('JWT Verification Error:'), error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access denied for role ${req.user.role}` 
      });
    }

    next();
  };
};
