/**
 * Global Input Validation Utilities
 * Handles edge cases for all user inputs including:
 * - Negative values
 * - Special characters
 * - SQL injection attempts
 * - XSS attacks
 * - Invalid formats
 * - Out of range values
 */

// ==================== SANITIZATION ====================

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove any HTML tags
  const sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags content
  const noScripts = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim whitespace
  return noScripts.trim();
};

/**
 * Sanitize HTML to allow only safe tags
 */
export const sanitizeHTML = (html) => {
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'];
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const walk = (node) => {
    if (node.nodeType === 3) return; // Text node
    if (node.nodeType === 1) { // Element node
      if (!allowedTags.includes(node.tagName.toLowerCase())) {
        node.parentNode.replaceChild(document.createTextNode(node.textContent), node);
      } else {
        Array.from(node.childNodes).forEach(walk);
      }
    }
  };
  
  Array.from(div.childNodes).forEach(walk);
  return div.innerHTML;
};

// ==================== NUMERIC VALIDATION ====================

/**
 * Validate and sanitize price input
 * - Prevents negative values
 * - Limits decimal places
 * - Enforces maximum value
 */
export const validatePrice = (value, options = {}) => {
  const {
    min = 0,
    max = 999999999,
    allowZero = false,
    decimalPlaces = 2
  } = options;

  if (value === '' || value === null || value === undefined) {
    return { isValid: true, value: '', error: '' };
  }

  const numValue = parseFloat(value);

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return { isValid: false, value: '', error: 'Please enter a valid number' };
  }

  // Check for negative values
  if (numValue < 0) {
    return { isValid: false, value: 0, error: 'Price cannot be negative' };
  }

  // Check for zero
  if (!allowZero && numValue === 0) {
    return { isValid: false, value: '', error: 'Price must be greater than 0' };
  }

  // Check minimum
  if (numValue < min) {
    return { isValid: false, value: min, error: `Price must be at least ${min}` };
  }

  // Check maximum
  if (numValue > max) {
    return { isValid: false, value: max, error: `Price cannot exceed ${max}` };
  }

  // Round to decimal places
  const rounded = parseFloat(numValue.toFixed(decimalPlaces));

  return { isValid: true, value: rounded, error: '' };
};

/**
 * Validate integer input (quantity, duration, etc.)
 */
export const validateInteger = (value, options = {}) => {
  const {
    min = 0,
    max = 999999,
    allowZero = true
  } = options;

  if (value === '' || value === null || value === undefined) {
    return { isValid: true, value: '', error: '' };
  }

  const numValue = parseInt(value, 10);

  if (isNaN(numValue)) {
    return { isValid: false, value: '', error: 'Please enter a valid whole number' };
  }

  if (numValue < 0) {
    return { isValid: false, value: 0, error: 'Value cannot be negative' };
  }

  if (!allowZero && numValue === 0) {
    return { isValid: false, value: '', error: 'Value must be greater than 0' };
  }

  if (numValue < min) {
    return { isValid: false, value: min, error: `Value must be at least ${min}` };
  }

  if (numValue > max) {
    return { isValid: false, value: max, error: `Value cannot exceed ${max}` };
  }

  return { isValid: true, value: numValue, error: '' };
};

// ==================== DATE/TIME VALIDATION ====================

/**
 * Validate date input
 * - Ensures date is not in the past
 * - Validates format
 * - Checks range
 */
