/**
 * RespondRequestDialog Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RespondRequestDialog } from '../RespondRequestDialog';
import { useRespondToRequest } from '../../hooks';
import { requestService } from '../../infrastructure';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useRespondToRequest: vi.fn(),
}));

// Mock the requestService
vi.mock('../../infrastructure', () => ({
  requestService: {
    getRequest: vi.fn(),
  },
}));

describe('RespondRequestDialog', () => {
  const mockRespondToRequest = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockRequest = {
    requestId: 'req-123',
    requestingEntity: {
      entityId: 'entity-1',
      businessName: 'Test University',
      email: 'test@university.edu',
    },
    purpose: 'Enrollment verification',
    requestDate: '2024-01-15T10:00:00Z',
    status: 'PENDING',
    requiredDocuments: [
      {
        id: 'req-doc-1',
        documentType: 'ID Card',
        mandatory: true,
        specifications: 'Valid government-issued ID',
      },
      {
        id: 'req-doc-2',
        documentType: 'Diploma',
        mandatory: true,
        specifications: 'Bachelor degree or higher',
      },
      {
        id: 'req-doc-3',
        documentType: 'Photo',
        mandatory: false,
        specifications: 'Recent passport photo',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (useRespondToRequest as any).mockReturnValue({
      respondToRequest: mockRespondToRequest,
      isLoading: false,
      error: null,
      success: false,
    });

    (requestService.getRequest as any).mockResolvedValue({
      success: true,
      data: mockRequest,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Dialog visibility', () => {
    it('should not render when open is false', () => {
      render(
        <RespondRequestDialog open={false} requestId="req-123" onClose={mockOnClose} />
      );

      expect(screen.queryByText('Respond to Document Request')).not.toBeInTheDocument();
    });

    it('should render when open is true', async () => {
      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText('Respond to Document Request')).toBeInTheDocument();
      });
    });
  });

  describe('Request loading', () => {
    it('should display loading spinner while fetching request', () => {
      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should fetch request when dialog opens', async () => {
      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(requestService.getRequest).toHaveBeenCalledWith('req-123');
      });
    });

    it('should not render content until request is loaded', () => {
      (requestService.getRequest as any).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      expect(screen.queryByText(mockRequest.requestingEntity.businessName)).not.toBeInTheDocument();
    });
  });

  describe('Request display', () => {
    beforeEach(async () => {
      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      });
    });

    it('should display requesting entity information', () => {
      expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      expect(screen.getByText(mockRequest.purpose)).toBeInTheDocument();
    });

    it('should display action selector', () => {
      expect(screen.getByLabelText(/^action$/i)).toBeInTheDocument();
    });

    it('should default to AUTHORIZE action', () => {
      // Material-UI Select displays the selected value as text
      expect(screen.getByText('Authorize - Send Documents')).toBeInTheDocument();
    });

    it('should display all required documents', () => {
      expect(screen.getByText('ID Card')).toBeInTheDocument();
      expect(screen.getByText('Diploma')).toBeInTheDocument();
      expect(screen.getByText('Photo')).toBeInTheDocument();
    });

    it('should mark mandatory documents with asterisk', () => {
      const idCardElement = screen.getByText('ID Card').closest('div');
      expect(idCardElement?.innerHTML).toContain('*');
    });
  });

  describe('Authorize action', () => {
    beforeEach(async () => {
      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      });
    });

    it('should display document selection fields when AUTHORIZE is selected', () => {
      expect(screen.getByText('Select Documents to Send:')).toBeInTheDocument();
      expect(screen.getByText(/need to select documents for all mandatory requirements/i)).toBeInTheDocument();
    });

    it('should disable submit button when mandatory documents are not selected', () => {
      const submitButton = screen.getByRole('button', { name: /authorize & send/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all mandatory documents are selected', async () => {
      const user = userEvent.setup();

      // Get all document selectors
      const selectors = screen.getAllByLabelText('Select Document');

      // Select documents for mandatory requirements (first two)
      await user.click(selectors[0]);
      await user.click(screen.getByRole('option', { name: /document 001/i }));

      await user.click(selectors[1]);
      await user.click(screen.getByRole('option', { name: /document 002/i }));

      const submitButton = screen.getByRole('button', { name: /authorize & send/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should call respondToRequest with correct data when authorized', async () => {
      const user = userEvent.setup();
      mockRespondToRequest.mockResolvedValue(undefined);

      // Select mandatory documents
      const selectors = screen.getAllByLabelText('Select Document');

      await user.click(selectors[0]);
      await user.click(screen.getByRole('option', { name: /document 001/i }));

      await user.click(selectors[1]);
      await user.click(screen.getByRole('option', { name: /document 002/i }));

      // Submit
      const submitButton = screen.getByRole('button', { name: /authorize & send/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRespondToRequest).toHaveBeenCalledWith({
          requestId: 'req-123',
          action: 'AUTHORIZE',
          sentDocuments: expect.arrayContaining([
            { requiredDocumentId: 'req-doc-1', documentId: 'doc-001' },
            { requiredDocumentId: 'req-doc-2', documentId: 'doc-002' },
          ]),
          rejectionReason: undefined,
        });
      });
    });

    it('should include optional documents if selected', async () => {
      const user = userEvent.setup();
      mockRespondToRequest.mockResolvedValue(undefined);

      // Select all documents (including optional)
      const selectors = screen.getAllByLabelText('Select Document');

      await user.click(selectors[0]);
      await user.click(screen.getByRole('option', { name: /document 001/i }));

      await user.click(selectors[1]);
      await user.click(screen.getByRole('option', { name: /document 002/i }));

      await user.click(selectors[2]);
      await user.click(screen.getByRole('option', { name: /document 003/i }));

      // Submit
      const submitButton = screen.getByRole('button', { name: /authorize & send/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRespondToRequest).toHaveBeenCalledWith({
          requestId: 'req-123',
          action: 'AUTHORIZE',
          sentDocuments: expect.arrayContaining([
            { requiredDocumentId: 'req-doc-1', documentId: 'doc-001' },
            { requiredDocumentId: 'req-doc-2', documentId: 'doc-002' },
            { requiredDocumentId: 'req-doc-3', documentId: 'doc-003' },
          ]),
          rejectionReason: undefined,
        });
      });
    });
  });

  describe('Reject action', () => {
    beforeEach(async () => {
      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      });
    });

    it('should display rejection reason field when REJECT is selected', async () => {
      const user = userEvent.setup();

      const actionSelect = screen.getByLabelText(/^action$/i);
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /reject - decline request/i }));

      expect(screen.getByLabelText(/rejection reason/i)).toBeInTheDocument();
      expect(screen.getByText(/provide a reason for rejecting/i)).toBeInTheDocument();
    });

    it('should disable submit button when rejection reason is empty', async () => {
      const user = userEvent.setup();

      const actionSelect = screen.getByLabelText(/^action$/i);
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /reject - decline request/i }));

      const submitButton = screen.getByRole('button', { name: /reject request/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when rejection reason is provided', async () => {
      const user = userEvent.setup();

      const actionSelect = screen.getByLabelText(/^action$/i);
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /reject - decline request/i }));

      const reasonField = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonField, 'I do not have the requested documents');

      const submitButton = screen.getByRole('button', { name: /reject request/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should call respondToRequest with rejection data', async () => {
      const user = userEvent.setup();
      mockRespondToRequest.mockResolvedValue(undefined);

      const actionSelect = screen.getByLabelText(/^action$/i);
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /reject - decline request/i }));

      const reasonField = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonField, 'I do not have the requested documents');

      const submitButton = screen.getByRole('button', { name: /reject request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRespondToRequest).toHaveBeenCalledWith({
          requestId: 'req-123',
          action: 'REJECT',
          sentDocuments: undefined,
          rejectionReason: 'I do not have the requested documents',
        });
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      (useRespondToRequest as any).mockReturnValue({
        respondToRequest: mockRespondToRequest,
        isLoading: false,
        error: 'Failed to respond to request',
        success: false,
      });

      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      });
    });

    it('should display error message when error exists', () => {
      const alerts = screen.getAllByRole('alert');
      const errorAlert = alerts.find(alert =>
        alert.textContent?.includes('Failed to respond to request')
      );
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent('Failed to respond to request');
    });
  });

  describe('Success handling', () => {
    it('should display success message when request is successful', async () => {
      (useRespondToRequest as any).mockReturnValue({
        respondToRequest: mockRespondToRequest,
        isLoading: false,
        error: null,
        success: true,
      });

      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      // Wait for the request to load first
      await waitFor(() => {
        expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      });

      // Then check for success message
      await waitFor(() => {
        expect(screen.getByText(/authorized successfully/i)).toBeInTheDocument();
      });
    });

    it('should call onSuccess and close dialog after delay on success', async () => {
      (useRespondToRequest as any).mockReturnValue({
        respondToRequest: mockRespondToRequest,
        isLoading: false,
        error: null,
        success: true,
      });

      render(
        <RespondRequestDialog
          open={true}
          requestId="req-123"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Wait for the request to load first
      await waitFor(() => {
        expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      });

      // Then check for success message
      await waitFor(() => {
        expect(screen.getByText(/authorized successfully/i)).toBeInTheDocument();
      });

      // Verify callbacks haven't been called yet
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();

      // Wait for the timeout to complete (1500ms)
      await waitFor(
        () => {
          expect(mockOnSuccess).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    beforeEach(async () => {
      (useRespondToRequest as any).mockReturnValue({
        respondToRequest: mockRespondToRequest,
        isLoading: true,
        error: null,
        success: false,
      });

      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      });
    });

    it('should disable buttons during loading', () => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    });

    it('should show loading indicator in submit button', () => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Dialog close', () => {
    beforeEach(async () => {
      render(
        <RespondRequestDialog open={true} requestId="req-123" onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText(mockRequest.requestingEntity.businessName)).toBeInTheDocument();
      });
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should reset form state when dialog closes', async () => {
      const user = userEvent.setup();

      // Change action to REJECT
      const actionSelect = screen.getByLabelText(/^action$/i);
      await user.click(actionSelect);
      await user.click(screen.getByRole('option', { name: /reject - decline request/i }));

      // Type rejection reason
      const reasonField = screen.getByLabelText(/rejection reason/i);
      await user.type(reasonField, 'Some reason');

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

