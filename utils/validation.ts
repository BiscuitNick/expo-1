// Validation utilities for authentication forms

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
}

export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  
  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }
  
  // Check for at least one uppercase, one lowercase, and one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return 'Password must contain uppercase, lowercase, and number';
  }
  
  return undefined;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  
  return undefined;
};

export const validateDisplayName = (displayName: string): string | undefined => {
  if (!displayName) {
    return 'Display name is required';
  }
  
  if (displayName.length < 2) {
    return 'Display name must be at least 2 characters';
  }
  
  if (displayName.length > 30) {
    return 'Display name must be less than 30 characters';
  }
  
  // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
  const validNameRegex = /^[a-zA-Z0-9\s\-_]+$/;
  if (!validNameRegex.test(displayName)) {
    return 'Display name can only contain letters, numbers, spaces, hyphens, and underscores';
  }
  
  // Check for consecutive spaces
  if (/\s{2,}/.test(displayName)) {
    return 'Display name cannot have consecutive spaces';
  }
  
  // Check for leading/trailing spaces
  if (displayName !== displayName.trim()) {
    return 'Display name cannot have leading or trailing spaces';
  }
  
  return undefined;
};

export const validateLoginForm = (email: string, password: string): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  
  return errors;
};

export const validateSignupForm = (
  email: string,
  password: string,
  confirmPassword: string,
  displayName: string
): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  
  const displayNameError = validateDisplayName(displayName);
  if (displayNameError) errors.displayName = displayNameError;
  
  return errors;
};

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined);
};

export const getErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/requires-recent-login': 'Please sign in again to complete this action.',
  };
  
  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
};
