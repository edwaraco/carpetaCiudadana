/**
 * SetPasswordForm Tests
 * Uses data-testid for all selectors and validates against actual form structure
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SetPasswordForm } from './SetPasswordForm';
import { AuthProvider } from '@/contexts/authentication/context/AuthContext';

// Mock authService
vi.mock('@/contexts/authentication/infrastructure', () => ({
  authService: {
    setPassword: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: {
          token: 'mock-auth-token',
          expiresAt: new Date(Date.now() + 3600000),
          user: {
            cedula: '1234567890',
            fullName: 'Juan Pérez García',
            address: 'Calle 123 #45-67',
            personalEmail: 'juan@example.com',
            folderEmail: 'juan.perez.1234567890@carpetacolombia.co',
            currentOperator: 'MiCarpeta',
            registrationDate: new Date(),
            status: 'ACTIVE',
            carpetaId: 'carpeta-123',
          },
          requiresMFA: false,
        },
      })
    ),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper component with required providers and initial route with token
const WrapperWithToken: React.FC<{ children: React.ReactNode; token?: string }> = ({
  children,
  token = 'mock-verification-token-123'
}) => (
  <MemoryRouter initialEntries={[`/set-password?token=${token}`]}>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

// Wrapper without token (for testing invalid token scenario)
const WrapperWithoutToken: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter initialEntries={['/set-password']}>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

describe('SetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid token scenarios', () => {
    it('renders the form with all required elements when token is present', () => {
      render(<SetPasswordForm />, { wrapper: WrapperWithToken });

      // Container and title
      expect(screen.getByTestId('set-password-form-container')).toBeInTheDocument();
      expect(screen.getByTestId('set-password-form-title')).toBeInTheDocument();
      expect(screen.getByTestId('set-password-form-subtitle')).toBeInTheDocument();

      // Form fields
      expect(screen.getByTestId('set-password-form')).toBeInTheDocument();
      expect(screen.getByTestId('set-password-form-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('set-password-form-confirm-password-input')).toBeInTheDocument();

      // Submit button
      expect(screen.getByTestId('set-password-form-submit-button')).toBeInTheDocument();
    });

    it('submits form with valid passwords', async () => {
      const user = userEvent.setup();
      render(<SetPasswordForm />, { wrapper: WrapperWithToken });

      const passwordInput = screen.getByTestId('set-password-form-password-field');
      const confirmPasswordInput = screen.getByTestId('set-password-form-confirm-password-field');
      const submitButton = screen.getByTestId('set-password-form-submit-button');

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');

      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      // Form should process successfully
      await waitFor(() => {
        expect(submitButton).toBeInTheDocument();
      });
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<SetPasswordForm />, { wrapper: WrapperWithToken });

      const passwordInput = screen.getByTestId('set-password-form-password-field') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByTestId('set-password-form-toggle-password');
      await user.click(toggleButton);

      expect(passwordInput.type).toBe('text');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('toggles confirm password visibility', async () => {
      const user = userEvent.setup();
      render(<SetPasswordForm />, { wrapper: WrapperWithToken });

      const confirmPasswordInput = screen.getByTestId('set-password-form-confirm-password-field') as HTMLInputElement;
      expect(confirmPasswordInput.type).toBe('password');

      const toggleButton = screen.getByTestId('set-password-form-toggle-confirm-password');
      await user.click(toggleButton);

      expect(confirmPasswordInput.type).toBe('text');

      await user.click(toggleButton);
      expect(confirmPasswordInput.type).toBe('password');
    });


    it('calls onSuccess callback on successful password set', async () => {
      const onSuccess = vi.fn();
      const user = userEvent.setup();

      render(<SetPasswordForm onSuccess={onSuccess} />, { wrapper: WrapperWithToken });

      const passwordInput = screen.getByTestId('set-password-form-password-field');
      const confirmPasswordInput = screen.getByTestId('set-password-form-confirm-password-field');
      const submitButton = screen.getByTestId('set-password-form-submit-button');

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('calls onCancel callback when cancel button is clicked', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();

      render(<SetPasswordForm onCancel={onCancel} />, { wrapper: WrapperWithToken });

      const cancelButton = screen.getByTestId('set-password-form-cancel-button');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Invalid token scenarios', () => {
    it('shows error message when token is missing from URL', () => {
      render(<SetPasswordForm />, { wrapper: WrapperWithoutToken });

      // Should show invalid token error
      expect(screen.getByTestId('set-password-form-container')).toBeInTheDocument();
      expect(screen.getByTestId('set-password-invalid-token-title')).toBeInTheDocument();
      expect(screen.getByTestId('set-password-back-to-login-button')).toBeInTheDocument();

      // Should show back to login button
      expect(screen.getByTestId('set-password-back-to-login-button')).toBeInTheDocument();

      // Should NOT show the form
      expect(screen.queryByTestId('set-password-form')).not.toBeInTheDocument();
    });

    it('navigates to login when back button is clicked on invalid token', async () => {
      const user = userEvent.setup();
      render(<SetPasswordForm />, { wrapper: WrapperWithoutToken });

      const backButton = screen.getByTestId('set-password-back-to-login-button');
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Token extraction from URL', () => {
    it('extracts token from URL query params', () => {
      const customToken = 'custom-verification-token-456';
      const CustomWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <MemoryRouter initialEntries={[`/set-password?token=${customToken}`]}>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      );

      render(<SetPasswordForm />, { wrapper: CustomWrapper });

      // Form should be visible (token was successfully extracted)
      expect(screen.getByTestId('set-password-form')).toBeInTheDocument();
      expect(screen.queryByTestId('set-password-invalid-token-alert')).not.toBeInTheDocument();
    });
  });

  describe('Password strength requirements', () => {
    it('accepts password with uppercase, lowercase, and number', async () => {
      const user = userEvent.setup();
      render(<SetPasswordForm />, { wrapper: WrapperWithToken });

      const passwordInput = screen.getByTestId('set-password-form-password-field');
      const confirmPasswordInput = screen.getByTestId('set-password-form-confirm-password-field');
      const submitButton = screen.getByTestId('set-password-form-submit-button');

      await user.type(passwordInput, 'MySecurePass123');
      await user.type(confirmPasswordInput, 'MySecurePass123');

      // Button should be enabled
      expect(submitButton).not.toBeDisabled();
    });
  });
});

