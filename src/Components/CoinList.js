import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { $numberWithCommas, $currencySymbol } from '../Utils/Helpers';
import { translationStrings } from '../Utils/i18n';
import { getAlertsForCoin, ALERT_STATUS } from '../Utils/alertHelpers';
import QuickActions from './QuickActions';
import styled from 'styled-components';
import { showNotification } from './Notifications';

const CoinListContainer = styled.div`
  padding: 0 20px;
`;

const CoinItem = styled.div`
  background: #303032;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  &:hover {
    border-color: #21ce99;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 206, 153, 0.1);
  }
`;

const CoinInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AlertBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'linear-gradient(135deg, #21ce99, #00d4aa)';
      case 'triggered': return 'linear-gradient(135deg, #ffd93d, #ffed4e)';
      default: return '#666';
    }
  }};
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border: 2px solid #303032;
  animation: ${props => props.status === 'triggered' ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const CoinIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #21ce99, #1a4d2e);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
  position: relative;
`;

const CoinDetails = styled.div`
  flex: 1;
`;

const CoinName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

const CoinQuantity = styled.div`
  font-size: 14px;
  color: #aaa;
`;

const CoinValue = styled.div`
  text-align: right;
  margin-right: 16px;
`;

const TotalValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

const CurrentPrice = styled.div`
  font-size: 14px;
  color: #aaa;
`;

const Performance = styled.div`
  text-align: center;
  margin-right: 16px;
  min-width: 80px;
`;

const PerformanceValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.isPositive ? '#21ce99' : '#ff6b6b'};
  margin-bottom: 4px;
`;

const PerformanceLabel = styled.div`
  font-size: 12px;
  color: #aaa;
`;

const FavoriteButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.isFavorite ? '#ffd700' : '#555'};
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-right: 8px;
  
  &:hover {
    color: ${props => props.isFavorite ? '#ffed4e' : '#777'};
    background: #404042;
  }
