import { create } from 'zustand';
import { FetchNotificationsUseCase } from '@/use-cases/FetchNotifications';
import { FetchMyNotificationsUseCase } from '@/use-cases/FetchMyNotifications';
import { MarkNotificationAsReadUseCase } from '@/use-cases/MarkNotificationAsRead';
import { DismissNotificationUseCase } from '@/use-cases/DismissNotification';
import { MarkAllNotificationsAsReadUseCase } from '@/use-cases/MarkAllNotificationsAsRead';
import { MarkMyNotificationAsReadUseCase } from '@/use-cases/MarkMyNotificationAsRead';
import { DismissMyNotificationUseCase } from '@/use-cases/DismissMyNotification';
import { MarkAllMyNotificationsAsReadUseCase } from '@/use-cases/MarkAllMyNotificationsAsRead';
import { CapitalCraftNotificationAPI } from '@/infrastructure/api/NotificationAPI';
import { ConsoleLogger } from '@/infrastructure/logging/ConsoleLogger';
import { Notification } from '@/entities/Notification';
import { mockNotifications, shouldUseMockData } from '@/lib/mockNotifications';


// Updated interface with authenticated methods
interface NotificationState {
  // State
  notifications: Notification[] | null;
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
  usingMockData: boolean; // Track if we're using mock data
  isAuthenticated: boolean; // Track authentication state
  serverUnreadCount: number | null; // 🔔 NEW: Store backend count separately

  
  // Computed properties - Updated to use backend count  
  getUnreadCount: () => number;  // 🔧 Changed from getter to function
  
  // Actions - Original methods (backward compatibility)
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>; // New bulk action
  
  // Actions - New authenticated methods
  fetchMyNotifications: () => Promise<void>;
  markMyNotificationAsRead: (notificationId: string) => Promise<void>;
  dismissMyNotification: (notificationId: string) => Promise<void>;
  markAllMyNotificationsAsRead: () => Promise<void>;
  
  // Utility actions
  setAuthenticated: (isAuth: boolean) => void;
  clearError: () => void;
}

// Dependencies
const notificationAPI = CapitalCraftNotificationAPI.getInstance();
const logger = new ConsoleLogger();


// Original use cases (backward compatibility)
const fetchNotificationsUseCase = new FetchNotificationsUseCase(notificationAPI, logger);
const markAsReadUseCase = new MarkNotificationAsReadUseCase(notificationAPI, logger);
const dismissNotificationUseCase = new DismissNotificationUseCase(notificationAPI, logger);
const markAllAsReadUseCase = new MarkAllNotificationsAsReadUseCase(notificationAPI);

