import validator from 'validator';

// Validation result interfaces
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface NameValidationResult {
  valid: boolean;
  message?: string;
  trimmedName?: string;
}

export interface PhoneValidationResult {
  valid: boolean;
  message?: string;
  cleanPhone?: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface RegistrationValidationResult {
  valid: boolean;
  errors?: Record<string, string | string[]>;
}

export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  companyName?: string;
}

// Validate email
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }
  
  if (!validator.isEmail(email)) {
    return { valid: false, message: 'Please provide a valid email address' };
  }
  
  return { valid: true };
};

// Validate password strength
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

// Validate phone number
export const validatePhone = (phone: string): PhoneValidationResult => {
  if (!phone) {
    return { valid: false, message: 'Phone number is required' };
  }
  
  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  if (!/^\d{10,15}$/.test(cleanPhone)) {
    return { valid: false, message: 'Phone number must be 10-15 digits' };
  }
  
  return { valid: true, cleanPhone };
};

// Validate name
export const validateName = (name: string, fieldName: string = 'Name'): NameValidationResult => {
  if (!name) {
    return { valid: false, message: `${fieldName} is required` };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { valid: false, message: `${fieldName} must be at least 2 characters` };
  }
  
  if (trimmedName.length > 50) {
    return { valid: false, message: `${fieldName} cannot exceed 50 characters` };
  }
  
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return { valid: false, message: `${fieldName} can only contain letters, spaces, hyphens and apostrophes` };
  }
  
  return { valid: true, trimmedName };
};

// Validate registration data
export const validateRegistration = (data: RegistrationData): RegistrationValidationResult => {
  const errors: Record<string, string | string[]> = {};
  
  // Email validation
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.message!;
  }
  
  // Password validation
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors!;
  }
  
  // Confirm password
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // First name validation
  const firstNameValidation = validateName(data.firstName, 'First name');
  if (!firstNameValidation.valid) {
    errors.firstName = firstNameValidation.message!;
  }
  
  // Last name validation
  const lastNameValidation = validateName(data.lastName, 'Last name');
  if (!lastNameValidation.valid) {
    errors.lastName = lastNameValidation.message!;
  }
  
  // Phone validation
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.message!;
  }
  
  // Role validation
  if (!data.role || !['user', 'vendor'].includes(data.role)) {
    errors.role = 'Role must be either "user" or "vendor"';
  }
  
  // Vendor-specific validation
  if (data.role === 'vendor') {
    if (!data.companyName || data.companyName.trim().length < 3) {
      errors.companyName = 'Company name is required and must be at least 3 characters';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
};
