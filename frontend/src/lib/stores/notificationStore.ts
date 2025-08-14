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

// Debug: Log initialization
console.log('🔧 NotificationStore: Initializing dependencies...');
console.log('🔧 NotificationAPI instance:', notificationAPI);

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

console.log('✅ NotificationStore: All use cases initialized (original + authenticated)');

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
    
    // 🔍 DEBUG: Log state for debugging campanita issue
    console.log('🔔 Debug getUnreadCount called:', {
      serverUnreadCount,
      usingMockData,
      notificationsLength: notifications?.length || 0,
      manualCount: notifications ? notifications.filter(n => !n.isRead).length : 0,
      fullState: { serverUnreadCount: state.serverUnreadCount, usingMockData: state.usingMockData }
    });
    
    // 🔔 FIXED: Use backend count when available (preferred)
    if (serverUnreadCount !== null && !usingMockData) {
      console.log('🔔 Using backend count:', serverUnreadCount);
      return serverUnreadCount;
    }
    
    // Fallback: Calculate manually for mock data or when backend count is not available
    if (!notifications) return 0;
    const manualCount = notifications.filter(n => !n.isRead).length;
    console.log('🔔 Using manual count:', manualCount);
    return manualCount;
  },
  
  // ========================================
  // ORIGINAL METHODS (Backward Compatibility)
  // ========================================
  
  fetchNotifications: async (userId: string) => {
    set({ isLoading: true, error: null, currentUserId: userId });
    
    try {
      console.log(`🔗 Fetching notifications for user: ${userId}`);
      const result = await fetchNotificationsUseCase.execute({ userId });
      
      if (result.success) {
        // Debug: Log the actual result structure
        console.log('🔍 Debug - Full result:', result);
        console.log('🔍 Debug - result.data:', result.data);
        
        // Handle the data structure properly
        let notificationItems: Notification[] = [];
        console.log("result.data:", result.data );
        if (result.data?.notifications?.items && Array.isArray(result.data.notifications.items)) {
          notificationItems = result.data.notifications.items;
          
          // 🚨 DEBUG: Log each notification ID to track duplicates
          console.log('🔍 NOTIFICATION IDS FROM API:');
          notificationItems.forEach((notif, index) => {
            console.log(`  ${index + 1}. ${notif.id} - ${notif.title}`);
          });
          
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
        console.log('✅ Notifications fetched successfully:', notificationItems.length);
      } else {
        // Check if we should use mock data
        if (shouldUseMockData(result.error)) {
          console.log('⚠️ API error, using mock notifications for demo');
          console.log('🔍 MOCK NOTIFICATION IDS:');
          mockNotifications.forEach((notif, index) => {
            console.log(`  ${index + 1}. ${notif.id} - ${notif.title}`);
          });
          
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
        console.error('❌ Failed to fetch notifications:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Exception caught, using mock notifications for demo');

      set({ 
        notifications: mockNotifications,
        error: null, // Clear error when using mock
        isLoading: false,
        usingMockData: true 
      });
      console.error('❌ Exception during fetch:', error);
    }
  },
  
  // Mark as read action with optimistic updates
  markAsRead: async (notificationId: string) => {
    console.log('🔄 markAsRead called with ID:', notificationId);
    
    const { notifications, currentUserId, usingMockData } = get();
    console.log('📊 Store state:', { 
      notificationsCount: notifications?.length || 0, 
      currentUserId, 
      usingMockData 
    });
    
    // Fix: Use demo as fallback if currentUserId is not set
    const userId = currentUserId || 'demo';
    
    if (!notifications) {
      console.warn('❌ Cannot mark as read: missing notifications');
      return;
    }
    
    console.log('🔄 Using userId:', userId, 'for notification:', notificationId);
    
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
      console.warn('❌ Cannot dismiss: missing notifications or userId');
      return;
    }
    
    // Optimistic update - remove from list
    const optimisticNotifications = notifications.filter(notification =>
      notification.id !== notificationId
    );
    
    set({ notifications: optimisticNotifications });
    console.log(`🔄 Optimistically dismissed notification ${notificationId}`);
    
    // If using mock data, don't try to call the API
    if (usingMockData) {
      console.log('📝 Using mock data - dismiss saved locally only');
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
    console.log(`🔄 Optimistically marked all notifications as read for user ${userId}`);
    
    // If using mock data, don't try to call the API
    if (usingMockData) {
      console.log('📝 Using mock data - mark all as read saved locally only');
      return;
    }
    
    try {
      const result = await markAllAsReadUseCase.execute(userId);
      
      if (result.success) {
        console.log(`✅ Successfully marked all notifications as read for user ${userId}`);
      } else {
        // Revert optimistic update on failure
        set({ notifications, error: result.error });
        console.error(`❌ Failed to mark all notifications as read:`, result.error);
      }
    } catch (error) {
      // Revert optimistic update on exception
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ notifications, error: errorMessage });
      console.error(`❌ Exception during markAllAsRead:`, error);
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
        
        console.log('✅ My notifications fetched successfully:', notificationItems.length);
        console.log('🔔 Unread count from backend:', unreadCount);  // Debug log
        console.log('🔍 Debug fetchMyNotifications - Full response:', response);
        console.log('🔍 Debug fetchMyNotifications - NotificationList:', notificationList);
        console.log('🔍 Debug fetchMyNotifications - Items:', notificationItems.map(n => ({ id: n.id, title: n.title, isRead: n.isRead, status: n.status })));
        
        // 🔍 DEBUG: Detailed isRead status verification
        console.log('🔍 DETAILED isRead STATUS CHECK:');
        notificationItems.forEach((notification, index) => {
          console.log(`  Notification ${index + 1}:`, {
            id: notification.id,
            title: notification.title.substring(0, 40) + '...',
            isRead: notification.isRead,
            type: typeof notification.isRead,
            rawValue: JSON.stringify(notification.isRead)
          });
        });
        
        // 🔍 DEBUG: Manual count calculation for comparison
        const manualUnreadCount = notificationItems.filter(n => !n.isRead).length;
        console.log('🔍 Manual unread count vs backend:', { manualUnreadCount, backendUnreadCount: unreadCount });
        
        // 🔧 TEMPORARY FIX: Use manual count if backend count is incorrect
        const finalUnreadCount = manualUnreadCount > 0 && unreadCount === 0 ? manualUnreadCount : unreadCount;
        console.log('🔧 Using final count:', finalUnreadCount);
        
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
    console.log('🔄 Optimistically marked all my notifications as read');
    
    try {
      const result = await markAllMyNotificationsAsReadUseCase.execute();
      
      if (result.success) {
        console.log('✅ Successfully marked all my notifications as read');
      } else {
        // Revert optimistic update on failure
        set({ notifications, error: result.error });
        console.error('❌ Failed to mark all my notifications as read:', result.error);
      }
    } catch (error) {
      // Revert optimistic update on exception
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ notifications, error: errorMessage });
      console.error('❌ Exception during markAllMyNotificationsAsRead:', error);
    }
  },
  
  setAuthenticated: (isAuth: boolean) => {
    set({ isAuthenticated: isAuth });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));