`;

const string = translationStrings();

class CoinList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      favorites: JSON.parse(localStorage.getItem('coinFavorites') || '[]'),
      coinAlerts: {} // Store alerts for each coin
    };
  }

  componentDidMount() {
    this.loadAllCoinAlerts();
  }

  componentDidUpdate(prevProps) {
    // Reload alerts if coinz prop changes
    if (prevProps.coinz !== this.props.coinz) {
      this.loadAllCoinAlerts();
    }
  }

  loadAllCoinAlerts = async () => {
    const { coinz } = this.props;
    if (!coinz) return;

    const alertsMap = {};
    
    try {
      for (const coin of Object.keys(coinz)) {
        const alerts = await getAlertsForCoin(coin);
        if (alerts.length > 0) {
          alertsMap[coin] = alerts;
        }
      }
      
      this.setState({ coinAlerts: alertsMap });
    } catch (error) {
      console.error('Error loading coin alerts:', error);
    }
  };

  getAlertSummary = (coin) => {
    const alerts = this.state.coinAlerts[coin] || [];
    const activeAlerts = alerts.filter(alert => alert.status === ALERT_STATUS.ACTIVE);
    const triggeredAlerts = alerts.filter(alert => alert.status === ALERT_STATUS.TRIGGERED);
    
    return {
      total: alerts.length,
      active: activeAlerts.length,
      triggered: triggeredAlerts.length,
      hasTriggered: triggeredAlerts.length > 0,
      hasActive: activeAlerts.length > 0
    };
  };

  toggleFavorite = (coin) => {
    const { favorites } = this.state;
    const isCurrentlyFavorite = favorites.includes(coin);
    const newFavorites = isCurrentlyFavorite
      ? favorites.filter(f => f !== coin)
      : [...favorites, coin];
    
    this.setState({ favorites: newFavorites });
    localStorage.setItem('coinFavorites', JSON.stringify(newFavorites));
    
    // Show notification
    if (isCurrentlyFavorite) {
      showNotification('info', `${coin.toUpperCase()} removed from favorites`);
    } else {
      showNotification('success', `${coin.toUpperCase()} added to favorites`);
    }
  };

  handleEdit = (coin) => {
    // Navigate to edit page or open edit modal
    console.log('Edit coin:', coin);
  };

  handleRemove = (coin) => {
    if (window.confirm(`Remove ${coin.toUpperCase()} from your portfolio?`)) {
      // Call remove function from parent
      console.log('Remove coin:', coin);
    }
  };

  handleViewDetails = (coin) => {
    // Navigate to coin details page
    window.location.href = `/coin/${coin}`;
  };

  handleManageAlerts = (coin) => {
    // Navigate to coin page with alerts section open
    window.location.href = `/coin/${coin}#alerts`;
  };

  render() {
    const coinz = this.props.coinz ? this.props.coinz : false;
    const marketData = this.props.marketData ? this.props.marketData : false;
    const curSymbol = $currencySymbol(this.props.currency);
    const { searchTerm, activeFilter, sortBy } = this.props;
    
    if (!coinz || !marketData) {
      return <div>Loading...</div>;
    }

    let filteredCoins = Object.keys(coinz);
    
    // Apply search filter
    if (searchTerm) {
      filteredCoins = filteredCoins.filter(coin => 
        coin.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply active filter
    if (activeFilter === 'favorites') {
      filteredCoins = filteredCoins.filter(coin => 
        this.state.favorites.includes(coin)
      );
    } else if (activeFilter === 'gaining') {
      filteredCoins = filteredCoins.filter(coin => {
        const price = (marketData[coin] && marketData[coin].ticker && marketData[coin].ticker.price) || 0;
        const costBasis = coinz[coin].cost_basis * this.props.exchangeRate;
        return price >= costBasis;
      });
    } else if (activeFilter === 'losing') {
      filteredCoins = filteredCoins.filter(coin => {
        const price = (marketData[coin] && marketData[coin].ticker && marketData[coin].ticker.price) || 0;
        const costBasis = coinz[coin].cost_basis * this.props.exchangeRate;
        return price < costBasis;
      });
    }

    const coinzWithPrice = filteredCoins.map((coin, i) => {
      const coinPrice = (marketData[coin] && marketData[coin].ticker && marketData[coin].ticker.price) || 0;
      const price = marketData[coin] && marketData[coin].ticker
        ? Number(coinPrice * this.props.exchangeRate)
        : 0;

      const coinRound = Math.round(coinz[coin].hodl * 100) / 100;
      const hodlValue = price * coinz[coin].hodl;
      const costBasis = coinz[coin].cost_basis * this.props.exchangeRate;
      const performance = ((price - costBasis) / costBasis) * 100;
      const isPositive = performance >= 0;

      return {
        coin,
        price,
        coinRound,
        hodlValue,
        performance,
        isPositive,
        costBasis
      };
    });

    // Apply sorting
    switch (sortBy) {
      case 'name':
        coinzWithPrice.sort((a, b) => a.coin.localeCompare(b.coin));
        break;
      case 'performance':
        coinzWithPrice.sort((a, b) => b.performance - a.performance);
        break;
      case 'quantity':
        coinzWithPrice.sort((a, b) => b.coinRound - a.coinRound);
        break;
      case 'value':
      default:
        coinzWithPrice.sort((a, b) => b.hodlValue - a.hodlValue);
        break;
    }

    if (coinzWithPrice.length === 0) {
      return (
        <CoinListContainer>
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            <i className="fa fa-search" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <h3>No coins found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        </CoinListContainer>
      );
    }

    return (
      <CoinListContainer>
        {coinzWithPrice.map((coinData, i) => {
          const isFavorite = this.state.favorites.includes(coinData.coin);
          const alertSummary = this.getAlertSummary(coinData.coin);
          
          return (
            <CoinItem key={i}>
              <CoinInfo>
                <CoinIcon>
                  {coinData.coin.toUpperCase().charAt(0)}
                  {alertSummary.total > 0 && (
                    <AlertBadge 
                      status={alertSummary.hasTriggered ? 'triggered' : 'active'}
                      title={`${alertSummary.total} alert${alertSummary.total !== 1 ? 's' : ''}`}
                    >
                      {alertSummary.total}
                    </AlertBadge>
                  )}
                </CoinIcon>
                
                <CoinDetails>
                  <CoinName>{coinData.coin.toUpperCase()}</CoinName>
                  <CoinQuantity>{coinData.coinRound} {string.coins}</CoinQuantity>
                </CoinDetails>
              </CoinInfo>

              <Performance>
                <PerformanceValue isPositive={coinData.isPositive}>
                  {coinData.isPositive ? '+' : ''}{coinData.performance.toFixed(2)}%
                </PerformanceValue>
                <PerformanceLabel>Performance</PerformanceLabel>
              </Performance>

              <CoinValue>
                <TotalValue>{curSymbol}{$numberWithCommas(coinData.hodlValue.toFixed(2))}</TotalValue>
                <CurrentPrice>{curSymbol}{$numberWithCommas(coinData.price.toFixed(2))}</CurrentPrice>
              </CoinValue>

              <FavoriteButton
                isFavorite={isFavorite}
                onClick={() => this.toggleFavorite(coinData.coin)}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <i className={`fa fa-${isFavorite ? 'heart' : 'heart-o'}`} aria-hidden="true"></i>
              </FavoriteButton>

              <QuickActions
                coin={coinData.coin}
                onEdit={this.handleEdit}
                onRemove={this.handleRemove}
                onToggleFavorite={() => this.toggleFavorite(coinData.coin)}
                isFavorite={isFavorite}
                onViewDetails={this.handleViewDetails}
                onManageAlerts={this.handleManageAlerts}
              />
            </CoinItem>
          );
        })}
      </CoinListContainer>
    );
  }
}

export default CoinList;
