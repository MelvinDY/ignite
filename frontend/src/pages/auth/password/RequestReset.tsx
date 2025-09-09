import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { TextInput } from '../../../components/ui/TextInput';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { AuthApiError } from '../../../lib/authApi';
import { useAuth } from '../../../hooks/useAuth';
import { validateEmail } from '../../../lib/validation';

export function RequestReset() {
  const { requestPasswordReset, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError('');
    setSuccess(false);

    try {
      const response = await requestPasswordReset(email);
      setSuccess(true);
      setSuccessMessage(response.message || 'If an account with that email exists, we\'ve sent you a password reset code.');
    } catch (err) {
      if (err instanceof AuthApiError) {
        switch (err.code) {
          case 'VALIDATION_ERROR':
            setError('Please enter a valid email address.');
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

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (error) setError('');
    if (success) setSuccess(false);
  };

  if (success) {
    return (
      <AuthLayout title="Check Your Email">
        <div className="text-center space-y-6">
          <Alert 
            message={successMessage}
            type="success"
          />
          
          <div className="space-y-4 text-sm text-white/80">
            <p>
              We've sent a 6-digit verification code to your email address.
            </p>
            <p>
              The code will expire in 10 minutes.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to={`/auth/password/verify?email=${encodeURIComponent(email)}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Enter Verification Code
            </Link>
            
            <Link
              to="/auth/login"
              className="block text-center text-sm text-white/80 hover:text-white underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center text-sm text-white/80 mb-6">
          <p>Enter your email address and we'll send you a code to reset your password.</p>
        </div>

        {error && <Alert message={error} type="error" />}

        <TextInput
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={handleEmailChange}
          error={error}
          placeholder="your.email@example.com"
          required
          autoFocus
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </Button>

        <div className="text-center space-y-2">
          <Link
            to="/auth/login"
            className="block text-sm text-white/80 hover:text-white underline"
          >
            Back to Sign In
          </Link>
          <Link
            to="/auth/register"
            className="block text-sm text-white/80 hover:text-white underline"
          >
            Don't have an account? Sign Up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}