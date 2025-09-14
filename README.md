# 🚨 Coinfox - Cryptocurrency Portfolio Tracker

A comprehensive cryptocurrency portfolio tracker with real-time price alerts and advanced analytics.

![Coinfox Dashboard](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-Ready-green) ![Alerts](https://img.shields.io/badge/Price%20Alerts-Active-orange) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🔔 Real-time Price Alerts
- **Above/Below Threshold Alerts**: Set price targets and get notified instantly
- **Browser Notifications**: Desktop notifications when alerts trigger
- **Alert Management**: Create, edit, delete, and track alert history
- **Multiple Alert Types**: Support for both "Price Above" and "Price Below" alerts
- **Real-time Monitoring**: Automatic price checking every 5 minutes

### 📊 Portfolio Analytics
- **Portfolio Tracking**: Track multiple cryptocurrencies in real-time
- **Performance Metrics**: View gains/losses, percentage changes
- **Advanced Charts**: Interactive price charts and portfolio value tracking
- **Currency Support**: Multiple fiat currency support

### 🔗 Data & Storage
- **Blockstack Integration**: Decentralized data storage with Gaia
- **Local Storage**: Fallback for anonymous users
- **CoinGecko API**: Reliable market data with rate limiting
- **WebSocket Support**: Real-time price updates when available

### 🎨 User Experience
- **Mobile Responsive**: Optimized for all device sizes
- **Dark Theme**: Modern dark UI with glassmorphism effects
- **Intuitive Interface**: Clean, user-friendly design
- **Multi-language Support**: i18n ready

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Modern web browser with notification support

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/coinfox-portfolio-tracker.git
cd coinfox-portfolio-tracker

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## 📱 Setting Up Price Alerts

### Method 1: Through Coin Pages
1. Add coins to your portfolio
2. Click on any coin to view details
3. Click "🚨 Show Price Alerts"
4. Set your alert type and target price
5. Click "Add Alert"

### Method 2: Quick Test Setup
1. Open browser console (F12)
2. Run: `window.debugAlertSystem()`
3. This creates test alerts to verify the system

### Browser Notification Setup
1. Grant notification permissions when prompted
2. Test with: `window.testNotification()`

## 🛠️ Technical Architecture

### Core Components
- **RealTimeMonitoring**: Price monitoring engine with 5-minute intervals
- **PriceAlert**: Alert management UI component
- **AlertNotification**: Notification display system
- **alertHelpers**: CRUD operations for alert management

### API Integration
- **CoinGecko API**: Primary market data source
- **Rate Limiting**: Built-in request throttling and circuit breaker
- **Caching**: Intelligent caching to reduce API calls
- **Error Handling**: Comprehensive error recovery

### Storage Systems
- **localStorage**: For anonymous users
- **Blockstack/Gaia**: For authenticated users
- **Session Management**: Automatic storage switching

## 🧪 Testing & Debug

### Debug Functions
```javascript
// Available in browser console
window.debugAlertSystem()    // Create test alerts
window.testNotification()    // Test notifications
window.checkAlertSystem()    // Verify system status
```

### Testing Guide
Visit `/price-alert-guide.html` for an interactive setup guide with:
- Portfolio checking
- Test alert creation
- Notification testing
- System verification

## 📈 Performance Features

### Monitoring
- **WebSocket Fallback**: Automatic switching between WebSocket and polling
- **Performance Metrics**: Response time tracking
- **Health Monitoring**: API health status
- **Error Recovery**: Automatic retry mechanisms

### Optimization
- **Efficient Polling**: Adaptive polling intervals
- **Request Batching**: Minimize API calls
- **Background Processing**: Non-blocking price checks
- **Memory Management**: Efficient state management

## 🔧 Configuration

### Environment Variables
```bash
REACT_APP_COINGECKO_API_KEY=your_api_key_here
REACT_APP_BLOCKSTACK_APP_DOMAIN=your_domain.com
```

### Alert System Settings
- Default polling interval: 5 minutes
- Max failed requests before circuit breaker: 5
- Notification timeout: 5 seconds
- Alert history retention: 30 days

## 📊 Project Status

### ✅ Completed Features
- ✅ Real-time price monitoring
- ✅ Price alert system (Above/Below thresholds)
- ✅ Browser notifications
- ✅ Alert management UI
- ✅ Portfolio tracking
- ✅ Blockstack integration
- ✅ Rate limiting and error handling
- ✅ Mobile responsive design
- ✅ Comprehensive testing suite

### 🔄 In Progress
- Enhanced analytics dashboard
- Historical alert performance
- Advanced notification types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- [CoinGecko](https://coingecko.com) for providing free cryptocurrency API
- [Blockstack](https://blockstack.org) for decentralized storage solutions
- React community for excellent documentation and tools

## 📞 Support

For support, email raj@coinfox.dev or open an issue on GitHub.

---

**⭐ Star this repository if you find it helpful!**
# coinfox_task
# coinfox_task
# coinfox_task
