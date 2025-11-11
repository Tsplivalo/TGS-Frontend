export enum NotificationType {
  USER_VERIFICATION_APPROVED = 'USER_VERIFICATION_APPROVED',
  USER_VERIFICATION_REJECTED = 'USER_VERIFICATION_REJECTED',
  ROLE_REQUEST_APPROVED = 'ROLE_REQUEST_APPROVED',
  ROLE_REQUEST_REJECTED = 'ROLE_REQUEST_REJECTED',
  SYSTEM = 'SYSTEM',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'role-request' | 'user-verification' | 'system';
  metadata?: Record<string, any>; // Datos adicionales si se necesitan
}

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: 'role-request' | 'user-verification' | 'system';
  metadata?: Record<string, any>;
}

export interface NotificationSearchParams {
  status?: NotificationStatus;
  type?: NotificationType;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedNotifications {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}
