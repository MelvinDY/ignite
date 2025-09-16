import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RequestReset } from '../../../../pages/auth/password/RequestReset';
import { useAuth } from '../../../../hooks/useAuth';
import { AuthApiError } from '../../../../lib/authApi';

// Mock the useAuth hook
vi.mock('../../../../hooks/useAuth');
const mockUseAuth = vi.mocked(useAuth);

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderRequestReset() {
  return render(
    <BrowserRouter>
      <RequestReset />
    </BrowserRouter>
  );
}

describe('RequestReset', () => {
  const mockRequestPasswordReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      requestPasswordReset: mockRequestPasswordReset,
      isLoading: false,
      // Other useAuth properties (not used in this component)
      accessToken: null,
      userId: null,
      expiresAt: null,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      attemptSessionRestore: vi.fn(),
      clearAuth: vi.fn(),
      verifyPasswordOtp: vi.fn(),
      resetPassword: vi.fn(),
      resendPasswordOtp: vi.fn(),
      cancelPasswordReset: vi.fn(),
    });
  });

  it('renders the request reset form', () => {
    renderRequestReset();

    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Code' })).toBeInTheDocument();
    expect(screen.getByText(/enter your email address and we'll send you a code/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    renderRequestReset();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });

  it('shows validation error for empty email', async () => {
    renderRequestReset();
    
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });

  it('successfully sends reset request and shows success state', async () => {
    mockRequestPasswordReset.mockResolvedValue({
      message: 'Reset code sent successfully!'
    });

    renderRequestReset();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    // Should show success state
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Check Your Email' })).toBeInTheDocument();
      expect(screen.getByText(/reset code sent successfully!/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Enter Verification Code' })).toBeInTheDocument();
    });
  });

  it('shows default success message when no message provided', async () => {
    mockRequestPasswordReset.mockResolvedValue({
      message: ''
    });

    renderRequestReset();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/if an account with that email exists/i)).toBeInTheDocument();
    });
  });

  it('handles validation error from API', async () => {
    mockRequestPasswordReset.mockRejectedValue(
      new AuthApiError('VALIDATION_ERROR', 400, 'Invalid email format')
    );

    renderRequestReset();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('handles network error from API', async () => {
    mockRequestPasswordReset.mockRejectedValue(
      new AuthApiError('NETWORK_ERROR', 0, 'Network error')
    );

    renderRequestReset();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
    });
  });

  it('handles unexpected errors', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('Unexpected error'));

    renderRequestReset();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockUseAuth.mockReturnValue({
      requestPasswordReset: mockRequestPasswordReset,
      isLoading: true,
      // Other useAuth properties
      accessToken: null,
      userId: null,
      expiresAt: null,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      attemptSessionRestore: vi.fn(),
      clearAuth: vi.fn(),
      verifyPasswordOtp: vi.fn(),
      resetPassword: vi.fn(),
      resendPasswordOtp: vi.fn(),
      cancelPasswordReset: vi.fn(),
    });

    renderRequestReset();
    
    const submitButton = screen.getByRole('button', { name: 'Sending...' });
    expect(submitButton).toBeDisabled();
  });

  it('clears error when user modifies email', async () => {
    renderRequestReset();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' });

    // First trigger validation error
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    // Then change email - error should clear
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  it('has proper navigation links', () => {
    renderRequestReset();

    expect(screen.getByRole('link', { name: 'Back to Sign In' })).toHaveAttribute('href', '/auth/login');
    expect(screen.getByRole('link', { name: "Don't have an account? Sign Up" })).toHaveAttribute('href', '/auth/register');
  });

  it('has proper accessibility attributes', () => {
    renderRequestReset();

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('autoFocus');
  });
});