export const validateDate = (dateString, options = {}) => {
  const {
    allowPast = false,
    minDate = null,
    maxDate = null,
    futureOnly = true
  } = options;

  if (!dateString) {
    return { isValid: false, value: '', error: 'Date is required' };
  }

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if valid date
  if (isNaN(date.getTime())) {
    return { isValid: false, value: '', error: 'Invalid date format' };
  }

  // Check past date
  if (futureOnly && date < today) {
    return { isValid: false, value: '', error: 'Date must be in the future' };
  }

  if (!allowPast && date < today) {
    return { isValid: false, value: '', error: 'Past dates are not allowed' };
  }

  // Check minimum date
  if (minDate && date < new Date(minDate)) {
    return { isValid: false, value: '', error: `Date must be after ${minDate}` };
  }

  // Check maximum date
  if (maxDate && date > new Date(maxDate)) {
    return { isValid: false, value: '', error: `Date must be before ${maxDate}` };
  }

  return { isValid: true, value: dateString, error: '' };
};

/**
 * Validate time input
 */
export const validateTime = (timeString, options = {}) => {
  const {
    format24h = true,
    minTime = null,
    maxTime = null
  } = options;

  if (!timeString) {
    return { isValid: false, value: '', error: 'Time is required' };
  }

  // Validate format (HH:MM)
  const timeRegex = format24h ? /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ : /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/;
  
  if (!timeRegex.test(timeString)) {
    return { isValid: false, value: '', error: 'Invalid time format' };
  }

  // Compare with min/max if provided
  if (minTime && timeString < minTime) {
    return { isValid: false, value: minTime, error: `Time must be after ${minTime}` };
  }

  if (maxTime && timeString > maxTime) {
    return { isValid: false, value: maxTime, error: `Time must be before ${maxTime}` };
  }

  return { isValid: true, value: timeString, error: '' };
};

/**
 * Validate datetime combination
 */
export const validateDateTime = (dateString, timeString) => {
  const dateValidation = validateDate(dateString, { futureOnly: true });
  if (!dateValidation.isValid) {
    return dateValidation;
  }

  const timeValidation = validateTime(timeString);
  if (!timeValidation.isValid) {
    return timeValidation;
  }

  // Check if date is today and time is in the past
  const selectedDate = new Date(dateString);
  const today = new Date();
  
  if (selectedDate.toDateString() === today.toDateString()) {
    const [hours, minutes] = timeString.split(':');
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    if (selectedDateTime <= new Date()) {
      return { isValid: false, value: '', error: 'Selected time has already passed' };
    }
  }

  return { isValid: true, value: { date: dateString, time: timeString }, error: '' };
};

// ==================== TEXT VALIDATION ====================

/**
 * Validate text input with special character filtering
 */
export const validateText = (text, options = {}) => {
  const {
    minLength = 0,
    maxLength = 1000,
    allowSpecialChars = false,
    allowNumbers = true,
    required = false,
    pattern = null
  } = options;

  const sanitized = sanitizeString(text);

  if (required && !sanitized) {
    return { isValid: false, value: '', error: 'This field is required' };
  }

  if (sanitized.length < minLength) {
    return { isValid: false, value: sanitized, error: `Must be at least ${minLength} characters` };
  }

  if (sanitized.length > maxLength) {
    return { isValid: false, value: sanitized.substring(0, maxLength), error: `Cannot exceed ${maxLength} characters` };
  }

  if (!allowSpecialChars) {
    const regex = allowNumbers ? /^[a-zA-Z0-9\s]*$/ : /^[a-zA-Z\s]*$/;
    if (!regex.test(sanitized)) {
      return { isValid: false, value: sanitized, error: 'Special characters are not allowed' };
    }
  }

  if (pattern && !pattern.test(sanitized)) {
    return { isValid: false, value: sanitized, error: 'Invalid format' };
  }

  return { isValid: true, value: sanitized, error: '' };
};

/**
 * Validate email with comprehensive checks
 */
export const validateEmail = (email) => {
  const sanitized = sanitizeString(email);

  if (!sanitized) {
    return { isValid: false, value: '', error: 'Email is required' };
  }

  // Comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return { isValid: false, value: sanitized, error: 'Please enter a valid email address' };
  }

  // Check for common typos
  const commonTlds = ['com', 'net', 'org', 'edu', 'gov', 'mil'];
  const domain = sanitized.split('@')[1];
  const tld = domain?.split('.').pop();
  
  if (tld && tld.length === 1) {
    return { isValid: false, value: sanitized, error: 'Email domain looks incomplete' };
  }

  return { isValid: true, value: sanitized.toLowerCase(), error: '' };
};

