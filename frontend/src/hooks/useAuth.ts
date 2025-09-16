import { useState, useEffect, useRef, useCallback } from 'react';
import { authApi, type LoginRequest, type RegisterRequest, type PasswordResetVerifyOtpRequest, type PasswordResetData } from '../lib/authApi';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<{ resumeToken: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  attemptSessionRestore: () => Promise<boolean>;
  clearAuth: () => void;
  // Password reset helpers
  requestPasswordReset: (email: string) => Promise<{ message: string }>;
  verifyPasswordOtp: (request: PasswordResetVerifyOtpRequest) => Promise<{ resetSessionToken: string }>;
  resetPassword: (request: PasswordResetData) => Promise<{ message: string }>;
  resendPasswordOtp: (email: string) => Promise<{ message: string }>;
  cancelPasswordReset: (email: string) => Promise<{ message: string }>;
}

// Create a singleton auth state to persist across component rerenders
class AuthStateManager {
  private state: AuthState;
  private listeners: Set<() => void> = new Set();
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'auth_state';

  constructor() {
    // Load state from localStorage or use default
    const storedState = this.loadFromStorage();
    this.state = storedState || {
      accessToken: null,
      userId: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
    };

    // If we have valid auth state from storage, schedule refresh
    if (this.state.isAuthenticated && this.state.expiresAt && this.state.accessToken) {
      const timeUntilExpiry = this.state.expiresAt - Date.now();
      if (timeUntilExpiry > 60000) { // Only if more than 1 minute left
        this.scheduleRefresh(timeUntilExpiry / 1000);
      } else {
        // Token expired or expiring soon, but don't clear auth immediately
        // Let the app attempt session restoration with refresh token cookie
        console.log('Stored token expired or expiring soon, will attempt refresh token restoration');
        this.state = {
          accessToken: null,
          userId: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false, // Will be set to true when App.tsx calls refreshAuth
        };
        this.clearStorage(); // Clear invalid localStorage data
      }
    }
  }

  getState(): AuthState {
    return { ...this.state };
  }

  setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.saveToStorage();
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  setAuth(accessToken: string, userId: string, expiresIn: number) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    this.setState({
      accessToken,
      userId,
      expiresAt,
      isAuthenticated: true,
      isLoading: false,
    });
    this.scheduleRefresh(expiresIn);
  }

  clearAuth() {
    this.setState({
      accessToken: null,
      userId: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
    });
    this.clearStorage();
    this.cancelRefresh();
  }

  scheduleRefresh(expiresIn: number) {
    this.cancelRefresh();
    
    // Schedule refresh 60 seconds before expiry
    const refreshIn = Math.max(0, (expiresIn * 1000) - 60000);
    
    this.refreshTimer = setTimeout(() => {
      this.performRefresh();
    }, refreshIn);
  }

  private async performRefresh() {
    //Setting loading to true when refreshing
    this.setLoading(true);
    try {
      const response = await authApi.refresh();
      this.setAuth(response.accessToken, response.userId, response.expiresIn);
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
    } finally {
      this.setLoading(false);
    }
  }

  cancelRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  setLoading(isLoading: boolean) {
    // Don't persist loading state to localStorage
    this.state = { ...this.state, isLoading };
    this.notifyListeners();
  }

  private loadFromStorage(): AuthState | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that the stored state has the expected structure and valid data
        if (parsed && 
            typeof parsed === 'object' && 
            parsed.accessToken && 
            parsed.userId && 
            parsed.expiresAt && 
            typeof parsed.expiresAt === 'number' &&
            parsed.expiresAt > Date.now()) {
          return {
            ...parsed,
            isLoading: false, // Never persist loading state
          };
        } else {
          // Invalid or expired stored data, clear it
          console.log('Invalid or expired auth data in localStorage, clearing');
          this.clearStorage();
        }
      }
    } catch (error) {
      console.error('Failed to load auth state from localStorage:', error);
      this.clearStorage();
    }
    return null;
  }

  private saveToStorage() {
    try {
      // Only save persistent state (exclude loading)
      const { isLoading, ...persistentState } = this.state;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistentState));
    } catch (error) {
      console.error('Failed to save auth state to localStorage:', error);
    }
  }

  private clearStorage() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear auth state from localStorage:', error);
    }
  }

  // Check if we should attempt session restoration on app startup
  shouldAttemptRestore(): boolean {
    // Only attempt if we're not already authenticated and not currently loading
    return !this.state.isAuthenticated && !this.state.isLoading;
  }

  // Attempt session restoration - this will be called by App.tsx on startup
  async attemptSessionRestore(): Promise<boolean> {
    if (!this.shouldAttemptRestore()) {
      console.log('Skipping session restore - already authenticated or loading');
      return this.state.isAuthenticated;
    }

    this.setLoading(true);
    try {
      console.log('Attempting to restore session from refresh token cookie...');
      const response = await authApi.refresh();
      this.setAuth(response.accessToken, response.userId, response.expiresIn);
      console.log('Session restored successfully from refresh token');
      return true;
    } catch (error) {
      console.log('No valid refresh token found - user needs to log in');
      // Clear any remaining auth state to ensure clean slate
      this.clearAuth();
      return false;
    }
  }
}

