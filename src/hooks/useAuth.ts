import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState, LoginCredentials, SignUpCredentials, UserProfile } from '../types/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    error: null,
  });

  // Fetch user profile with role information
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('Profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: data.id,
        role: data.role,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
          return;
        }

        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
            last_sign_in_at: session.user.last_sign_in_at,
          };

          const userProfile = await fetchUserProfile(session.user.id);

          setAuthState(prev => ({
            ...prev,
            user,
            userProfile,
            isLoading: false,
          }));
        } else {
          setAuthState(prev => ({
            ...prev,
            user: null,
            userProfile: null,
            isLoading: false,
          }));
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Failed to initialize authentication', 
          isLoading: false 
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
            last_sign_in_at: session.user.last_sign_in_at,
          };

          // Fetch user profile after successful authentication
          const userProfile = await fetchUserProfile(session.user.id);

          setAuthState(prev => ({
            ...prev,
            user,
            userProfile,
            error: null,
            isLoading: false,
          }));
        } else {
          setAuthState(prev => ({
            ...prev,
            user: null,
            userProfile: null,
            error: null,
            isLoading: false,
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (credentials: SignUpCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    if (credentials.password !== credentials.confirmPassword) {
      const error = 'Passwords do not match';
      setAuthState(prev => ({ ...prev, error, isLoading: false }));
      return { success: false, error };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return { success: false, error: error.message };
      }

      // Wait a moment for the trigger to create the profile
      if (data.user) {
        // Create or update the user profile with the selected role
        try {
          const { error: profileError } = await supabase
            .from('Profiles')
            .upsert({
              id: data.user.id,
              role: credentials.role || 'operator'
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Don't fail the signup, just log the error
          }
        } catch (profileErr) {
          console.error('Unexpected error creating profile:', profileErr);
        }

        // Give the database trigger time to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch the created profile
        const userProfile = await fetchUserProfile(data.user.id);
        
        if (userProfile) {
          setAuthState(prev => ({
            ...prev,
            userProfile,
          }));
        }
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, user: null, userProfile: null }));
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setAuthState(prev => ({ ...prev, error: error.message, isLoading: false }));
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Failed to sign out', 
        isLoading: false 
      }));
    }
  };

  // Helper function to check if user has admin role
  const isAdmin = (): boolean => {
    return authState.userProfile?.role === 'admin';
  };

  // Helper function to check if user has operator role
  const isOperator = (): boolean => {
    return authState.userProfile?.role === 'operator';
  };

  // Helper function to check if user can access dashboard overview
  const canAccessDashboard = (): boolean => {
    return isAdmin();
  };
  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isOperator,
    canAccessDashboard,
    fetchUserProfile,
  };
}