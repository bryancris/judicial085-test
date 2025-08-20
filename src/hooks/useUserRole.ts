import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'super_admin' | 'firm_admin' | 'attorney' | 'paralegal' | 'user';

interface UserRoleHook {
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAttorney: boolean;
}

export const useUserRole = (): UserRoleHook => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setIsLoading(false);
          return;
        }

        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user'); // Default role
        } else {
          setRole(userRoles?.role || 'user');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const isAdmin = role === 'firm_admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const isAttorney = role === 'attorney';

  return {
    role,
    isLoading,
    isAdmin,
    isSuperAdmin,
    isAttorney
  };
};