const authStateManager = new AuthStateManager();

export function useAuth(): AuthContextType {
  const [state, setState] = useState<AuthState>(authStateManager.getState());
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = authStateManager.subscribe(() => {
      if (isMountedRef.current) {
        setState(authStateManager.getState());
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);


  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    authStateManager.setLoading(true);
    try {
      const response = await authApi.login(credentials);
      authStateManager.setAuth(response.accessToken, response.userId, response.expiresIn);
    } catch (error) {
      authStateManager.setLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest): Promise<{ resumeToken: string }> => {
    authStateManager.setLoading(true);
    try {
      const response = await authApi.register(userData);
      return { resumeToken: response.resumeToken };
    } catch (error) {
      authStateManager.setLoading(false);
      throw error;
    } finally {
      authStateManager.setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Clear frontend auth state immediately for responsive UI
    authStateManager.clearAuth();
    
    // Call backend logout to clear HttpOnly cookie
    // Don't await or handle errors - if this fails, the frontend is still logged out
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Backend logout failed:', error);
      // Frontend state is already cleared, so this is not critical
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    //Set loading to true when refreshing auth
    authStateManager.setLoading(true);
    try {
      const response = await authApi.refresh();
      authStateManager.setAuth(response.accessToken, response.userId, response.expiresIn);
    } catch (error) {
      console.error('Manual refresh failed:', error);
      authStateManager.clearAuth();
      throw error;
    } finally {
      authStateManager.setLoading(false);
    }
  }, []);

  const attemptSessionRestore = useCallback(async (): Promise<boolean> => {
    return await authStateManager.attemptSessionRestore();
  }, []);

  const clearAuth = useCallback(() => {
    authStateManager.clearAuth();
  }, []);

  // Password reset helpers (independent of login state)
  const requestPasswordReset = useCallback(async (email: string): Promise<{ message: string }> => {
    const response = await authApi.requestPasswordReset(email);
    return { message: response.message };
  }, []);

  const verifyPasswordOtp = useCallback(async (request: PasswordResetVerifyOtpRequest): Promise<{ resetSessionToken: string }> => {
    const response = await authApi.verifyPasswordOtp(request);
    return { resetSessionToken: response.resetSessionToken };
  }, []);

  const resetPassword = useCallback(async (request: PasswordResetData): Promise<{ message: string }> => {
    const response = await authApi.resetPassword(request);
    return { message: response.message };
  }, []);

  const resendPasswordOtp = useCallback(async (email: string): Promise<{ message: string }> => {
    const response = await authApi.resendPasswordOtp(email);
    return { message: response.message };
  }, []);

  const cancelPasswordReset = useCallback(async (email: string): Promise<{ message: string }> => {
    const response = await authApi.cancelPasswordReset(email);
    return { message: response.message };
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refreshAuth,
    attemptSessionRestore,
    clearAuth,
    requestPasswordReset,
    verifyPasswordOtp,
    resetPassword,
    resendPasswordOtp,
    cancelPasswordReset,
  };
}

// Export the auth state manager for other parts of the app that might need direct access
export { authStateManager };