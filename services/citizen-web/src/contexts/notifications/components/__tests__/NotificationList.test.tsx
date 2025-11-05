/**
 * NotificationList Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NotificationList } from '../NotificationList';
import { useNotifications, useMarkAsRead } from '../../hooks';

// Mock hooks
vi.mock('../../hooks', () => ({
  useNotifications: vi.fn(),
  useMarkAsRead: vi.fn(),
}));

const mockNotifications = [
  {
    notificationId: 'notif-1',
    recipientId: 'user-123',
    type: 'DOCUMENT_RECEIVED',
    category: 'DOCUMENT',
    title: 'Documento Recibido',
    message: 'Has recibido un nuevo documento',
    isRead: false,
    createdAt: new Date('2025-10-24T10:30:00'),
  },
  {
    notificationId: 'notif-2',
    recipientId: 'user-123',
    type: 'DOCUMENT_REQUESTED',
    category: 'REQUEST',
    title: 'Nueva Solicitud',
    message: 'Tienes una nueva solicitud de documento',
    isRead: true,
    createdAt: new Date('2025-10-23T09:15:00'),
  },
];

describe('NotificationList', () => {
  const mockRefetch = vi.fn();
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
      notifications: mockNotifications,
      isLoading: false,
      error: null,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
      },
      refetch: mockRefetch,
    });

    (useMarkAsRead as ReturnType<typeof vi.fn>).mockReturnValue({
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      isLoading: false,
      error: null,
    });
  });

  it('should render notification list', async () => {
    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
      expect(screen.getByTestId('notification-list-title')).toBeInTheDocument();
    });
  });

  it('should display notification items', async () => {
    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-items-list')).toBeInTheDocument();
      expect(screen.getByTestId('notification-item-notif-1')).toBeInTheDocument();
      expect(screen.getByTestId('notification-item-notif-2')).toBeInTheDocument();
    });
  });

  it('should show "mark all as read" button', async () => {
    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-mark-all-read-button')).toBeInTheDocument();
    });
  });

  it('should show unread only filter toggle', async () => {
    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-filter-unread-toggle')).toBeInTheDocument();
    });
  });

  it('should call markAllAsRead when button is clicked', async () => {
    render(<NotificationList />);

    const markAllButton = await screen.findByTestId('notification-mark-all-read-button');
    fireEvent.click(markAllButton);

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });
  });

  it('should show empty state when no notifications', async () => {
    (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
      notifications: [],
      isLoading: false,
      error: null,
      pagination: null,
      refetch: mockRefetch,
    });

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-empty-state')).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
      notifications: [],
      isLoading: true,
      error: null,
      pagination: null,
      refetch: mockRefetch,
    });

    render(<NotificationList />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
      notifications: [],
      isLoading: false,
      error: 'Error al cargar notificaciones',
      pagination: null,
      refetch: mockRefetch,
    });

    render(<NotificationList />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should show pagination when multiple pages exist', async () => {
    (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
      notifications: mockNotifications,
      isLoading: false,
      error: null,
      pagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 25,
        totalPages: 3,
      },
      refetch: mockRefetch,
    });

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-pagination')).toBeInTheDocument();
    });
  });

  it('should identify unread notifications', async () => {
    render(<NotificationList />);

    await waitFor(() => {
      const unreadItem = screen.getByTestId('notification-item-notif-1');
      const readItem = screen.getByTestId('notification-item-notif-2');

      expect(unreadItem).toHaveAttribute('data-read', 'false');
      expect(readItem).toHaveAttribute('data-read', 'true');
    });
  });
});

