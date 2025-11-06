/**
 * DocumentList Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeAll } from 'vitest';
import { DocumentList } from './DocumentList';

// Mock the AuthContext
vi.mock('../../authentication/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: {
      cedula: '1234567890',
      fullName: 'Test User',
      address: 'Test Address',
      personalEmail: 'test@example.com',
      folderEmail: 'test.user@carpetacolombia.co',
      currentOperator: 'MiCarpeta',
      registrationDate: new Date('2024-01-15'),
      status: 'ACTIVE',
      carpetaId: 'test-carpeta-id-123',
    },
    isLoading: false,
    token: 'mock-token',
    error: null,
    requiresMFA: false,
    sessionId: null,
    login: vi.fn(),
    verifyMFA: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  })),
}));

// Mock localStorage before tests
const mockCarpetaId = 'test-carpeta-id-123';

beforeAll(() => {
  Storage.prototype.getItem = vi.fn((key: string) => {
    if (key === 'carpetaId') return mockCarpetaId;
    return null;
  });
  Storage.prototype.setItem = vi.fn();
  Storage.prototype.removeItem = vi.fn();
});

// Mock the hooks
vi.mock('../hooks', () => ({
  useDocuments: vi.fn(() => ({
    documents: [
      {
        documentId: '1',
        metadata: {
          title: 'Test Document 1',
          type: 'CEDULA',
          context: 'CIVIL_REGISTRY',
          issueDate: undefined,
          issuingEntity: undefined,
        },
        content: {
          format: 'PDF',
          sizeBytes: 1024000,
          hash: 'abc123',
          storageUrl: 'https://example.com/doc1.pdf',
          presignedUrl: undefined,
        },
        certification: undefined,
        documentStatus: 'CERTIFIED',
        receptionDate: new Date('2024-01-15'),
      },
      {
        documentId: '2',
        metadata: {
          title: 'Test Document 2',
          type: 'DIPLOMA',
          context: 'EDUCATION',
          issueDate: undefined,
          issuingEntity: undefined,
        },
        content: {
          format: 'JPEG',
          sizeBytes: 2048000,
          hash: 'def456',
          storageUrl: 'https://example.com/doc2.jpg',
          presignedUrl: undefined,
        },
        certification: undefined,
        documentStatus: 'TEMPORARY',
        receptionDate: new Date('2024-01-16'),
      },
    ],
    isLoading: false,
    error: null,
    pagination: {
      nextCursor: null,
      hasMore: false,
    },
    loadMore: vi.fn(),
    refetch: vi.fn(),
  })),
  useDeleteDocument: vi.fn(() => ({
    deleteDocument: vi.fn(),
    isLoading: false,
    error: null,
  })),
}));

// Mock the infrastructure
vi.mock('../infrastructure', () => ({
  documentService: {
    downloadDocument: vi.fn(),
  },
}));

describe('DocumentList', () => {
  it('renders the document list', async () => {
    render(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument();
      expect(screen.getByText('Test Document 2')).toBeInTheDocument();
    });
  });

  it('shows upload button', () => {
    render(<DocumentList onUploadClick={() => {}} />);

    expect(screen.getByTestId('upload-document-button')).toBeInTheDocument();
  });

  it('calls onUploadClick when upload button is clicked', async () => {
    const onUploadClick = vi.fn();
    const user = userEvent.setup();

    render(<DocumentList onUploadClick={onUploadClick} />);

    const uploadButton = screen.getByTestId('upload-document-button');
    await user.click(uploadButton);

    expect(onUploadClick).toHaveBeenCalled();
  });

  it('displays document type badges', async () => {
    render(<DocumentList />);

    await waitFor(() => {
      expect(screen.getByText('CEDULA')).toBeInTheDocument();
      expect(screen.getByText('DIPLOMA')).toBeInTheDocument();
    });
  });

  it('shows certified badge for certified documents', async () => {
    render(<DocumentList />);

    await waitFor(() => {
      // The document status is shown as a chip with the status value
      expect(screen.getByText('CERTIFIED')).toBeInTheDocument();
    });
  });

  it('displays empty state when no documents', async () => {
    const { useDocuments } = await import('../hooks');
    vi.mocked(useDocuments).mockReturnValue({
      documents: [],
      isLoading: false,
      isLoadingMore: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    });

    render(<DocumentList />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('displays loading state', async () => {
    const { useDocuments } = await import('../hooks');
    vi.mocked(useDocuments).mockReturnValue({
      documents: [],
      isLoading: true,
      isLoadingMore: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    });

    render(<DocumentList />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    const { useDocuments } = await import('../hooks');
    vi.mocked(useDocuments).mockReturnValue({
      documents: [],
      isLoading: false,
      isLoadingMore: false,
      error: 'Failed to load documents',
      hasMore: false,
      loadMore: vi.fn(),
      refetch: vi.fn(),
    });

    render(<DocumentList />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

