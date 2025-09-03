import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Alert } from '../../components/ui/Alert';

export function VerifyEmail() {
  return (
    <AuthLayout title="Verify Email">
      <Alert 
        message="Email verification functionality coming soon!" 
        type="info" 
      />
      
      <div className="mt-6 text-center space-y-2">
        <p className="text-white/80 text-sm">
          We'll send you an email with verification instructions.
        </p>
        <Link 
          to="/auth/login" 
          className="block text-white hover:text-white/80 underline"
        >
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}