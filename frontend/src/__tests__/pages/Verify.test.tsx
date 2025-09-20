import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Verify } from '../../pages/auth/Verify';
import { server } from '../../__mocks__/server';
import { http, HttpResponse } from 'msw';

// Mock useNavigate
const mockNavigate = vi.fn();
// Mock useSearchParams
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

const renderVerify = (resumeToken = 'mock-resume-token') => {
  if (resumeToken) {
    mockSearchParams.set('resumeToken', resumeToken);
  } else {
    mockSearchParams.delete('resumeToken');
  }
  return render(
    <BrowserRouter>
      <Verify />
    </BrowserRouter>
  );
};

describe('Verify Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it('shows error when no resume token provided', () => {
    renderVerify('');

    expect(screen.getByText(/no verification link provided/i)).toBeInTheDocument();
    expect(screen.getByText(/start registration/i)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderVerify();

    expect(screen.getByText(/loading verification details/i)).toBeInTheDocument();
  });

  it('loads and displays pending context successfully', async () => {
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/we've sent a verification code to/i)).toBeInTheDocument();
    expect(screen.getByText(/n\*\*\*@example\.com/i)).toBeInTheDocument();

    // Check for the 6 individual OTP input boxes
    const otpInputs = screen.getAllByRole('textbox');
    expect(otpInputs).toHaveLength(6);

    expect(screen.getByRole('button', { name: /verify email address/i })).toBeInTheDocument();
    expect(screen.getByText(/resend verification code/i)).toBeInTheDocument();
  });

  it('handles successful OTP verification', async () => {
    const user = userEvent.setup();
    renderVerify();

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    // Get all 6 OTP input boxes
    const otpInputs = screen.getAllByRole('textbox');

    // Type one digit in each box
    await user.type(otpInputs[0], '1');
    await user.type(otpInputs[1], '2');
    await user.type(otpInputs[2], '3');
    await user.type(otpInputs[3], '4');
    await user.type(otpInputs[4], '5');
    await user.type(otpInputs[5], '6');

    const verifyButton = screen.getByRole('button', { name: /verify email address/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/your account has been successfully verified/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to setup/i })).toBeInTheDocument();
    });
  });

  it('handles invalid OTP error', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');

    // Type invalid OTP
    for (let i = 0; i < 6; i++) {
      await user.type(otpInputs[i], '0');
    }

    const verifyButton = screen.getByRole('button', { name: /verify email address/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid verification code/i)).toBeInTheDocument();
    });
  });

  it('handles expired OTP error', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');

    // Type expired OTP
    for (let i = 0; i < 6; i++) {
      await user.type(otpInputs[i], '9');
    }

    const verifyButton = screen.getByRole('button', { name: /verify email address/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/verification code has expired/i)).toBeInTheDocument();
    });
  });

  it('handles OTP locked error', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');

    // Type OTP that triggers locked error
    for (let i = 0; i < 6; i++) {
      await user.type(otpInputs[i], '8');
    }

    const verifyButton = screen.getByRole('button', { name: /verify email address/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/too many incorrect attempts/i)).toBeInTheDocument();
    });
  });

  it('disables verify button when OTP is incomplete', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');
    const verifyButton = screen.getByRole('button', { name: /verify email address/i });

    // Initially disabled (no digits entered)
    expect(verifyButton).toBeDisabled();

    // Type only 3 digits
    await user.type(otpInputs[0], '1');
    await user.type(otpInputs[1], '2');
    await user.type(otpInputs[2], '3');

    // Should still be disabled
    expect(verifyButton).toBeDisabled();

    // Complete the OTP
    await user.type(otpInputs[3], '4');
    await user.type(otpInputs[4], '5');
    await user.type(otpInputs[5], '6');

    // Should now be enabled
    expect(verifyButton).not.toBeDisabled();
  });

  it('handles OTP resend', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    // Find and click the resend button
    const resendButton = screen.getByRole('button', { name: /resend verification code/i });
    await user.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText(/a new verification code has been sent to your email/i)).toBeInTheDocument();
    });
  });

  it('shows cooldown timer after resend', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const resendButton = screen.getByRole('button', { name: /resend verification code/i });
    await user.click(resendButton);

    await waitFor(() => {
      // Should show cooldown timer
      expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument();
    });
  });

  it('shows change email option', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    // Find and click the change email button
    const changeEmailButton = screen.getByRole('button', { name: /change email address/i });
    expect(changeEmailButton).toBeInTheDocument();

    await user.click(changeEmailButton);

    // Should show email change form
    await waitFor(() => {
      expect(screen.getByLabelText(/new email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update email/i })).toBeInTheDocument();
    });
  });

  it('handles email change', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    // Open email change form
    const changeEmailButton = screen.getByRole('button', { name: /change email address/i });
    await user.click(changeEmailButton);

    // Fill and submit new email
    const emailInput = screen.getByLabelText(/new email address/i);
    await user.type(emailInput, 'newemail@example.com');

    const updateButton = screen.getByRole('button', { name: /update email/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/email updated.*new verification code has been sent/i)).toBeInTheDocument();
    });
  });

  it('navigates to login when clicking proceed after verification', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');

    // Enter valid OTP
    for (let i = 0; i < 6; i++) {
      await user.type(otpInputs[i], (i + 1).toString());
    }

    const verifyButton = screen.getByRole('button', { name: /verify email address/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/your account has been successfully verified/i)).toBeInTheDocument();
    });

    const continueButton = screen.getByRole('button', { name: /continue to setup/i });
    await user.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', { state: { redirectToHandle: true } });
  });

  it('handles already verified account', async () => {
    server.use(
      http.get('http://localhost:3000/api/auth/pending/context', () => {
        return HttpResponse.json({
          code: 'ALREADY_VERIFIED',
        }, { status: 409 });
      })
    );

    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/your account has been successfully verified/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue to setup/i })).toBeInTheDocument();
    });
  });

  it('handles invalid resume token', async () => {
    server.use(
      http.get('http://localhost:3000/api/auth/pending/context', () => {
        return HttpResponse.json({
          code: 'RESUME_TOKEN_INVALID',
        }, { status: 401 });
      })
    );

    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired verification link/i)).toBeInTheDocument();
      expect(screen.getByText(/start registration again/i)).toBeInTheDocument();
    });
  });

  it('auto-focuses next input when typing OTP', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');

    // Type in first input
    await user.type(otpInputs[0], '1');

    // Second input should be focused
    expect(otpInputs[1]).toHaveFocus();

    // Type in second input
    await user.type(otpInputs[1], '2');

    // Third input should be focused
    expect(otpInputs[2]).toHaveFocus();
  });

  it('handles backspace to move to previous input', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');

    // Type in first two inputs
    await user.type(otpInputs[0], '1');
    await user.type(otpInputs[1], '2');

    // Clear second input and press backspace
    await user.clear(otpInputs[1]);
    await user.type(otpInputs[1], '{backspace}');

    // First input should be focused
    expect(otpInputs[0]).toHaveFocus();
  });

  it('handles paste of complete OTP', async () => {
    const user = userEvent.setup();
    renderVerify();

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole('textbox');

    // Focus first input and paste
    otpInputs[0].focus();

    // Simulate paste event
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer(),
    });
    Object.defineProperty(pasteEvent.clipboardData, 'getData', {
      value: () => '123456',
    });

    otpInputs[0].dispatchEvent(pasteEvent);

    // All inputs should be filled
    await waitFor(() => {
      expect(otpInputs[0]).toHaveValue('1');
      expect(otpInputs[1]).toHaveValue('2');
      expect(otpInputs[2]).toHaveValue('3');
      expect(otpInputs[3]).toHaveValue('4');
      expect(otpInputs[4]).toHaveValue('5');
      expect(otpInputs[5]).toHaveValue('6');
    });
  });
});