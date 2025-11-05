/**
 * Notification Service Factory
 */

import { INotificationService } from './INotificationService';
import { NotificationApiService } from './api/NotificationApiService';
import { NotificationMockService } from './mocks/NotificationMockService';
import { isMockAPIEnabled } from '@/shared/utils/env';

function createNotificationService(): INotificationService {
  if (isMockAPIEnabled()) {
    console.log('🔧 Using MOCK Notification Service');
    return new NotificationMockService();
  }
  console.log('🚀 Using REAL Notification Service');
  return new NotificationApiService();
}

export const notificationService: INotificationService = createNotificationService();

export type { INotificationService };
export { NotificationApiService, NotificationMockService };

