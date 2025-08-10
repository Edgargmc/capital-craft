import { create } from 'zustand';
import { FetchNotificationsUseCase } from '@/use-cases/FetchNotifications';
import { MarkNotificationAsReadUseCase } from '@/use-cases/MarkNotificationAsRead';
import { DismissNotificationUseCase } from '@/use-cases/DismissNotification';
import { MarkAllNotificationsAsReadUseCase } from '@/use-cases/MarkAllNotificationsAsRead';
import { CapitalCraftNotificationAPI } from '@/infrastructure/api/NotificationAPI';
import { ConsoleLogger } from '@/infrastructure/logging/ConsoleLogger';
import { Notification } from '@/entities/Notification';
import { mockNotifications, shouldUseMockData } from '@/lib/mockNotifications';


// Updated interface with currentUserId
interface NotificationState {
  // State
  notifications: Notification[] | null;
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
  usingMockData: boolean; // Track if we're using mock data

  
  // Computed properties
  unreadCount: number;
  
  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>; // New bulk action
  clearError: () => void;
}

// Dependencies
const notificationAPI = CapitalCraftNotificationAPI.getInstance();
const logger = new ConsoleLogger();

// Debug: Log initialization
console.log('🔧 NotificationStore: Initializing dependencies...');
console.log('🔧 NotificationAPI instance:', notificationAPI);

// Fix: Use cases expect different parameters based on their actual constructors
const fetchNotificationsUseCase = new FetchNotificationsUseCase(notificationAPI, logger);
const markAsReadUseCase = new MarkNotificationAsReadUseCase(notificationAPI, logger);
const dismissNotificationUseCase = new DismissNotificationUseCase(notificationAPI, logger);
const markAllAsReadUseCase = new MarkAllNotificationsAsReadUseCase(notificationAPI);

console.log('✅ NotificationStore: All use cases initialized');

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: null,
  currentUserId: null,
  isLoading: false,
  error: null,
  usingMockData: false,

  get unreadCount() {
    const { notifications } = get();
    if (!notifications) return 0;
    return notifications.filter(n => !n.isRead).length;
  },
  
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
  
  clearError: () => {
    set({ error: null });
  },
}));