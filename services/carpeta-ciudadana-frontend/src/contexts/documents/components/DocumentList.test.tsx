/**
 * DocumentList Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DocumentList } from './DocumentList';

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
          tags: [],
        },
        content: {
          format: 'PDF',
          sizeBytes: 1024000,
          hash: 'abc123',
          storageUrl: 'https://example.com/doc1.pdf',
        },
        documentStatus: 'CERTIFIED',
        receptionDate: new Date('2024-01-15'),
      },
      {
        documentId: '2',
        metadata: {
          title: 'Test Document 2',
          type: 'DIPLOMA',
          context: 'EDUCATION',
          tags: [],
        },
        content: {
          format: 'JPEG',
          sizeBytes: 2048000,
          hash: 'def456',
          storageUrl: 'https://example.com/doc2.jpg',
        },
        documentStatus: 'TEMPORARY',
        receptionDate: new Date('2024-01-16'),
      },
    ],
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    },
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

    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
  });

  it('calls onUploadClick when upload button is clicked', async () => {
    const onUploadClick = vi.fn();
    const user = userEvent.setup();

    render(<DocumentList onUploadClick={onUploadClick} />);

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
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
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      refetch: vi.fn(),
    });

    render(<DocumentList />);

    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
  });

  it('displays loading state', async () => {
    const { useDocuments } = await import('../hooks');
    vi.mocked(useDocuments).mockReturnValue({
      documents: [],
      isLoading: true,
      error: null,
      pagination: null,
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
      error: 'Failed to load documents',
      pagination: null,
      refetch: vi.fn(),
    });

    render(<DocumentList />);

    expect(screen.getByText(/failed to load documents/i)).toBeInTheDocument();
  });
});

