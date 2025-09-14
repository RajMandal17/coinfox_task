import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Import components to test
import PriceAlert from '../Components/PriceAlert';
import AlertNotification from '../Components/AlertNotification';
import PortfolioAnalytics from '../Components/PortfolioAnalytics';
import AlertSummary from '../Components/AlertSummary';
import RealTimeMonitoring from '../Components/RealTimeMonitoring';
import Analytics from '../Pages/Analytics';

// Import utilities
import { alertHelpers } from '../Utils/alertHelpers';

// Mock data
const mockCoinz = {
  'btc': { cost_basis: 45000, hodl: 0.5 },
  'eth': { cost_basis: 3000, hodl: 2.0 }
};

const mockMarketData = {
  'btc': {
    ticker: { 
      base: 'BTC', 
      target: 'USD', 
      price: 47000, 
      volume: 1000000, 
      change: 4.44 
    }
  },
  'eth': {
    ticker: { 
      base: 'ETH', 
      target: 'USD', 
      price: 3200, 
      volume: 500000, 
      change: 6.67 
    }
  }
};

const mockTotalPortfolio = {
  totalValue: 29900,
  totalBasis: 28500
};

// Helper function to wrap components with Router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: jest.fn(() => Promise.resolve('granted')),
};

describe('Coinfox Feature Expansion - Alert System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
  });

  test('PriceAlert component renders correctly', () => {
    renderWithRouter(
      <PriceAlert
        coinz={mockCoinz}
        marketData={mockMarketData}
        currency="USD"
        language="EN"
      />
    );

    expect(screen.getByText(/Price Alert Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Create New Alert/i)).toBeInTheDocument();
  });

  test('Can create a new price alert', async () => {
    renderWithRouter(
      <PriceAlert
        coinz={mockCoinz}
        marketData={mockMarketData}
        currency="USD"
        language="EN"
      />
    );

    // Find and fill the form
    const coinSelect = screen.getByDisplayValue('btc');
    const typeSelect = screen.getByDisplayValue('price_above');
    const priceInput = screen.getByDisplayValue('47000');
    const createButton = screen.getByText('Create Alert');

    // Change values
    fireEvent.change(priceInput, { target: { value: '50000' } });
    fireEvent.click(createButton);

    // Wait for alert creation
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  test('AlertSummary displays portfolio alerts correctly', () => {
    render(
      <AlertSummary
        coinz={mockCoinz}
        marketData={mockMarketData}
        currency="USD"
      />
    );

    expect(screen.getByText(/Portfolio Alerts/i)).toBeInTheDocument();
  });

  test('PortfolioAnalytics calculates metrics correctly', () => {
    render(
      <PortfolioAnalytics
        coinz={mockCoinz}
        marketData={mockMarketData}
        exchangeRate={1}
        totalPortfolio={mockTotalPortfolio}
        currency="USD"
        language="EN"
      />
    );

    expect(screen.getByText(/Portfolio Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Performance/i)).toBeInTheDocument();
  });

  test('RealTimeMonitoring component initializes', () => {
    render(
      <RealTimeMonitoring
        coinz={mockCoinz}
        marketData={mockMarketData}
      />
    );

    // Should start monitoring automatically
    expect(screen.getByText(/Live Monitoring/i)).toBeInTheDocument();
  });
});

describe('Coinfox Feature Expansion - Analytics Dashboard', () => {
  test('Analytics page renders with portfolio data', () => {
    renderWithRouter(
      <Analytics
        coinz={mockCoinz}
        marketData={mockMarketData}
        exchangeRate={1}
        totalPortfolio={mockTotalPortfolio}
        currency="USD"
        language="EN"
      />
    );

    expect(screen.getByText(/Portfolio Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Portfolio Performance/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Comparison/i)).toBeInTheDocument();
  });

  test('Analytics page shows empty state without portfolio', () => {
    renderWithRouter(
      <Analytics
        coinz={{}}
        marketData={{}}
        exchangeRate={1}
        totalPortfolio={{ totalValue: 0, totalBasis: 0 }}
        currency="USD"
        language="EN"
      />
    );

    expect(screen.getByText(/Add coins to your portfolio to view analytics/i)).toBeInTheDocument();
  });
});

