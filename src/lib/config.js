// For development, use your local IP address (from expo start)
const DEVELOPMENT_API_URL = 'http://192.168.0.88:8081';
const PRODUCTION_API_URL = 'https://www.aistudyguru.com';

// The API URL will be different based on the environment
export const API_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

// Development URL will be your local Supabase instance
export const SUPABASE_URL = 'https://pctdsdeswoqlgrxduxtt.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGRzZGVzd29xbGdyeGR1eHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDAxNzUsImV4cCI6MjA1NjY3NjE3NX0.br2FQzHV8QFOIz6uJNFbzKJYFKsiCaeISCLzVpBZ_tk';

// For development, we'll use Supabase's built-in password reset
// In production, you might want to use your custom API
export const IS_DEVELOPMENT = __DEV__;

// We'll use Supabase's built-in auth functionality directly
export const useCustomPasswordReset = false;

// Reset password URLs
export const PASSWORD_RESET_REDIRECT_URL = __DEV__ ? 
    'exp://192.168.0.88:8081/--/reset-password' : 
    'aistudyguru://reset-password';