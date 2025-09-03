
// Email validation
export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
}

// Password validation
export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

// zID validation
export function validateZid(zid: string): string | null {
  if (!zid.trim()) return 'zID is required';
  const zidRegex = /^z[0-9]{7}$/;
  if (!zidRegex.test(zid)) return 'zID must be in format z1234567';
  return null;
}

// Full name validation
export function validateFullName(fullName: string): string | null {
  if (!fullName.trim()) return 'Full name is required';
  if (fullName.trim().length < 2) return 'Full name must be at least 2 characters';
  return null;
}

// Year intake validation
export function validateYearIntake(year: number): string | null {
  if (!year) return 'Year intake is required';
  if (year < 2015 || year > 2035) {
    return 'Year intake must be between 2015 and 2035';
  }
  return null;
}

// Generic required field validation
export function validateRequired(value: string | number | boolean, fieldName: string): string | null {
  if (value === '' || value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  return null;
}

// Password confirmation validation
export function validatePasswordConfirmation(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}

// Combine multiple validation functions
export function combineValidations(
  value: any,
  validators: ((value: any) => string | null)[]
): string | null {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
}