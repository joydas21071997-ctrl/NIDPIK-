import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export type AdminRole = 'OWNER' | 'ADMIN' | 'EDITOR';

/**
 * Admin profile returned by the Firebase Authentication fallback login.
 * Structurally compatible with the AdminUser shape used in AppContext.
 */
export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: 'active' | 'disabled';
  lastLogin?: string;
}

/**
 * Allowlist of accounts that may establish an admin session through Firebase
 * Authentication when the Express /api backend is unavailable (production
 * static hosting on Firebase Hosting). Mirrors the seeded accounts in
 * server/db.ts so roles match the dev/AI Studio environment.
 *
 * Note: custom admin accounts created through the CMS in the dev environment
 * are validated by the Express backend and do not go through this fallback.
 */
const ADMIN_DIRECTORY: Record<string, { name: string; role: AdminRole }> = {
  'admin@nidpik.in': { name: 'Owner Admin', role: 'OWNER' },
  'manager@nidpik.in': { name: 'Manager Admin', role: 'ADMIN' },
  'editor@nidpik.in': { name: 'Editor Admin', role: 'EDITOR' }
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
  return FRIENDLY_ERRORS[code] || 'Login failed. Please verify credentials.';
}

/**
 * Sign in to Firebase Authentication with email/password and build the admin
 * profile. Only allowlisted admin accounts may establish a session. Any
 * failure throws an Error with a user-presentable message (never resolves
 * silently), so the login page can always show what went wrong.
 */
export async function firebaseAdminLogin(
  email: string,
  password: string
): Promise<{ token: string; user: AdminProfile }> {
  const normalized = email.trim().toLowerCase();
  const entry = ADMIN_DIRECTORY[normalized];
  if (!entry) {
    throw new Error('This account is not authorized for admin access on this site.');
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, normalized, password);
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
