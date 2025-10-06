// src/hooks/useAuth.ts (corrected version)
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { TimestampService } from "../services/timestampService";
import {
  User,
  AuthState,
  LoginCredentials,
  SignUpCredentials,
} from "../types/auth";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: undefined,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchUserProfile = async (user: User): Promise<string> => {
      try {
        const { data: profile, error } = await supabase
          .from("Profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.warn("Error fetching user profile:", error.message);
          return "operator";
        }
        return profile?.role || "operator";
      } catch (err) {
        console.warn("Unexpected error fetching profile:", err);
        return "operator";
      }
    };

    const handleSession = async (session: any) => {
      if (!isMounted) return;

      try {
        if (session?.user) {
          console.log("🟢 AUTH: Processing user session");

          const user: User = {
            id: session.user.id,
            email: session.user.email || "",
            created_at: session.user.created_at,
            last_sign_in_at: session.user.last_sign_in_at,
          };

          // Fetch role with timeout
          const rolePromise = fetchUserProfile(user);
          const timeoutPromise = new Promise<string>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error("Profile fetch timeout")),
              5000
            );
          });

          let role: string;
          try {
            role = await Promise.race([rolePromise, timeoutPromise]);
            clearTimeout(timeoutId);
          } catch (error) {
            console.warn("Profile fetch failed, using default role:", error);
            role = "operator";
          }

          if (isMounted) {
            setAuthState({
              user,
              role,
              isLoading: false,
              error: null,
            });
          }
        } else {
          console.log("🟡 AUTH: No user session");
          if (isMounted) {
            setAuthState({
              user: null,
              role: undefined,
              isLoading: false,
              error: null,
            });
          }
        }
      } catch (error) {
        console.error("🔴 AUTH: Error handling session:", error);
        if (isMounted) {
          setAuthState({
            user: null,
            role: undefined,
            isLoading: false,
            error: null, // Don't show error to user, just log it
          });
        }
      }
    };

    const initAuth = async () => {
      try {
        console.log("🟦 AUTH: Initializing authentication");

        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<any>((_, reject) => {
          setTimeout(() => reject(new Error("Session timeout")), 10000);
        });

        let sessionResult;
        try {
          sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
        } catch (error) {
          console.error("🔴 AUTH: Session initialization failed:", error);
          if (isMounted) {
            setAuthState({
              user: null,
              role: undefined,
              isLoading: false,
              error: null,
            });
          }
          return;
        }

        await handleSession(sessionResult.data.session);

        // Set up auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;

          console.log("🟦 AUTH: Auth state changed:", event);

          if (event === "SIGNED_OUT") {
            TimestampService.clearAllTimestamps();
            window.dispatchEvent(new CustomEvent("user-signed-out"));
          }

          await handleSession(session);
        });

        // Cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("🔴 AUTH: Initialization error:", error);
        if (isMounted) {
          setAuthState({
            user: null,
            role: undefined,
            isLoading: false,
            error: null,
          });
        }
      }
    };

    // Start initialization
    const cleanup = initAuth();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cleanup
        .then((cleanupFn) => {
          if (cleanupFn) {
            cleanupFn();
          }
        })
        .catch(console.error);
    };
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return { error };
      }

      // Don't set loading to false here - let the auth state change handler do it
      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      const errorMessage = "An unexpected error occurred";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { error: { message: errorMessage } };
    }
  };

  const signUp = async (credentials: SignUpCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    if (credentials.password !== credentials.confirmPassword) {
      const errorMessage = "Passwords do not match";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { error: { message: errorMessage } };
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Sign up error:", err);
      const errorMessage = "An unexpected error occurred";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      console.log("🔴 AUTH: Starting sign-out process");

      // Don't set loading state during sign-out to prevent UI issues
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("🔴 AUTH: Sign-out error:", error);
        return { error };
      }

      // Clear session data
      TimestampService.clearAllTimestamps();
      sessionStorage.clear();

      console.log("🟢 AUTH: Sign-out successful");
      return { error: null };
    } catch (err) {
      console.error("🔴 AUTH: Unexpected sign-out error:", err);
      return { error: { message: "Sign-out failed" } };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}
