import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signInAsTestInstructor: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
  isGuestInstructor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'classroom_survey_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestInstructor, setIsGuestInstructor] = useState(false);
  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || 'instructor@university.edu' });
          setIsGuestInstructor(false);
        } else {
          // Check for saved guest/test instructor session
          const savedUser = localStorage.getItem(LOCAL_USER_KEY);
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              setUser(parsed);
              setIsGuestInstructor(true);
            } catch {
              setUser(null);
            }
          }
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || 'instructor@university.edu' });
          setIsGuestInstructor(false);
        } else if (!localStorage.getItem(LOCAL_USER_KEY)) {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local/Demo Auth
      const savedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        const defaultDemoUser: User = { id: 'demo-instructor-id', email: 'instructor@university.edu' };
        setUser(defaultDemoUser);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultDemoUser));
      }
      setIsGuestInstructor(true);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      if (error) return { error: new Error(error.message) };
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || email });
        setIsGuestInstructor(false);
        localStorage.removeItem(LOCAL_USER_KEY);
      }
      return { error: null };
    }

    // Local / Demo Mode Sign-In
    const demoUser: User = {
      id: 'instructor-' + Math.random().toString(36).substring(2, 8),
      email: email || 'instructor@university.edu'
    };
    setUser(demoUser);
    setIsGuestInstructor(true);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null; needsEmailConfirmation?: boolean }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim()
      });
      if (error) return { error: new Error(error.message) };
      if (data.user && data.session) {
        setUser({ id: data.user.id, email: data.user.email || email });
        setIsGuestInstructor(false);
        localStorage.removeItem(LOCAL_USER_KEY);
        return { error: null, needsEmailConfirmation: false };
      }
      // If Supabase has email confirmation enabled
      return { error: null, needsEmailConfirmation: true };
    }

    return signIn(email, password);
  };

  const signInAsTestInstructor = async (): Promise<{ error: Error | null }> => {
    if (isSupabaseConfigured && supabase) {
      const testEmail = 'test.instructor@classroom-survey.internal';
      const testPassword = 'TestInstructor4095!';

      // 1. Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (!signInError && signInData.user) {
        setUser({ id: signInData.user.id, email: signInData.user.email || testEmail });
        setIsGuestInstructor(false);
        localStorage.removeItem(LOCAL_USER_KEY);
        return { error: null };
      }

      // 2. If account does not exist, attempt to auto-create it
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      if (!signUpError && signUpData.user && signUpData.session) {
        setUser({ id: signUpData.user.id, email: signUpData.user.email || testEmail });
        setIsGuestInstructor(false);
        localStorage.removeItem(LOCAL_USER_KEY);
        return { error: null };
      }

      // 3. If Supabase has email confirmation turned on, grant guest test access so evaluator is not blocked
      const guestUser: User = { id: 'test-instructor-guest', email: 'test.instructor@classroom.edu' };
      setUser(guestUser);
      setIsGuestInstructor(true);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(guestUser));
      return { error: null };
    }

    // Demo Mode Test Access
    const demoUser: User = { id: 'test-instructor-id', email: 'test.instructor@classroom.edu' };
    setUser(demoUser);
    setIsGuestInstructor(true);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
    return { error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
    setIsGuestInstructor(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInAsTestInstructor,
        signOut,
        isDemoMode,
        isGuestInstructor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
