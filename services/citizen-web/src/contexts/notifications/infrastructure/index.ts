/**
 * Notification Service Factory
 *
 * Crea el servicio de notificaciones apropiado basado en la configuración de mocks.
 * Soporta configuración granular por contexto.
 */

import type { INotificationService } from './INotificationService';
import { NotificationApiService } from './api/NotificationApiService';
import { NotificationMockService } from './mocks/NotificationMockService';
import { shouldUseMock } from '@/shared/config/mockConfig';

function createNotificationService(): INotificationService {
  if (shouldUseMock('NOTIFICATIONS')) {
    console.log('🔧 [Notifications] Using MOCK Service');
    return new NotificationMockService();
  }
  console.log('🚀 [Notifications] Using REAL API Service');
  return new NotificationApiService();
}

export const notificationService: INotificationService = createNotificationService();

export type { INotificationService };
export { NotificationApiService, NotificationMockService };