/**
 * Validate phone number (supports multiple formats)
 */
export const validatePhone = (phone, options = {}) => {
  const {
    country = 'BD', // Bangladesh default
    required = true
  } = options;

  const sanitized = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

  if (!required && !sanitized) {
    return { isValid: true, value: '', error: '' };
  }

  if (!sanitized) {
    return { isValid: false, value: '', error: 'Phone number is required' };
  }

  // Bangladesh phone validation
  if (country === 'BD') {
    const bdRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!bdRegex.test(sanitized)) {
      return { isValid: false, value: sanitized, error: 'Invalid Bangladeshi phone number' };
    }
  }

  return { isValid: true, value: sanitized, error: '' };
};

// ==================== PASSWORD VALIDATION ====================

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password) {
    return { isValid: false, value: '', errors: ['Password is required'] };
  }

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('One number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('One special character');
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return {
    isValid: errors.length === 0,
    value: password,
    errors
  };
};

// ==================== URL VALIDATION ====================

/**
 * Validate URL format
 */
export const validateURL = (url, options = {}) => {
  const {
    required = false,
    allowHttp = true,
    requireHttps = false
  } = options;

  if (!required && !url) {
    return { isValid: true, value: '', error: '' };
  }

  if (!url) {
    return { isValid: false, value: '', error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);
    
    if (requireHttps && urlObj.protocol !== 'https:') {
      return { isValid: false, value: url, error: 'URL must use HTTPS' };
    }

    if (!allowHttp && urlObj.protocol === 'http:') {
      return { isValid: false, value: url, error: 'HTTP URLs are not allowed' };
    }

    return { isValid: true, value: url, error: '' };
  } catch (e) {
    return { isValid: false, value: url, error: 'Invalid URL format' };
  }
};

// ==================== FILE VALIDATION ====================

/**
 * Validate file upload
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
    required = false
  } = options;

  if (!required && !file) {
    return { isValid: true, value: null, error: '' };
  }

  if (!file) {
    return { isValid: false, value: null, error: 'File is required' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, value: null, error: `File type must be ${allowedTypes.join(', ')}` };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { isValid: false, value: null, error: `File size must be less than ${maxSizeMB}MB` };
  }

  return { isValid: true, value: file, error: '' };
};

// ==================== SPECIAL VALIDATIONS ====================

/**
 * Validate discount percentage
 */
export const validateDiscount = (value) => {
  return validateInteger(value, {
    min: 0,
    max: 100,
    allowZero: true
  });
};

/**
 * Validate rating
 */
export const validateRating = (value) => {
  return validateInteger(value, {
    min: 1,
    max: 5,
    allowZero: false
  });
};

/**
 * Validate Bangladesh postal code
 */
export const validatePostalCode = (code) => {
  const sanitized = code.replace(/\s+/g, '');
  
  if (!/^\d{4}$/.test(sanitized)) {
    return { isValid: false, value: sanitized, error: 'Postal code must be 4 digits' };
  }

  return { isValid: true, value: sanitized, error: '' };
};

// ==================== BATCH VALIDATION ====================

/**
 * Validate multiple fields at once
 */
export const validateForm = (fields) => {
  const errors = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, { value, validator, options }]) => {
    const result = validator(value, options);
    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

export default {
  sanitizeString,
  sanitizeHTML,
  validatePrice,
  validateInteger,
  validateDate,
  validateTime,
  validateDateTime,
  validateText,
  validateEmail,
  validatePhone,
  validatePassword,
  validateURL,
  validateFile,
  validateDiscount,
  validateRating,
  validatePostalCode,
  validateForm
};
