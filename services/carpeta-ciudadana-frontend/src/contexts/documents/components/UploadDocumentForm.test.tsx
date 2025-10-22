/**
 * UploadDocumentForm Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UploadDocumentForm } from './UploadDocumentForm';

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

    // Check for form fields
    expect(screen.getByLabelText(/document title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/document type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/context/i)).toBeInTheDocument();

    // Check for upload button specifically
    expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
  });

  it('validates required title field', async () => {
    const user = userEvent.setup();
    render(<UploadDocumentForm />);

    // The title field should have the required attribute
    const titleInput = screen.getByLabelText(/document title/i);
    expect(titleInput).toBeRequired();
    expect(titleInput).toHaveValue('');
  });

  it('disables submit button when no file is selected', () => {
    render(<UploadDocumentForm />);

    const submitButton = screen.getByRole('button', { name: /upload document/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows drag and drop area', () => {
    render(<UploadDocumentForm />);

    expect(screen.getByText(/drag and drop your document here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  it('shows issuing entity field when certified checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<UploadDocumentForm />);

    // Initially, issuing entity should not be visible
    expect(screen.queryByLabelText(/issuing entity/i)).not.toBeInTheDocument();

    // Check the certified checkbox
    const certifiedCheckbox = screen.getByRole('checkbox', {
      name: /this is a certified document/i,
    });
    await user.click(certifiedCheckbox);

    // Now issuing entity field should be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/issuing entity/i)).toBeInTheDocument();
    });
  });

  it('calls onCancel callback when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<UploadDocumentForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
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

