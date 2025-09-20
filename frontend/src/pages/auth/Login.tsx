import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { TextInput } from '../../components/ui/TextInput';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { AuthApiError } from '../../lib/authApi';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../lib/validation';

interface FormErrors {
  [key: string]: string;
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<React.ReactNode>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    // Check if we have a success message from navigation state (e.g., after password reset)
    const state = location.state as { message?: string; type?: string } | null;
    if (state?.message && state?.type === 'success') {
      setSuccessMessage(state.message);
      // Clear the state to prevent the message from persisting on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear API error when user modifies form
    if (apiError) {
      setApiError('');
    }
    
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setApiError('');

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });

      // Navigate to profile/me which will check for handle
      navigate('/profile/me');
    } catch (error) {
      if (error instanceof AuthApiError) {
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            setApiError('Invalid email or password. Please try again.');
            break;
          case 'ACCOUNT_NOT_VERIFIED':
            // Check if we have a resume token in the error details to offer verify option
            if (error.details?.resumeToken) {
              setApiError(
                <>
                  Please verify your email address before signing in.{' '}
                  <Link
                    to={`/auth/verify?resumeToken=${error.details.resumeToken}`}
                    className="underline hover:text-white/80"
                  >
                    Verify now
                  </Link>
                </>
              );
            } else {
              setApiError('Please verify your email address before signing in.');
            }
            break;
          case 'TOO_MANY_ATTEMPTS':
            setApiError('Too many login attempts. Please try again later.');
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

  return (
    <AuthLayout title="Sign In">
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && <Alert message={successMessage} type="success" />}
        {apiError && <Alert message={apiError} type="error" />}
        
        <TextInput
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => handleInputChange('email', value)}
          error={errors.email}
          placeholder="your.email@example.com"
          required
        />

        <PasswordInput
          id="password"
          label="Password"
          value={formData.password}
          onChange={(value) => handleInputChange('password', value)}
          error={errors.password}
          placeholder="Enter your password"
          required
        />

        <div className="flex items-center justify-between pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>

        <div className="text-center pt-4">
          <Link 
            to="/auth/password/request" 
            className="text-sm text-white/80 hover:text-white underline"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-white/80">
          Don't have an account?{' '}
          <Link 
            to="/auth/register" 
            className="text-white font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}