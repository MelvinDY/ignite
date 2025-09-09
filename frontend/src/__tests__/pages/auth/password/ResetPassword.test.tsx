import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ResetPassword } from '../../../../pages/auth/password/ResetPassword';
import { useAuth } from '../../../../hooks/useAuth';
import { AuthApiError } from '../../../../lib/authApi';

// Mock the useAuth hook
vi.mock('../../../../hooks/useAuth');
const mockUseAuth = vi.mocked(useAuth);

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockUseSearchParams()],
  };
});

function renderResetPassword(token = 'reset-token-123') {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => key === 'token' ? token : null
  });
  
  return render(
    <BrowserRouter>
      <ResetPassword />
    </BrowserRouter>
  );
}

describe('ResetPassword', () => {
  const mockResetPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      resetPassword: mockResetPassword,
      isLoading: false,
      // Other useAuth properties
      accessToken: null,
      userId: null,
      expiresAt: null,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      clearAuth: vi.fn(),
      requestPasswordReset: vi.fn(),
      verifyPasswordOtp: vi.fn(),
      resendPasswordOtp: vi.fn(),
      cancelPasswordReset: vi.fn(),
    });
  });

  it('renders the reset password form', () => {
    renderResetPassword();

    expect(screen.getByRole('heading', { name: 'Set New Password' })).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
    expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
  });

  it('redirects to request page when no token in URL params', () => {
    renderResetPassword(''); // No token

    expect(mockNavigate).toHaveBeenCalledWith('/auth/password/request');
  });

  it('shows validation error for short password', async () => {
    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('shows validation error for mismatched passwords', async () => {
    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('successfully resets password and navigates to login', async () => {
    mockResetPassword.mockResolvedValue({
      message: 'Password updated successfully'
    });

    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        resetSessionToken: 'reset-token-123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', {
      state: {
        message: 'Password updated successfully',
        type: 'success'
      }
    });
  });

  it('shows default success message when none provided', async () => {
    mockResetPassword.mockResolvedValue({
      message: ''
    });

    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login', {
        state: {
          message: expect.stringContaining('Your password has been reset successfully'),
          type: 'success'
        }
      });
    });
  });

  it('handles invalid reset session token error', async () => {
    mockResetPassword.mockRejectedValue(
      new AuthApiError('RESET_SESSION_INVALID', 401, 'Session expired')
    );

    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password reset session has expired/i)).toBeInTheDocument();
    });
  });

  it('handles validation error from API with field errors', async () => {
    mockResetPassword.mockRejectedValue(
      new AuthApiError('VALIDATION_ERROR', 400, 'Validation error', {
        fieldErrors: {
          newPassword: 'Password too weak',
          confirmPassword: 'Passwords do not match'
        }
      })
    );

    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password too weak')).toBeInTheDocument();
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('handles validation error from API without field errors', async () => {
    mockResetPassword.mockRejectedValue(
      new AuthApiError('VALIDATION_ERROR', 400, 'Generic validation error')
    );

    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please check your password and try again/i)).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    mockResetPassword.mockRejectedValue(
      new AuthApiError('NETWORK_ERROR', 0, 'Network error')
    );

    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
    });
  });

  it('handles unexpected errors', async () => {
    mockResetPassword.mockRejectedValue(new Error('Unexpected error'));

    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', () => {
    mockUseAuth.mockReturnValue({
      resetPassword: mockResetPassword,
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
      clearAuth: vi.fn(),
      requestPasswordReset: vi.fn(),
      verifyPasswordOtp: vi.fn(),
      resendPasswordOtp: vi.fn(),
      cancelPasswordReset: vi.fn(),
    });

    renderResetPassword();
    
    const submitButton = screen.getByRole('button', { name: 'Updating Password...' });
    expect(submitButton).toBeDisabled();
  });

  it('clears field errors when user types', async () => {
    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    // First trigger validation error
    fireEvent.change(newPasswordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Then change new password - its error should clear
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });

    expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument(); // Confirm error should still be there

    // Then change confirm password - its error should clear
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
  });

  it('clears API error when user types', async () => {
    mockResetPassword.mockRejectedValue(
      new AuthApiError('RESET_SESSION_INVALID', 401, 'Session expired')
    );

    renderResetPassword();
    
    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    const submitButton = screen.getByRole('button', { name: 'Update Password' });

    // First trigger API error
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password reset session has expired/i)).toBeInTheDocument();
    });

    // Then type - error should clear
    fireEvent.change(newPasswordInput, { target: { value: 'differentpassword123' } });

    expect(screen.queryByText(/password reset session has expired/i)).not.toBeInTheDocument();
  });

  it('has proper navigation links', () => {
    renderResetPassword();

    expect(screen.getByRole('link', { name: 'Back to Sign In' })).toHaveAttribute('href', '/auth/login');
    expect(screen.getByRole('link', { name: 'Request New Reset Code' })).toHaveAttribute('href', '/auth/password/request');
  });

  it('has proper accessibility attributes', () => {
    renderResetPassword();

    const newPasswordInput = screen.getByLabelText(/^new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);
    
    expect(newPasswordInput).toHaveAttribute('type', 'password');
    expect(newPasswordInput).toHaveAttribute('required');
    expect(newPasswordInput).toHaveAttribute('autoFocus');
    
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('required');
  });
});