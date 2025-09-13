import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';

// Mock useAuth hook
const mockLogout = vi.fn();
const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  authStateManager: {
    getState: () => ({
      accessToken: 'mock-token',
      userId: 'mock-user-id',
      expiresAt: Date.now() + 3600000,
      isAuthenticated: true,
      isLoading: false,
    }),
  },
}));

const renderNavbar = (isAuthenticated = false) => {
  mockUseAuth.mockReturnValue({
    isAuthenticated,
    logout: mockLogout,
    // Add other required properties with default values
    accessToken: null,
    userId: null,
    expiresAt: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    refreshAuth: vi.fn(),
    clearAuth: vi.fn(),
  });

  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    it('shows Login and Register buttons', () => {
      renderNavbar(false);
      
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
    });

    it('navigates to login when Login button is clicked', () => {
      renderNavbar(false);
      
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });

    it('navigates to register when Register button is clicked', () => {
      renderNavbar(false);
      
      const registerButton = screen.getByText('Register');
      fireEvent.click(registerButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/auth/register');
    });
  });

  describe('when user is authenticated', () => {
    it('shows Logout button and hides Login/Register buttons', () => {
      renderNavbar(true);
      
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('calls logout function and navigates to login when Logout button is clicked', () => {
      renderNavbar(true);
      
      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('navigation functionality', () => {
    it('renders all navigation buttons', () => {
      renderNavbar(false);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Membership')).toBeInTheDocument();
    });

    it('scrolls to top when Dashboard button is clicked from dashboard page', () => {
      // Mock window.scrollTo since jsdom doesn't implement it
      const mockScrollTo = vi.fn();
      Object.defineProperty(window, 'scrollTo', {
        value: mockScrollTo,
        writable: true
      });
      
      renderNavbar(false);
      
      const dashboardButton = screen.getByText('Dashboard');
      fireEvent.click(dashboardButton);
      
      // Since current path is '/', it should scroll to top, not navigate
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});