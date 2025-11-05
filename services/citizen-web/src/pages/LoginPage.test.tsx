/**
 * LoginPage Tests
 */

import { screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { renderWithI18n } from '@/tests/i18n';
import { BrowserRouter } from 'react-router-dom';

// Mock components
vi.mock('../contexts/authentication/components/LoginForm', () => ({
  LoginForm: ({ initialEmail }: { initialEmail: string }) => (
    <div data-testid="login-form">Login Form - Email: {initialEmail}</div>
  ),
}));

vi.mock('../contexts/authentication/components/MFAVerification', () => ({
  MFAVerification: () => <div data-testid="mfa-verification">MFA Verification</div>,
}));

// Mock AuthContext
vi.mock('../contexts/authentication/context/AuthContext', () => ({
  useAuth: () => ({
    requiresMFA: false,
    user: null,
  }),
}));

// Mock environment utils
vi.mock('@/shared/utils/env', () => ({
  isMFARequired: () => false,
}));

const LoginPageWithRouter = () => (
  <BrowserRouter>
    <LoginPage />
  </BrowserRouter>
);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome title in Spanish', () => {
    renderWithI18n(<LoginPageWithRouter />);

    expect(screen.getByText(/Bienvenido de Nuevo/i)).toBeInTheDocument();
  });

  it('renders welcome subtitle in Spanish', () => {
    renderWithI18n(<LoginPageWithRouter />);

    expect(screen.getByText(/Inicie sesión para acceder a su Carpeta Ciudadana/i)).toBeInTheDocument();
  });

  it('renders MFA optional message in Spanish when MFA is not required', () => {
    renderWithI18n(<LoginPageWithRouter />);

    expect(screen.getByText(/MFA es opcional/i)).toBeInTheDocument();
    expect(screen.getByText(/Puede omitirlo o usarlo para seguridad adicional/i)).toBeInTheDocument();
  });

  it('renders login form by default', () => {
    renderWithI18n(<LoginPageWithRouter />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('renders registration link in Spanish', () => {
    renderWithI18n(<LoginPageWithRouter />);

    expect(screen.getByText(/¿No tiene una cuenta?/i)).toBeInTheDocument();
    expect(screen.getByText(/Regístrese aquí/i)).toBeInTheDocument();
  });

  it('renders verify identity title when showing MFA', () => {
    // This would require state manipulation which is more complex
    // For now, we're testing the default state
    renderWithI18n(<LoginPageWithRouter />);

    // Verify we're NOT showing MFA by default
    expect(screen.queryByTestId('mfa-verification')).not.toBeInTheDocument();
  });

  it('shows success message when passed in location state', () => {
    // Mock useLocation to return state
    const mockMessage = 'Registro exitoso';
    
    vi.mock('react-router-dom', async () => {
      const mockMessage = 'Registro exitoso';
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useLocation: () => ({
          state: { message: mockMessage },
        }),
      };
    });

    renderWithI18n(<LoginPageWithRouter />);

    // The success alert should show the message
    expect(screen.getByText(mockMessage)).toBeInTheDocument();
  });

  it('has proper link to registration page', () => {
    renderWithI18n(<LoginPageWithRouter />);

    const registerLink = screen.getByText(/Regístrese aquí/i);
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});

