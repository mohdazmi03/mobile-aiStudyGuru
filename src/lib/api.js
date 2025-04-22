import { supabase } from './supabase';

// Validate password strength
export const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isValid = minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    
    const errors = [];
    if (!minLength) errors.push('Password must be at least 8 characters long');
    if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
    if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
    if (!hasNumbers) errors.push('Password must contain at least one number');
    if (!hasSpecialChar) errors.push('Password must contain at least one special character');

    return {
        isValid,
        errors,
        checks: {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        }
    };
};