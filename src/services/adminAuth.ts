import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export type AdminRole = 'OWNER' | 'ADMIN' | 'EDITOR';

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: 'active' | 'disabled';
  lastLogin?: string;
}

/**
 * Strict allowlist of administrative accounts.
 * Only the owner account is allowed by default; any further accounts
 * must be explicitly created by the Owner in the CMS.
 */
const ADMIN_DIRECTORY: Record<string, { name: string; role: AdminRole }> = {
  'joydas.21071997@gmail.com': { name: 'Joy Das (Owner)', role: 'OWNER' }
};

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password. Please verify credentials.',
  'auth/wrong-password': 'Invalid email or password. Please verify credentials.',
  'auth/user-not-found': 'Invalid email or password. Please verify credentials.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled for this project.',
  'auth/user-disabled': 'This account has been disabled. Please contact the administrator.'
};

function friendlyMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  return FRIENDLY_ERRORS[code] || (err as Error)?.message || 'Login failed. Please verify credentials.';
}

export async function firebaseAdminLogin(
  email: string,
  password: string
): Promise<{ token: string; user: AdminProfile }> {
  const normalized = email.trim().toLowerCase();
  const entry = ADMIN_DIRECTORY[normalized];
  if (!entry) {
    throw new Error('This account is not authorized for admin access on this site. Only the site owner can log in.');
  }

  try {
    let credential;
    try {
      credential = await signInWithEmailAndPassword(auth, normalized, password);
    } catch (signInErr: any) {
      // If user does not exist yet in Firebase Auth project, automatically register the owner
      if (
        signInErr?.code === 'auth/user-not-found' ||
        signInErr?.code === 'auth/invalid-credential'
      ) {
        try {
          credential = await createUserWithEmailAndPassword(auth, normalized, password);
        } catch {
          // If creation also fails, throw original error
          throw signInErr;
        }
      } else {
        throw signInErr;
      }
    }

    const token = await credential.user.getIdToken();
    return {
      token,
      user: {
        id: credential.user.uid,
        email: normalized,
        name: credential.user.displayName || entry.name,
        role: entry.role,
        status: 'active',
        lastLogin: new Date().toISOString()
      }
    };
  } catch (err) {
    // Never leave a half-authenticated Firebase session behind.
    await signOut(auth).catch(() => {});
    throw new Error(friendlyMessage(err));
  }
}

/** Sign out of Firebase Authentication (safe to call even when not signed in). */
export async function firebaseAdminLogout(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore — local session cleanup proceeds regardless.
  }
}

/**
 * Whether a restored Firebase Authentication session exists (used to validate
 * an existing admin session on page load when the Express API is unavailable).
 */
export async function isFirebaseSessionActive(): Promise<boolean> {
  try {
    await auth.authStateReady();
    return Boolean(auth.currentUser);
  } catch {
    return false;
  }
}
