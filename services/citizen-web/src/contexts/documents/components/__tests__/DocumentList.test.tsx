/**
 * DocumentList Component Tests
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentList } from '@/contexts/documents/components/DocumentList';
import { useDocuments, useDeleteDocument } from '@/contexts/documents/hooks';
import type { Document } from '@/contexts/documents/domain/types';

// Mock the hooks
vi.mock('@/contexts/documents/hooks', () => ({
  useDocuments: vi.fn(),
  useDeleteDocument: vi.fn(),
}));

interface DocumentCardProps {
  document: Document;
  onView?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
}

// Mock DocumentCard component
vi.mock('@/contexts/documents/components/DocumentCard', () => ({
  DocumentCard: ({ document, onView, onDelete }: DocumentCardProps) => (
    <div data-testid={`document-card-${document.documentId}`}>
      <span>{document.metadata.title}</span>
      {onView && <button onClick={() => onView(document.documentId)}>View</button>}
      {onDelete && <button onClick={() => onDelete(document.documentId)}>Delete</button>}
    </div>
  ),
}));

// Mock feature flags
vi.mock('@/shared/config/featureFlags', () => ({
  isFeatureEnabled: vi.fn((flag: string) => {
    if (flag === 'DELETE_DOCUMENTS') return true;
    if (flag === 'DOWNLOAD_DOCUMENTS') return true;
    return false;
  }),
}));

describe('DocumentList', () => {
  const mockRefetch = vi.fn();
  const mockLoadMore = vi.fn();
  const mockDeleteDocument = vi.fn();

  // Mock localStorage
  const mockCarpetaId = 'test-carpeta-id-123';

  const mockDocuments: Document[] = [
    {
      documentId: '1',
      metadata: {
        title: 'Cedula.pdf',
        type: 'CEDULA',
        context: 'CIVIL_REGISTRY',
        issueDate: undefined,
        issuingEntity: undefined,
      },
      content: {
        format: 'PDF',
        sizeBytes: 1024000,
        hash: 'abc123',
        storageUrl: 'https://storage.example.com/doc1.pdf',
        presignedUrl: undefined,
      },
      certification: undefined,
      documentStatus: 'AUTENTICADO',
      receptionDate: new Date('2024-01-15'),
    },
    {
      documentId: '2',
      metadata: {
        title: 'Diploma.pdf',
        type: 'DIPLOMA',
        context: 'EDUCATION',
        issueDate: undefined,
        issuingEntity: undefined,
      },
      content: {
        format: 'PDF',
        sizeBytes: 2048000,
        hash: 'def456',
        storageUrl: 'https://storage.example.com/doc2.pdf',
        presignedUrl: undefined,
      },
      certification: undefined,
      documentStatus: 'TEMPORAL',
      receptionDate: new Date('2023-12-20'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    Storage.prototype.getItem = vi.fn((key: string) => {
      if (key === 'carpetaId') return mockCarpetaId;
      return null;
    });
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.removeItem = vi.fn();

    // Default mock implementations
    (useDeleteDocument as unknown as Mock).mockReturnValue({
      deleteDocument: mockDeleteDocument,
      isLoading: false,
    });
  });

  describe('Loading state', () => {
    it('should display loading spinner when data is loading', () => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: [],
        isLoading: true,
        isLoadingMore: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when there is an error', () => {
      const errorMessage = 'Failed to load documents';
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: [],
        isLoading: false,
        isLoadingMore: false,
        error: errorMessage,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });

  describe('Empty state', () => {
    beforeEach(() => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: [],
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });
    });

    it('should display empty state when no documents exist', () => {
      render(<DocumentList />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should show upload button in empty state when onUploadClick is provided', () => {
      const mockOnUploadClick = vi.fn();
      render(<DocumentList onUploadClick={mockOnUploadClick} />);

      expect(screen.getByTestId('upload-document-button-empty')).toBeInTheDocument();
    });

    it('should not show upload button when onUploadClick is not provided', () => {
      render(<DocumentList />);

      expect(screen.queryByTestId('upload-document-button-empty')).not.toBeInTheDocument();
    });
  });

  describe('Document list display', () => {
    beforeEach(() => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });
    });

    it('should render list of documents', () => {
      render(<DocumentList />);

      expect(screen.getByTestId('document-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('document-card-2')).toBeInTheDocument();
      expect(screen.getByText('Cedula.pdf')).toBeInTheDocument();
      expect(screen.getByText('Diploma.pdf')).toBeInTheDocument();
    });

    it('should display upload button in header when onUploadClick is provided', () => {
      const mockOnUploadClick = vi.fn();
      render(<DocumentList onUploadClick={mockOnUploadClick} />);

      expect(screen.getByTestId('upload-document-button')).toBeInTheDocument();
    });

    it('should call onUploadClick when upload button is clicked', async () => {
      const mockOnUploadClick = vi.fn();
      const user = userEvent.setup();

      render(<DocumentList onUploadClick={mockOnUploadClick} />);

      const uploadButton = screen.getByTestId('upload-document-button');
      await user.click(uploadButton);

      expect(mockOnUploadClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cursor-based pagination', () => {
    it('should display load more button when hasMore is true', () => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: true,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
    });

    it('should not display load more button when hasMore is false', () => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
    });

    it('should call loadMore when load more button is clicked', async () => {
      const user = userEvent.setup();

      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: true,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      const loadMoreButton = screen.getByTestId('load-more-button');
      await user.click(loadMoreButton);

      expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should disable load more button when loading more', () => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        isLoadingMore: true,
        error: null,
        hasMore: true,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      const loadMoreButton = screen.getByTestId('load-more-button');
      expect(loadMoreButton).toBeDisabled();
    });
  });

  describe('Document actions', () => {
    beforeEach(() => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });
    });

    it('should call onViewDocument when view button is clicked', async () => {
      const mockOnViewDocument = vi.fn();
      const user = userEvent.setup();

      render(<DocumentList onViewDocument={mockOnViewDocument} />);

      const viewButton = screen.getAllByText('View')[0];
      await user.click(viewButton);

      expect(mockOnViewDocument).toHaveBeenCalledWith('1');
    });
  });

  describe('Delete confirmation dialog', () => {
    beforeEach(() => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: false,
        loadMore: mockLoadMore,
        refetch: mockRefetch,
      });
    });

    it('should open delete dialog when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(<DocumentList />);

      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<DocumentList />);

      // Open dialog
      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);

      // Click cancel
      const cancelButton = screen.getByTestId('delete-cancel-button');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
      });
    });

    it('should delete document and refetch when confirmed', async () => {
      const user = userEvent.setup();
      mockDeleteDocument.mockResolvedValue(undefined);

      render(<DocumentList />);

      // Open dialog
      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);

      // Click delete
      const confirmButton = screen.getByTestId('delete-confirm-button');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteDocument).toHaveBeenCalledWith('1');
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('should disable buttons while deleting', async () => {
      const user = userEvent.setup();

      // Mock deleteDocument to be slow
      mockDeleteDocument.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      (useDeleteDocument as unknown as Mock).mockReturnValue({
        deleteDocument: mockDeleteDocument,
        isLoading: true, // Simulating loading state
      });

      render(<DocumentList />);

      // Open dialog
      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);

      // Check if buttons are disabled using data-testid
      expect(screen.getByTestId('delete-cancel-button')).toBeDisabled();
      expect(screen.getByTestId('delete-confirm-button')).toBeDisabled();
    });
  });
});

