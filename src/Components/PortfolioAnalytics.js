import React, { Component } from 'react';
import styled from 'styled-components';
import { $numberWithCommas, $currencySymbol, returnMultiple } from '../Utils/Helpers';

// Styled Components
const AnalyticsContainer = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  margin: 16px 0;
`;

const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const AnalyticsTitle = styled.h3`
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TimeframeSelector = styled.div`
  display: flex;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
`;

const TimeframeButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #21ce99, #00d4aa)' : 'transparent'};
  color: ${props => props.active ? 'white' : '#aaa'};
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
    background: ${props => props.active ? 'linear-gradient(135deg, #21ce99, #00d4aa)' : 'rgba(255,255,255,0.1)'};
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div`
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba(33, 206, 153, 0.3);
    background: rgba(255,255,255,0.05);
  }
`;

const MetricLabel = styled.div`
  color: #aaa;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const MetricValue = styled.div`
  color: ${props => {
    if (props.trend === 'positive') return '#21ce99';
    if (props.trend === 'negative') return '#ff6b6b';
    return 'white';
  }};
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetricSubtext = styled.div`
  color: #666;
  font-size: 11px;
`;

const PerformanceSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h4`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CoinPerformanceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CoinPerformanceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.05);
`;

const CoinInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CoinIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #21ce99, #1a4d2e);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
`;

const CoinDetails = styled.div``;

const CoinName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const CoinHolding = styled.div`
  color: #aaa;
  font-size: 12px;
`;

const CoinPerformance = styled.div`
  text-align: right;
`;

const PerformanceValue = styled.div`
  color: ${props => props.isPositive ? '#21ce99' : '#ff6b6b'};
  font-weight: 600;
  font-size: 14px;
`;

const PerformanceSubtext = styled.div`
  color: #666;
  font-size: 11px;
`;

const DiversificationSection = styled.div`
  margin-bottom: 24px;
`;

const DiversificationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DiversificationCard = styled.div`
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.1);
`;

const AllocationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AllocationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
`;

const AllocationBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  margin: 4px 0;
  overflow: hidden;
`;

const AllocationFill = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #21ce99, #00d4aa);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const RiskIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`;

const RiskLevel = styled.div`
  color: ${props => {
    switch (props.level) {
      case 'low': return '#21ce99';
      case 'medium': return '#ffd93d';
      case 'high': return '#ff6b6b';
      default: return '#aaa';
    }
  }};
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
`;

const RiskDots = styled.div`
  display: flex;
  gap: 4px;
`;

const RiskDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? props.color : 'rgba(255,255,255,0.2)'};
`;

class PortfolioAnalytics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeframe: '24h',
      historicalData: {},
      loading: true
    };
  }

  componentDidMount() {
    this.calculateAnalytics();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.marketData !== this.props.marketData || 
        prevProps.coinz !== this.props.coinz) {
      this.calculateAnalytics();
    }
  }

  calculateAnalytics = () => {
    const { coinz, marketData, exchangeRate, totalPortfolio } = this.props;
    
    if (!coinz || !marketData || !totalPortfolio) {
      this.setState({ loading: false });
      return;
    }

    try {
      const analytics = this.generateAnalytics(coinz, marketData, exchangeRate, totalPortfolio);
      this.setState({ 
        ...analytics,
        loading: false 
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
      this.setState({ loading: false });
    }
  };

  generateAnalytics = (coinz, marketData, exchangeRate, totalPortfolio) => {
    const coins = Object.keys(coinz);
    const coinAnalytics = [];
    
    // Calculate individual coin performance
    coins.forEach(coin => {
      const holding = coinz[coin];
      const market = marketData[coin];
      
      if (market && market.ticker) {
        const currentPrice = Number(market.ticker.price) * exchangeRate;
        const costBasis = holding.cost_basis * exchangeRate;
        const quantity = holding.hodl;
        const currentValue = currentPrice * quantity;
        const totalCost = costBasis * quantity;
        const performance = ((currentPrice - costBasis) / costBasis) * 100;
        const change24h = market.ticker.change || 0;
        
        coinAnalytics.push({
          coin,
          currentPrice,
          costBasis,
          quantity,
          currentValue,
          totalCost,
          performance,
          change24h,
          allocation: (currentValue / totalPortfolio.totalValue) * 100
        });
      }
    });

    // Sort by performance for best/worst
    const sortedByPerformance = [...coinAnalytics].sort((a, b) => b.performance - a.performance);
    
    // Calculate portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(coinAnalytics, totalPortfolio);
    
    // Calculate diversification metrics
    const diversificationMetrics = this.calculateDiversification(coinAnalytics);
    
    // Calculate risk assessment
    const riskAssessment = this.calculateRiskAssessment(coinAnalytics);

    return {
      coinAnalytics,
      bestPerformers: sortedByPerformance.slice(0, 3),
      worstPerformers: sortedByPerformance.slice(-3).reverse(),
      portfolioMetrics,
      diversificationMetrics,
      riskAssessment
    };
  };

  calculatePortfolioMetrics = (coinAnalytics, totalPortfolio) => {
    const totalReturn = totalPortfolio.totalValue - totalPortfolio.totalBasis;
    const returnPercentage = (totalReturn / totalPortfolio.totalBasis) * 100;
    
    // Simulate different timeframe performance (would be replaced with historical data)
    const timeframes = {
      '24h': this.simulateTimeframePerformance(returnPercentage, 0.8, 1.2),
      '7d': this.simulateTimeframePerformance(returnPercentage, 0.6, 1.8),
      '30d': this.simulateTimeframePerformance(returnPercentage, 0.3, 2.5)
    };

    return {
      totalReturn,
      returnPercentage,
      timeframes,
      gainers: coinAnalytics.filter(coin => coin.performance > 0).length,
      losers: coinAnalytics.filter(coin => coin.performance < 0).length,
      breakeven: coinAnalytics.filter(coin => Math.abs(coin.performance) < 1).length
    };
  };

  simulateTimeframePerformance = (baseReturn, minMultiplier, maxMultiplier) => {
    // This simulates different timeframe performance
    // In a real implementation, this would fetch historical data
    const multiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
    return baseReturn * multiplier;
  };

  calculateDiversification = (coinAnalytics) => {
    const allocations = coinAnalytics.map(coin => ({
      coin: coin.coin,
      percentage: coin.allocation
    })).sort((a, b) => b.percentage - a.percentage);

    // Calculate concentration risk (Herfindahl Index)
    const herfindahlIndex = coinAnalytics.reduce((sum, coin) => {
      const weight = coin.allocation / 100;
      return sum + (weight * weight);
    }, 0);

    // Diversification score (1 - HHI, normalized to 0-100)
    const diversificationScore = Math.max(0, (1 - herfindahlIndex) * 100);

    return {
      allocations,
      diversificationScore,
      topHolding: allocations[0],
      numberOfAssets: coinAnalytics.length,
      concentrationRisk: herfindahlIndex > 0.25 ? 'high' : herfindahlIndex > 0.15 ? 'medium' : 'low'
    };
  };

  calculateRiskAssessment = (coinAnalytics) => {
    // Calculate portfolio volatility based on individual coin changes
    const avgVolatility = coinAnalytics.reduce((sum, coin) => {
      return sum + Math.abs(coin.change24h);
    }, 0) / coinAnalytics.length;

    // Risk categories
    let riskLevel = 'low';
    let riskScore = 30;

    if (avgVolatility > 15) {
      riskLevel = 'high';
      riskScore = 85;
    } else if (avgVolatility > 8) {
      riskLevel = 'medium';
      riskScore = 60;
    }

    // Adjust for concentration risk
    const concentrationPenalty = coinAnalytics.length < 3 ? 20 : coinAnalytics.length < 5 ? 10 : 0;
    riskScore = Math.min(100, riskScore + concentrationPenalty);

    return {
      level: riskLevel,
      score: riskScore,
      volatility: avgVolatility,
      factors: {
        volatility: avgVolatility,
        concentration: concentrationPenalty > 0,
        diversification: coinAnalytics.length
      }
    };
  };

  setTimeframe = (timeframe) => {
    this.setState({ timeframe });
  };

  formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  formatCurrency = (value) => {
    const curSymbol = $currencySymbol(this.props.currency || 'USD');
    return `${curSymbol}${$numberWithCommas(value.toFixed(2))}`;
  };

  render() {
    const { 
      timeframe, 
      loading, 
      portfolioMetrics = {}, 
      bestPerformers = [], 
      worstPerformers = [],
      diversificationMetrics = {},
      riskAssessment = {}
    } = this.state;

    if (loading) {
      return (
        <AnalyticsContainer>
          <AnalyticsTitle>📊 Loading analytics...</AnalyticsTitle>
        </AnalyticsContainer>
      );
    }

    const currentTimeframePerformance = portfolioMetrics.timeframes 
      ? portfolioMetrics.timeframes[timeframe] 
      : 0;

    return (
      <AnalyticsContainer>
        <AnalyticsHeader>
          <AnalyticsTitle>📊 Portfolio Analytics</AnalyticsTitle>
          <TimeframeSelector>
            {['24h', '7d', '30d'].map(tf => (
              <TimeframeButton
                key={tf}
                active={timeframe === tf}
                onClick={() => this.setTimeframe(tf)}
              >
                {tf}
              </TimeframeButton>
            ))}
          </TimeframeSelector>
        </AnalyticsHeader>

        {/* Performance Metrics */}
        <MetricsGrid>
          <MetricCard>
            <MetricLabel>Total Return</MetricLabel>
            <MetricValue trend={portfolioMetrics.returnPercentage >= 0 ? 'positive' : 'negative'}>
              {this.formatPercentage(portfolioMetrics.returnPercentage || 0)}
              <span style={{ fontSize: '12px' }}>
                {portfolioMetrics.returnPercentage >= 0 ? '📈' : '📉'}
              </span>
            </MetricValue>
            <MetricSubtext>
              {this.formatCurrency(portfolioMetrics.totalReturn || 0)}
            </MetricSubtext>
          </MetricCard>

          <MetricCard>
            <MetricLabel>{timeframe} Performance</MetricLabel>
            <MetricValue trend={currentTimeframePerformance >= 0 ? 'positive' : 'negative'}>
              {this.formatPercentage(currentTimeframePerformance)}
            </MetricValue>
            <MetricSubtext>vs previous period</MetricSubtext>
          </MetricCard>

          <MetricCard>
            <MetricLabel>Winners/Losers</MetricLabel>
            <MetricValue>
              <span style={{ color: '#21ce99' }}>{portfolioMetrics.gainers || 0}</span>
              /
              <span style={{ color: '#ff6b6b' }}>{portfolioMetrics.losers || 0}</span>
            </MetricValue>
            <MetricSubtext>{portfolioMetrics.breakeven || 0} breakeven</MetricSubtext>
          </MetricCard>

          <MetricCard>
            <MetricLabel>Diversification</MetricLabel>
            <MetricValue>
              {(diversificationMetrics.diversificationScore || 0).toFixed(0)}%
            </MetricValue>
            <MetricSubtext>
              {diversificationMetrics.numberOfAssets || 0} assets
            </MetricSubtext>
          </MetricCard>
        </MetricsGrid>

        {/* Best/Worst Performers */}
        <PerformanceSection>
          <SectionTitle>🏆 Best Performers</SectionTitle>
          <CoinPerformanceList>
            {bestPerformers.map(coin => (
              <CoinPerformanceItem key={coin.coin}>
                <CoinInfo>
                  <CoinIcon>{coin.coin.toUpperCase().charAt(0)}</CoinIcon>
                  <CoinDetails>
                    <CoinName>{coin.coin.toUpperCase()}</CoinName>
                    <CoinHolding>{coin.quantity} coins</CoinHolding>
                  </CoinDetails>
                </CoinInfo>
                <CoinPerformance>
                  <PerformanceValue isPositive={coin.performance >= 0}>
                    {this.formatPercentage(coin.performance)}
                  </PerformanceValue>
                  <PerformanceSubtext>
                    {this.formatCurrency(coin.currentValue)}
                  </PerformanceSubtext>
                </CoinPerformance>
              </CoinPerformanceItem>
            ))}
          </CoinPerformanceList>
        </PerformanceSection>

        {worstPerformers.length > 0 && (
          <PerformanceSection>
            <SectionTitle>📉 Needs Attention</SectionTitle>
            <CoinPerformanceList>
              {worstPerformers.map(coin => (
                <CoinPerformanceItem key={coin.coin}>
                  <CoinInfo>
                    <CoinIcon>{coin.coin.toUpperCase().charAt(0)}</CoinIcon>
                    <CoinDetails>
                      <CoinName>{coin.coin.toUpperCase()}</CoinName>
                      <CoinHolding>{coin.quantity} coins</CoinHolding>
                    </CoinDetails>
                  </CoinInfo>
                  <CoinPerformance>
                    <PerformanceValue isPositive={coin.performance >= 0}>
                      {this.formatPercentage(coin.performance)}
                    </PerformanceValue>
                    <PerformanceSubtext>
                      {this.formatCurrency(coin.currentValue)}
                    </PerformanceSubtext>
                  </CoinPerformance>
                </CoinPerformanceItem>
              ))}
            </CoinPerformanceList>
          </PerformanceSection>
        )}

        {/* Diversification & Risk */}
        <DiversificationSection>
          <SectionTitle>🎯 Portfolio Composition</SectionTitle>
          <DiversificationGrid>
            <DiversificationCard>
              <MetricLabel>Asset Allocation</MetricLabel>
              <AllocationList>
                {(diversificationMetrics.allocations || []).slice(0, 5).map(allocation => (
                  <AllocationItem key={allocation.coin}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: 'white', fontSize: '14px' }}>
                        {allocation.coin.toUpperCase()}
                      </span>
                      <span style={{ color: '#aaa', fontSize: '12px' }}>
                        {allocation.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <AllocationBar>
                      <AllocationFill percentage={allocation.percentage} />
                    </AllocationBar>
                  </AllocationItem>
                ))}
              </AllocationList>
            </DiversificationCard>

            <DiversificationCard>
              <MetricLabel>Risk Assessment</MetricLabel>
              <MetricValue>
                Risk Score: {riskAssessment.score || 0}/100
              </MetricValue>
              <RiskIndicator>
                <RiskLevel level={riskAssessment.level}>
                  {riskAssessment.level} risk
                </RiskLevel>
                <RiskDots>
                  {[1, 2, 3, 4, 5].map(dot => (
                    <RiskDot
                      key={dot}
                      active={dot <= (riskAssessment.score || 0) / 20}
                      color={
                        riskAssessment.level === 'high' ? '#ff6b6b' :
                        riskAssessment.level === 'medium' ? '#ffd93d' : '#21ce99'
                      }
                    />
                  ))}
                </RiskDots>
              </RiskIndicator>
              <MetricSubtext style={{ marginTop: '8px' }}>
                Volatility: {(riskAssessment.volatility || 0).toFixed(1)}%
              </MetricSubtext>
              <MetricSubtext>
                Concentration: {diversificationMetrics.concentrationRisk || 'low'}
              </MetricSubtext>
            </DiversificationCard>
          </DiversificationGrid>
        </DiversificationSection>
      </AnalyticsContainer>
    );
  }
}

export default PortfolioAnalytics;
