import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'operator';
  adminOnly?: boolean;
  fallback?: React.ReactNode;
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  adminOnly = false, 
  fallback 
}: RoleGuardProps) {
  const { userProfile, isAdmin, isOperator } = useAuth();

  // If no user profile is loaded yet, show loading
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Check admin-only access
  if (adminOnly && !isAdmin()) {
    return fallback || (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">Access Restricted</p>
          <p className="text-sm mt-2">This feature is only available to administrators</p>
          <p className="text-xs mt-1 text-gray-400">Current role: {userProfile.role}</p>
        </div>
      </div>
    );
  }

  // Check specific role requirement
  if (requiredRole && userProfile.role !== requiredRole) {
    return fallback || (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">Access Restricted</p>
          <p className="text-sm mt-2">This feature requires {requiredRole} role</p>
          <p className="text-xs mt-1 text-gray-400">Current role: {userProfile.role}</p>
        </div>
      </div>
    );
  }

  // User has required permissions
  return <>{children}</>;
}