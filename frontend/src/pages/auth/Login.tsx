import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { TextInput } from '../../components/ui/TextInput';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { apiClient, ApiError } from '../../lib/api';
import { validateEmail, validatePassword } from '../../lib/validation';

interface FormErrors {
  [key: string]: string;
}

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');

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

    setIsLoading(true);
    setApiError('');

    try {
      const response = await apiClient.login({
        email: formData.email,
        password: formData.password,
      });

      // Store access token in memory (you might want to use a context/state management)
      // For now, we'll just navigate to dashboard
      console.log('Login successful:', response);
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            setApiError('Invalid email or password. Please try again.');
            break;
          case 'ACCOUNT_NOT_VERIFIED':
            setApiError('Please verify your email address before signing in.');
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign In">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            to="/auth/forgot-password" 
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