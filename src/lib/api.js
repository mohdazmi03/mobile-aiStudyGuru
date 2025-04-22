import { supabase } from './supabase';
import { PASSWORD_RESET_REDIRECT_URL } from './config';

export const forgotPassword = async (email) => {
    try {
        // Use Supabase's built-in password reset
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: PASSWORD_RESET_REDIRECT_URL
        });

        if (error) throw error;

        return {
            message: 'If an account exists with this email, you will receive password reset instructions.',
            exists: !!data
        };
    } catch (error) {
        throw new Error(error.message || 'Failed to process password reset request');
    }
};

export const resetPassword = async (newPassword) => {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        return { message: 'Password updated successfully.' };
    } catch (error) {
        throw new Error(error.message || 'Failed to reset password');
    }
};

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