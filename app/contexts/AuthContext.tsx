import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  shouldShowAuthPrompt: boolean;
  dismissAuthPrompt: () => void;
  resetAuthPromptTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys for tracking auth prompts
const AUTH_PROMPT_KEYS = {
  LAST_PROMPT: 'auth_last_prompt',
  DISMISS_COUNT: 'auth_dismiss_count',
  FIRST_LAUNCH: 'auth_first_launch'
};

// Intelligent prompting intervals (in milliseconds)
const PROMPT_INTERVALS = {
  FIRST_TIME: 30 * 1000,      // 30 seconds after first use
  SECOND_TIME: 5 * 60 * 1000,  // 5 minutes after first dismiss
  THIRD_TIME: 15 * 60 * 1000,  // 15 minutes after second dismiss
  FOURTH_TIME: 60 * 60 * 1000, // 1 hour after third dismiss
  FINAL: 24 * 60 * 60 * 1000   // 24 hours after fourth dismiss
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldShowAuthPrompt, setShouldShowAuthPrompt] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Reset auth prompt when user signs in
        if (event === 'SIGNED_IN') {
          setShouldShowAuthPrompt(false);
          await AsyncStorage.removeItem(AUTH_PROMPT_KEYS.LAST_PROMPT);
          await AsyncStorage.removeItem(AUTH_PROMPT_KEYS.DISMISS_COUNT);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Initialize auth prompt logic for unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      initializeAuthPromptLogic();
    }
  }, [loading, user]);

  const initializeAuthPromptLogic = async () => {
    try {
      const firstLaunch = await AsyncStorage.getItem(AUTH_PROMPT_KEYS.FIRST_LAUNCH);
      const lastPrompt = await AsyncStorage.getItem(AUTH_PROMPT_KEYS.LAST_PROMPT);
      const dismissCount = await AsyncStorage.getItem(AUTH_PROMPT_KEYS.DISMISS_COUNT);
      
      const now = Date.now();
      const dismissCountNum = dismissCount ? parseInt(dismissCount) : 0;
      
      // First time user
      if (!firstLaunch) {
        await AsyncStorage.setItem(AUTH_PROMPT_KEYS.FIRST_LAUNCH, now.toString());
        // Show first prompt after 30 seconds
        setTimeout(() => {
          setShouldShowAuthPrompt(true);
        }, PROMPT_INTERVALS.FIRST_TIME);
        return;
      }

      // Calculate next prompt time based on dismiss count
      if (lastPrompt) {
        const lastPromptTime = parseInt(lastPrompt);
        let nextInterval: number;

        switch (dismissCountNum) {
          case 0:
            nextInterval = PROMPT_INTERVALS.FIRST_TIME;
            break;
          case 1:
            nextInterval = PROMPT_INTERVALS.SECOND_TIME;
            break;
          case 2:
            nextInterval = PROMPT_INTERVALS.THIRD_TIME;
            break;
          case 3:
            nextInterval = PROMPT_INTERVALS.FOURTH_TIME;
            break;
          default:
            nextInterval = PROMPT_INTERVALS.FINAL;
            break;
        }

        const timeSinceLastPrompt = now - lastPromptTime;
        
        if (timeSinceLastPrompt >= nextInterval) {
          setShouldShowAuthPrompt(true);
        } else {
          // Schedule next prompt
          const timeUntilNextPrompt = nextInterval - timeSinceLastPrompt;
          setTimeout(() => {
            setShouldShowAuthPrompt(true);
          }, timeUntilNextPrompt);
        }
      }
    } catch (error) {
      console.error('Error initializing auth prompt logic:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const dismissAuthPrompt = async () => {
    setShouldShowAuthPrompt(false);
    
    try {
      const now = Date.now();
      const dismissCount = await AsyncStorage.getItem(AUTH_PROMPT_KEYS.DISMISS_COUNT);
      const dismissCountNum = dismissCount ? parseInt(dismissCount) : 0;
      
      await AsyncStorage.setItem(AUTH_PROMPT_KEYS.LAST_PROMPT, now.toString());
      await AsyncStorage.setItem(AUTH_PROMPT_KEYS.DISMISS_COUNT, (dismissCountNum + 1).toString());
      
      // Schedule next prompt based on new dismiss count
      let nextInterval: number;
      switch (dismissCountNum + 1) {
        case 1:
          nextInterval = PROMPT_INTERVALS.SECOND_TIME;
          break;
        case 2:
          nextInterval = PROMPT_INTERVALS.THIRD_TIME;
          break;
        case 3:
          nextInterval = PROMPT_INTERVALS.FOURTH_TIME;
          break;
        default:
          nextInterval = PROMPT_INTERVALS.FINAL;
          break;
      }
      
      setTimeout(() => {
        setShouldShowAuthPrompt(true);
      }, nextInterval);
    } catch (error) {
      console.error('Error dismissing auth prompt:', error);
    }
  };

  const resetAuthPromptTimer = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_PROMPT_KEYS.LAST_PROMPT);
      await AsyncStorage.removeItem(AUTH_PROMPT_KEYS.DISMISS_COUNT);
      setShouldShowAuthPrompt(false);
    } catch (error) {
      console.error('Error resetting auth prompt timer:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    shouldShowAuthPrompt,
    dismissAuthPrompt,
    resetAuthPromptTimer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 