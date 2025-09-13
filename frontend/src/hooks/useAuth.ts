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
  logout: () => void;
  refreshAuth: () => Promise<void>;
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
  private state: AuthState = {
    accessToken: null,
    userId: null,
    expiresAt: null,
    isAuthenticated: false,
    isLoading: false,
  };

  private listeners: Set<() => void> = new Set();
  private refreshTimer: NodeJS.Timeout | null = null;

  getState(): AuthState {
    return { ...this.state };
  }

  setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
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
      this.setAuth(response.accessToken, this.state.userId!, response.expiresIn);
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
    this.setState({ isLoading });
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

  const logout = useCallback(() => {
    authStateManager.clearAuth();
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    //Set loading to true when refreshing auth
    authStateManager.setLoading(true);
    try {
      const response = await authApi.refresh();
      const currentUserId = authStateManager.getState().userId;
      authStateManager.setAuth(response.accessToken, currentUserId!, response.expiresIn);
    } catch (error) {
      console.error('Manual refresh failed:', error);
      authStateManager.clearAuth();
      throw error;
    } finally {
      authStateManager.setLoading(false);
    }
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