import React, { Component } from 'react';
import styled from 'styled-components';
import { getAllAlerts, getAlertStats, ALERT_STATUS } from '../Utils/alertHelpers';
import { $numberWithCommas } from '../Utils/Helpers';

const AlertSummaryContainer = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 16px;
  margin: 16px 20px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
`;

const AlertSummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const AlertTitle = styled.h4`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AlertStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 8px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${props => {
    switch (props.type) {
      case 'active': return '#21ce99';
      case 'triggered': return '#ffd93d';
      case 'dismissed': return '#666';
      default: return 'white';
    }
  }};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  color: #aaa;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ViewAllButton = styled.button`
  background: rgba(33, 206, 153, 0.1);
  color: #21ce99;
  border: 1px solid rgba(33, 206, 153, 0.3);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(33, 206, 153, 0.2);
  }
`;

const RecentAlerts = styled.div`
  margin-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 12px;
`;

const RecentAlert = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin: 4px 0;
  background: rgba(255,255,255,0.02);
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.05);
`;

const AlertCoin = styled.span`
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const AlertStatus = styled.span`
  color: ${props => {
    switch (props.status) {
      case ALERT_STATUS.ACTIVE: return '#21ce99';
      case ALERT_STATUS.TRIGGERED: return '#ffd93d';
      case ALERT_STATUS.DISMISSED: return '#666';
      default: return '#aaa';
    }
  }};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
`;

class AlertSummary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      alertStats: {
        total: 0,
        active: 0,
        triggered: 0,
        dismissed: 0,
        byType: { above: 0, below: 0 },
        byStatus: { active: 0, triggered: 0, dismissed: 0 }
      },
      recentAlerts: [],
      loading: true
    };
  }

  componentDidMount() {
    this.loadAlertData();
    
    // Refresh alert data every 30 seconds
    this.alertInterval = setInterval(this.loadAlertData, 30000);
  }

  componentWillUnmount() {
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }
  }

  loadAlertData = async () => {
    try {
      const [stats, allAlerts] = await Promise.all([
        getAlertStats(),
        getAllAlerts()
      ]);
      
      // Get recent alerts (last 10, sorted by creation date)
      const recentAlerts = allAlerts
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
      
      this.setState({
        alertStats: stats,
        recentAlerts,
        loading: false
      });
    } catch (error) {
      console.error('Error loading alert data:', error);
      this.setState({ loading: false });
    }
  };

  formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  handleViewAll = () => {
    // Navigate to alerts page or open modal
    console.log('View all alerts');
    // Could navigate to /alerts route when implemented
  };

  render() {
    const { alertStats, recentAlerts, loading } = this.state;
    
    if (loading) {
      return (
        <AlertSummaryContainer>
          <AlertTitle>🚨 Loading alerts...</AlertTitle>
        </AlertSummaryContainer>
      );
    }

    if (alertStats.total === 0) {
      return (
        <AlertSummaryContainer>
          <AlertSummaryHeader>
            <AlertTitle>🚨 Price Alerts</AlertTitle>
          </AlertSummaryHeader>
          <EmptyState>
            No price alerts set. Add alerts to get notified when prices hit your targets.
          </EmptyState>
        </AlertSummaryContainer>
      );
    }

    return (
      <AlertSummaryContainer>
        <AlertSummaryHeader>
          <AlertTitle>🚨 Price Alerts</AlertTitle>
          <ViewAllButton onClick={this.handleViewAll}>
            View All
          </ViewAllButton>
        </AlertSummaryHeader>

        <AlertStats>
          <StatItem>
            <StatValue>{alertStats.total}</StatValue>
            <StatLabel>Total</StatLabel>
          </StatItem>
          
          <StatItem>
            <StatValue type="active">{alertStats.active}</StatValue>
            <StatLabel>Active</StatLabel>
          </StatItem>
          
          <StatItem>
            <StatValue type="triggered">{alertStats.triggered}</StatValue>
            <StatLabel>Triggered</StatLabel>
          </StatItem>
          
          <StatItem>
            <StatValue type="dismissed">{alertStats.dismissed}</StatValue>
            <StatLabel>Dismissed</StatLabel>
          </StatItem>
        </AlertStats>

        {recentAlerts.length > 0 && (
          <RecentAlerts>
            {recentAlerts.map(alert => (
              <RecentAlert key={alert.id}>
                <div>
                  <AlertCoin>{alert.coin.toUpperCase()}</AlertCoin>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>
                    {alert.type} ${$numberWithCommas(alert.targetPrice.toFixed(2))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <AlertStatus status={alert.status}>
                    {alert.status}
                  </AlertStatus>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {this.formatDate(alert.createdAt)}
                  </div>
                </div>
              </RecentAlert>
            ))}
          </RecentAlerts>
        )}
      </AlertSummaryContainer>
    );
  }
}

export default AlertSummary;
