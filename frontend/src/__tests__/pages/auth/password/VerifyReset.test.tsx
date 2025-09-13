import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VerifyReset } from '../../../../pages/auth/password/VerifyReset';
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

function renderVerifyReset(email = 'test@example.com') {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => key === 'email' ? email : null
  });
  
  return render(
    <BrowserRouter>
      <VerifyReset />
    </BrowserRouter>
  );
}

describe('VerifyReset', () => {
  const mockVerifyPasswordOtp = vi.fn();
  const mockResendPasswordOtp = vi.fn();
  const mockCancelPasswordReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      verifyPasswordOtp: mockVerifyPasswordOtp,
      resendPasswordOtp: mockResendPasswordOtp,
      cancelPasswordReset: mockCancelPasswordReset,
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
      resetPassword: vi.fn(),
    });
  });

  it('renders the verify reset form with masked email', () => {
    renderVerifyReset('test@example.com');

    expect(screen.getByRole('heading', { name: 'Enter Verification Code' })).toBeInTheDocument();
    expect(screen.getByText(/we sent a 6-digit verification code to:/i)).toBeInTheDocument();
    expect(screen.getByText('t**t@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verify Code' })).toBeInTheDocument();
  });

  it('redirects to request page when no email in URL params', () => {
    renderVerifyReset(''); // No email

    expect(mockNavigate).toHaveBeenCalledWith('/auth/password/request');
  });

  it('only allows numeric input for OTP', () => {
    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    
    fireEvent.change(otpInput, { target: { value: 'abc123def' } });
    
    expect(otpInput).toHaveValue('123');
  });

  it('limits OTP input to 6 digits', () => {
    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    
    fireEvent.change(otpInput, { target: { value: '1234567890' } });
    
    expect(otpInput).toHaveValue('123456');
  });

  it('disables submit button when OTP is not 6 digits', () => {
    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: 'Verify Code' });
    
    fireEvent.change(otpInput, { target: { value: '12345' } });
    expect(submitButton).toBeDisabled();
    
    fireEvent.change(otpInput, { target: { value: '123456' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows validation error for incomplete OTP', async () => {
    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: 'Verify Code' });

    fireEvent.change(otpInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a 6-digit verification code/i)).toBeInTheDocument();
    });

    expect(mockVerifyPasswordOtp).not.toHaveBeenCalled();
  });

  it('successfully verifies OTP and navigates to reset page', async () => {
    mockVerifyPasswordOtp.mockResolvedValue({
      resetSessionToken: 'reset-token-123'
    });

    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: 'Verify Code' });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockVerifyPasswordOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456'
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/auth/password/reset?token=reset-token-123');
  });

  it('handles invalid OTP error', async () => {
    mockVerifyPasswordOtp.mockRejectedValue(
      new AuthApiError('OTP_INVALID', 400, 'Invalid OTP')
    );

    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: 'Verify Code' });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument();
    });
  });

  it('handles expired OTP error', async () => {
    mockVerifyPasswordOtp.mockRejectedValue(
      new AuthApiError('OTP_EXPIRED', 400, 'OTP expired')
    );

    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: 'Verify Code' });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/verification code has expired/i)).toBeInTheDocument();
    });
  });

  it('handles locked OTP error', async () => {
    mockVerifyPasswordOtp.mockRejectedValue(
      new AuthApiError('OTP_LOCKED', 423, 'OTP locked')
    );

    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: 'Verify Code' });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/too many failed attempts/i)).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    mockVerifyPasswordOtp.mockRejectedValue(
      new AuthApiError('NETWORK_ERROR', 0, 'Network error')
    );

    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: 'Verify Code' });

    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
    });
  });

  it('successfully resends OTP', async () => {
    mockResendPasswordOtp.mockResolvedValue({
      message: 'Code sent successfully'
    });

    renderVerifyReset();
    
    const resendButton = screen.getByRole('button', { name: 'Resend Code' });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(mockResendPasswordOtp).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText(/code sent successfully/i)).toBeInTheDocument();
    });
  });

  it('handles resend cooldown error', async () => {
    mockResendPasswordOtp.mockRejectedValue(
      new AuthApiError('OTP_COOLDOWN', 429, 'Too fast')
    );

    renderVerifyReset();
    
    const resendButton = screen.getByRole('button', { name: 'Resend Code' });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/please wait before requesting another code/i)).toBeInTheDocument();
    });
  });

  it('handles resend limit error', async () => {
    mockResendPasswordOtp.mockRejectedValue(
      new AuthApiError('OTP_RESEND_LIMIT', 429, 'Daily limit reached')
    );

    renderVerifyReset();
    
    const resendButton = screen.getByRole('button', { name: 'Resend Code' });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/daily limit for code requests/i)).toBeInTheDocument();
    });
  });

  it('successfully cancels password reset', async () => {
    mockCancelPasswordReset.mockResolvedValue({
      message: 'Reset cancelled'
    });

    renderVerifyReset();
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel Reset' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockCancelPasswordReset).toHaveBeenCalledWith('test@example.com');
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('shows loading states for resend and cancel buttons', async () => {
    // Mock long-running operations
    mockResendPasswordOtp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    mockCancelPasswordReset.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderVerifyReset();
    
    const resendButton = screen.getByRole('button', { name: 'Resend Code' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel Reset' });

    // Test resend loading
    fireEvent.click(resendButton);
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeInTheDocument();
    expect(resendButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Sending...' })).not.toBeInTheDocument();
    });

    // Test cancel loading
    fireEvent.click(cancelButton);
    expect(screen.getByRole('button', { name: 'Canceling...' })).toBeInTheDocument();
    expect(cancelButton).toBeDisabled();
  });

  it('clears errors when user types', async () => {
    mockVerifyPasswordOtp.mockRejectedValue(
      new AuthApiError('OTP_INVALID', 400, 'Invalid OTP')
    );

    renderVerifyReset();
    
    const otpInput = screen.getByLabelText(/verification code/i);
    const submitButton = screen.getByRole('button', { name: 'Verify Code' });

    // First, trigger an error
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument();
    });

    // Then type again - error should clear
    fireEvent.change(otpInput, { target: { value: '654321' } });
    expect(screen.queryByText(/invalid verification code/i)).not.toBeInTheDocument();
  });

  it.skip('has proper accessibility attributes', () => {
    renderVerifyReset();

    const otpInput = screen.getByLabelText(/verification code/i);
    expect(otpInput).toHaveAttribute('type', 'text');
    expect(otpInput).toHaveAttribute('required');
    expect(otpInput).toHaveAttribute('autoFocus');
    expect(otpInput).toHaveAttribute('inputMode', 'numeric');
    expect(otpInput).toHaveAttribute('pattern', '[0-9]*');
    expect(otpInput).toHaveAttribute('maxLength', '6');
  });

  it('has proper navigation links', () => {
    renderVerifyReset();

    expect(screen.getByRole('link', { name: 'Back to Sign In' })).toHaveAttribute('href', '/auth/login');
  });
});