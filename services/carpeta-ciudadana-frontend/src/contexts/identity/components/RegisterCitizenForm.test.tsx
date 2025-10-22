/**
 * RegisterCitizenForm Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RegisterCitizenForm } from './RegisterCitizenForm';

describe('RegisterCitizenForm', () => {
  it('renders the form with all fields', () => {
    render(<RegisterCitizenForm />);

    expect(screen.getByLabelText(/cedula/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/personal email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<RegisterCitizenForm />);

    const submitButton = screen.getByRole('button', { name: /register/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cedula is required/i)).toBeInTheDocument();
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/address is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<RegisterCitizenForm />);

    const emailInput = screen.getByLabelText(/personal email/i);
    await user.type(emailInput, 'invalid-email');

    // Submit to trigger validation
    const submitButton = screen.getByRole('button', { name: /register/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates email confirmation', async () => {
    const user = userEvent.setup();
    render(<RegisterCitizenForm />);

    const emailInput = screen.getByLabelText(/personal email/i);
    const confirmEmailInput = screen.getByLabelText(/confirm email/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(confirmEmailInput, 'different@example.com');

    // Submit to trigger validation
    const submitButton = screen.getByRole('button', { name: /register/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/emails do not match/i)).toBeInTheDocument();
    });
  });

  it('validates cedula format', async () => {
    const user = userEvent.setup();
    render(<RegisterCitizenForm />);

    const cedulaInput = screen.getByLabelText(/cedula/i);
    await user.type(cedulaInput, '123');

    // Submit to trigger validation
    const submitButton = screen.getByRole('button', { name: /register/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cedula must be 6-10 digits/i)).toBeInTheDocument();
    });
  });

  it('calls onSuccess when registration succeeds', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<RegisterCitizenForm onSuccess={onSuccess} />);

    // Fill form with valid data
    await user.type(screen.getByLabelText(/cedula/i), '9876543210');
    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/address/i), 'Test Address 123');
    await user.type(screen.getByLabelText(/personal email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/confirm email/i), 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /register/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<RegisterCitizenForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});

