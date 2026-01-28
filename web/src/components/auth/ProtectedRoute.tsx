/**
 * Protected Route - Redirect to login if not authenticated
 */
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, loadUser } = useAuthStore();

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token, loadUser]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
