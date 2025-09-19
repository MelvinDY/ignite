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

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);

    // Clear errors when user starts typing
    if (otpError) setOtpError('');
    if (apiError) setApiError('');
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
            setApiError('Verification failed. Please try again.');
        }
      } else {
        setApiError('Unable to connect to server. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentResumeToken || !newEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailChangeError('Please enter a valid email address');
      return;
    }

    setIsChangingEmail(true);
    setEmailChangeError('');
    setApiError('');

    try {
      const result = await authApi.changeEmailPreVerify({
        resumeToken: currentResumeToken,
        newEmail: newEmail.trim(),
      });

      // Update the resume token and reset states
      setCurrentResumeToken(result.resumeToken);
      setShowEmailChange(false);
      setNewEmail('');
      setOtp(''); // Clear OTP as user needs new code
      setCooldownSeconds(0); // Reset cooldown

      setApiError(
        <span className="text-green-200">
          Email updated! A new verification code has been sent to {newEmail}.
        </span>
      );
    } catch (error) {
      if (error instanceof AuthApiError) {
        switch (error.code) {
          case 'EMAIL_EXISTS':
            setEmailChangeError('This email is already registered to another account');
            break;
          case 'ALREADY_VERIFIED':
            setIsVerified(true);
            break;
          case 'RESUME_TOKEN_INVALID':
          case 'PENDING_NOT_FOUND':
            setApiError(
              <>
                Invalid verification session.{' '}
                <Link to="/auth/register" className="underline hover:text-white/80">
                  Start registration again
                </Link>
              </>
            );
            break;
          default:
            setEmailChangeError('Failed to change email. Please try again.');
        }
      } else {
        setEmailChangeError('Unable to connect to server. Please try again.');
      }
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleResend = async () => {
    if (!currentResumeToken || cooldownSeconds > 0) return;

    setIsResending(true);
    setApiError('');

    try {
      const result = await authApi.resendOtp({ resumeToken: currentResumeToken });

      // Update context with new resend state if returned
      if (result.resend && context) {
        setContext({
          ...context,
          resend: {
            cooldownSeconds: result.resend.cooldownSeconds,
            remainingToday: result.resend.remainingToday,
          },
        });
      }

      setCooldownSeconds(60); // Set 60-second cooldown
      setApiError(
        <span className="text-green-200">
          Verification code sent! Please check your email.
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
                Invalid verification link.{' '}
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

  if (!resumeToken) {
    return (
      <AuthLayout title="Verify Email">
        <Alert
          message={
            <>
              Invalid or missing verification link.{' '}
              <Link to="/auth/register" className="underline hover:text-white/80">
                Start registration again
              </Link>
              {' or '}
              <Link to="/auth/login" className="underline hover:text-white/80">
                Sign in
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
          <div className="text-white/80 text-sm">Loading verification details...</div>
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
        <Alert
          message="Your account has been successfully verified!"
          type="success"
        />
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm mb-4">
            You can now sign in to your account.
          </p>
          <Button
            onClick={() => navigate('/auth/login')}
            className="w-full"
          >
            Proceed to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify Email">
      <div className="text-center mb-6">
        <p className="text-white/80 text-sm">
          We sent a verification code to{' '}
          {context?.emailMasked ? (
            <span className="font-medium text-white">
              {context.emailMasked}
            </span>
          ) : (
            'your email address'
          )}
          . Please check your inbox and enter the 6-digit code below.
        </p>

        {context && (
          <div className="mt-3 text-xs text-white/60">
            {context.resend.remainingToday > 0 ? (
              <>
                {context.resend.remainingToday} resend{context.resend.remainingToday === 1 ? '' : 's'} remaining today
              </>
            ) : (
              'Daily resend limit reached. Try again tomorrow.'
            )}
          </div>
        )}
      </div>

      {apiError && <Alert message={apiError} type="error" className="mb-4" />}

      <form onSubmit={handleVerify} className="space-y-4">
        <TextInput
          id="otp"
          label="Verification Code"
          type="text"
          value={otp}
          onChange={handleOtpChange}
          error={otpError}
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="text-center text-2xl tracking-wider"
          required
          disabled={isVerifying}
        />

        <Button
          type="submit"
          disabled={isVerifying || otp.length !== 6}
          className="w-full"
        >
          {isVerifying ? 'Verifying...' : 'Verify Account'}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-4">
        <div className="text-sm text-white/60">
          Didn't receive the code?
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleResend}
            disabled={
              isResending ||
              cooldownSeconds > 0 ||
              (context && context.resend.remainingToday === 0)
            }
            className="text-sm w-full"
          >
            {isResending
              ? 'Sending...'
              : cooldownSeconds > 0
              ? `Resend in ${cooldownSeconds}s`
              : context && context.resend.remainingToday === 0
              ? 'Daily limit reached'
              : 'Resend Code'
            }
          </Button>

          <div className="text-xs text-white/40">or</div>

          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setShowEmailChange(!showEmailChange)}
            disabled={isChangingEmail}
            className="text-sm text-white/60 hover:text-white/80 w-full"
          >
            {showEmailChange ? 'Cancel' : 'Change Email Address'}
          </Button>
        </div>

        {showEmailChange && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <form onSubmit={handleChangeEmail} className="space-y-3">
              <div className="text-left">
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
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isChangingEmail || !newEmail.trim()}
                  className="flex-1 text-sm"
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
                  className="flex-1 text-sm"
                >
                  Cancel
                </Button>
              </div>
            </form>

            <div className="mt-3 text-xs text-white/40">
              After updating your email, a new verification code will be sent to your new address.
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/auth/register"
          className="text-sm text-white/60 hover:text-white/80 underline"
        >
          Back to Registration
        </Link>
      </div>
    </AuthLayout>
  );
}