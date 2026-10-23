// =====================================================
// AUTHENTICATION FUNCTIONS
// =====================================================

import { supabase } from './supabase';
import type { User } from '../types';

/**
 * Sign up with email and password (always creates owner account)
 * Automatically logs in after successful signup
 */
export async function signUp(email: string, password: string, username?: string) {
  // Step 1: Create user account
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        username: username || email.split('@')[0],
        role: 'owner',
      },
    },
  });

  if (error) throw error;

  // Step 2: Automatically sign in after signup
  if (data.user) {
    console.log('User account created. Signing in...');
    const loginResult = await supabase.auth.signInWithPassword({ email, password });

    if (loginResult.error) {
      const msg = loginResult.error.message || '';
      // Email confirmation required — user was created; treat as success
      if (
        msg.includes('Email not confirmed') ||
        msg.includes('email_not_confirmed') ||
        msg.includes('not confirmed')
      ) {
        console.warn('Email not confirmed after signup — returning signup session');
        // Return signup data so caller can still build a user object
        return data;
      }
      console.warn('Auto-login warning:', msg);
      return data;
    }

    return loginResult.data;
  }

  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message || '';
    // Surface a friendlier message for unconfirmed emails
    if (
      msg.includes('Email not confirmed') ||
      msg.includes('email_not_confirmed') ||
      msg.includes('not confirmed')
    ) {
      throw new Error(
        'EMAIL_NOT_CONFIRMED: Your email is not yet confirmed. ' +
        'Please check your inbox or try creating a new account.'
      );
    }
    throw error;
  }
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Get current user with profile — with graceful fallback
 * If the database profile fetch fails (RLS, network, etc.),
 * we fall back to auth metadata so the dashboard can still load.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return null;

  // Attempt to get profile from database
  let profile: any = null;
  try {
    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileError && data) {
      profile = data;
    } else {
      console.warn('Profile fetch warning (using metadata fallback):', profileError?.message);
    }
  } catch (e) {
    console.warn('Profile fetch failed (using metadata fallback):', e);
  }

  // Determine role — prefer DB, fall back to auth metadata, then default 'owner'
  const role: 'customer' | 'owner' | 'admin' =
    (profile?.role as any) ||
    (user.user_metadata?.role as any) ||
    'owner';

  const name =
    profile?.username ||
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User';

  // Get shop ID + status if user is owner
  let shopId: string | undefined;
  let shopStatus: string | undefined;
  if (role === 'owner') {
    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('id, status')
        .eq('owner_id', user.id)
        .single();

      shopId = shop?.id;
      shopStatus = shop?.status;
    } catch (e) {
      console.warn('Shop fetch failed:', e);
    }
  }

  return {
    id: user.id,
    name,
    email: user.email!,
    phone: profile?.phone || user.user_metadata?.phone || '',
    role,
    shopId,
    shopStatus,
  };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

/**
 * Reset password via email
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}
