import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { TextInput } from '../../../components/ui/TextInput';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { AuthApiError } from '../../../lib/authApi';
import { useAuth } from '../../../hooks/useAuth';

export function VerifyReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPasswordOtp, resendPasswordOtp, cancelPasswordReset, isLoading } = useAuth();
  
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/auth/password/request');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await verifyPasswordOtp({ email, otp });
      navigate(`/auth/password/reset?token=${encodeURIComponent(response.resetSessionToken)}`);
    } catch (err) {
      if (err instanceof AuthApiError) {
        switch (err.code) {
          case 'OTP_INVALID':
            setError('Invalid verification code. Please try again.');
            break;
          case 'OTP_EXPIRED':
            setError('Verification code has expired. Please request a new one.');
            break;
          case 'OTP_LOCKED':
            setError('Too many failed attempts. Your account has been temporarily locked.');
            break;
          case 'VALIDATION_ERROR':
            setError('Please enter a valid 6-digit code.');
            break;
          case 'NETWORK_ERROR':
            setError('Unable to connect to server. Please check your connection and try again.');
            break;
          default:
            setError('An unexpected error occurred. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await resendPasswordOtp(email);
      setSuccess(response.message || 'Verification code sent successfully.');
    } catch (err) {
      if (err instanceof AuthApiError) {
        switch (err.code) {
          case 'OTP_COOLDOWN':
            setError('Please wait before requesting another code.');
            break;
          case 'OTP_RESEND_LIMIT':
            setError('You\'ve reached the daily limit for code requests.');
            break;
          case 'NETWORK_ERROR':
            setError('Unable to connect to server. Please check your connection and try again.');
            break;
          default:
            setError('Unable to resend code. Please try again.');
        }
      } else {
        setError('Unable to resend code. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = async () => {
    setIsCanceling(true);
    setError('');

    try {
      await cancelPasswordReset(email);
      navigate('/auth/login');
    } catch (err) {
      if (err instanceof AuthApiError) {
        switch (err.code) {
          case 'NETWORK_ERROR':
            setError('Unable to connect to server. Please check your connection and try again.');
            break;
          default:
            setError('Unable to cancel reset. Please try again.');
        }
      } else {
        setError('Unable to cancel reset. Please try again.');
      }
    } finally {
      setIsCanceling(false);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(numericValue);
    if (error) setError('');
    if (success) setSuccess('');
  };

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return email;
    const masked = localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1);
    return `${masked}@${domain}`;
  };

  if (!email) {
    return null; // Will redirect
  }

  return (
    <AuthLayout title="Enter Verification Code">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center text-sm text-white/80 space-y-2">
          <p>We sent a 6-digit verification code to:</p>
          <p className="font-medium text-white">{maskEmail(email)}</p>
          <p>Enter the code below to reset your password.</p>
        </div>

        {error && <Alert message={error} type="error" />}
        {success && <Alert message={success} type="success" />}

        <TextInput
          id="otp"
          label="Verification Code"
          type="text"
          value={otp}
          onChange={handleOtpChange}
          error={error}
          placeholder="000000"
          maxLength={6}
          required
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
        />

        <Button
          type="submit"
          disabled={isLoading || otp.length !== 6}
          className="w-full"
        >
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-blue-400 hover:text-blue-300 underline disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCanceling}
              className="text-red-400 hover:text-red-300 underline disabled:opacity-50"
            >
              {isCanceling ? 'Canceling...' : 'Cancel Reset'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/auth/login"
              className="text-sm text-white/80 hover:text-white underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}