/**
 * RegisterForm Tests
 * Uses data-testid for all selectors and validates against actual form structure
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RegisterForm } from './RegisterForm';
import { AuthProvider } from '@/contexts/authentication/context/AuthContext';

// Mock authService
vi.mock('@/contexts/authentication/infrastructure', () => ({
  authService: {
    register: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: {
          message: 'Registro iniciado exitosamente. Revise su correo electrónico para el enlace de verificación.',
          cedula: '1234567890',
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

// Wrapper component with required providers
const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all required elements', () => {
    render(<RegisterForm />, { wrapper: Wrapper });

    // Container and title
    expect(screen.getByTestId('register-form-container')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-title')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-subtitle')).toBeInTheDocument();

    // Form fields
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-cedula-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-fullname-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-address-input')).toBeInTheDocument();

    // Submit button
    expect(screen.getByTestId('register-form-submit-button')).toBeInTheDocument();

    // Login link
    expect(screen.getByTestId('register-form-login-link')).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const submitButton = screen.getByTestId('register-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      // Check for Spanish validation messages
      expect(screen.getByText(/registerForm.validation.cedulaRequired/i)).toBeInTheDocument();
      expect(screen.getByText(/registerForm.validation.fullNameRequired/i)).toBeInTheDocument();
      expect(screen.getByText(/registerForm.validation.emailRequired/i)).toBeInTheDocument();
    });
  });

  it('validates cedula format (must be 6-10 digits)', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('register-form-cedula-field');
    await user.type(cedulaInput, '12345'); // Less than 6 digits

    const submitButton = screen.getByTestId('register-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registerForm.validation.cedulaPattern/i)).toBeInTheDocument();
    });
  });

  it('validates full name minimum length', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const fullNameInput = screen.getByTestId('register-form-fullname-field');
    await user.type(fullNameInput, 'AB'); // Less than 3 characters

    const submitButton = screen.getByTestId('register-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registerForm.validation.fullNameMinLength/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const emailInput = screen.getByTestId('register-form-email-field');
    await user.type(emailInput, 'invalid-email'); // Invalid format

    const submitButton = screen.getByTestId('register-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registerForm.validation.emailPattern/i)).toBeInTheDocument();
    });
  });

  it('validates phone format when provided (optional field)', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const phoneInput = screen.getByTestId('register-form-phone-field');
    await user.type(phoneInput, 'abc'); // Invalid format

    const submitButton = screen.getByTestId('register-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registerForm.validation.phonePattern/i)).toBeInTheDocument();
    });
  });

  it('accepts valid phone format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('register-form-cedula-field');
    const fullNameInput = screen.getByTestId('register-form-fullname-field');
    const emailInput = screen.getByTestId('register-form-email-field');
    const phoneInput = screen.getByTestId('register-form-phone-field');

    await user.type(cedulaInput, '1234567890');
    await user.type(fullNameInput, 'Juan Pérez García');
    await user.type(emailInput, 'juan@example.com');
    await user.type(phoneInput, '+573001234567');

    const submitButton = screen.getByTestId('register-form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/formato de teléfono inválido/i)).not.toBeInTheDocument();
    });
  });

  it('submits form with all fields filled', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('register-form-cedula-field');
    const fullNameInput = screen.getByTestId('register-form-fullname-field');
    const emailInput = screen.getByTestId('register-form-email-field');
    const phoneInput = screen.getByTestId('register-form-phone-field');
    const addressInput = screen.getByTestId('register-form-address-field');
    const submitButton = screen.getByTestId('register-form-submit-button');

    await user.type(cedulaInput, '1234567890');
    await user.type(fullNameInput, 'Juan Pérez García');
    await user.type(emailInput, 'juan@example.com');
    await user.type(phoneInput, '+573001234567');
    await user.type(addressInput, 'Calle 123 #45-67, Medellín');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-form-success-alert')).toBeInTheDocument();
    });
  });

  it('shows success message with cedula after registration', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('register-form-cedula-field');
    const fullNameInput = screen.getByTestId('register-form-fullname-field');
    const emailInput = screen.getByTestId('register-form-email-field');
    const submitButton = screen.getByTestId('register-form-submit-button');

    await user.type(cedulaInput, '1234567890');
    await user.type(fullNameInput, 'Juan Pérez García');
    await user.type(emailInput, 'juan@example.com');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registerForm.successMessage/i)).toBeInTheDocument();
      const cedulaDisplay = screen.getByTestId('register-form-cedula-display');
      expect(cedulaDisplay).toHaveTextContent('1234567890');
    });
  });

  it('calls onSuccess callback with cedula after successful registration', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<RegisterForm onSuccess={onSuccess} />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('register-form-cedula-field');
    const fullNameInput = screen.getByTestId('register-form-fullname-field');
    const emailInput = screen.getByTestId('register-form-email-field');
    const submitButton = screen.getByTestId('register-form-submit-button');

    await user.type(cedulaInput, '1234567890');
    await user.type(fullNameInput, 'Juan Pérez García');
    await user.type(emailInput, 'juan@example.com');

    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('1234567890');
    });
  });

  it('navigates to login page when login link is clicked', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const loginLink = screen.getByTestId('register-form-login-link');
    await user.click(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('calls onCancel callback when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<RegisterForm onCancel={onCancel} />, { wrapper: Wrapper });

    const cancelButton = screen.getByTestId('register-form-cancel-button');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('disables form fields after successful registration', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('register-form-cedula-field');
    const fullNameInput = screen.getByTestId('register-form-fullname-field');
    const emailInput = screen.getByTestId('register-form-email-field');
    const submitButton = screen.getByTestId('register-form-submit-button');

    await user.type(cedulaInput, '1234567890');
    await user.type(fullNameInput, 'Juan Pérez García');
    await user.type(emailInput, 'juan@example.com');

    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('submits form with only required fields (phone and address are optional)', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />, { wrapper: Wrapper });

    const cedulaInput = screen.getByTestId('register-form-cedula-field');
    const fullNameInput = screen.getByTestId('register-form-fullname-field');
    const emailInput = screen.getByTestId('register-form-email-field');
    const submitButton = screen.getByTestId('register-form-submit-button');

    await user.type(cedulaInput, '9876543210');
    await user.type(fullNameInput, 'María González López');
    await user.type(emailInput, 'maria@example.com');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-form-success-alert')).toBeInTheDocument();
    });
  });
});

