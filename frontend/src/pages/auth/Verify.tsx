import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { authApi, AuthApiError } from '../../lib/authApi';

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeToken) return;
    if (otp.length !== 6) {
      setOtpError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setApiError('');
    setOtpError('');

    try {
      await authApi.verifyOtp({
        resumeToken,
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

  const handleResend = async () => {
    if (!resumeToken || cooldownSeconds > 0) return;

    setIsResending(true);
    setApiError('');

    try {
      await authApi.resendOtp({ resumeToken });
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
          We sent a verification code to your email address. Please check your inbox and enter the 6-digit code below.
        </p>
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

      <div className="mt-6 text-center space-y-2">
        <div className="text-sm text-white/60">
          Didn't receive the code?
        </div>
        
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleResend}
          disabled={isResending || cooldownSeconds > 0}
          className="text-sm"
        >
          {isResending
            ? 'Sending...'
            : cooldownSeconds > 0
            ? `Resend in ${cooldownSeconds}s`
            : 'Resend Code'
          }
        </Button>
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