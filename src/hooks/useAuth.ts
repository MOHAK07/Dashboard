// src/hooks/useAuth.ts (corrected version)
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { TimestampService } from "../services/timestampService";
import { useApp } from "../contexts/AppContext";
import {
  User,
  AuthState,
  LoginCredentials,
  SignUpCredentials,
} from "../types/auth";

export function useAuth() {
  const {
    dispatch,
    state: { user },
  } = useApp();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: undefined,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchUserProfile = async (user: User): Promise<string | null> => {
      try {
        const { data: profile, error } = await supabase
          .from("Profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.warn("Error fetching user profile:", error.message);
          return null;
        }
        return profile?.role || null;
      } catch (err) {
        console.warn("Unexpected error fetching profile:", err);
        return null;
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
          const fetchedRole = await fetchUserProfile(user);
          let role = fetchedRole;

          if (role) {
            localStorage.setItem("userRole", role);
          } else {
            // If fetching fails, try to get it from localStorage as a fallback
            const storedRole = localStorage.getItem("userRole");
            if (storedRole) {
              console.log("AUTH: Using stored role as fallback.");
              role = storedRole;
            } else {
              // If no stored role, default to "operator"
              console.warn(
                "AUTH: No stored role found, defaulting to 'operator'."
              );
              role = "operator";
            }
          }

          // Final check to ensure role is not null
          if (!role) {
            role = "operator"; // Should not happen with the logic above, but as a safeguard
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
            localStorage.removeItem("userRole");
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
    console.log("🔵 AUTH: Starting sign-out process...");
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Attempt to sign out from Supabase.
      // This might fail if the session is already gone, and that's okay.
      const { error } = await supabase.auth.signOut();

      // Check for any error that ISN'T an AuthSessionMissingError
      if (error && error.name !== "AuthSessionMissingError") {
        // If it's a different, real error (like a network issue), throw it.
        throw error;
      }

      // If we reach here, it means either the sign-out was successful,
      // or the user was already signed out from Supabase's perspective.
      // In either case, we proceed to clear the local state.
    } catch (error) {
      // Log any unexpected errors that occurred during sign-out.
      console.error("🔴 AUTH: A non-critical sign-out error occurred:", error);
    } finally {
      // THIS IS THE CRUCIAL PART:
      // Always clear the user from the local state and stop loading.
      // This ensures the UI logs out cleanly every single time.
      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_LOADING", payload: false });
      console.log("🟢 AUTH: Local user state cleared. Sign-out complete.");
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}
