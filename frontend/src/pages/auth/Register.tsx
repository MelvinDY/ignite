import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FormProgress } from '../../components/ui/FormProgress';
import { TextInput } from '../../components/ui/TextInput';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { RadioGroup } from '../../components/ui/RadioGroup';
import { Select } from '../../components/ui/Select';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { AuthApiError } from '../../lib/authApi';
import { useAuth } from '../../hooks/useAuth';
import {
  validateFullName,
  validateZid,
  validateYearIntake,
  validateRequired,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation
} from '../../lib/validation';
import { programDataService } from '../../data/programDataService';

interface FormErrors {
  [key: string]: string;
}

// Register form step data
interface RegisterStep1Data {
  fullName: string;
  zid: string;
  isIndonesian: boolean;
}

interface RegisterStep2Data {
  yearIntake: number;
  level: string;
  program: string;
  major: string;
}

interface RegisterStep3Data {
  email: string;
  password: string;
  confirmPassword: string;
}

// Get program and major options from the data service
const PROGRAM_OPTIONS = programDataService.searchPrograms('').map(program => ({
  value: program.value,
  label: program.label
}));

const MAJOR_OPTIONS = programDataService.searchMajors('').map(major => ({
  value: major.value,
  label: major.label
}));

export function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [apiError, setApiError] = useState<React.ReactNode>('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Step data
  const [step1Data, setStep1Data] = useState<RegisterStep1Data>({
    fullName: '',
    zid: '',
    isIndonesian: false,
  });

  const [step2Data, setStep2Data] = useState<RegisterStep2Data>({
    yearIntake: 0,
    level: '',
    program: '',
    major: '',
  });

  const [step3Data, setStep3Data] = useState<RegisterStep3Data>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (step: number, field: string, value: any) => {
    switch (step) {
      case 1:
        setStep1Data(prev => ({ ...prev, [field]: value }));
        break;
      case 2:
        setStep2Data(prev => ({ ...prev, [field]: value }));
        break;
      case 3:
        setStep3Data(prev => ({ ...prev, [field]: value }));
        break;
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

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    const fullNameError = validateFullName(step1Data.fullName);
    if (fullNameError) newErrors.fullName = fullNameError;

    const zidError = validateZid(step1Data.zid);
    if (zidError) newErrors.zid = zidError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    const yearError = validateYearIntake(step2Data.yearIntake);
    if (yearError) newErrors.yearIntake = yearError;

    const levelError = validateRequired(step2Data.level, 'Level');
    if (levelError) newErrors.level = levelError;

    const programError = validateRequired(step2Data.program, 'Program');
    if (programError) newErrors.program = programError;

    const majorError = validateRequired(step2Data.major, 'Major');
    if (majorError) newErrors.major = majorError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(step3Data.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(step3Data.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validatePasswordConfirmation(
      step3Data.password,
      step3Data.confirmPassword
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    } else if (isValid && currentStep === 3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setApiError('');

    try {
      const registerData = {
        fullName: step1Data.fullName,
        zid: step1Data.zid,
        isIndonesian: step1Data.isIndonesian,
        yearIntake: step2Data.yearIntake,
        level: step2Data.level,
        program: step2Data.program,
        major: step2Data.major,
        email: step3Data.email,
        password: step3Data.password,
        confirmPassword: step3Data.confirmPassword,
      };

      const response = await register(registerData);
      
      // Navigate to verify page with resume token
      navigate(`/auth/verify?resumeToken=${response.resumeToken}`);
    } catch (error) {
      if (error instanceof AuthApiError) {
        switch (error.code) {
          case 'EMAIL_EXISTS':
            setApiError(
              <>
                An account with this email already exists.{' '}
                <Link to="/auth/login" className="underline hover:text-white/80">
                  Sign in instead
                </Link>
              </>
            );
            break;
          case 'ZID_EXISTS':
            setApiError(
              <>
                This zID is already registered.{' '}
                <Link to="/auth/login" className="underline hover:text-white/80">
                  Sign in instead
                </Link>
              </>
            );
            break;
          case 'PENDING_VERIFICATION_EXISTS':
            if (error.details?.resumeToken) {
              setApiError(
                <>
                  A verification email has already been sent.{' '}
                  <Link 
                    to={`/auth/verify?resumeToken=${error.details.resumeToken}`} 
                    className="underline hover:text-white/80"
                  >
                    Continue verification
                  </Link>
                </>
              );
            } else {
              setApiError('A verification email has already been sent. Please check your inbox.');
            }
            break;
          case 'VALIDATION_ERROR':
            setApiError('Please check your information and try again.');
            if (error.details?.fieldErrors) {
              setErrors(error.details.fieldErrors);
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

  const renderStep1 = () => (
    <div className="space-y-4">
      <TextInput
        id="fullName"
        label="Full Name"
        value={step1Data.fullName}
        onChange={(value) => handleInputChange(1, 'fullName', value)}
        error={errors.fullName}
        placeholder="Your full name"
        required
      />

      <TextInput
        id="zid"
        label="zID"
        value={step1Data.zid}
        onChange={(value) => handleInputChange(1, 'zid', value)}
        error={errors.zid}
        placeholder="z1234567"
        required
      />

      <RadioGroup
        name="isIndonesian"
        label="Are you Indonesian?"
        value={step1Data.isIndonesian.toString()}
        onChange={(value) => handleInputChange(1, 'isIndonesian', value === 'true')}
        options={[
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ]}
        required
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <TextInput
        id="yearIntake"
        label="Year Intake"
        type="number"
        value={step2Data.yearIntake.toString()}
        onChange={(value) => handleInputChange(2, 'yearIntake', parseInt(value) || 0)}
        error={errors.yearIntake}
        placeholder="e.g. 2020"
        required
      />

      <Select
        id="level"
        label="Level"
        value={step2Data.level}
        onChange={(value) => handleInputChange(2, 'level', value)}
        options={[
          { value: 'foundation', label: 'Foundation' },
          { value: 'diploma', label: 'Diploma' },
          { value: 'undergrad', label: 'Undergraduate' },
          { value: 'postgrad', label: 'Postgraduate' },
          { value: 'phd', label: 'PhD' },
        ]}
        placeholder="Select your level of study"
        error={errors.level}
        required
      />

      <SearchableSelect
        id="program"
        label="Program"
        value={step2Data.program}
        onChange={(value) => handleInputChange(2, 'program', value)}
        options={PROGRAM_OPTIONS}
        placeholder="Type to search UNSW programs..."
        error={errors.program}
        required
        searchFunction={(query) => {
          const results = programDataService.searchPrograms(query);
          return results.map(p => ({ value: p.value, label: p.label }));
        }}
        popularOptions={programDataService.getPopularPrograms().map(p => ({ value: p.value, label: p.label }))}
      />

      <SearchableSelect
        id="major"
        label="Major"
        value={step2Data.major}
        onChange={(value) => handleInputChange(2, 'major', value)}
        options={MAJOR_OPTIONS}
        placeholder="Type to search majors/specializations..."
        error={errors.major}
        required
        searchFunction={(query) => programDataService.searchMajors(query).map(m => ({ value: m.value, label: m.label }))}
        popularOptions={programDataService.getPopularMajors().map(m => ({ value: m.value, label: m.label }))}
      />

    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <TextInput
        id="email"
        label="Email"
        type="email"
        value={step3Data.email}
        onChange={(value) => handleInputChange(3, 'email', value)}
        error={errors.email}
        placeholder="your.email@example.com"
        required
      />

      <PasswordInput
        id="password"
        label="Password"
        value={step3Data.password}
        onChange={(value) => handleInputChange(3, 'password', value)}
        error={errors.password}
        placeholder="At least 8 characters"
        required
      />

      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        value={step3Data.confirmPassword}
        onChange={(value) => handleInputChange(3, 'confirmPassword', value)}
        error={errors.confirmPassword}
        placeholder="Confirm your password"
        required
      />
    </div>
  );

  return (
    <AuthLayout title={`Register (${currentStep}/3)`}>
      <FormProgress currentStep={currentStep} totalSteps={3} />
      
      {apiError && <Alert message={apiError} type="error" className="mb-4" />}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="flex justify-between pt-4">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className={currentStep === 1 ? 'w-full' : 'ml-auto'}
          >
            {isLoading 
              ? 'Creating Account...' 
              : currentStep === 3 
                ? 'Create Account' 
                : 'Next'
            }
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-white/80">
          Already have an account?{' '}
          <Link 
            to="/auth/login" 
            className="text-white font-medium hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}