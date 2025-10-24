/**
 * HomePage Tests
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { HomePage } from './HomePage';
import { renderWithI18n } from '@/tests/i18n';
import { BrowserRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const HomePageWithRouter = () => (
  <BrowserRouter>
    <HomePage />
  </BrowserRouter>
);

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero section with Spanish translations', () => {
    renderWithI18n(<HomePageWithRouter />);

    expect(screen.getByText('Carpeta Ciudadana')).toBeInTheDocument();
    expect(screen.getByText(/Su carpeta digital de documentos para Colombia/i)).toBeInTheDocument();
    expect(screen.getByText(/El ciudadano no debe ser el mensajero del estado/i)).toBeInTheDocument();
  });

  it('renders call-to-action buttons in Spanish', () => {
    renderWithI18n(<HomePageWithRouter />);

    expect(screen.getByRole('button', { name: /Registrarse Ahora/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('renders features section with all features in Spanish', () => {
    renderWithI18n(<HomePageWithRouter />);

    expect(screen.getByText(/Características Principales/i)).toBeInTheDocument();
    expect(screen.getByText(/Carpeta Personal/i)).toBeInTheDocument();
    expect(screen.getByText(/Seguridad Digital/i)).toBeInTheDocument();
    expect(screen.getByText(/Portabilidad de Operador/i)).toBeInTheDocument();
    expect(screen.getByText(/Compartir Fácilmente/i)).toBeInTheDocument();
  });

  it('renders feature descriptions in Spanish', () => {
    renderWithI18n(<HomePageWithRouter />);

    expect(screen.getByText(/Almacene todos sus documentos certificados/i)).toBeInTheDocument();
    expect(screen.getByText(/Sus documentos están protegidos con firmas digitales/i)).toBeInTheDocument();
    expect(screen.getByText(/Cambie libremente entre operadores/i)).toBeInTheDocument();
    expect(screen.getByText(/Comparta documentos con instituciones/i)).toBeInTheDocument();
  });

  it('renders CTA section in Spanish', () => {
    renderWithI18n(<HomePageWithRouter />);

    expect(screen.getByText(/¿Listo para comenzar?/i)).toBeInTheDocument();
    expect(screen.getByText(/Únase a miles de colombianos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cree Su Cuenta/i })).toBeInTheDocument();
  });

  it('navigates to register page when clicking register button', async () => {
    const user = userEvent.setup();
    renderWithI18n(<HomePageWithRouter />);

    const registerButton = screen.getAllByRole('button', { name: /Registrarse Ahora|Cree Su Cuenta/i })[0];
    await user.click(registerButton);

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('navigates to login page when clicking login button', async () => {
    const user = userEvent.setup();
    renderWithI18n(<HomePageWithRouter />);

    const loginButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    await user.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders all four feature cards', () => {
    renderWithI18n(<HomePageWithRouter />);

    const cards = screen.getAllByRole('heading', { level: 6 });
    expect(cards).toHaveLength(4);
  });
});

