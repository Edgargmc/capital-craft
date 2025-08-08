import { create } from 'zustand';
import { FetchNotificationsUseCase } from '@/use-cases/FetchNotifications';
import { MarkNotificationAsReadUseCase } from '@/use-cases/MarkNotificationAsRead';
import { DismissNotificationUseCase } from '@/use-cases/DismissNotification';
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
  clearError: () => void;
}

// Dependencies
const notificationAPI = CapitalCraftNotificationAPI.getInstance();
const logger = new ConsoleLogger();
const fetchNotificationsUseCase = new FetchNotificationsUseCase(notificationAPI, logger);
const markAsReadUseCase = new MarkNotificationAsReadUseCase(notificationAPI, logger);
const dismissNotificationUseCase = new DismissNotificationUseCase(notificationAPI, logger);

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
        if (result.data && Array.isArray(result.data.notifications.items)) {
          notificationItems = result.data.notifications.items;
        } else if (result.data && Array.isArray(result.data.notifications.items)) {
          notificationItems = result.data.notifications.items;
        } else if (Array.isArray(result.data?.notifications.items)) {
          notificationItems = result.data.notifications.items;
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
        error: errorMessage, 
        isLoading: false,
        usingMockData: true 
      });
      console.error('❌ Exception during fetch:', error);
    }
  },
  
  // Mark as read action with optimistic updates
  markAsRead: async (notificationId: string) => {
    const { notifications, currentUserId, usingMockData } = get();
    if (!notifications || !currentUserId) {
      console.warn('❌ Cannot mark as read: missing notifications or userId');
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
        userId: currentUserId 
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
  
  clearError: () => {
    set({ error: null });
  },
}));