import { 
  isUserSignedIn, 
  putFile, 
  getFile 
} from 'blockstack';
import { 
  showNotification, 
  showAlertNotification, 
  showBrowserNotification 
} from '../Components/Notifications';

// Alert data structure constants
export const ALERT_TYPES = {
  ABOVE: 'above',
  BELOW: 'below'
};

export const ALERT_STATUS = {
  ACTIVE: 'active',
  TRIGGERED: 'triggered',
  DISMISSED: 'dismissed'
};

// Storage configuration
const GAIA_ALERTS_STORAGE = 'coinfox-alerts.json';
const LOCAL_ALERTS_KEY = 'coinAlerts';

/**
 * Generate a unique alert ID
 * @returns {string} Unique alert identifier
 */
export const generateAlertId = () => {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new alert object
 * @param {string} coin - Coin ticker (e.g., 'btc')
 * @param {string} type - Alert type ('above' or 'below')
 * @param {number} targetPrice - Target price for alert
 * @param {string} currency - Currency for price (e.g., 'USD')
 * @returns {Object} Alert object
 */
export const createAlert = (coin, type, targetPrice, currency = 'USD') => {
  if (!coin || !type || !targetPrice) {
    throw new Error('Missing required alert parameters');
  }

  if (!Object.values(ALERT_TYPES).includes(type)) {
    throw new Error('Invalid alert type');
  }

  if (targetPrice <= 0) {
    throw new Error('Target price must be greater than 0');
  }

  return {
    id: generateAlertId(),
    coin: coin.toLowerCase(),
    type,
    targetPrice: Number(targetPrice),
    currency: currency.toUpperCase(),
    status: ALERT_STATUS.ACTIVE,
    createdAt: Date.now(),
    triggeredAt: null,
    dismissedAt: null
  };
};

/**
 * Read alerts from localStorage
 * @returns {Array} Array of alert objects
 */
export const readLocalAlerts = () => {
  try {
    const alertsJson = localStorage.getItem(LOCAL_ALERTS_KEY);
    return alertsJson ? JSON.parse(alertsJson) : [];
  } catch (error) {
    console.error('Error reading local alerts:', error);
    return [];
  }
};

/**
 * Save alerts to localStorage
 * @param {Array} alerts - Array of alert objects
 * @returns {boolean} Success status
 */
export const saveLocalAlerts = (alerts) => {
  try {
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(alerts));
    return true;
  } catch (error) {
    console.error('Error saving local alerts:', error);
    return false;
  }
};

/**
 * Read alerts from Gaia storage (Blockstack)
 * @returns {Promise<Array>} Promise resolving to array of alert objects
 */
export const readGaiaAlerts = async () => {
  try {
    if (!isUserSignedIn()) {
      throw new Error('User not signed in to Blockstack');
    }

    const decrypt = true;
    const alertsJson = await getFile(GAIA_ALERTS_STORAGE, decrypt);
    
    if (!alertsJson) {
      return [];
    }

    const alertsData = JSON.parse(alertsJson);
    return alertsData.alerts || [];
  } catch (error) {
    console.error('Error reading Gaia alerts:', error);
    // Return empty array if file doesn't exist or other error
    return [];
  }
};

/**
 * Save alerts to Gaia storage (Blockstack)
 * @param {Array} alerts - Array of alert objects
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const saveGaiaAlerts = async (alerts) => {
  try {
    if (!isUserSignedIn()) {
      throw new Error('User not signed in to Blockstack');
    }

    const encrypt = true;
    const data = {
      alerts,
      lastUpdated: Date.now(),
      version: '1.0'
    };

    await putFile(GAIA_ALERTS_STORAGE, JSON.stringify(data), encrypt);
    return true;
  } catch (error) {
    console.error('Error saving Gaia alerts:', error);
    return false;
  }
};

/**
 * Get all alerts using the appropriate storage method
 * @returns {Promise<Array>} Promise resolving to array of alert objects
 */
export const getAllAlerts = async () => {
  try {
    if (isUserSignedIn()) {
      return await readGaiaAlerts();
    } else {
      return readLocalAlerts();
    }
  } catch (error) {
    console.error('Error getting alerts:', error);
    return [];
  }
};

