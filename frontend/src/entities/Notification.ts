// src/entities/Notification.ts
// Domain Entity following Clean Architecture

// Core notification entity - domain model
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  triggerType: TriggerType;
  metadata?: NotificationMetadata;
  deepLink?: string;
  isRead: boolean;
  status: 'pending' | 'sent' | 'read' | 'dismissed';
  createdAt: string; // ISO string
  priority: NotificationPriority;
}

// Notification types
export type NotificationType = 'education' | 'achievement' | 'market' | 'system';

// Trigger types - Updated based on backend response
export type TriggerType = 
  | 'first_stock' 
  | 'high_volatility' 
  | 'dividend_stock' 
  | 'portfolio_milestone'
  | 'risk_change'
  | 'educational_moment';

// Priority levels
export type NotificationPriority = 'high' | 'medium' | 'low';

// Flexible metadata structure
export interface NotificationMetadata {
  stockSymbol?: string;
  portfolioBeta?: number;
  riskLevel?: string;
  achievementName?: string;
  conceptsCovered?: string[];
  learningContent?: string;
  dividendYield?: number;
  stocksOwned?: number;
  [key: string]: string | number | boolean | string[] | undefined;
}

// API Response type from backend (what we actually receive)
export interface NotificationApiResponse {
  id: string;
  title: string;
  message: string;
  deep_link: string;
  trigger_type: string;
  status: 'pending' | 'sent' | 'read' | 'dismissed';
  createdAt: string;
  sent_at: string | null;
  isRead: boolean;
}

// List response from API - Updated with unread_count from backend
export interface NotificationListApiResponse {
  success: boolean;
  data: NotificationApiResponse[];
  total_count: number;
  unread_count: number;  // 🔔 NEW: From backend campanita fix
  user_id: string;
}

// Domain entity for a list of notifications - Updated with unread_count
export interface NotificationList {
  items: Notification[];
  totalCount: number;
  unreadCount: number;  // 🔔 NEW: From backend campanita fix
  userId: string;
}

// Result type for use cases
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Extended result type for notification updates (includes unread count)
export interface NotificationUpdateResult<T> extends Result<T> {
  unreadCount?: number;  // 🔔 NEW: For campanita updates
}

// Custom error class
  
  // Domain Exceptions
  export class NotificationError extends Error {
    constructor(
      message: string,
      public readonly code?: string,
      public readonly cause?: Error
    ) {
      super(message);
      this.name = 'NotificationError';
    }
  }
  
  export class NotificationValidationError extends NotificationError {
    constructor(field: string, value: unknown) {
      super(`Invalid ${field}: ${value}`, 'VALIDATION_ERROR');
      this.name = 'NotificationValidationError';
    }
  }
  
  export class NotificationNotFoundError extends NotificationError {
    constructor(id: string) {
      super(`Notification not found: ${id}`, 'NOT_FOUND');
      this.name = 'NotificationNotFoundError';
    }
  }
  
// Entity transformation class
export class NotificationEntity {
  static fromApiResponse(apiResponse: NotificationApiResponse): Notification {
    return {
      id: apiResponse.id,
      userId: this.extractUserIdFromDeepLink(apiResponse.deep_link), // Extract from deep_link or default
      type: this.mapToNotificationType(apiResponse.trigger_type),
      title: apiResponse.title,
      message: apiResponse.message,
      triggerType: this.mapToTriggerType(apiResponse.trigger_type),
      metadata: this.extractMetadata(apiResponse),
      deepLink: apiResponse.deep_link,
      isRead: apiResponse.isRead,  // 🔧 FIXED: Use isRead field directly from API response
      status: apiResponse.status,
      createdAt: apiResponse.createdAt,  // 🔧 FIXED: Use camelCase createdAt from backend
      priority: this.determinePriority(apiResponse.trigger_type)
    };
  }

  private static extractUserIdFromDeepLink(_deepLink: string): string {
    console.log(_deepLink);
    //_deepLink: string
    //TODO Validar que deberia hacer
    // For now, default to 'demo' - in real app, this would come from auth context
    return 'demo';
  }

  private static mapToNotificationType(triggerType: string): NotificationType {
    switch (triggerType) {
      case 'first_stock':
      case 'high_volatility':
      case 'educational_moment':
        return 'education';
      case 'portfolio_milestone':
        return 'achievement';
      case 'dividend_stock':
        return 'market';
      case 'risk_change':
        return 'system';
      default:
        return 'system';
    }
  }

  private static mapToTriggerType(triggerType: string): TriggerType {
    // Validate and map trigger types
    const validTriggers: TriggerType[] = [
      'first_stock', 
      'high_volatility', 
      'dividend_stock', 
      'portfolio_milestone',
      'risk_change',
      'educational_moment'
    ];
    
    if (validTriggers.includes(triggerType as TriggerType)) {
      return triggerType as TriggerType;
    }
    
    // Default fallback
    return 'educational_moment';
  }

  private static extractMetadata(apiResponse: NotificationApiResponse): NotificationMetadata {
    const metadata: NotificationMetadata = {};
    
    // Extract metadata from the message or deep_link
    if (apiResponse.deep_link) {
      // Parse query params from deep_link if any
      const url = new URL(apiResponse.deep_link, 'http://example.com');
      const params = new URLSearchParams(url.search);
      
      if (params.get('level')) {
        metadata.riskLevel = params.get('level') || undefined;
      }
    }
    
    // Extract from trigger_type
    if (apiResponse.trigger_type === 'risk_change') {
      // Parse risk level from title if present
      const riskMatch = apiResponse.title.match(/Portfolio Risk: (\w+)/);
      if (riskMatch) {
        metadata.riskLevel = riskMatch[1];
      }
    }
    
    return metadata;
  }

  private static determinePriority(triggerType: string): NotificationPriority {
    switch (triggerType) {
      case 'first_stock':
      case 'risk_change':
        return 'high';
      case 'high_volatility':
      case 'educational_moment':
      case 'portfolio_milestone':
        return 'medium';
      case 'dividend_stock':
      default:
        return 'low';
    }
  }

  static canBeDismissed(notification: Notification): boolean {
    // Business logic: notifications can be dismissed unless they are system critical
    return notification.status !== 'dismissed' && notification.priority !== 'high';
  }

  static isUrgent(notification: Notification): boolean {
    return notification.priority === 'high' && notification.status === 'pending';
  }
}

// List entity transformation
export class NotificationListEntity {
  static fromApiResponse(apiResponse: NotificationListApiResponse): Result<NotificationList> {
    try {
      const notifications = apiResponse.data.map(item => 
        NotificationEntity.fromApiResponse(item)
      );
      
      return {
        success: true,
        data: {
          items: notifications,
          totalCount: apiResponse.total_count,
          unreadCount: apiResponse.unread_count,  // 🔔 NEW: Use backend count
          userId: apiResponse.user_id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transform notifications',
        code: 'TRANSFORMATION_ERROR'
      };
    }
  }
}