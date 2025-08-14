/**
 * 📄 /notifications/page.tsx
 * 
 * BABY STEP 2A: Next.js App Router page for notifications
 * Following Clean Architecture + SOLID principles
 * 
 * Responsibilities:
 * - Route handler for /notifications
 * - Metadata configuration
 * - Integration with NotificationsPage component
 */

import { Metadata } from 'next';
import { NotificationsPage } from '../../pages/NotificationsPage';

// SEO and metadata configuration
export const metadata: Metadata = {
  title: 'Notifications | Capital Craft',
  description: 'Manage your portfolio notifications and stay updated with important alerts and educational content.',
  keywords: ['notifications', 'portfolio', 'alerts', 'capital craft'],
};

/**
 * Next.js App Router page component
 * Single Responsibility: Route configuration and page rendering
 */
export default function NotificationsRoute() {
  return <NotificationsPage />;
}

// Optional: Add static generation if needed in the future
// export const dynamic = 'force-dynamic'; // For authenticated content
