import React from 'react';
import AlertNotificationSystem, { 
  showNotification as showAlertNotification,
  showAlertNotification as triggerAlertNotification,
  requestNotificationPermission,
  showBrowserNotification
} from './AlertNotification';

// Enhanced NotificationSystem that uses AlertNotificationSystem
const NotificationSystem = () => {
  return <AlertNotificationSystem />;
};

// Backward compatible helper function
export const showNotification = (type, message, duration, alertData = null) => {
  showAlertNotification(type, message, duration, alertData);
};

// Export additional alert-specific functions
export { 
  triggerAlertNotification as showAlertNotification,
  requestNotificationPermission,
  showBrowserNotification
};

export default NotificationSystem;

