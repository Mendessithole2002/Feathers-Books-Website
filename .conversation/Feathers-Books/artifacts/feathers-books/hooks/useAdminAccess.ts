import { useAdminAuth } from '@/context/AdminAuthContext';

export function useAdminAccess() {
  return useAdminAuth();
}