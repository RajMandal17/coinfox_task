import React, { Component } from 'react';
import styled from 'styled-components';
import { getAllAlerts, updateAlert, checkAlertsAgainstMarket } from '../Utils/alertHelpers';
import { showNotification, showAlertNotification } from '../Components/AlertNotification';

// Styled Components
const MonitoringContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: ${props => props.show ? 'block' : 'none'};
`;

const MonitoringIndicator = styled.div`
  background: linear-gradient(135deg, #21ce99, #00d4aa);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(33, 206, 153, 0.3);
  animation: pulse 2s infinite;
  cursor: pointer;
  
  @keyframes pulse {
    0% { box-shadow: 0 4px 12px rgba(33, 206, 153, 0.3); }
    50% { box-shadow: 0 4px 20px rgba(33, 206, 153, 0.6); }
    100% { box-shadow: 0 4px 12px rgba(33, 206, 153, 0.3); }
  }
`;

const MonitoringStatus = styled.div`
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1.4;
  max-width: 200px;
`;

class RealTimeMonitoring extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isMonitoring: false,
      monitoringInterval: null,
      lastCheckTime: null,
      checkedPrices: {},
      triggeredAlerts: new Set(),
      showStatus: false,
      connectionStatus: 'disconnected',
      apiHealthy: true,
      failedRequests: 0,
      consecutiveErrors: 0,
      totalAlertChecks: 0,
      performanceMetrics: {
        avgResponseTime: 0,
        lastResponseTime: 0,
        requestCount: 0
      }
    };
    
    // Dynamic polling intervals based on market conditions
    this.basePollingInterval = 30000; // 30 seconds base
    this.fastPollingInterval = 15000; // 15 seconds for active alerts
    this.slowPollingInterval = 60000; // 60 seconds for inactive periods
    this.currentPollingInterval = this.basePollingInterval;
    
    // Performance and rate limiting
    this.maxConsecutiveErrors = 5;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 10000; // 10 seconds between requests to prevent rate limiting
    
    // WebSocket support
    this.webSocket = null;
    this.webSocketUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // Alert cooldown management
    this.alertCooldowns = new Map();
    this.defaultCooldownPeriod = 300000; // 5 minutes
  }

  componentDidMount() {
    this.startMonitoring();
    this.startPerformanceCleanup();
  }

  componentWillUnmount() {
    this.stopMonitoring();
    this.closeWebSocket();
    
    // Clear caches and timers
    this._alertsCache = null;
    this._consecutiveTriggers = null;
    this._notificationTimes = null;
    this.alertCooldowns.clear();
    
    // Clear any pending timeouts
    if (this._performanceCleanup) {
      clearInterval(this._performanceCleanup);
    }
  }

  componentDidUpdate(prevProps) {
    // Restart monitoring if alerts or market data changed significantly
    if (
      prevProps.coinz !== this.props.coinz || 
      (prevProps.marketData !== this.props.marketData && this.hasSignificantMarketChange(prevProps.marketData))
    ) {
      // Clear cache to force refresh
      this._alertsCache = null;
      this._alertsCacheTime = 0;
    }
  }

  hasSignificantMarketChange = (prevMarketData) => {
    if (!prevMarketData || !this.props.marketData) return true;
    
    // Check if any prices changed significantly (>5%)
    for (const symbol in this.props.marketData) {
      const prevPrice = prevMarketData[symbol]?.ticker?.price;
      const currentPrice = this.props.marketData[symbol]?.ticker?.price;
      
      if (prevPrice && currentPrice) {
        const change = Math.abs((currentPrice - prevPrice) / prevPrice);
        if (change > 0.05) return true;
      }
    }
    return false;
  };

  shouldTriggerAlert = (alert, currentPrice) => {
    const { alertType, targetPrice } = alert;
    
    switch (alertType) {
      case 'price_above':
      case 'above':
        return currentPrice >= targetPrice;
      case 'price_below':
      case 'below':
        return currentPrice <= targetPrice;
      case 'price_change':
        // For percentage changes, we'd need historical data
        const changePercent = alert.changePercent || 5;
        const basePrice = alert.basePrice || targetPrice;
        const actualChange = Math.abs((currentPrice - basePrice) / basePrice) * 100;
        return actualChange >= changePercent;
      default:
        return false;
    }
  };

  startMonitoring = () => {
    if (this.state.isMonitoring) return;

    console.log('🚨 Starting enhanced real-time price monitoring...');
    
    // Try WebSocket first, fallback to polling
    this.attemptWebSocketConnection();
    
    // Start intelligent polling
    this.startIntelligentPolling();

    this.setState({
      isMonitoring: true,
      connectionStatus: 'connecting',
      lastCheckTime: new Date()
    });

    // Initial check with delay
    setTimeout(() => this.checkPriceAlerts(), 2000);

    // Manual test function - adds a test alert for debugging
    window.debugAlertSystem = async () => {
      console.log('🧪 Adding test alert for debugging...');
      try {
        const { addAlert } = await import('../Utils/alertHelpers');
        const testAlert = await addAlert({
          coin: 'btc',
          type: 'above',
          targetPrice: 1, // Very low price to trigger immediately
          currency: 'USD'
        });
        console.log('✅ Test alert created:', testAlert);
        return testAlert;
      } catch (error) {
        console.error('❌ Failed to create test alert:', error);
      }
    };

    // Test notification system
    window.testNotification = () => {
      console.log('🧪 Testing notification system...');
      try {
        const { showNotification } = require('./Notifications');
        showNotification('success', '🧪 Test notification from RealTimeMonitoring', 5000);
        console.log('✅ Test notification sent');
      } catch (error) {
        console.error('❌ Test notification failed:', error);
      }
    };

    console.log('🧪 Debug functions available:');
    console.log('  - window.debugAlertSystem() - Creates test alert');
    console.log('  - window.testNotification() - Tests notification system');
  };

  startIntelligentPolling = () => {
    const adaptiveInterval = () => {
      this.checkPriceAlerts().then(() => {
        // Adjust polling interval based on conditions
        const newInterval = this.calculateOptimalInterval();
        if (newInterval !== this.currentPollingInterval) {
          console.log(`📊 Adjusting polling interval: ${this.currentPollingInterval}ms → ${newInterval}ms`);
          this.currentPollingInterval = newInterval;
        }
        
        // Schedule next check
        if (this.state.isMonitoring) {
          const timeoutId = setTimeout(adaptiveInterval, this.currentPollingInterval);
          this.setState({ monitoringInterval: timeoutId });
        }
      }).catch(error => {
        console.error('Polling error:', error);
        this.handlePollingError();
        
        // Continue with exponential backoff
        if (this.state.isMonitoring) {
          const backoffInterval = Math.min(
            this.currentPollingInterval * Math.pow(2, this.state.consecutiveErrors),
            300000 // Max 5 minutes
          );
          const timeoutId = setTimeout(adaptiveInterval, backoffInterval);
          this.setState({ monitoringInterval: timeoutId });
        }
      });
    };

    adaptiveInterval();
  };

  calculateOptimalInterval = () => {
    const activeAlerts = this.getActiveAlertsCount();
    const marketVolatility = this.estimateMarketVolatility();
    const apiHealth = this.state.apiHealthy ? 1 : 2;
    
    // Fast polling for active alerts or high volatility
    if (activeAlerts > 0 && marketVolatility > 0.05) {
      return this.fastPollingInterval * apiHealth;
    }
    
    // Medium polling for some activity
    if (activeAlerts > 0 || marketVolatility > 0.02) {
      return this.basePollingInterval * apiHealth;
    }
    
    // Slow polling for quiet periods
    return this.slowPollingInterval * apiHealth;
  };

  estimateMarketVolatility = () => {
    const { marketData } = this.props;
    if (!marketData) return 0;
    
    const volatilities = Object.values(marketData)
      .map(coin => Math.abs(coin.ticker?.change || 0))
      .filter(change => !isNaN(change));
    
    if (volatilities.length === 0) return 0;
    
    return volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length / 100;
  };

  getActiveAlertsCount = async () => {
    try {
      const alerts = await getAllAlerts();
      return alerts.filter(alert => alert.isActive).length;
    } catch (error) {
      return 0;
    }
  };

  handlePollingError = () => {
    const consecutiveErrors = this.state.consecutiveErrors + 1;
    const failedRequests = this.state.failedRequests + 1;
    
    this.setState({
      consecutiveErrors,
      failedRequests,
      apiHealthy: consecutiveErrors < this.maxConsecutiveErrors,
      connectionStatus: consecutiveErrors >= this.maxConsecutiveErrors ? 'error' : 'connected'
    });

    if (consecutiveErrors >= this.maxConsecutiveErrors) {
      console.warn('🚨 API health degraded, switching to fallback mode');
      this.switchToFallbackMode();
    }
  };

  switchToFallbackMode = () => {
    // Increase polling intervals and reduce feature complexity
    this.currentPollingInterval = Math.max(this.currentPollingInterval * 2, 120000); // Min 2 minutes
    console.log('⚠️ Fallback mode: Reduced polling frequency');
  };

  stopMonitoring = () => {
    if (this.state.monitoringInterval) {
      clearTimeout(this.state.monitoringInterval);
    }
    
    this.closeWebSocket();
    
    this.setState({
      isMonitoring: false,
      monitoringInterval: null,
      connectionStatus: 'disconnected'
    });

    console.log('🛑 Stopped enhanced price monitoring');
  };

  restartMonitoring = () => {
    this.stopMonitoring();
    setTimeout(() => this.startMonitoring(), 1000);
  };

  checkPriceAlerts = async () => {
    const startTime = performance.now();
    
    try {
      const { marketData, coinz } = this.props;
      
      if (!marketData || !coinz || Object.keys(coinz).length === 0) {
        return;
      }

      // Rate limiting check - increased interval to prevent API limits
      const now = Date.now();
      if (now - this.lastRequestTime < this.minRequestInterval) {
        console.log('⏳ Rate limiting: Skipping check (increased interval)');
        return;
      }
      this.lastRequestTime = now;

      // Get all active alerts with performance optimization
      const alerts = await this.getCachedAlerts();
      const activeAlerts = alerts.filter(alert => 
        alert.isActive !== false && alert.status === 'active' && !this.isAlertInCooldown(alert)
      );
      
      if (activeAlerts.length === 0) {
        this.setState({ 
          lastCheckTime: new Date(),
          connectionStatus: 'connected',
          consecutiveErrors: 0
        });
        return;
      }

      console.log(`🔍 Checking ${activeAlerts.length} active alerts (${alerts.length} total)...`);

      const triggeredAlerts = [];
      const checkedPrices = {};
      const batchedRequests = this.batchAlertsBySymbol(activeAlerts);

      // Process alerts in batches for efficiency
      for (const [coinSymbol, coinAlerts] of batchedRequests) {
        const marketInfo = marketData[coinSymbol.toLowerCase()];
        if (!marketInfo || !marketInfo.ticker) {
          continue;
        }

        const currentPrice = marketInfo.ticker.price;
        const priceChange24h = marketInfo.ticker.change || 0;
        checkedPrices[coinSymbol] = currentPrice;

        // Advanced alert evaluation
        for (const alert of coinAlerts) {
          const shouldTrigger = this.evaluateAdvancedAlert(alert, currentPrice, priceChange24h);
          
          if (shouldTrigger) {
            const alertKey = `${alert.id}-${alert.targetPrice}-${Date.now()}`;
            
            if (!this.state.triggeredAlerts.has(alertKey) && !this.isAlertInCooldown(alert)) {
              triggeredAlerts.push({ 
                ...alert, 
                currentPrice,
                priceChange24h,
                triggeredAt: new Date().toISOString()
              });
              
              this.state.triggeredAlerts.add(alertKey);
              this.setAlertCooldown(alert);
              
              // Update alert with trigger information
              await this.updateTriggeredAlert(alert, currentPrice);
            }
          }
        }
      }

      // Handle triggered alerts with batch processing
      if (triggeredAlerts.length > 0) {
        await this.handleTriggeredAlertsBatch(triggeredAlerts);
      }

      // Update performance metrics
      const responseTime = performance.now() - startTime;
      this.updatePerformanceMetrics(responseTime);

      this.setState({
        lastCheckTime: new Date(),
        checkedPrices,
        totalAlertChecks: this.state.totalAlertChecks + activeAlerts.length,
        connectionStatus: 'connected',
        consecutiveErrors: 0,
        apiHealthy: true
      });

    } catch (error) {
      console.error('Enhanced alert check error:', error);
      this.handlePollingError();
    }
  };

  getCachedAlerts = async () => {
    // Implement simple caching to reduce storage calls
    if (!this._alertsCache || Date.now() - this._alertsCacheTime > 30000) {
      console.log('🔄 Refreshing alerts cache...');
      try {
        const { getAllAlerts } = await import('../Utils/alertHelpers');
        this._alertsCache = await getAllAlerts();
        this._alertsCacheTime = Date.now();
        console.log(`📋 Cached ${this._alertsCache.length} alerts`);
      } catch (error) {
        console.error('❌ Failed to get alerts:', error);
        this._alertsCache = [];
      }
    }
    return this._alertsCache;
  };

  batchAlertsBySymbol = (alerts) => {
    const batched = new Map();
    alerts.forEach(alert => {
      const symbol = alert.coin || alert.coinSymbol; // Support both field names
      if (!batched.has(symbol)) {
        batched.set(symbol, []);
      }
      batched.get(symbol).push(alert);
    });
    return batched;
  };

  evaluateAdvancedAlert = (alert, currentPrice, priceChange24h) => {
    const { type, targetPrice, conditions = {} } = alert;
    
    // Basic price threshold check using the correct field names
    let triggered = false;
    
    if (type === 'above' || type === 'price_above') {
      triggered = currentPrice >= targetPrice;
    } else if (type === 'below' || type === 'price_below') {
      triggered = currentPrice <= targetPrice;
    }
    
    if (!triggered) return false;

    // Advanced conditions
    if (conditions.minVolatility && Math.abs(priceChange24h) < conditions.minVolatility) {
      return false;
    }

    if (conditions.consecutiveChecks && conditions.consecutiveChecks > 1) {
      return this.checkConsecutiveTriggers(alert, currentPrice);
    }

    if (conditions.timeWindow) {
      return this.checkTimeWindow(alert, conditions.timeWindow);
    }

    return triggered;
  };

  checkConsecutiveTriggers = (alert, currentPrice) => {
    const alertId = alert.id;
    if (!this._consecutiveTriggers) {
      this._consecutiveTriggers = new Map();
    }

    const triggers = this._consecutiveTriggers.get(alertId) || [];
    const shouldTrigger = this.shouldTriggerAlert(alert, currentPrice);

    if (shouldTrigger) {
      triggers.push(Date.now());
      // Keep only recent triggers (last 5 minutes)
      const recent = triggers.filter(time => Date.now() - time < 300000);
      this._consecutiveTriggers.set(alertId, recent);
      
      return recent.length >= (alert.conditions?.consecutiveChecks || 1);
    } else {
      // Clear triggers if condition not met
      this._consecutiveTriggers.set(alertId, []);
      return false;
    }
  };

  checkTimeWindow = (alert, timeWindow) => {
    const now = new Date();
    const startTime = new Date(timeWindow.start);
    const endTime = new Date(timeWindow.end);
    
    return now >= startTime && now <= endTime;
  };

  isAlertInCooldown = (alert) => {
    const cooldownEnd = this.alertCooldowns.get(alert.id);
    return cooldownEnd && Date.now() < cooldownEnd;
  };

  setAlertCooldown = (alert) => {
    const cooldownPeriod = alert.cooldownPeriod || this.defaultCooldownPeriod;
    const cooldownEnd = Date.now() + cooldownPeriod;
    this.alertCooldowns.set(alert.id, cooldownEnd);
  };

  updateTriggeredAlert = async (alert, currentPrice) => {
    try {
      await updateAlert(alert.id, {
        ...alert,
        isActive: alert.oneTime !== false, // Keep active unless it's a one-time alert
        lastTriggered: new Date().toISOString(),
        lastTriggeredPrice: currentPrice,
        triggerCount: (alert.triggerCount || 0) + 1
      });
    } catch (error) {
      console.error('Error updating triggered alert:', error);
    }
  };

  updatePerformanceMetrics = (responseTime) => {
    const { performanceMetrics } = this.state;
    const newCount = performanceMetrics.requestCount + 1;
    const newAvg = (performanceMetrics.avgResponseTime * performanceMetrics.requestCount + responseTime) / newCount;

    this.setState({
      performanceMetrics: {
        avgResponseTime: newAvg,
        lastResponseTime: responseTime,
        requestCount: newCount
      }
    });
  };

  // WebSocket Integration
  attemptWebSocketConnection = () => {
    // CoinGecko doesn't have public WebSocket, but we can simulate the pattern
    // for future integration with other data providers
    console.log('🔌 WebSocket not available for CoinGecko, using enhanced polling');
    
    // Future WebSocket URLs could be:
    // wss://ws.coincap.io/prices?assets=bitcoin,ethereum
    // wss://stream.binance.com:9443/ws/btcusdt@ticker
    
    this.setState({ connectionStatus: 'polling' });
  };

  initializeWebSocket = (url) => {
    if (!url) return;
    
    try {
      this.webSocket = new WebSocket(url);
      
      this.webSocket.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.setState({ 
          connectionStatus: 'websocket',
          consecutiveErrors: 0
        });
        this.reconnectAttempts = 0;
      };
      
      this.webSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketData(data);
        } catch (error) {
          console.error('WebSocket data parsing error:', error);
        }
      };
      
      this.webSocket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.setState({ connectionStatus: 'polling' });
        this.attemptWebSocketReconnect();
      };
      
      this.webSocket.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        this.handleWebSocketError();
      };
      
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      this.setState({ connectionStatus: 'polling' });
    }
  };

  handleWebSocketData = (data) => {
    // Process real-time price data
    if (data.price && data.symbol) {
      const symbol = data.symbol.toLowerCase();
      this.setState(prevState => ({
        checkedPrices: {
          ...prevState.checkedPrices,
          [symbol]: data.price
        }
      }));
      
      // Trigger immediate alert check for this symbol
      this.checkSpecificCoinAlerts(symbol, data.price);
    }
  };

  checkSpecificCoinAlerts = async (coinSymbol, currentPrice) => {
    try {
      const alerts = await this.getCachedAlerts();
      const coinAlerts = alerts.filter(alert => 
        alert.coinSymbol.toLowerCase() === coinSymbol && 
        alert.isActive && 
        !this.isAlertInCooldown(alert)
      );

      for (const alert of coinAlerts) {
        const shouldTrigger = this.evaluateAdvancedAlert(alert, currentPrice, 0);
        if (shouldTrigger) {
          await this.handleSingleTriggeredAlert(alert, currentPrice);
        }
      }
    } catch (error) {
      console.error('Specific coin alert check error:', error);
    }
  };

  attemptWebSocketReconnect = () => {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`🔌 Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket(this.webSocketUrl);
      }, delay);
    }
  };

  handleWebSocketError = () => {
    this.setState(prevState => ({
      consecutiveErrors: prevState.consecutiveErrors + 1,
      connectionStatus: 'error'
    }));
  };

  closeWebSocket = () => {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  };

  // Performance Optimizations
  handleTriggeredAlertsBatch = async (triggeredAlerts) => {
    if (triggeredAlerts.length === 0) return;

    console.log(`🚨 Processing ${triggeredAlerts.length} triggered alerts in batch...`);

    // Group alerts by type for efficient processing
    const alertGroups = this.groupAlertsByType(triggeredAlerts);
    
    // Process notifications in batches to avoid spam
    for (const [alertType, alerts] of alertGroups) {
      if (alerts.length === 1) {
        // Single alert - full notification
        await this.handleSingleTriggeredAlert(alerts[0], alerts[0].currentPrice);
      } else {
        // Multiple alerts - condensed notification
        await this.handleBatchNotification(alertType, alerts);
      }
      
      // Small delay between batches to prevent overwhelming
      await this.delay(500);
    }
  };

  groupAlertsByType = (alerts) => {
    const groups = new Map();
    alerts.forEach(alert => {
      const type = alert.alertType;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type).push(alert);
    });
    return groups;
  };

  handleSingleTriggeredAlert = async (alert, currentPrice) => {
    const { coin, coinSymbol, type, targetPrice } = alert;
    const alertCoin = coin || coinSymbol; // Support both field names
    
    let title = '';
    let message = '';
    
    switch (type) {
      case 'price_above':
      case 'above':
        title = `${alertCoin.toUpperCase()} Price Alert! 📈`;
        message = `${alertCoin.toUpperCase()} reached $${currentPrice.toFixed(2)} (target: $${targetPrice.toFixed(2)})`;
        break;
      case 'price_below':
      case 'below':
        title = `${alertCoin.toUpperCase()} Price Alert! 📉`;
        message = `${alertCoin.toUpperCase()} dropped to $${currentPrice.toFixed(2)} (target: $${targetPrice.toFixed(2)})`;
        break;
      default:
        title = `${alertCoin.toUpperCase()} Alert!`;
        message = `Price alert triggered at $${currentPrice.toFixed(2)}`;
    }

    // Show notification with enhanced data
    showNotification({
      title,
      message,
      type: 'alert',
      coinSymbol: alertCoin,
      currentPrice,
      targetPrice,
      alertType: type,
      timestamp: alert.triggeredAt
    });

    // Browser notification with rate limiting
    await this.showBrowserNotification(title, message, alertCoin);
  };

  handleBatchNotification = async (alertType, alerts) => {
    const coinCount = alerts.length;
    const coinNames = alerts.slice(0, 3).map(a => a.coinSymbol.toUpperCase()).join(', ');
    const moreText = coinCount > 3 ? ` and ${coinCount - 3} more` : '';
    
    const title = `${coinCount} Price Alerts Triggered! 🚨`;
    const message = `${coinNames}${moreText} alerts triggered`;

    showNotification({
      title,
      message,
      type: 'batch_alert',
      alertCount: coinCount,
      alertType,
      timestamp: new Date().toISOString()
    });

    await this.showBrowserNotification(title, message, 'multiple');
  };

  showBrowserNotification = async (title, message, coinSymbol) => {
    // Rate limit browser notifications (max 1 per 30 seconds per coin)
    const notificationKey = `browser_notification_${coinSymbol}`;
    const lastNotification = this._notificationTimes?.get(notificationKey) || 0;
    const now = Date.now();
    
    if (now - lastNotification < 30000) {
      return; // Skip if too recent
    }

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: `price-alert-${coinSymbol}`,
          requireInteraction: false,
          silent: false
        });

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);
        
        // Track timing
        if (!this._notificationTimes) {
          this._notificationTimes = new Map();
        }
        this._notificationTimes.set(notificationKey, now);
        
      } catch (error) {
        console.error('Browser notification error:', error);
      }
    }
  };

  // Utility methods
  delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Performance monitoring cleanup
  startPerformanceCleanup = () => {
    this._performanceCleanup = setInterval(() => {
      // Clean old cooldowns
      const now = Date.now();
      for (const [alertId, cooldownEnd] of this.alertCooldowns.entries()) {
        if (now > cooldownEnd) {
          this.alertCooldowns.delete(alertId);
        }
      }
      
      // Clean old consecutive triggers
      if (this._consecutiveTriggers) {
        for (const [alertId, triggers] of this._consecutiveTriggers.entries()) {
          const recent = triggers.filter(time => now - time < 300000);
          if (recent.length === 0) {
            this._consecutiveTriggers.delete(alertId);
          } else {
            this._consecutiveTriggers.set(alertId, recent);
          }
        }
      }
      
      // Clean old notification times
      if (this._notificationTimes) {
        for (const [key, time] of this._notificationTimes.entries()) {
          if (now - time > 3600000) { // 1 hour
            this._notificationTimes.delete(key);
          }
        }
      }
    }, 300000); // Every 5 minutes
  };

  handleTriggeredAlerts = (triggeredAlerts) => {
    console.log(`🚨 ${triggeredAlerts.length} alerts triggered!`, triggeredAlerts);

    triggeredAlerts.forEach(alert => {
      const { coinSymbol, alertType, targetPrice, currentPrice } = alert;
      
      let title = '';
      let message = '';
      
      switch (alertType) {
        case 'price_above':
          title = `${coinSymbol.toUpperCase()} Price Alert! 📈`;
          message = `${coinSymbol.toUpperCase()} has reached $${currentPrice.toFixed(2)}, above your target of $${targetPrice.toFixed(2)}`;
          break;
        case 'price_below':
          title = `${coinSymbol.toUpperCase()} Price Alert! 📉`;
          message = `${coinSymbol.toUpperCase()} has dropped to $${currentPrice.toFixed(2)}, below your target of $${targetPrice.toFixed(2)}`;
          break;
        case 'price_change':
          title = `${coinSymbol.toUpperCase()} Price Movement! 🔄`;
          message = `${coinSymbol.toUpperCase()} price has changed significantly to $${currentPrice.toFixed(2)}`;
          break;
        default:
          title = `${coinSymbol.toUpperCase()} Alert!`;
          message = `Price alert triggered at $${currentPrice.toFixed(2)}`;
      }

      // Show notification
      showNotification({
        title,
        message,
        type: 'alert',
        coinSymbol,
        currentPrice,
        targetPrice,
        alertType
      });

      // Browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: `price-alert-${coinSymbol}`,
          requireInteraction: true
        });
      }
    });
  };

  requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showNotification({
            title: 'Notifications Enabled! 🔔',
            message: 'You will now receive browser notifications for price alerts',
            type: 'success'
          });
        }
      });
    }
  };

  toggleStatus = () => {
    this.setState({ showStatus: !this.state.showStatus });
  };

  render() {
    const { 
      isMonitoring, 
      lastCheckTime, 
      checkedPrices, 
      showStatus,
      connectionStatus,
      apiHealthy,
      failedRequests,
      totalAlertChecks,
      performanceMetrics
    } = this.state;
    
    const { coinz } = this.props;
    
    // Don't show if no coins or if there are rate limiting issues
    if (!coinz || Object.keys(coinz).length === 0 || failedRequests > 3) {
      return null;
    }

    const checkedCoins = Object.keys(checkedPrices).length;
    const statusText = isMonitoring 
      ? `Monitoring ${checkedCoins} coins`
      : 'Monitoring paused';

    // Determine status indicator color
    const getStatusColor = () => {
      if (!isMonitoring) return '#666';
      if (connectionStatus === 'error') return '#ff6b6b';
      if (!apiHealthy) return '#ffa500';
      if (connectionStatus === 'websocket') return '#00ff00';
      return '#21ce99';
    };

    const getConnectionStatusText = () => {
      switch (connectionStatus) {
        case 'websocket': return 'WebSocket Connected';
        case 'polling': return 'Polling Mode';
        case 'connecting': return 'Connecting...';
        case 'error': return 'Connection Error';
        case 'disconnected': return 'Disconnected';
        default: return 'Unknown';
      }
    };

    // Test function for manual alert triggering
    const triggerTestAlert = () => {
      console.log('🧪 Manually triggering test alert...');
      showAlertNotification({
        coin: 'btc',
        type: 'above',
        targetPrice: 45000,
        id: 'test-alert-' + Date.now()
      }, 50000, 'USD');
    };

    return (
      <MonitoringContainer show={isMonitoring}>
        {showStatus && (
          <MonitoringStatus>
            <div><strong>Enhanced Price Monitoring</strong></div>
            <div>Status: {statusText}</div>
            <div>Connection: {getConnectionStatusText()}</div>
            {lastCheckTime && (
              <div>Last check: {lastCheckTime.toLocaleTimeString()}</div>
            )}
            <div>Interval: {Math.round(this.currentPollingInterval / 1000)}s</div>
            
            {/* Performance Metrics */}
            <div style={{ marginTop: '8px', borderTop: '1px solid #444', paddingTop: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Performance</div>
              <div>Alerts checked: {totalAlertChecks}</div>
              <div>Failed requests: {failedRequests}</div>
              {performanceMetrics.requestCount > 0 && (
                <>
                  <div>Avg response: {Math.round(performanceMetrics.avgResponseTime)}ms</div>
                  <div>Last response: {Math.round(performanceMetrics.lastResponseTime)}ms</div>
                </>
              )}
            </div>
            
            {/* Debug Controls */}
            <div style={{ marginTop: '8px', borderTop: '1px solid #444', paddingTop: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Debug</div>
              <button 
                onClick={triggerTestAlert}
                style={{
                  background: '#21ce99',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  marginTop: '4px'
                }}
              >
                🧪 Test Alert
              </button>
            </div>
            
            <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
              Click for browser notifications
            </div>
          </MonitoringStatus>
        )}
        
        <MonitoringIndicator 
          onClick={() => {
            this.toggleStatus();
            this.requestNotificationPermission();
          }}
          title={`Enhanced monitoring: ${getConnectionStatusText()} - Click for details`}
          style={{ background: `linear-gradient(135deg, ${getStatusColor()}, ${getStatusColor()}dd)` }}
        >
          {connectionStatus === 'websocket' ? '🟢' : connectionStatus === 'error' ? '🔴' : '🟡'} Live Monitor
        </MonitoringIndicator>
      </MonitoringContainer>
    );
  }
}

export default RealTimeMonitoring;
