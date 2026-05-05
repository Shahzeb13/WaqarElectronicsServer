import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string | null;
}

// Type Predicates
export const isOwner = (user: AuthUser): user is AuthUser & { role: 'OWNER' } => {
  return user.role === 'OWNER';
};

export const isBranchManager = (user: AuthUser): user is AuthUser & { role: 'BRANCH_MANAGER' } => {
  return user.role === 'BRANCH_MANAGER';
};

export const isEmployee = (user: AuthUser): user is AuthUser & { role: 'EMPLOYEE' } => {
  return user.role === 'EMPLOYEE';
};

// Permission check: Can create target role?
export const canCreateRole = (creatorRole: Role, targetRole: Role): boolean => {
  if (creatorRole === 'OWNER') {
    return targetRole === 'BRANCH_MANAGER' || targetRole === 'EMPLOYEE';
  }
  if (creatorRole === 'BRANCH_MANAGER') {
    return targetRole === 'EMPLOYEE';
  }
  return false;
};
