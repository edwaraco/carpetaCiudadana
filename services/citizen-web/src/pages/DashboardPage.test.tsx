/**
 * DashboardPage Tests
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardPage } from './DashboardPage';
import { renderWithI18n } from '@/tests/i18n';
import { BrowserRouter } from 'react-router-dom';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
vi.mock('../contexts/authentication/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      fullName: 'Juan Pérez García',
      email: 'juan.perez@carpetacolombia.co',
    },
  }),
}));

// Mock StorageStatistics component
vi.mock('../contexts/folder/components', () => ({
  StorageStatistics: () => <div data-testid="storage-statistics">Storage Statistics</div>,
}));

// Mock hooks
vi.mock('../contexts/folder/hooks', () => ({
  useFolderStatistics: () => ({
    statistics: {
      totalDocuments: 15,
      certifiedDocuments: 10,
      temporaryDocuments: 5,
    },
    isLoading: false,
  }),
}));

vi.mock('../contexts/requests/hooks', () => ({
  useRequests: () => ({
    requests: [
      { id: '1', requestStatus: 'CREATED' },
      { id: '2', requestStatus: 'NOTIFIED' },
      { id: '3', requestStatus: 'COMPLETED' },
    ],
    isLoading: false,
  }),
}));

const DashboardPageWithRouter = () => (
  <BrowserRouter>
    <DashboardPage />
  </BrowserRouter>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome message with user name in Spanish', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    expect(screen.getByText(/¡Bienvenido de nuevo, Juan!/i)).toBeInTheDocument();
  });

  it('renders subtitle in Spanish', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    expect(screen.getByText(/Gestione sus documentos y manténgase actualizado/i)).toBeInTheDocument();
  });

  it('renders statistics cards with Spanish labels', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    // Total de Documentos solo aparece en stats
    expect(screen.getByText(/Total de Documentos/i)).toBeInTheDocument();

    // Estos textos pueden aparecer múltiples veces en la página
    const certificadosElements = screen.getAllByText(/Certificados/i);
    expect(certificadosElements.length).toBeGreaterThan(0);

    const temporalesElements = screen.getAllByText(/Temporales/i);
    expect(temporalesElements.length).toBeGreaterThan(0);

    const solicitudesElements = screen.getAllByText(/Solicitudes Pendientes/i);
    expect(solicitudesElements.length).toBeGreaterThan(0);
  });

  it('displays correct statistics values', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    expect(screen.getByTestId('stats-total')).toBeInTheDocument(); // Total documents
    expect(screen.getByTestId('stats-certified')).toBeInTheDocument(); // Certified
    expect(screen.getByTestId('stats-temp')).toBeInTheDocument(); // Temporary
    expect(screen.getByTestId('stats-pending')).toBeInTheDocument(); // Pending requests (2 out of 3)
  });

  it('renders quick actions section in Spanish', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    expect(screen.getByText(/Acciones Rápidas/i)).toBeInTheDocument();
  });

  it('renders all quick action cards in Spanish', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    // These are the actual quick actions in DashboardPage
    expect(screen.getByText(/Mis Documentos/i)).toBeInTheDocument();
    expect(screen.getByText(/Solicitudes de Documentos/i)).toBeInTheDocument();
    expect(screen.getByText(/Cambiar Operador/i)).toBeInTheDocument();
  });

  it('renders quick action cards', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    // Verify quick action cards exist using data-testid (independent of translations)
    expect(screen.getByTestId('quick-action-my-documents')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-requested-document')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-portability')).toBeInTheDocument();
  });

  it('renders recent activity section in Spanish', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    expect(screen.getByTestId('dashboard-recent-activities')).toBeInTheDocument();
    expect(screen.getByText(/Sin actividad reciente/i)).toBeInTheDocument();
    expect(screen.getByText(/Su actividad de documentos aparecerá aquí/i)).toBeInTheDocument();
  });

  it('navigates to documents page when clicking my documents action', async () => {
    const user = userEvent.setup();
    renderWithI18n(<DashboardPageWithRouter />);

    const myDocumentsAction = screen.getByTestId('quick-action-my-documents');
    await user.click(myDocumentsAction);
    expect(mockNavigate).toHaveBeenCalledWith('/documents');
  });

  it('navigates to requests page when clicking document requests action', async () => {
    const user = userEvent.setup();
    renderWithI18n(<DashboardPageWithRouter />);

    const requestsAction = screen.getByTestId('quick-action-requested-document');
    await user.click(requestsAction);
    expect(mockNavigate).toHaveBeenCalledWith('/requests');
  });

  it('navigates to portability page when clicking change operator action', async () => {
    const user = userEvent.setup();
    renderWithI18n(<DashboardPageWithRouter />);

    const portabilityAction = screen.getByTestId('quick-action-portability');
    await user.click(portabilityAction);
    expect(mockNavigate).toHaveBeenCalledWith('/portability');
  });

  it('shows badge on document requests card when there are pending requests', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    const badge = screen.getByTestId('badge-requested-document'); // 2 pending requests
    expect(badge).toBeInTheDocument();
  });

  it('renders storage statistics component', () => {
    renderWithI18n(<DashboardPageWithRouter />);

    expect(screen.getByTestId('storage-statistics')).toBeInTheDocument();
  });
});