/**
 * Save alerts using the appropriate storage method
 * @param {Array} alerts - Array of alert objects
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const saveAllAlerts = async (alerts) => {
  try {
    if (isUserSignedIn()) {
      return await saveGaiaAlerts(alerts);
    } else {
      return saveLocalAlerts(alerts);
    }
  } catch (error) {
    console.error('Error saving alerts:', error);
    return false;
  }
};

/**
 * Add a new alert
 * @param {Object} alertData - Alert data object
 * @returns {Promise<Object|null>} Promise resolving to created alert or null
 */
export const addAlert = async (alertData) => {
  try {
    const alert = createAlert(
      alertData.coin,
      alertData.type,
      alertData.targetPrice,
      alertData.currency
    );

    const existingAlerts = await getAllAlerts();
    const updatedAlerts = [...existingAlerts, alert];
    
    const success = await saveAllAlerts(updatedAlerts);
    
    if (success) {
      showNotification(
        'success', 
        `Alert created for ${alert.coin.toUpperCase()} ${alert.type} $${alert.targetPrice}`,
        3000
      );
      return alert;
    } else {
      throw new Error('Failed to save alert');
    }
  } catch (error) {
    console.error('Error adding alert:', error);
    showNotification('error', `Failed to create alert: ${error.message}`, 5000);
    return null;
  }
};

/**
 * Update an existing alert
 * @param {string} alertId - Alert ID to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const updateAlert = async (alertId, updates) => {
  try {
    const alerts = await getAllAlerts();
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex === -1) {
      throw new Error('Alert not found');
    }

    // Update the alert
    alerts[alertIndex] = {
      ...alerts[alertIndex],
      ...updates,
      updatedAt: Date.now()
    };

    const success = await saveAllAlerts(alerts);
    
    if (success) {
      showNotification('success', 'Alert updated successfully', 3000);
      return true;
    } else {
      throw new Error('Failed to save updated alert');
    }
  } catch (error) {
    console.error('Error updating alert:', error);
    showNotification('error', `Failed to update alert: ${error.message}`, 5000);
    return false;
  }
};

/**
 * Delete an alert
 * @param {string} alertId - Alert ID to delete
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const deleteAlert = async (alertId) => {
  try {
    const alerts = await getAllAlerts();
    const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
    
    if (filteredAlerts.length === alerts.length) {
      throw new Error('Alert not found');
    }

    const success = await saveAllAlerts(filteredAlerts);
    
    if (success) {
      showNotification('success', 'Alert deleted successfully', 3000);
      return true;
    } else {
      throw new Error('Failed to save after deletion');
    }
  } catch (error) {
    console.error('Error deleting alert:', error);
    showNotification('error', `Failed to delete alert: ${error.message}`, 5000);
    return false;
  }
};

/**
 * Get alerts for a specific coin
 * @param {string} coin - Coin ticker
 * @returns {Promise<Array>} Promise resolving to array of alerts for the coin
 */
export const getAlertsForCoin = async (coin) => {
  try {
    const alerts = await getAllAlerts();
    return alerts.filter(alert => alert.coin === coin.toLowerCase());
  } catch (error) {
    console.error('Error getting alerts for coin:', error);
    return [];
  }
};

/**
 * Get active alerts (not triggered or dismissed)
 * @returns {Promise<Array>} Promise resolving to array of active alerts
 */
export const getActiveAlerts = async () => {
  try {
    const alerts = await getAllAlerts();
    return alerts.filter(alert => alert.status === ALERT_STATUS.ACTIVE);
  } catch (error) {
    console.error('Error getting active alerts:', error);
    return [];
  }
};

/**
 * Check if a price triggers an alert
 * @param {Object} alert - Alert object
 * @param {number} currentPrice - Current price to check
 * @returns {boolean} True if alert should be triggered
 */
export const shouldTriggerAlert = (alert, currentPrice) => {
  if (alert.status !== ALERT_STATUS.ACTIVE) {
    return false;
  }

  if (alert.type === ALERT_TYPES.ABOVE) {
    return currentPrice >= alert.targetPrice;
  } else if (alert.type === ALERT_TYPES.BELOW) {
    return currentPrice <= alert.targetPrice;
  }

  return false;
};

