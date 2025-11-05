/**
 * RegisterCitizenForm Tests
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RegisterCitizenForm } from './RegisterCitizenForm';
import { renderWithI18n } from '@/tests/i18n';

// Mock the custom hooks
vi.mock('../hooks/useRegisterCitizen', () => ({
  useRegisterCitizen: vi.fn(() => ({
    registerCitizen: vi.fn(),
    isLoading: false,
    error: null,
    data: null,
    reset: vi.fn(),
  })),
}));

vi.mock('../hooks/useValidateCitizen', () => ({
  useValidateCitizen: vi.fn(() => ({
    validateCitizen: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    data: null,
    error: null,
    reset: vi.fn(),
  })),
}));

describe('RegisterCitizenForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all fields in Spanish', () => {
    renderWithI18n(<RegisterCitizenForm />);

    // Verify title and subtitle
    expect(screen.getByText('Registro de Ciudadano')).toBeInTheDocument();
    expect(screen.getByText(/Regístrese como nuevo ciudadano/i)).toBeInTheDocument();

    // Verify all form fields are present
    expect(screen.getByLabelText(/Cédula de Ciudadanía/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Dirección$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico Personal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar Correo Electrónico/i)).toBeInTheDocument();

    // Verify register button
    expect(screen.getByRole('button', { name: /Registrar/i })).toBeInTheDocument();
  });

  it('validates required fields and shows error messages in Spanish', async () => {
    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    const submitButton = screen.getByRole('button', { name: /Registrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Check for "La cédula es obligatoria"
      expect(screen.getByText(/cédula es obligatori/i)).toBeInTheDocument();

      // Check for "Nombre Completo es obligatorio"
      expect(screen.getByText(/Nombre Completo es obligatorio/i)).toBeInTheDocument();

      // Check for "Dirección es obligatorio"
      expect(screen.getByText(/Dirección es obligatori/i)).toBeInTheDocument();
    });
  });

  it('validates email format and shows error in Spanish', async () => {
    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    const emailInput = screen.getByLabelText(/Correo Electrónico Personal/i);
    await user.type(emailInput, 'correo-invalido');

    // Submit to trigger validation
    const submitButton = screen.getByRole('button', { name: /Registrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Ingrese una dirección de correo electrónico válida/i)).toBeInTheDocument();
    });
  });

  it('validates email confirmation and shows mismatch error in Spanish', async () => {
    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    const emailInput = screen.getByLabelText(/Correo Electrónico Personal/i);
    const confirmEmailInput = screen.getByLabelText(/Confirmar Correo Electrónico/i);

    await user.type(emailInput, 'test@ejemplo.com');
    await user.type(confirmEmailInput, 'diferente@ejemplo.com');

    // Submit to trigger validation
    const submitButton = screen.getByRole('button', { name: /Registrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Los correos electrónicos no coinciden/i)).toBeInTheDocument();
    });
  });

  it('validates cedula format and shows error in Spanish', async () => {
    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    const cedulaInput = screen.getByLabelText(/Cédula de Ciudadanía/i);
    await user.type(cedulaInput, '123');

    // Submit to trigger validation
    const submitButton = screen.getByRole('button', { name: /Registrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/La cédula debe tener entre 6 y 10 dígitos/i)).toBeInTheDocument();
    });
  });

  it('shows validation status while validating cedula', async () => {
    const { useValidateCitizen } = await import('../hooks/useValidateCitizen');

    vi.mocked(useValidateCitizen).mockReturnValue({
      validateCitizen: vi.fn().mockResolvedValue(undefined),
      isLoading: true,
      data: null,
      error: null,
      reset: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    const cedulaInput = screen.getByLabelText(/Cédula de Ciudadanía/i);
    await user.type(cedulaInput, '1234567890');

    await waitFor(() => {
      expect(screen.getByText(/Validando.../i)).toBeInTheDocument();
    });
  });

  it('shows cedula availability status when validated successfully', async () => {
    const { useValidateCitizen } = await import('../hooks/useValidateCitizen');

    vi.mocked(useValidateCitizen).mockReturnValue({
      validateCitizen: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      data: {
        exists: false,
        available: true,
        currentOperator: undefined,
      },
      error: null,
      reset: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    const cedulaInput = screen.getByLabelText(/Cédula de Ciudadanía/i);
    await user.type(cedulaInput, '1234567890');

    await waitFor(() => {
      expect(screen.getByText(/Cédula disponible para registro/i)).toBeInTheDocument();
    });
  });

  it('shows error when cedula is already registered', async () => {
    const { useValidateCitizen } = await import('../hooks/useValidateCitizen');

    vi.mocked(useValidateCitizen).mockReturnValue({
      validateCitizen: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      data: {
        exists: true,
        available: false,
        currentOperator: 'MiCarpeta Colombia',
      },
      error: null,
      reset: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    const cedulaInput = screen.getByLabelText(/Cédula de Ciudadanía/i);
    await user.type(cedulaInput, '1234567890');

    await waitFor(() => {
      expect(screen.getByText(/Esta cédula ya está registrada con MiCarpeta Colombia/i)).toBeInTheDocument();
    });
  });

  it('shows success message when registration succeeds', async () => {
    const { useRegisterCitizen } = await import('../hooks/useRegisterCitizen');
    const { useValidateCitizen } = await import('../hooks/useValidateCitizen');

    const onSuccess = vi.fn();

    vi.mocked(useValidateCitizen).mockReturnValue({
      validateCitizen: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      data: {
        exists: false,
        available: true,
        currentOperator: undefined,
      },
      error: null,
      reset: vi.fn(),
    });

    vi.mocked(useRegisterCitizen).mockReturnValue({
      registerCitizen: vi.fn(),
      isLoading: false,
      error: null,
      data: {
        citizen: {
          cedula: '1234567890',
          fullName: 'Juan Pérez',
          address: 'Calle 123',
          personalEmail: 'juan.perez@gmail.com',
          folderEmail: 'juan.perez@carpetacolombia.co',
          currentOperator: 'MiCarpeta',
          registrationDate: new Date(),
          status: 'ACTIVE',
        },
        folderEmail: 'juan.perez@carpetacolombia.co',
        message: 'Registration successful',
      },
      reset: vi.fn(),
    });

    renderWithI18n(<RegisterCitizenForm onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByText(/¡Registro exitoso!/i)).toBeInTheDocument();
      expect(screen.getByText(/juan.perez@carpetacolombia.co/i)).toBeInTheDocument();
      expect(screen.getByText(/Este correo es permanente y no puede ser cambiado/i)).toBeInTheDocument();
    });
  });

  it('calls registerCitizen with correct data when form is submitted', async () => {
    const { useRegisterCitizen } = await import('../hooks/useRegisterCitizen');
    const { useValidateCitizen } = await import('../hooks/useValidateCitizen');

    const registerCitizenMock = vi.fn();

    vi.mocked(useValidateCitizen).mockReturnValue({
      validateCitizen: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      data: {
        exists: false,
        available: true,
        currentOperator: undefined,
      },
      error: null,
      reset: vi.fn(),
    });

    vi.mocked(useRegisterCitizen).mockReturnValue({
      registerCitizen: registerCitizenMock,
      isLoading: false,
      error: null,
      data: null,
      reset: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    // Fill form with valid data
    await user.type(screen.getByLabelText(/Cédula de Ciudadanía/i), '9876543210');
    await user.type(screen.getByLabelText(/Nombre Completo/i), 'Juan Pérez');
    await user.type(screen.getByLabelText(/^Dirección$/i), 'Calle 123 #45-67');
    await user.type(screen.getByLabelText(/Correo Electrónico Personal/i), 'juan@ejemplo.com');
    await user.type(screen.getByLabelText(/Confirmar Correo Electrónico/i), 'juan@ejemplo.com');

    const submitButton = screen.getByRole('button', { name: /Registrar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(registerCitizenMock).toHaveBeenCalledWith({
        cedula: '9876543210',
        fullName: 'Juan Pérez',
        address: 'Calle 123 #45-67',
        personalEmail: 'juan@ejemplo.com',
      });
    });
  });

  it('shows loading state while registering', async () => {
    const { useRegisterCitizen } = await import('../hooks/useRegisterCitizen');

    vi.mocked(useRegisterCitizen).mockReturnValue({
      registerCitizen: vi.fn(),
      isLoading: true,
      error: null,
      data: null,
      reset: vi.fn(),
    });

    renderWithI18n(<RegisterCitizenForm />);

    expect(screen.getByText(/Registrando.../i)).toBeInTheDocument();
  });

  it('shows error message when registration fails', async () => {
    const { useRegisterCitizen } = await import('../hooks/useRegisterCitizen');

    vi.mocked(useRegisterCitizen).mockReturnValue({
      registerCitizen: vi.fn(),
      isLoading: false,
      error: {
        code: 'CONNECTION_ERROR',
        message: 'Error de conexión',
        statusCode: 500,
      },
      data: null,
      reset: vi.fn(),
    });

    renderWithI18n(<RegisterCitizenForm />);

    expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    renderWithI18n(<RegisterCitizenForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('disables submit button when cedula is not available', async () => {
    const { useValidateCitizen } = await import('../hooks/useValidateCitizen');

    vi.mocked(useValidateCitizen).mockReturnValue({
      validateCitizen: vi.fn().mockResolvedValue(undefined),
      isLoading: false,
      data: {
        exists: true,
        available: false,
        currentOperator: 'Otro Operador',
      },
      error: null,
      reset: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithI18n(<RegisterCitizenForm />);

    const cedulaInput = screen.getByLabelText(/Cédula de Ciudadanía/i);
    await user.type(cedulaInput, '1234567890');

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Registrar/i });
      expect(submitButton).toBeDisabled();
    });
  });

  it('calls onSuccess with folderEmail when registration completes', async () => {
    const { useRegisterCitizen } = await import('../hooks/useRegisterCitizen');

    const onSuccess = vi.fn();
    const folderEmail = 'maria.garcia@carpetacolombia.co';

    vi.mocked(useRegisterCitizen).mockReturnValue({
      registerCitizen: vi.fn(),
      isLoading: false,
      error: null,
      data: {
        citizen: {
          cedula: '1234567890',
          fullName: 'Maria Garcia',
          address: 'Calle 123',
          personalEmail: 'maria.garcia@gmail.com',
          folderEmail,
          currentOperator: 'MiCarpeta',
          registrationDate: new Date(),
          status: 'ACTIVE',
        },
        folderEmail,
        message: 'Success',
      },
      reset: vi.fn(),
    });

    renderWithI18n(<RegisterCitizenForm onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(folderEmail);
    });
  });

  it('shows helper text for personal email field', () => {
    renderWithI18n(<RegisterCitizenForm />);

    expect(screen.getByText(/Este correo será usado para notificaciones/i)).toBeInTheDocument();
  });
});

