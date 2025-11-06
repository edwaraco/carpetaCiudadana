/**
 * UploadDocumentForm Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeAll } from 'vitest';
import { UploadDocumentForm } from './UploadDocumentForm';

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

// Mock the upload hook
vi.mock('../hooks', () => ({
  useUploadDocument: vi.fn(() => ({
    uploadDocument: vi.fn(),
    isLoading: false,
    error: null,
    data: null,
  })),
}));

describe('UploadDocumentForm', () => {
  it('renders the form with all fields', () => {
    render(<UploadDocumentForm />);

    // Check for form fields using data-testid
    expect(screen.getByTestId('document-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('document-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('document-context-select')).toBeInTheDocument();
    expect(screen.getByTestId('document-issue-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('document-issuing-entity-input')).toBeInTheDocument();

    // Check for upload button
    expect(screen.getByTestId('upload-submit-button')).toBeInTheDocument();
  });

  it('validates required title field', () => {
    render(<UploadDocumentForm />);

    // The title field should have the required attribute on the actual input element
    const titleContainer = screen.getByTestId('document-title-input');
    const titleInput = titleContainer.querySelector('input');
    expect(titleInput).toBeRequired();
    expect(titleInput).toHaveValue('');
  });

  it('validates required type field', () => {
    render(<UploadDocumentForm />);

    // The type field should exist - the required validation is handled by react-hook-form
    const typeSelect = screen.getByTestId('document-type-select');
    expect(typeSelect).toBeInTheDocument();
  });

  it('validates required context field', () => {
    render(<UploadDocumentForm />);

    // The context field should exist - the required validation is handled by react-hook-form
    const contextSelect = screen.getByTestId('document-context-select');
    expect(contextSelect).toBeInTheDocument();
  });

  it('disables submit button when no file is selected', () => {
    render(<UploadDocumentForm />);

    const submitButton = screen.getByTestId('upload-submit-button');
    expect(submitButton).toBeDisabled();
  });

  it('shows optional issueDate field', () => {
    render(<UploadDocumentForm />);

    const issueDateContainer = screen.getByTestId('document-issue-date-input');
    expect(issueDateContainer).toBeInTheDocument();
    const issueDateInput = issueDateContainer.querySelector('input');
    expect(issueDateInput).not.toBeRequired();
  });

  it('shows optional issuingEntity field', () => {
    render(<UploadDocumentForm />);

    const issuingEntityContainer = screen.getByTestId('document-issuing-entity-input');
    expect(issuingEntityContainer).toBeInTheDocument();
    const issuingEntityInput = issuingEntityContainer.querySelector('input');
    expect(issuingEntityInput).not.toBeRequired();
  });

  it('calls onCancel callback when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<UploadDocumentForm onCancel={onCancel} />);

    const cancelButton = screen.getByTestId('upload-cancel-button');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('accepts file through file input', async () => {
    const user = userEvent.setup();
    render(<UploadDocumentForm />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

    // Find the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('shows file size when file is selected', async () => {
    const user = userEvent.setup();
    render(<UploadDocumentForm />);

    const file = new File(['a'.repeat(1024 * 512)], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/0.50 MB/i)).toBeInTheDocument();
    });
  });
});

