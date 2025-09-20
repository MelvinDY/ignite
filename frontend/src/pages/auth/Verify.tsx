import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { authApi, AuthApiError } from '../../lib/authApi';
import type { PendingContextResponse } from '../../lib/authApi';

export function Verify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeToken = searchParams.get('resumeToken');

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [apiError, setApiError] = useState<React.ReactNode>('');
  const [otpError, setOtpError] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);

  // Email change states
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string>('');
  const [currentResumeToken, setCurrentResumeToken] = useState(resumeToken || '');

  // Context states
  const [context, setContext] = useState<PendingContextResponse | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [contextError, setContextError] = useState<React.ReactNode>('');

  // Fetch pending context on mount
  useEffect(() => {
    const fetchContext = async () => {
      if (!currentResumeToken) {
        setIsLoadingContext(false);
        return;
      }

      try {
        const contextData = await authApi.getPendingContext(currentResumeToken);
        setContext(contextData);

        // Set initial cooldown from server context
        setCooldownSeconds(contextData.resend.cooldownSeconds);
      } catch (error) {
        if (error instanceof AuthApiError) {
          switch (error.code) {
            case 'RESUME_TOKEN_INVALID':
            case 'PENDING_NOT_FOUND':
              setContextError(
                <>
                  Invalid or expired verification link.{' '}
                  <Link to="/auth/register" className="underline hover:text-white/80">
                    Start registration again
                  </Link>
                </>
              );
              break;
            case 'ALREADY_VERIFIED':
              setIsVerified(true);
              break;
            default:
              setContextError('Unable to load verification context. Please refresh the page.');
          }
        } else {
          setContextError('Unable to connect to server. Please check your connection.');
        }
      } finally {
        setIsLoadingContext(false);
      }
    };

    fetchContext();
  }, [currentResumeToken]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    // Update the OTP string
    const newOtp = otp.split('');
    newOtp[index] = digit;
    setOtp(newOtp.join(''));

    // Clear errors when user starts typing
    if (otpError) setOtpError('');
    if (apiError) setApiError('');

    // Auto-focus next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);

    // Focus the last filled input or the next empty one
    const lastIndex = Math.min(digits.length - 1, 5);
    const targetInput = document.getElementById(`otp-${lastIndex}`);
    targetInput?.focus();
  };

  const handleEmailInputChange = (value: string) => {
    setNewEmail(value);

    // Clear errors when user starts typing
    if (emailChangeError) setEmailChangeError('');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentResumeToken) return;
    if (otp.length !== 6) {
      setOtpError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setApiError('');
    setOtpError('');

    try {
      await authApi.verifyOtp({
        resumeToken: currentResumeToken,
        otp,
      });

      setIsVerified(true);
    } catch (error) {
      if (error instanceof AuthApiError) {
        switch (error.code) {
          case 'OTP_INVALID':
            setOtpError('Invalid verification code. Please try again.');
            break;
          case 'OTP_EXPIRED':
            setOtpError('Verification code has expired. Please request a new one.');
            break;
          case 'OTP_LOCKED':
            setApiError('Too many incorrect attempts. Please request a new verification code.');
            break;
          case 'ALREADY_VERIFIED':
            setIsVerified(true);
            break;
          case 'RESUME_TOKEN_INVALID':
          case 'PENDING_NOT_FOUND':
            setApiError(
              <>
                Invalid or expired verification link.{' '}
                <Link to="/auth/register" className="underline hover:text-white/80">
                  Start registration again
                </Link>
              </>
            );
            break;
          default:
            setApiError('An unexpected error occurred. Please try again.');
        }
      } else {
        setApiError('Unable to connect to server. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!currentResumeToken) return;

    setIsResending(true);
    setApiError('');

    try {
      await authApi.resendOtp(currentResumeToken);

      // Refresh context to get updated resend count
      const updatedContext = await authApi.getPendingContext(currentResumeToken);
      setContext(updatedContext);
      setCooldownSeconds(60);

      setApiError(
        <span className="text-green-400">
          A new verification code has been sent to your email.
        </span>
      );
    } catch (error) {
      if (error instanceof AuthApiError) {
        switch (error.code) {
          case 'OTP_COOLDOWN':
            setApiError('Please wait before requesting another code.');
            break;
          case 'OTP_RESEND_LIMIT':
            setApiError('Daily resend limit reached. Please try again tomorrow.');
            break;
          case 'RESUME_TOKEN_INVALID':
          case 'PENDING_NOT_FOUND':
            setApiError(
              <>
                Invalid or expired verification link.{' '}
                <Link to="/auth/register" className="underline hover:text-white/80">
                  Start registration again
                </Link>
              </>
            );
            break;
          default:
            setApiError('Failed to resend verification code. Please try again.');
        }
      } else {
        setApiError('Unable to connect to server. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleResend = handleResendOtp;

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentResumeToken || !newEmail.trim()) return;

    setIsChangingEmail(true);
    setEmailChangeError('');
    setApiError('');

    try {
      const response = await authApi.changeEmailPreVerify({
        resumeToken: currentResumeToken,
        newEmail: newEmail.trim(),
      });

      // Update the resume token
      setCurrentResumeToken(response.resumeToken);

      // Clear the form
      setNewEmail('');
      setShowEmailChange(false);

      // Fetch updated context
      const updatedContext = await authApi.getPendingContext(response.resumeToken);
      setContext(updatedContext);
      setCooldownSeconds(updatedContext.resend.cooldownSeconds);

      setApiError(
        <span className="text-green-400">
          Email updated! A new verification code has been sent to {newEmail.trim()}.
        </span>
      );

      // Clear the OTP input
      setOtp('');
    } catch (error) {
      if (error instanceof AuthApiError) {
        switch (error.code) {
          case 'EMAIL_EXISTS':
            setEmailChangeError('This email is already registered.');
            break;
          case 'VALIDATION_ERROR':
            setEmailChangeError('Please enter a valid email address.');
            break;
          case 'RESUME_TOKEN_INVALID':
          case 'PENDING_NOT_FOUND':
            setApiError(
              <>
                Invalid or expired verification link.{' '}
                <Link to="/auth/register" className="underline hover:text-white/80">
                  Start registration again
                </Link>
              </>
            );
            break;
          default:
            setEmailChangeError('Failed to update email. Please try again.');
        }
      } else {
        setEmailChangeError('Unable to connect to server. Please try again.');
      }
    } finally {
      setIsChangingEmail(false);
    }
  };

  if (!resumeToken) {
    return (
      <AuthLayout title="Verify Email">
        <Alert
          message={
            <>
              No verification link provided.{' '}
              <Link to="/auth/register" className="underline hover:text-white/80">
                Start registration
              </Link>
            </>
          }
          type="error"
        />
      </AuthLayout>
    );
  }

  if (isLoadingContext) {
    return (
      <AuthLayout title="Verify Email">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-white/80 text-sm">Loading verification details...</span>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (contextError) {
    return (
      <AuthLayout title="Verify Email">
        <Alert message={contextError} type="error" />
      </AuthLayout>
    );
  }

  if (isVerified) {
    return (
      <AuthLayout title="Account Verified">
        <div className="text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <Alert
            message="Your account has been successfully verified!"
            type="success"
          />

          <div className="mt-6">
            <p className="text-white/70 text-sm mb-6">
              Let's set up your profile handle to get started.
            </p>
            <Button
              onClick={() => navigate('/auth/login', { state: { redirectToHandle: true } })}
              className="w-full bg-white/20 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white font-medium py-3 rounded-lg transition-all"
            >
              Continue to Setup
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify Your Email">
      {/* Email Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Check Your Email</h2>
        <p className="text-white/70 text-sm leading-relaxed">
          We've sent a verification code to
        </p>
        {context?.emailMasked && (
          <div className="mt-2">
            <span className="font-medium text-white bg-white/10 px-3 py-1 rounded-full text-sm inline-block">
              {context.emailMasked}
            </span>
          </div>
        )}
        <p className="text-white/50 text-xs mt-3">
          Please check your inbox and enter the 6-digit code below
        </p>
      </div>

      {apiError && <Alert message={apiError} type="error" className="mb-4" />}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-4 text-center">
            Verification Code
          </label>
          <div className="flex justify-center gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={otp[index] || ''}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                onPaste={handleOtpPaste}
                className="w-12 h-14 sm:w-14 sm:h-16 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white text-center text-xl sm:text-2xl font-mono focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                maxLength={1}
                disabled={isVerifying}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]"
                required={index === 0}
              />
            ))}
          </div>
          {otpError && (
            <p className="mt-3 text-sm text-red-300 text-center">{otpError}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isVerifying || otp.length !== 6}
          className="w-full bg-white/20 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify Email Address'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-gradient-to-br from-[#3E000C]/80 to-[#8B1538]/80 text-white/50">Options</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Resend OTP */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || cooldownSeconds > 0 || (context?.resend.remainingToday === 0)}
            className="inline-flex items-center space-x-2 text-white/70 hover:text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isResending ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : cooldownSeconds > 0 ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Resend in {cooldownSeconds}s</span>
              </>
            ) : context?.resend.remainingToday === 0 ? (
              <span className="text-red-300">Daily limit reached</span>
            ) : (
              <>
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Resend verification code</span>
              </>
            )}
          </button>
          {context && context.resend.remainingToday > 0 && cooldownSeconds === 0 && !isResending && (
            <p className="text-xs text-white/40 mt-1">
              {context.resend.remainingToday} resend{context.resend.remainingToday === 1 ? '' : 's'} remaining today
            </p>
          )}
        </div>

        {/* Change Email */}
        {!showEmailChange ? (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowEmailChange(true)}
              className="inline-flex items-center space-x-2 text-white/70 hover:text-white text-sm font-medium transition-all group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Change email address</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <form onSubmit={handleChangeEmail} className="space-y-3">
              <TextInput
                id="newEmail"
                label="New Email Address"
                type="email"
                value={newEmail}
                onChange={handleEmailInputChange}
                error={emailChangeError}
                placeholder="Enter your correct email"
                required
                disabled={isChangingEmail}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isChangingEmail || !newEmail.trim()}
                  className="flex-1 bg-white/10 hover:bg-white/15"
                >
                  {isChangingEmail ? 'Updating...' : 'Update Email'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowEmailChange(false);
                    setNewEmail('');
                    setEmailChangeError('');
                  }}
                  disabled={isChangingEmail}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
            <p className="mt-3 text-xs text-white/40">
              A new verification code will be sent to your new address
            </p>
          </div>
        )}
      </div>

      {/* Footer Links */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <Link
            to="/auth/login"
            className="inline-flex items-center space-x-2 text-white/60 hover:text-white text-sm font-medium transition-all group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Back to login</span>
          </Link>
          <Link
            to="/auth/register"
            className="inline-flex items-center space-x-2 text-white/60 hover:text-white text-sm font-medium transition-all group"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>New registration</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}