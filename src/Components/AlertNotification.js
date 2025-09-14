import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { $currencySymbol, $numberWithCommas } from '../Utils/Helpers';
import { 
  getAllAlerts, 
  dismissAlert, 
  ALERT_STATUS, 
  ALERT_TYPES 
} from '../Utils/alertHelpers';

// Enhanced animations
const slideInBounce = keyframes`
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  60% {
    transform: translateX(-10px);
    opacity: 1;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const AlertNotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10001;
  max-width: 420px;
  
  @media (max-width: 768px) {
    left: 20px;
    right: 20px;
    max-width: none;
  }
`;

const AlertNotification = styled.div`
  background: ${props => {
    if (props.alertType === 'price-alert') {
      return 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%)';
    }
    return props.type === 'success' ? '#21ce99' : props.type === 'error' ? '#ff6b6b' : '#404042';
  }};
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  animation: ${slideInBounce} 0.5s ease-out;
  border: 2px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  
  ${props => props.alertType === 'price-alert' && `
    animation: ${slideInBounce} 0.5s ease-out, ${pulse} 2s ease-in-out infinite;
  `}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.alertType === 'price-alert' ? 
      'linear-gradient(90deg, #ff6b6b, #ffd93d, #21ce99)' : 
      'rgba(255, 255, 255, 0.3)'};
    ${props => props.alertType === 'price-alert' && `
      background-size: 200% 100%;
      animation: shimmer 2s linear infinite;
    `}
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
`;

const NotificationIcon = styled.div`
  font-size: 24px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  ${props => props.alertType === 'price-alert' && `
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}
`;

const NotificationBody = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const NotificationMessage = styled.div`
  font-size: 14px;
  line-height: 1.4;
  opacity: 0.95;
`;

const AlertDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const CoinInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CoinIcon = styled.div`
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
`;

const PriceInfo = styled.div`
  text-align: right;
  font-size: 12px;
`;

const CurrentPrice = styled.div`
  font-weight: 600;
  font-size: 14px;
`;

const TargetPrice = styled.div`
  opacity: 0.8;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  margin-left: 12px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const AlertNotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    // Listen for custom notification events
    const handleNotification = (event) => {
      const { type, message, duration = 5000, alertData } = event.detail;
      addNotification(type, message, duration, alertData);
    };

    const handleAlertNotification = (event) => {
      const { alertData, currentPrice, currency = 'USD' } = event.detail;
      addAlertNotification(alertData, currentPrice, currency);
    };

    window.addEventListener('showNotification', handleNotification);
    window.addEventListener('showAlertNotification', handleAlertNotification);
    
    return () => {
      window.removeEventListener('showNotification', handleNotification);
      window.removeEventListener('showAlertNotification', handleAlertNotification);
    };
  }, []);

  const addNotification = (type, message, duration = 5000, alertData = null) => {
    const id = Date.now() + Math.random();
    const newNotification = { 
      id, 
      type, 
      message, 
      alertData,
      alertType: alertData ? 'price-alert' : null,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const addAlertNotification = (alertData, currentPrice, currency) => {
    const id = Date.now() + Math.random();
    const curSymbol = $currencySymbol(currency);
    
    const title = `🚨 Price Alert Triggered!`;
    const coin = alertData.coin.toUpperCase();
    const type = alertData.type === ALERT_TYPES.ABOVE ? 'above' : 'below';
    const targetPrice = alertData.targetPrice;
    
    const notification = {
      id,
      type: 'alert',
      alertType: 'price-alert',
      title,
      coin,
      alertData,
      currentPrice,
      currency,
      timestamp: Date.now(),
      message: `${coin} is now ${type} your target of ${curSymbol}${$numberWithCommas(targetPrice.toFixed(2))}`
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Keep alert notifications longer (15 seconds)
    setTimeout(() => {
      removeNotification(id);
    }, 15000);
    
    // Add to recent alerts for analytics
    setRecentAlerts(prev => [alertData, ...prev.slice(0, 9)]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleDismissAlert = async (alertId, notificationId) => {
    try {
      await dismissAlert(alertId);
      removeNotification(notificationId);
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleViewCoin = (coin, notificationId) => {
    // Navigate to coin page
    window.location.href = `/coin/${coin.toLowerCase()}`;
    removeNotification(notificationId);
  };

  const getIcon = (notification) => {
    if (notification.alertType === 'price-alert') {
      return '🚨';
    }
    
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <AlertNotificationContainer>
      {notifications.map(notification => (
        <AlertNotification 
          key={notification.id} 
          type={notification.type}
          alertType={notification.alertType}
        >
          <NotificationContent>
            <NotificationIcon alertType={notification.alertType}>
              {getIcon(notification)}
            </NotificationIcon>
            
            <NotificationBody>
              {notification.title && (
                <NotificationTitle>{notification.title}</NotificationTitle>
              )}
              
              <NotificationMessage>
                {notification.message}
              </NotificationMessage>
              
              {notification.alertType === 'price-alert' && notification.alertData && (
                <>
                  <AlertDetails>
                    <CoinInfo>
                      <CoinIcon>
                        {notification.coin.charAt(0)}
                      </CoinIcon>
                      <div>
                        <div style={{ fontWeight: '600' }}>
                          {notification.coin}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.8 }}>
                          {notification.alertData.type} target
                        </div>
                      </div>
                    </CoinInfo>
                    
                    <PriceInfo>
                      <CurrentPrice>
                        {$currencySymbol(notification.currency)}
                        {$numberWithCommas(notification.currentPrice.toFixed(2))}
                      </CurrentPrice>
                      <TargetPrice>
                        Target: {$currencySymbol(notification.currency)}
                        {$numberWithCommas(notification.alertData.targetPrice.toFixed(2))}
                      </TargetPrice>
                    </PriceInfo>
                  </AlertDetails>
                  
                  <ActionButtons>
                    <ActionButton 
                      onClick={() => handleViewCoin(notification.coin, notification.id)}
                    >
                      📊 View Coin
                    </ActionButton>
                    <ActionButton 
                      onClick={() => handleDismissAlert(notification.alertData.id, notification.id)}
                    >
                      ✓ Dismiss
                    </ActionButton>
                  </ActionButtons>
                </>
              )}
            </NotificationBody>
          </NotificationContent>
          
          <CloseButton onClick={() => removeNotification(notification.id)}>
            ×
          </CloseButton>
        </AlertNotification>
      ))}
    </AlertNotificationContainer>
  );
};

// Enhanced helper functions for alert notifications
export const showNotification = (type, message, duration, alertData = null) => {
  window.dispatchEvent(new CustomEvent('showNotification', {
    detail: { type, message, duration, alertData }
  }));
};

export const showAlertNotification = (alertData, currentPrice, currency = 'USD') => {
  window.dispatchEvent(new CustomEvent('showAlertNotification', {
    detail: { alertData, currentPrice, currency }
  }));
};

// Function to request browser notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Function to show browser notification for alerts
export const showBrowserNotification = (title, body, icon = '/favicon.ico') => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: 'coinfox-alert',
      requireInteraction: true,
      actions: [
        { action: 'view', title: '👁️ View' },
        { action: 'dismiss', title: '✓ Dismiss' }
      ]
    });
    
    // Auto-close after 10 seconds if not interactive
    setTimeout(() => {
      notification.close();
    }, 10000);
    
    return notification;
  }
  return null;
};

export default AlertNotificationSystem;
