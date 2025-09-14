import React, { Component } from 'react';
import styled from 'styled-components';
import { 
  getAllAlerts,
  addAlert,
  updateAlert,
  deleteAlert,
  dismissAlert,
  getAlertsForCoin,
  ALERT_TYPES,
  ALERT_STATUS
} from '../Utils/alertHelpers';
import { $currencySymbol, $numberWithCommas } from '../Utils/Helpers';
import { showNotification } from './Notifications';

// Styled Components
const PriceAlertContainer = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  margin: 16px 0;
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const AlertTitle = styled.h3`
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AlertIcon = styled.span`
  font-size: 24px;
`;

const AlertForm = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 16px;
  margin-bottom: 24px;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #aaa;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 16px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #21ce99;
    box-shadow: 0 0 0 2px rgba(33, 206, 153, 0.2);
  }
  
  &::placeholder {
    color: #666;
  }
`;

const Select = styled.select`
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #21ce99;
    box-shadow: 0 0 0 2px rgba(33, 206, 153, 0.2);
  }
  
  option {
    background: #303032;
    color: white;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #21ce99, #00d4aa);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 206, 153, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const AlertsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AlertItem = styled.div`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(33, 206, 153, 0.3);
    background: rgba(255,255,255,0.05);
  }
`;

const AlertInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AlertCoin = styled.div`
  background: linear-gradient(135deg, #21ce99, #1a4d2e);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const AlertDetails = styled.div`
  flex: 1;
`;

const AlertText = styled.div`
  color: white;
  font-weight: 600;
  margin-bottom: 4px;
`;

const AlertMeta = styled.div`
  color: #aaa;
  font-size: 12px;
  display: flex;
  gap: 16px;
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
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
`;

const AlertActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: ${props => props.danger ? '#ff6b6b' : 'rgba(255,255,255,0.1)'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.danger ? '#ff5252' : 'rgba(255,255,255,0.2)'};
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #aaa;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyText = styled.h4`
  color: #aaa;
  margin: 0 0 8px 0;
`;

const EmptySubtext = styled.p`
  color: #666;
  margin: 0;
  font-size: 14px;
`;

class PriceAlert extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      alerts: [],
      loading: true,
      formData: {
        coin: '',
        type: ALERT_TYPES.ABOVE,
        targetPrice: '',
        currency: 'USD'
      },
      editingAlert: null,
      submitting: false
    };
  }

  componentDidMount() {
    this.loadAlerts();
    
    // If a specific coin is provided, set it in the form
    if (this.props.coin) {
      this.setState({
        formData: {
          ...this.state.formData,
          coin: this.props.coin.toLowerCase()
        }
      });
    }
  }

  loadAlerts = async () => {
    try {
      this.setState({ loading: true });
      
      let alerts;
      if (this.props.coin) {
        // Load alerts for specific coin
        alerts = await getAlertsForCoin(this.props.coin);
      } else {
        // Load all alerts
        alerts = await getAllAlerts();
      }
      
      // Sort alerts: active first, then by creation date
      alerts.sort((a, b) => {
        if (a.status === ALERT_STATUS.ACTIVE && b.status !== ALERT_STATUS.ACTIVE) return -1;
        if (b.status === ALERT_STATUS.ACTIVE && a.status !== ALERT_STATUS.ACTIVE) return 1;
        return b.createdAt - a.createdAt;
      });
      
      this.setState({ alerts, loading: false });
    } catch (error) {
      console.error('Error loading alerts:', error);
      showNotification('error', 'Failed to load alerts', 3000);
      this.setState({ loading: false });
    }
  };

  handleInputChange = (field, value) => {
    this.setState({
      formData: {
        ...this.state.formData,
        [field]: value
      }
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    
    const { formData, editingAlert } = this.state;
    
    // Validation
    if (!formData.coin || !formData.targetPrice) {
      showNotification('error', 'Please fill in all required fields', 3000);
      return;
    }

    if (formData.targetPrice <= 0) {
      showNotification('error', 'Target price must be greater than 0', 3000);
      return;
    }

    try {
      this.setState({ submitting: true });
      
      if (editingAlert) {
        // Update existing alert
        const success = await updateAlert(editingAlert.id, {
          type: formData.type,
          targetPrice: Number(formData.targetPrice),
          currency: formData.currency
        });
        
        if (success) {
          this.setState({ editingAlert: null });
          this.resetForm();
        }
      } else {
        // Create new alert
        const alertData = {
          coin: formData.coin,
          type: formData.type,
          targetPrice: Number(formData.targetPrice),
          currency: formData.currency
        };
        
        const newAlert = await addAlert(alertData);
        
        if (newAlert) {
          this.resetForm();
        }
      }
      
      // Reload alerts
      await this.loadAlerts();
      
    } catch (error) {
      console.error('Error submitting alert:', error);
      showNotification('error', 'Failed to save alert', 3000);
    } finally {
      this.setState({ submitting: false });
    }
  };

  resetForm = () => {
    this.setState({
      formData: {
        coin: this.props.coin || '',
        type: ALERT_TYPES.ABOVE,
        targetPrice: '',
        currency: 'USD'
      },
      editingAlert: null
    });
  };

  handleEdit = (alert) => {
    this.setState({
      editingAlert: alert,
      formData: {
        coin: alert.coin,
        type: alert.type,
        targetPrice: alert.targetPrice.toString(),
        currency: alert.currency
      }
    });
  };

  handleDelete = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    
    try {
      const success = await deleteAlert(alertId);
      if (success) {
        await this.loadAlerts();
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  handleDismiss = async (alertId) => {
    try {
      const success = await dismissAlert(alertId);
      if (success) {
        await this.loadAlerts();
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  getCurrentPrice = (coin) => {
    const { marketData, exchangeRate } = this.props;
    if (marketData && marketData[coin] && marketData[coin].ticker) {
      return Number(marketData[coin].ticker.price * (exchangeRate || 1));
    }
    return null;
  };

  render() {
    const { alerts, loading, formData, editingAlert, submitting } = this.state;
    const { currency = 'USD', coinz = {} } = this.props;
    const curSymbol = $currencySymbol(currency);
    
    // Get available coins from user's portfolio, filtering out invalid symbols
    const invalidSymbols = new Set([
      'btcusd', 'ethusd', 'bnbusd', 'adausd', 'solusd', 'dotusd', 
      'dogeusd', 'avaxusd', 'maticusd', 'ltcusd', 'linkusd', 'uniusd',
      'aaveusd', 'sushiusd', 'cakeusd', 'busdusd', 'usdtusd', 'usdcusd', 'daiusd'
    ]);
    
    const availableCoins = Object.keys(coinz)
      .filter(coin => !invalidSymbols.has(coin.toLowerCase()))
      .sort();

    return (
      <PriceAlertContainer>
        <AlertHeader>
          <AlertTitle>
            <AlertIcon>🚨</AlertIcon>
            Price Alerts
            {this.props.coin && ` for ${this.props.coin.toUpperCase()}`}
          </AlertTitle>
        </AlertHeader>

        {/* Alert Creation Form */}
        <AlertForm onSubmit={this.handleSubmit}>
          <FormGroup>
            <Label>Coin</Label>
            {this.props.coin ? (
              <Input 
                type="text" 
                value={this.props.coin.toUpperCase()} 
                disabled 
              />
            ) : (
              <Select
                value={formData.coin}
                onChange={(e) => this.handleInputChange('coin', e.target.value)}
                required
              >
                <option value="">Select a coin...</option>
                {availableCoins.map(coin => (
                  <option key={coin} value={coin}>
                    {coin.toUpperCase()}
                  </option>
                ))}
              </Select>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Alert Type</Label>
            <Select
              value={formData.type}
              onChange={(e) => this.handleInputChange('type', e.target.value)}
              required
            >
              <option value={ALERT_TYPES.ABOVE}>Price Above</option>
              <option value={ALERT_TYPES.BELOW}>Price Below</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Target Price ({curSymbol.trim()})</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.targetPrice}
              onChange={(e) => this.handleInputChange('targetPrice', e.target.value)}
              placeholder="0.00"
              required
            />
          </FormGroup>

          <SubmitButton 
            type="submit" 
            disabled={submitting}
          >
            {submitting ? '⏳' : editingAlert ? '✏️ Update' : '+ Add Alert'}
          </SubmitButton>
        </AlertForm>

        {editingAlert && (
          <div style={{ marginBottom: '16px' }}>
            <ActionButton onClick={this.resetForm}>
              Cancel Edit
            </ActionButton>
          </div>
        )}

        {/* Alerts List */}
        {loading ? (
          <EmptyState>
            <EmptyIcon>⏳</EmptyIcon>
            <EmptyText>Loading alerts...</EmptyText>
          </EmptyState>
        ) : alerts.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🔕</EmptyIcon>
            <EmptyText>No price alerts set</EmptyText>
            <EmptySubtext>
              Create your first alert to get notified when prices hit your targets
            </EmptySubtext>
          </EmptyState>
        ) : (
          <AlertsList>
            {alerts.map(alert => {
              const currentPrice = this.getCurrentPrice(alert.coin);
              
              return (
                <AlertItem key={alert.id}>
                  <AlertInfo>
                    <AlertCoin>
                      {alert.coin.toUpperCase().charAt(0)}
                    </AlertCoin>
                    
                    <AlertDetails>
                      <AlertText>
                        {alert.coin.toUpperCase()} {alert.type} {curSymbol}{$numberWithCommas(alert.targetPrice.toFixed(2))}
                      </AlertText>
                      <AlertMeta>
                        <span>Created: {this.formatDate(alert.createdAt)}</span>
                        {alert.triggeredAt && (
                          <span>Triggered: {this.formatDate(alert.triggeredAt)}</span>
                        )}
                        {currentPrice && (
                          <span>Current: {curSymbol}{$numberWithCommas(currentPrice.toFixed(2))}</span>
                        )}
                        <AlertStatus status={alert.status}>
                          {alert.status}
                        </AlertStatus>
                      </AlertMeta>
                    </AlertDetails>
                  </AlertInfo>

                  <AlertActions>
                    {alert.status === ALERT_STATUS.ACTIVE && (
                      <ActionButton onClick={() => this.handleEdit(alert)}>
                        ✏️ Edit
                      </ActionButton>
                    )}
                    
                    {alert.status === ALERT_STATUS.TRIGGERED && (
                      <ActionButton onClick={() => this.handleDismiss(alert.id)}>
                        ✓ Dismiss
                      </ActionButton>
                    )}
                    
                    <ActionButton 
                      danger 
                      onClick={() => this.handleDelete(alert.id)}
                    >
                      🗑️ Delete
                    </ActionButton>
                  </AlertActions>
                </AlertItem>
              );
            })}
          </AlertsList>
        )}
      </PriceAlertContainer>
    );
  }
}

export default PriceAlert;