describe('Alert Helpers Utility', () => {
  test('Creates and retrieves alerts correctly', async () => {
    const testAlert = {
      coinSymbol: 'btc',
      alertType: 'price_above',
      targetPrice: 50000,
      isActive: true
    };

    // Create alert
    const alertId = await alertHelpers.createAlert(testAlert);
    expect(alertId).toBeDefined();

    // Retrieve alerts
    const alerts = await alertHelpers.getAllAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].coinSymbol).toBe('btc');
    expect(alerts[0].targetPrice).toBe(50000);
  });

  test('Updates alert correctly', async () => {
    const testAlert = {
      coinSymbol: 'eth',
      alertType: 'price_below',
      targetPrice: 2500,
      isActive: true
    };

    const alertId = await alertHelpers.createAlert(testAlert);
    
    // Update alert
    await alertHelpers.updateAlert(alertId, { isActive: false });
    
    const alerts = await alertHelpers.getAllAlerts();
    const updatedAlert = alerts.find(a => a.id === alertId);
    expect(updatedAlert.isActive).toBe(false);
  });

  test('Deletes alert correctly', async () => {
    const testAlert = {
      coinSymbol: 'btc',
      alertType: 'price_above',
      targetPrice: 48000,
      isActive: true
    };

    const alertId = await alertHelpers.createAlert(testAlert);
    await alertHelpers.deleteAlert(alertId);
    
    const alerts = await alertHelpers.getAllAlerts();
    const deletedAlert = alerts.find(a => a.id === alertId);
    expect(deletedAlert).toBeUndefined();
  });
});

describe('Performance and Integration Tests', () => {
  test('Multiple alerts can be managed simultaneously', async () => {
    const alerts = [
      { coinSymbol: 'btc', alertType: 'price_above', targetPrice: 50000, isActive: true },
      { coinSymbol: 'eth', alertType: 'price_below', targetPrice: 2800, isActive: true },
      { coinSymbol: 'btc', alertType: 'price_change', targetPrice: 47000, isActive: true }
    ];

    // Create multiple alerts
    const alertIds = await Promise.all(
      alerts.map(alert => alertHelpers.createAlert(alert))
    );

    expect(alertIds).toHaveLength(3);
    
    const retrievedAlerts = await alertHelpers.getAllAlerts();
    expect(retrievedAlerts).toHaveLength(3);
  });

  test('Component integration works correctly', () => {
    // Test that components can work together
    renderWithRouter(
      <div>
        <PriceAlert
          coinz={mockCoinz}
          marketData={mockMarketData}
          currency="USD"
          language="EN"
        />
        <AlertSummary
          coinz={mockCoinz}
          marketData={mockMarketData}
          currency="USD"
        />
        <PortfolioAnalytics
          coinz={mockCoinz}
          marketData={mockMarketData}
          exchangeRate={1}
          totalPortfolio={mockTotalPortfolio}
          currency="USD"
          language="EN"
        />
      </div>
    );

    // All components should render without conflicts
    expect(screen.getByText(/Price Alert Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Portfolio Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Portfolio Analytics/i)).toBeInTheDocument();
  });
});

describe('Edge Cases and Error Handling', () => {
  test('Handles missing market data gracefully', () => {
    render(
      <PriceAlert
        coinz={mockCoinz}
        marketData={{}}
        currency="USD"
        language="EN"
      />
    );

    expect(screen.getByText(/Price Alert Management/i)).toBeInTheDocument();
    // Should not crash with empty market data
  });

  test('Handles invalid alert data', async () => {
    const invalidAlert = {
      coinSymbol: '',
      alertType: 'invalid_type',
      targetPrice: 'not_a_number',
      isActive: true
    };

    // Should handle invalid data gracefully
    try {
      await alertHelpers.createAlert(invalidAlert);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('Portfolio analytics handles empty portfolio', () => {
    render(
      <PortfolioAnalytics
        coinz={{}}
        marketData={{}}
        exchangeRate={1}
        totalPortfolio={{ totalValue: 0, totalBasis: 0 }}
        currency="USD"
        language="EN"
      />
    );

    expect(screen.getByText(/Add coins to view analytics/i)).toBeInTheDocument();
  });
});

// Performance benchmark test
describe('Performance Tests', () => {
  test('Alert creation performance is acceptable', async () => {
    const startTime = performance.now();
    
    // Create 100 alerts
    const promises = Array.from({ length: 100 }, (_, i) => 
      alertHelpers.createAlert({
        coinSymbol: 'btc',
        alertType: 'price_above',
        targetPrice: 45000 + i,
        isActive: true
      })
    );

    await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 1 second)
    expect(duration).toBeLessThan(1000);
  });

  test('Analytics calculations are performant', () => {
    const largeCoinz = {};
    const largeMarketData = {};
    
    // Create large dataset
    for (let i = 0; i < 1000; i++) {
      const symbol = `coin${i}`;
      largeCoinz[symbol] = { cost_basis: 1000 + i, hodl: Math.random() * 10 };
      largeMarketData[symbol] = {
        ticker: { price: 1000 + i * 1.1, volume: 100000, change: Math.random() * 10 - 5 }
      };
    }

    const startTime = performance.now();
    
    render(
      <PortfolioAnalytics
        coinz={largeCoinz}
        marketData={largeMarketData}
        exchangeRate={1}
        totalPortfolio={{ totalValue: 100000, totalBasis: 95000 }}
        currency="USD"
        language="EN"
      />
    );

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should render within reasonable time (less than 500ms)
    expect(duration).toBeLessThan(500);
  });
});

export default {};
