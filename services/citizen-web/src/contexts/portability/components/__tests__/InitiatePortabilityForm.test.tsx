/**
 * InitiatePortabilityForm Component Tests
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InitiatePortabilityForm } from '../InitiatePortabilityForm';
import { useInitiatePortability } from '../../hooks';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useInitiatePortability: vi.fn(),
}));

// Mock OperatorSelector component
vi.mock('../OperatorSelector', () => ({
  OperatorSelector: ({ onSelectOperator, selectedOperatorId }: { onSelectOperator: (id: string) => void; selectedOperatorId?: string }) => (
    <div data-testid="operator-selector">
      <select
        data-testid="operator-select"
        value={selectedOperatorId}
        onChange={(e) => onSelectOperator(e.target.value)}
      >
        <option value="">Select an operator</option>
        <option value="operator-1">Operator 1</option>
        <option value="operator-2">Operator 2</option>
      </select>
    </div>
  ),
}));

describe('InitiatePortabilityForm', () => {
  const mockInitiatePortability = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    (useInitiatePortability as unknown as Mock).mockReturnValue({
      initiatePortability: mockInitiatePortability,
      isLoading: false,
      error: null,
      data: null,
    });
  });

  describe('Initial render', () => {
    it('should render form with title and description', () => {
      render(<InitiatePortabilityForm />);

      expect(screen.getByText('Initiate Operator Portability')).toBeInTheDocument();
      expect(screen.getByText(/Transfer your documents to a different operator/i)).toBeInTheDocument();
    });

    it('should render important information warning', () => {
      render(<InitiatePortabilityForm />);

      expect(screen.getByText('Important Information:')).toBeInTheDocument();
      expect(screen.getByText(/Your folder will be temporarily unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/You cannot cancel once the transfer begins/i)).toBeInTheDocument();
    });

    it('should render OperatorSelector component', () => {
      render(<InitiatePortabilityForm />);

      expect(screen.getByTestId('operator-selector')).toBeInTheDocument();
    });

    it('should render initiate button disabled when no operator is selected', () => {
      render(<InitiatePortabilityForm />);

      const initiateButton = screen.getByRole('button', { name: /initiate portability/i });
      expect(initiateButton).toBeDisabled();
    });

    it('should render cancel button when onCancel is provided', () => {
      render(<InitiatePortabilityForm onCancel={mockOnCancel} />);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });

    it('should not render cancel button when onCancel is not provided', () => {
      render(<InitiatePortabilityForm />);

      const cancelButtons = screen.queryAllByRole('button', { name: /^cancel$/i });
      expect(cancelButtons).toHaveLength(0);
    });
  });

  describe('Error state', () => {
    it('should display error message when error exists', () => {
      const errorMessage = 'Failed to initiate portability';
      (useInitiatePortability as unknown as Mock).mockReturnValue({
        initiatePortability: mockInitiatePortability,
        isLoading: false,
        error: errorMessage,
        data: null,
      });

      render(<InitiatePortabilityForm />);

      // Find the specific error alert among multiple alerts
      const alerts = screen.getAllByRole('alert');
      const errorAlert = alerts.find(alert =>
        alert.textContent?.includes(errorMessage)
      );
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(errorMessage);
    });
  });

  describe('Operator selection', () => {
    it('should enable initiate button when operator is selected', async () => {
      const user = userEvent.setup();

      render(<InitiatePortabilityForm />);

      const operatorSelect = screen.getByTestId('operator-select');
      await user.selectOptions(operatorSelect, 'operator-1');

      const initiateButton = screen.getByRole('button', { name: /initiate portability/i });
      expect(initiateButton).not.toBeDisabled();
    });

    it('should open confirmation dialog when initiate button is clicked', async () => {
      const user = userEvent.setup();

      render(<InitiatePortabilityForm />);

      // Select operator
      const operatorSelect = screen.getByTestId('operator-select');
      await user.selectOptions(operatorSelect, 'operator-1');

      // Click initiate
      const initiateButton = screen.getByRole('button', { name: /initiate portability/i });
      await user.click(initiateButton);

      // Check dialog is open
      expect(screen.getByText('Confirm Operator Portability')).toBeInTheDocument();
      expect(screen.getByText(/cannot be reversed once started/i)).toBeInTheDocument();
    });
  });

  describe('Confirmation dialog', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<InitiatePortabilityForm />);

      // Select operator and open dialog
      const operatorSelect = screen.getByTestId('operator-select');
      await user.selectOptions(operatorSelect, 'operator-1');

      const initiateButton = screen.getByRole('button', { name: /initiate portability/i });
      await user.click(initiateButton);
    });

    it('should render confirmation dialog with key points', () => {
      expect(screen.getByText('Confirm Operator Portability')).toBeInTheDocument();
      expect(screen.getByText(/Key Points:/i)).toBeInTheDocument();
      expect(screen.getByText(/temporarily inaccessible/i)).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it('should render terms acceptance checkbox', () => {
      const checkbox = screen.getByRole('checkbox', { name: /I understand and accept these terms/i });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should disable confirm button when terms are not accepted', () => {
      const confirmButton = screen.getByRole('button', { name: /confirm & start/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when terms are accepted', async () => {
      const user = userEvent.setup();

      const checkbox = screen.getByRole('checkbox', { name: /I understand and accept these terms/i });
      await user.click(checkbox);

      const confirmButton = screen.getByRole('button', { name: /confirm & start/i });
      expect(confirmButton).not.toBeDisabled();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Operator Portability')).not.toBeInTheDocument();
      });
    });

    it('should reset terms acceptance when dialog is closed', async () => {
      const user = userEvent.setup();

      // Accept terms
      const checkbox = screen.getByRole('checkbox', { name: /I understand and accept these terms/i });
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      // Cancel dialog
      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByText('Confirm Operator Portability')).not.toBeInTheDocument();
      });

      // Reopen dialog - operator is already selected from beforeEach, just click the button
      const initiateButton = screen.getByRole('button', { name: /initiate portability/i });
      await user.click(initiateButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Confirm Operator Portability')).toBeInTheDocument();
      });

      // Check terms are not accepted
      const newCheckbox = screen.getByRole('checkbox', { name: /I understand and accept these terms/i });
      expect(newCheckbox).not.toBeChecked();
    });
  });

  describe('Portability initiation', () => {
    it('should call initiatePortability when confirmed', async () => {
      const user = userEvent.setup();
      mockInitiatePortability.mockResolvedValue(undefined);

      render(<InitiatePortabilityForm />);

      // Select operator
      const operatorSelect = screen.getByTestId('operator-select');
      await user.selectOptions(operatorSelect, 'operator-1');

      // Open dialog
      const initiateButton = screen.getByRole('button', { name: /initiate portability/i });
      await user.click(initiateButton);

      // Accept terms
      const checkbox = screen.getByRole('checkbox', { name: /I understand and accept these terms/i });
      await user.click(checkbox);

      // Confirm
      const confirmButton = screen.getByRole('button', { name: /confirm & start/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockInitiatePortability).toHaveBeenCalledWith({
          destinationOperatorId: 'operator-1',
          confirmation: true,
        });
      });
    });

    it('should close dialog after successful initiation', async () => {
      const user = userEvent.setup();
      mockInitiatePortability.mockResolvedValue(undefined);

      render(<InitiatePortabilityForm />);

      // Select operator
      const operatorSelect = screen.getByTestId('operator-select');
      await user.selectOptions(operatorSelect, 'operator-1');

      // Open dialog
      const initiateButton = screen.getByRole('button', { name: /initiate portability/i });
      await user.click(initiateButton);

      // Accept terms
      const checkbox = screen.getByRole('checkbox', { name: /I understand and accept these terms/i });
      await user.click(checkbox);

      // Confirm
      const confirmButton = screen.getByRole('button', { name: /confirm & start/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Operator Portability')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during initiation', async () => {
      const user = userEvent.setup();

      // First render in normal state
      const { rerender } = render(<InitiatePortabilityForm />);

      // Select operator
      const operatorSelect = screen.getByTestId('operator-select');
      await user.selectOptions(operatorSelect, 'operator-1');

      // Open the confirmation dialog
      const initiateButton = screen.getByRole('button', { name: /initiate portability/i });
      await user.click(initiateButton);

      // Accept terms
      const checkbox = screen.getByRole('checkbox', { name: /I understand and accept these terms/i });
      await user.click(checkbox);

      // Now simulate loading state
      (useInitiatePortability as unknown as Mock).mockReturnValue({
        initiatePortability: mockInitiatePortability,
        isLoading: true,
        error: null,
        data: null,
      });

      // Force re-render with loading state
      rerender(<InitiatePortabilityForm />);

      // The button should now show "Initiating..." text
      expect(screen.getByText('Initiating...')).toBeInTheDocument();
    });

    it('should disable buttons during loading', async () => {
      const user = userEvent.setup();

      (useInitiatePortability as unknown as Mock).mockReturnValue({
        initiatePortability: mockInitiatePortability,
        isLoading: true,
        error: null,
        data: null,
      });

      render(<InitiatePortabilityForm onCancel={mockOnCancel} />);

      // Select operator
      const operatorSelect = screen.getByTestId('operator-select');
      await user.selectOptions(operatorSelect, 'operator-1');

      // Check buttons are disabled
      expect(screen.getByRole('button', { name: /initiate portability/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
    });
  });

  describe('Success state', () => {
    const mockSuccessData = {
      success: true,
      portabilityId: 'port-123',
      message: 'Portability initiated successfully',
      deadline: '2024-01-16T12:00:00Z',
    };

    beforeEach(() => {
      (useInitiatePortability as unknown as Mock).mockReturnValue({
        initiatePortability: mockInitiatePortability,
        isLoading: false,
        error: null,
        data: mockSuccessData,
      });
    });

    it('should display success message when portability is initiated', () => {
      render(<InitiatePortabilityForm />);

      expect(screen.getByText('Portability Process Initiated!')).toBeInTheDocument();
      expect(screen.getByText(mockSuccessData.message)).toBeInTheDocument();
      expect(screen.getByText(`Process ID: ${mockSuccessData.portabilityId}`)).toBeInTheDocument();
    });

    it('should display deadline in success message', () => {
      render(<InitiatePortabilityForm />);

      const deadlineText = screen.getByText(/Deadline:/i);
      expect(deadlineText).toBeInTheDocument();
    });

    it('should render view progress button', () => {
      render(<InitiatePortabilityForm />);

      expect(screen.getByRole('button', { name: /view progress/i })).toBeInTheDocument();
    });

    it('should call onSuccess when view progress is clicked', async () => {
      const user = userEvent.setup();

      render(<InitiatePortabilityForm onSuccess={mockOnSuccess} />);

      const viewProgressButton = screen.getByRole('button', { name: /view progress/i });
      await user.click(viewProgressButton);

      expect(mockOnSuccess).toHaveBeenCalledWith(mockSuccessData.portabilityId);
    });

    it('should not show form elements in success state', () => {
      render(<InitiatePortabilityForm />);

      expect(screen.queryByText('Initiate Operator Portability')).not.toBeInTheDocument();
      expect(screen.queryByTestId('operator-selector')).not.toBeInTheDocument();
    });
  });

  describe('onCancel callback', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(<InitiatePortabilityForm onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });
});