/**
 * Trigger an alert (mark as triggered and send notification)
 * @param {Object} alert - Alert object to trigger
 * @param {number} currentPrice - Current price that triggered the alert
 * @param {string} currency - Currency for display (optional)
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const triggerAlert = async (alert, currentPrice, currency = 'USD') => {
  try {
    // Update alert status
    const success = await updateAlert(alert.id, {
      status: ALERT_STATUS.TRIGGERED,
      triggeredAt: Date.now(),
      triggeredPrice: currentPrice
    });

    if (success) {
      // Send enhanced alert notification
      showAlertNotification(alert, currentPrice, currency);
      
      // Try to send browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = 'Coinfox Price Alert';
        const body = `${alert.coin.toUpperCase()} ${alert.type} $${alert.targetPrice} - Current: $${currentPrice.toFixed(2)}`;
        showBrowserNotification(title, body);
      }
    }

    return success;
  } catch (error) {
    console.error('Error triggering alert:', error);
    return false;
  }
};

/**
 * Dismiss an alert
 * @param {string} alertId - Alert ID to dismiss
 * @returns {Promise<boolean>} Promise resolving to success status
 */
export const dismissAlert = async (alertId) => {
  try {
    return await updateAlert(alertId, {
      status: ALERT_STATUS.DISMISSED,
      dismissedAt: Date.now()
    });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    return false;
  }
};

/**
 * Check all active alerts against current market data
 * @param {Object} marketData - Current market data object
 * @param {string} currency - Currency for price display (optional)
 * @returns {Promise<Array>} Promise resolving to array of triggered alerts
 */
export const checkAlertsAgainstMarket = async (marketData, currency = 'USD') => {
  try {
    const activeAlerts = await getActiveAlerts();
    const triggeredAlerts = [];

    for (const alert of activeAlerts) {
      const coinMarketData = marketData[alert.coin];
      
      if (coinMarketData && coinMarketData.ticker && coinMarketData.ticker.price) {
        const currentPrice = Number(coinMarketData.ticker.price);
        
        if (shouldTriggerAlert(alert, currentPrice)) {
          const triggered = await triggerAlert(alert, currentPrice, currency);
          if (triggered) {
            triggeredAlerts.push({ ...alert, triggeredPrice: currentPrice });
          }
        }
      }
    }

    return triggeredAlerts;
  } catch (error) {
    console.error('Error checking alerts against market:', error);
    return [];
  }
};

/**
 * Get alert statistics
 * @returns {Promise<Object>} Promise resolving to alert statistics
 */
export const getAlertStats = async () => {
  try {
    const alerts = await getAllAlerts();
    
    const stats = {
      total: alerts.length,
      active: alerts.filter(a => a.status === ALERT_STATUS.ACTIVE).length,
      triggered: alerts.filter(a => a.status === ALERT_STATUS.TRIGGERED).length,
      dismissed: alerts.filter(a => a.status === ALERT_STATUS.DISMISSED).length,
      byType: {
        above: alerts.filter(a => a.type === ALERT_TYPES.ABOVE).length,
        below: alerts.filter(a => a.type === ALERT_TYPES.BELOW).length
      },
      byStatus: {
        active: alerts.filter(a => a.status === ALERT_STATUS.ACTIVE).length,
        triggered: alerts.filter(a => a.status === ALERT_STATUS.TRIGGERED).length,
        dismissed: alerts.filter(a => a.status === ALERT_STATUS.DISMISSED).length
      }
    };

    return stats;
  } catch (error) {
    console.error('Error getting alert stats:', error);
    return {
      total: 0,
      active: 0,
      triggered: 0,
      dismissed: 0,
      byType: { above: 0, below: 0 },
      byStatus: { active: 0, triggered: 0, dismissed: 0 }
    };
  }
};

/**
 * Clean up old dismissed alerts (older than 30 days)
 * @returns {Promise<number>} Promise resolving to number of alerts cleaned up
 */
export const cleanupOldAlerts = async () => {
  try {
    const alerts = await getAllAlerts();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const activeAlerts = alerts.filter(alert => {
      // Keep active and recently triggered alerts
      if (alert.status === ALERT_STATUS.ACTIVE) return true;
      if (alert.status === ALERT_STATUS.TRIGGERED && alert.triggeredAt > thirtyDaysAgo) return true;
      
      // Remove old dismissed alerts
      if (alert.status === ALERT_STATUS.DISMISSED && alert.dismissedAt < thirtyDaysAgo) return false;
      
      return true;
    });

    const cleanedCount = alerts.length - activeAlerts.length;
    
    if (cleanedCount > 0) {
      await saveAllAlerts(activeAlerts);
      showNotification('info', `Cleaned up ${cleanedCount} old alerts`, 3000);
    }

    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up old alerts:', error);
    return 0;
  }
};