// New authenticated use cases
const fetchMyNotificationsUseCase = new FetchMyNotificationsUseCase(notificationAPI, logger);
const markMyNotificationAsReadUseCase = new MarkMyNotificationAsReadUseCase(notificationAPI, logger);
const dismissMyNotificationUseCase = new DismissMyNotificationUseCase(notificationAPI, logger);
const markAllMyNotificationsAsReadUseCase = new MarkAllMyNotificationsAsReadUseCase(notificationAPI);

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: null,
  currentUserId: null,
  isLoading: false,
  error: null,
  usingMockData: false,
  isAuthenticated: false,
  serverUnreadCount: null,

  getUnreadCount: () => {
    const state = get();
    const { notifications, serverUnreadCount, usingMockData } = state;
    
    
    // 🔔 FIXED: Use backend count when available (preferred)
    if (serverUnreadCount !== null && !usingMockData) {
      return serverUnreadCount;
    }
    
    // Fallback: Calculate manually for mock data or when backend count is not available
    if (!notifications) return 0;
    const manualCount = notifications.filter(n => !n.isRead).length;
    return manualCount;
  },
  
  // ========================================
  // ORIGINAL METHODS (Backward Compatibility)
  // ========================================
  
  fetchNotifications: async (userId: string) => {
    set({ isLoading: true, error: null, currentUserId: userId });
    
    try {
      const result = await fetchNotificationsUseCase.execute({ userId });
      
      if (result.success) {        
        let notificationItems: Notification[] = [];
        if (result.data?.notifications?.items && Array.isArray(result.data.notifications.items)) {
          notificationItems = result.data.notifications.items;          

          // 🚨 DEBUG: Check for duplicate IDs
          const ids = notificationItems.map(n => n.id);
          const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
          if (duplicateIds.length > 0) {
            console.error('🚨 DUPLICATE IDs DETECTED:', duplicateIds);
          }
        } else {
          console.error('❌ Unexpected API response structure:', result.data);
          notificationItems = [];
        }
        
        set({ 
          notifications: notificationItems, 
          isLoading: false,
          usingMockData: false 
        });
      } else {
        // Check if we should use mock data
        if (shouldUseMockData(result.error)) {
          set({ 
            notifications: mockNotifications, 
            isLoading: false,
            error: null, // Clear error when using mock
            usingMockData: true 
          });
        } else {
          set({ 
            error: result.error, 
            isLoading: false,
            usingMockData: false 
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      set({ 
        notifications: mockNotifications,
        error: null, // Clear error when using mock
        isLoading: false,
        usingMockData: true 
      });
    }
  },
  
  // Mark as read action with optimistic updates
  markAsRead: async (notificationId: string) => {
    
    const { notifications, currentUserId, usingMockData } = get();
    
    // Fix: Use demo as fallback if currentUserId is not set
    const userId = currentUserId || 'demo';
    
    if (!notifications) {
      console.warn('❌ Cannot mark as read: missing notifications');
      return;
    }
    
    // Optimistic update (works for both mock and real data)
    const optimisticNotifications = notifications.map(notification =>
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    );
    
    set({ notifications: optimisticNotifications });
    console.log(`🔄 Optimistically marked notification ${notificationId} as read`);
    
    // If using mock data, don't try to call the API
    if (usingMockData) {
      console.log('📝 Using mock data - mark as read saved locally only');
      return;
    }
    
    try {
      const result = await markAsReadUseCase.execute({ 
        notificationId, 
        userId 
      });
      
      if (result.success) {
        console.log(`✅ Successfully marked notification ${notificationId} as read`);
      } else {
        // Revert optimistic update on failure
        set({ notifications, error: result.error });
        console.error(`❌ Failed to mark notification as read:`, result.error);
      }
    } catch (error) {
      // Revert optimistic update on exception
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ notifications, error: errorMessage });
      console.error(`❌ Exception during markAsRead:`, error);
    }
  },
  
  // Dismiss notification action
  dismiss: async (notificationId: string) => {
    const { notifications, currentUserId, usingMockData } = get();
    if (!notifications || !currentUserId) {
      return;
    }
    
    // Optimistic update - remove from list
    const optimisticNotifications = notifications.filter(notification =>
      notification.id !== notificationId
    );
    
    set({ notifications: optimisticNotifications });
    
    // If using mock data, don't try to call the API
    if (usingMockData) {
      return;
    }
    
    try {
      const result = await dismissNotificationUseCase.execute({ 
        notificationId, 
        userId: currentUserId 
      });
      
      if (result.success) {
        console.log(`✅ Successfully dismissed notification ${notificationId}`);
      } else {
        // Revert optimistic update on failure
        set({ notifications, error: result.error });
        console.error(`❌ Failed to dismiss notification:`, result.error);
      }
    } catch (error) {
      // Revert optimistic update on exception
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ notifications, error: errorMessage });
      console.error(`❌ Exception during dismiss:`, error);
    }
  },
  
  // Mark all as read action with optimistic updates
  markAllAsRead: async (userId: string) => {
    const { notifications, usingMockData } = get();
    if (!notifications) {
      console.warn('❌ Cannot mark all as read: missing notifications');
      return;
    }
    
    // Optimistic update (works for both mock and real data)
    const optimisticNotifications = notifications.map(notification => ({ ...notification, isRead: true }));
    
    set({ notifications: optimisticNotifications });
    
    // If using mock data, don't try to call the API
    if (usingMockData) {
      return;
    }
    
    try {
      const result = await markAllAsReadUseCase.execute(userId);
      
      if (result.success) {
      } else {
        // Revert optimistic update on failure
        set({ notifications, error: result.error });
      }
    } catch (error) {
      // Revert optimistic update on exception
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ notifications, error: errorMessage });
    }
  },
  
  // ========================================
  // NEW AUTHENTICATED METHODS
  // ========================================
  
  fetchMyNotifications: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) {
      console.error('❌ Cannot fetch my notifications: not authenticated');
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const result = await fetchMyNotificationsUseCase.execute();
      
      if (result.success && result.data) {
        const response = result.data;  // This is FetchMyNotificationsResponse
        const notificationList = response.notifications;  // This is NotificationList
        const notificationItems = notificationList.items || [];
        const unreadCount = notificationList.unreadCount || 0;  // 🔔 NEW: Get from backend
        
        // 🔍 DEBUG: Manual count calculation for comparison
        const manualUnreadCount = notificationItems.filter(n => !n.isRead).length;
        
        // 🔧 TEMPORARY FIX: Use manual count if backend count is incorrect
        const finalUnreadCount = manualUnreadCount > 0 && unreadCount === 0 ? manualUnreadCount : unreadCount;
        
        set({ 
          notifications: notificationItems, 
          serverUnreadCount: finalUnreadCount,  // 🔧 FIXED: Use corrected count
          isLoading: false,
          usingMockData: false 
        });
      } else {
        set({ 
          error: result.error, 
          isLoading: false,
          usingMockData: false 
        });
        console.error('❌ Failed to fetch my notifications:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ 
        error: errorMessage, 
        isLoading: false,
        usingMockData: false 
      });
      console.error('❌ Exception during fetchMyNotifications:', error);
    }
  },
  
  markMyNotificationAsRead: async (notificationId: string) => {
    const { isAuthenticated, notifications } = get();
    if (!isAuthenticated || !notifications) {
      console.error('❌ Cannot mark my notification as read: not authenticated or missing notifications');
      return;
    }
    
    // Optimistic update (works for both mock and real data)
    const optimisticNotifications = notifications.map(notification =>
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    );
    
    // 🔧 ALSO update serverUnreadCount optimistically
    const currentCount = get().serverUnreadCount || 0;
    const newOptimisticCount = Math.max(0, currentCount - 1);
    
    set({ 
      notifications: optimisticNotifications,
      serverUnreadCount: newOptimisticCount  // 🔧 Optimistic count update
    });
    console.log(`🔄 Optimistically marked my notification ${notificationId} as read`);
    console.log(`🔔 Optimistic unread count: ${currentCount} -> ${newOptimisticCount}`);
    
    try {
      const result = await markMyNotificationAsReadUseCase.execute(notificationId);
      
      if (result.success && result.data) {
        console.log('🔍 Mark-as-read result from backend:', result);
        
        // Update with server response to ensure sync
        const updatedNotifications = optimisticNotifications.map(notification =>
          notification.id === notificationId 
            ? { ...notification, isRead: true } // Ensure it's marked as read
            : notification
        );
        
        // 🔔 NEW: Update server unread count if provided by backend
        const updateData: any = { notifications: updatedNotifications };
        if (result.unreadCount !== undefined) {
          updateData.serverUnreadCount = result.unreadCount;
          console.log('🔔 Updated unread count from backend after mark-as-read:', result.unreadCount);
        } else {
          console.log('⚠️ Backend did not return unreadCount, keeping optimistic count');
        }
        
        set(updateData);
        console.log(`✅ Successfully marked my notification ${notificationId} as read`);
      } else {
        // Revert optimistic update on failure
        set({ notifications, error: result.error });
        console.error(`❌ Failed to mark my notification as read:`, result.error);
      }
    } catch (error) {
      // Revert optimistic update on exception
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ notifications, error: errorMessage });
      console.error(`❌ Exception during markMyNotificationAsRead:`, error);
    }
  },
  
  dismissMyNotification: async (notificationId: string) => {
    const { isAuthenticated, notifications } = get();
    if (!isAuthenticated || !notifications) {
      console.error('❌ Cannot dismiss my notification: not authenticated or missing notifications');
      return;
    }
    
    // Optimistic update - remove from list
    const optimisticNotifications = notifications.filter(notification =>
      notification.id !== notificationId
    );
    
    // 🔧 ALSO update serverUnreadCount optimistically (dismiss = -1 unread)
    const dismissedNotification = notifications.find(n => n.id === notificationId);
    const currentCount = get().serverUnreadCount || 0;
    const newOptimisticCount = (dismissedNotification && !dismissedNotification.isRead) 
      ? Math.max(0, currentCount - 1) 
      : currentCount;
    
    set({ 
      notifications: optimisticNotifications,
      serverUnreadCount: newOptimisticCount  // 🔧 Optimistic count update
    });
    console.log(`🔄 Optimistically dismissed my notification ${notificationId}`);
    console.log(`🔔 Optimistic unread count after dismiss: ${currentCount} -> ${newOptimisticCount}`);
    
    try {
      const result = await dismissMyNotificationUseCase.execute(notificationId);
      
      if (result.success) {
        // 🔔 NEW: Update server unread count if provided by backend
        const updateData: any = { notifications: optimisticNotifications };
        if (result.unreadCount !== undefined) {
          updateData.serverUnreadCount = result.unreadCount;
          console.log('🔔 Updated unread count from backend after dismiss:', result.unreadCount);
        }
        
        set(updateData);
        console.log(`✅ Successfully dismissed my notification ${notificationId}`);
      } else {
        // Revert optimistic update on failure
        set({ notifications, error: result.error });
        console.error(`❌ Failed to dismiss my notification:`, result.error);
      }
    } catch (error) {
      // Revert optimistic update on exception
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ notifications, error: errorMessage });
      console.error(`❌ Exception during dismissMyNotification:`, error);
    }
  },
  
  markAllMyNotificationsAsRead: async () => {
    const { isAuthenticated, notifications } = get();
    if (!isAuthenticated || !notifications) {
      console.error('❌ Cannot mark all my notifications as read: not authenticated or missing notifications');
      return;
    }
    
    // Optimistic update (works for both mock and real data)
    const optimisticNotifications = notifications.map(notification => ({ ...notification, isRead: true }));
    
    set({ notifications: optimisticNotifications });
    
    try {
      const result = await markAllMyNotificationsAsReadUseCase.execute();
      
      if (result.success) {
      } else {
        // Revert optimistic update on failure
        set({ notifications, error: result.error });
      }
    } catch (error) {
      // Revert optimistic update on exception
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ notifications, error: errorMessage });
    }
  },
  
  setAuthenticated: (isAuth: boolean) => {
    set({ isAuthenticated: isAuth });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));