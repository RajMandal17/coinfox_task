// Test script for Coinfox Alert System
// Run this in browser console when the app is loaded

console.log('🧪 Coinfox Alert System Test Starting...');

// Test 1: Check if alert helpers are available
async function testAlertHelpers() {
  try {
    console.log('Test 1: Checking alert helper functions...');
    
    // Import alert helpers dynamically
    const alertModule = await import('./src/Utils/alertHelpers.js');
    console.log('✅ Alert helpers loaded:', Object.keys(alertModule));
    
    return alertModule;
  } catch (error) {
    console.error('❌ Failed to load alert helpers:', error);
    return null;
  }
}

// Test 2: Create a test alert
async function createTestAlert(alertHelpers) {
  try {
    console.log('Test 2: Creating test alert...');
    
    const testAlert = await alertHelpers.addAlert({
      coin: 'btc',
      type: 'above',
      targetPrice: 1, // Very low price to trigger immediately
      currency: 'USD'
    });
    
    console.log('✅ Test alert created:', testAlert);
    return testAlert;
  } catch (error) {
    console.error('❌ Failed to create test alert:', error);
    return null;
  }
}

// Test 3: Check existing alerts
async function checkExistingAlerts(alertHelpers) {
  try {
    console.log('Test 3: Checking existing alerts...');
    
    const alerts = await alertHelpers.getAllAlerts();
    console.log(`📊 Found ${alerts.length} alerts:`, alerts);
    
    const activeAlerts = await alertHelpers.getActiveAlerts();
    console.log(`🟢 Active alerts: ${activeAlerts.length}`);
    
    return { alerts, activeAlerts };
  } catch (error) {
    console.error('❌ Failed to check alerts:', error);
    return null;
  }
}

// Test 4: Simulate market data check
async function testMarketDataCheck(alertHelpers) {
  try {
    console.log('Test 4: Testing market data check...');
    
    // Mock market data
    const mockMarketData = {
      btc: {
        ticker: {
          price: 50000, // Current BTC price
          change: 2.5
        }
      },
      eth: {
        ticker: {
          price: 3000, // Current ETH price  
          change: 1.8
        }
      }
    };
    
    const triggeredAlerts = await alertHelpers.checkAlertsAgainstMarket(mockMarketData);
    console.log(`🚨 Triggered alerts: ${triggeredAlerts.length}`, triggeredAlerts);
    
    return triggeredAlerts;
  } catch (error) {
    console.error('❌ Failed to test market data check:', error);
    return null;
  }
}

// Test 5: Check notification system
function testNotificationSystem() {
  console.log('Test 5: Testing notification system...');
  
  try {
    // Test basic notification
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: { 
          type: 'success', 
          message: '🧪 Test notification from alert system test', 
          duration: 5000 
        }
      }));
      console.log('✅ Basic notification dispatched');
      
      // Test alert notification
      const mockAlert = {
        id: 'test-alert',
        coin: 'btc',
        type: 'above',
        targetPrice: 45000
      };
      
      window.dispatchEvent(new CustomEvent('showAlertNotification', {
        detail: { 
          alertData: mockAlert, 
          currentPrice: 50000, 
          currency: 'USD' 
        }
      }));
      console.log('✅ Alert notification dispatched');
      
      return true;
    } else {
      console.warn('⚠️ CustomEvent not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ Notification test failed:', error);
    return false;
  }
}

// Run all tests
async function runAlertSystemTests() {
  console.log('🚀 Running complete alert system test suite...');
  
  // Test 1: Load alert helpers
  const alertHelpers = await testAlertHelpers();
  if (!alertHelpers) {
    console.error('💀 Test suite failed - could not load alert helpers');
    return;
  }
  
  // Test 2: Create test alert
  const testAlert = await createTestAlert(alertHelpers);
  
  // Test 3: Check alerts
  const alertData = await checkExistingAlerts(alertHelpers);
  
  // Test 4: Test market data
  const triggeredAlerts = await testMarketDataCheck(alertHelpers);
  
  // Test 5: Test notifications
  const notificationTest = testNotificationSystem();
  
  console.log('🏁 Alert system test completed!');
  console.log('Results:', {
    alertHelpersLoaded: !!alertHelpers,
    testAlertCreated: !!testAlert,
    alertsFound: alertData?.alerts?.length || 0,
    activeAlerts: alertData?.activeAlerts?.length || 0,
    triggeredAlerts: triggeredAlerts?.length || 0,
    notificationSystemWorking: notificationTest
  });
  
  if (testAlert) {
    console.log('🧹 Cleaning up test alert...');
    try {
      await alertHelpers.deleteAlert(testAlert.id);
      console.log('✅ Test alert cleaned up');
    } catch (error) {
      console.warn('⚠️ Could not clean up test alert:', error);
    }
  }
}

// Make functions available globally for manual testing
window.testAlertSystem = {
  runAlertSystemTests,
  testAlertHelpers,
  createTestAlert,
  checkExistingAlerts,
  testMarketDataCheck,
  testNotificationSystem
};

console.log('🧪 Alert system test functions loaded. Run window.testAlertSystem.runAlertSystemTests() to start.');

// Auto-run basic tests if in development
if (window.location.hostname === 'localhost') {
  setTimeout(() => {
    console.log('🤖 Auto-running alert system tests (development mode)...');
    runAlertSystemTests();
  }, 3000);
}
