import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { AuthApiError } from '../../../lib/authApi';
import { useAuth } from '../../../hooks/useAuth';
import { validatePassword, validatePasswordConfirmation } from '../../../lib/validation';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, isLoading } = useAuth();
  
  const [resetSessionToken, setResetSessionToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (!resetSessionToken) {
      navigate('/auth/password/request');
    }
  }, [resetSessionToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    const newErrors: { [key: string]: string } = {};
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) newErrors.newPassword = passwordError;

    const confirmPasswordError = validatePasswordConfirmation(newPassword, confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    setApiError('');

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const response = await resetPassword({
        resetSessionToken,
        newPassword,
        confirmPassword
      });

      // Show success message and redirect to login
      navigate('/auth/login', {
        state: {
          message: response.message || 'Your password has been reset successfully. You can now sign in with your new password.',
          type: 'success'
        }
      });
    } catch (err) {
      if (err instanceof AuthApiError) {
        switch (err.code) {
          case 'RESET_SESSION_INVALID':
            setApiError('Your password reset session has expired. Please request a new reset code.');
            break;
          case 'VALIDATION_ERROR':
            if (err.details?.fieldErrors) {
              setErrors(err.details.fieldErrors);
            } else {
              setApiError('Please check your password and try again.');
            }
            break;
          case 'NETWORK_ERROR':
            setApiError('Unable to connect to server. Please check your connection and try again.');
            break;
          default:
            setApiError('An unexpected error occurred. Please try again.');
        }
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'newPassword') {
      setNewPassword(value);
    } else if (field === 'confirmPassword') {
      setConfirmPassword(value);
    }

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear API error when user modifies form
    if (apiError) {
      setApiError('');
    }
  };

  if (!resetSessionToken) {
    return null; // Will redirect
  }

  return (
    <AuthLayout title="Set New Password">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center text-sm text-white/80 mb-6">
          <p>Enter your new password below.</p>
        </div>

        {apiError && <Alert message={apiError} type="error" />}

        <PasswordInput
          id="newPassword"
          label="New Password"
          value={newPassword}
          onChange={(value) => handleInputChange('newPassword', value)}
          error={errors.newPassword}
          placeholder="At least 8 characters"
          required
          autoFocus
        />

        <PasswordInput
          id="confirmPassword"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(value) => handleInputChange('confirmPassword', value)}
          error={errors.confirmPassword}
          placeholder="Confirm your new password"
          required
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Updating Password...' : 'Update Password'}
        </Button>

        <div className="text-center space-y-2">
          <Link
            to="/auth/login"
            className="block text-sm text-white/80 hover:text-white underline"
          >
            Back to Sign In
          </Link>
          <Link
            to="/auth/password/request"
            className="block text-sm text-white/80 hover:text-white underline"
          >
            Request New Reset Code
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}