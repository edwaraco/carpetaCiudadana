/**
 * DocumentList Component Tests
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentList } from '../DocumentList';
import { useDocuments, useDeleteDocument } from '../../hooks';
import { documentService } from '../../infrastructure';
import { Document } from '../../domain/types';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useDocuments: vi.fn(),
  useDeleteDocument: vi.fn(),
}));

// Mock the documentService
vi.mock('../../infrastructure', () => ({
  documentService: {
    downloadDocument: vi.fn(),
  },
}));

interface DocumentCardProps {
  document: Document;
  onView?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
}

// Mock DocumentCard component
vi.mock('../DocumentCard', () => ({
  DocumentCard: ({ document, onView, onDownload, onDelete }: DocumentCardProps) => (
    <div data-testid={`document-card-${document.documentId}`}>
      <span>{document.metadata.title}</span>
      <button onClick={() => onView?.(document.documentId)}>View</button>
      <button onClick={() => onDownload?.(document.documentId)}>Download</button>
      <button onClick={() => onDelete?.(document.documentId)}>Delete</button>
    </div>
  ),
}));

describe('DocumentList', () => {
  const mockRefetch = vi.fn();
  const mockDeleteDocument = vi.fn();

  const mockDocuments = [
    {
      documentId: '1',
      metadata: {title: 'Cedula.pdf'},
      documentType: 'CERTIFICADO',
      issueDate: '2024-01-15',
      issuingEntity: 'Registraduría',
      storageLocation: 'https://storage.example.com/doc1.pdf',
    },
    {
      documentId: '2',
      metadata: {title: 'Diploma.pdf'},
      documentType: 'CERTIFICADO',
      issueDate: '2023-12-20',
      issuingEntity: 'Universidad Nacional',
      storageLocation: 'https://storage.example.com/doc2.pdf',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

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
        error: null,
        pagination: null,
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
        error: errorMessage,
        pagination: null,
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
        error: null,
        pagination: null,
        refetch: mockRefetch,
      });
    });

    it('should display empty state when no documents exist', () => {
      render(<DocumentList />);

      expect(screen.getByText('No documents yet')).toBeInTheDocument();
      expect(screen.getByText('Upload your first document to get started')).toBeInTheDocument();
    });

    it('should show upload button in empty state when onUploadClick is provided', () => {
      const mockOnUploadClick = vi.fn();
      render(<DocumentList onUploadClick={mockOnUploadClick} />);

      const uploadButtons = screen.getAllByText('Upload Document');
      expect(uploadButtons.length).toBeGreaterThan(0);
    });

    it('should not show upload button when onUploadClick is not provided', () => {
      render(<DocumentList />);

      expect(screen.queryByText('Upload Document')).not.toBeInTheDocument();
    });
  });

  describe('Document list display', () => {
    beforeEach(() => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: 2 },
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

      const uploadButton = screen.getAllByText('Upload Document')[0];
      expect(uploadButton).toBeInTheDocument();
    });

    it('should call onUploadClick when upload button is clicked', async () => {
      const mockOnUploadClick = vi.fn();
      const user = userEvent.setup();

      render(<DocumentList onUploadClick={mockOnUploadClick} />);

      const uploadButton = screen.getAllByText('Upload Document')[0];
      await user.click(uploadButton);

      expect(mockOnUploadClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pagination', () => {
    it('should display pagination when there are multiple pages', () => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 3, pageSize: 10, totalItems: 25 },
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      // MUI Pagination renders buttons for each page
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should not display pagination when there is only one page', () => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: 2 },
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should call refetch with new page when pagination is changed', async () => {
      const user = userEvent.setup();

      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 3, pageSize: 10, totalItems: 25 },
        refetch: mockRefetch,
      });

      render(<DocumentList />);

      // Click on page 2 button
      const page2Button = screen.getByRole('button', { name: /go to page 2/i });
      await user.click(page2Button);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('Document actions', () => {
    beforeEach(() => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: 2 },
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

    it('should handle download action', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });

      (documentService.downloadDocument as unknown as Mock).mockResolvedValue({
        success: true,
        data: mockBlob,
      });

      // Mock URL.createObjectURL and other DOM methods
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      render(<DocumentList />);

      const downloadButton = screen.getAllByText('Download')[0];
      await user.click(downloadButton);

      await waitFor(() => {
        expect(documentService.downloadDocument).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Delete confirmation dialog', () => {
    beforeEach(() => {
      (useDocuments as unknown as Mock).mockReturnValue({
        documents: mockDocuments,
        isLoading: false,
        error: null,
        pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: 2 },
        refetch: mockRefetch,
      });
    });

    it('should open delete dialog when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(<DocumentList />);

      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);

      expect(screen.getByText('Delete Document')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this document/i)).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<DocumentList />);

      // Open dialog
      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Document')).not.toBeInTheDocument();
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
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteDocument).toHaveBeenCalledWith('1');
        expect(mockRefetch).toHaveBeenCalledWith(1);
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

      // Check if buttons are disabled
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    });
  });
});

