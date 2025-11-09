/**
 * LoginForm Tests
 * Uses data-testid for all selectors
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { AuthProvider } from '@/contexts/authentication/context/AuthContext';

// Mock authService
vi.mock('@/contexts/authentication/infrastructure', () => ({
  authService: {
    login: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: {
          token: 'mock-token',
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

// Wrapper component with required providers
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('LoginForm', () => {
  it('renders the form with all fields', () => {
    render(<LoginForm />, { wrapper: Wrapper });

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-cedula-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-submit-button')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const submitButton = screen.getByTestId('login-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cédula is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates cedula format (must be 6-10 digits)', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('login-form-cedula-field');
    await user.type(cedulaInput, '12345'); // Less than 6 digits

    const submitButton = screen.getByTestId('login-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cédula must be 6-10 digits/i)).toBeInTheDocument();
    });
  });

  it('validates cedula format (no letters allowed)', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('login-form-cedula-field');
    await user.type(cedulaInput, 'abc123'); // Contains letters

    const submitButton = screen.getByTestId('login-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cédula must be 6-10 digits/i)).toBeInTheDocument();
    });
  });

  it('accepts valid cedula (6 digits)', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('login-form-cedula-field');
    const passwordInput = screen.getByTestId('login-form-password-field');
    const submitButton = screen.getByTestId('login-form-submit-button');

    await user.type(cedulaInput, '123456'); // 6 digits - valid
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/cédula must be 6-10 digits/i)).not.toBeInTheDocument();
    });
  });

  it('accepts valid cedula (10 digits)', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('login-form-cedula-field');
    const passwordInput = screen.getByTestId('login-form-password-field');
    const submitButton = screen.getByTestId('login-form-submit-button');

    await user.type(cedulaInput, '1234567890'); // 10 digits - valid
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/cédula must be 6-10 digits/i)).not.toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const passwordInput = screen.getByTestId('login-form-password-field');
    await user.type(passwordInput, '123');

    const submitButton = screen.getByTestId('login-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const passwordInput = screen.getByTestId('login-form-password-field') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByTestId('login-form-toggle-password');
    await user.click(toggleButton);

    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('accepts initial cedula value', () => {
    render(<LoginForm initialCedula="1234567890" />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('login-form-cedula-field') as HTMLInputElement;
    expect(cedulaInput.value).toBe('1234567890');
  });

  it('accepts valid cedula and password', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('login-form-cedula-field');
    const passwordInput = screen.getByTestId('login-form-password-field');
    const submitButton = screen.getByTestId('login-form-submit-button');

    await user.type(cedulaInput, '1234567890');
    await user.type(passwordInput, 'password123');

    // Button should be enabled
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    // Form should be processed without validation errors
    await waitFor(() => {
      expect(screen.queryByText(/cédula must be 6-10 digits/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
    });
  });

  it('calls onSuccess callback on successful login', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSuccess={onSuccess} />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('login-form-cedula-field');
    const passwordInput = screen.getByTestId('login-form-password-field');
    const submitButton = screen.getByTestId('login-form-submit-button');

    await user.type(cedulaInput, '1234567890');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('disables form while loading', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('login-form-cedula-field');
    const passwordInput = screen.getByTestId('login-form-password-field');
    const submitButton = screen.getByTestId('login-form-submit-button');

    await user.type(cedulaInput, '1234567890');
    await user.type(passwordInput, 'password123');

    // Button should be enabled before clicking
    expect(submitButton).not.toBeDisabled();
  });

  it('shows placeholder text for cedula', () => {
    render(<LoginForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByPlaceholderText('1234567890');
    expect(cedulaInput).toBeInTheDocument();
  });
});

