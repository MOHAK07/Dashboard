export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface UserProfile {
  id: string;
  role: 'admin' | 'operator';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  confirmPassword: string;
  role?: 'admin' | 'operator';
}