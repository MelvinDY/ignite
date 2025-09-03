import React from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Alert } from '../../components/ui/Alert';

export function ForgotPassword() {
  return (
    <AuthLayout title="Forgot Password">
      <Alert 
        message="Password reset functionality coming soon!" 
        type="info" 
      />
      
      <div className="mt-6 text-center">
        <Link 
          to="/auth/login" 
          className="text-white hover:text-white/80 underline"
        >
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}