import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { $numberWithCommas, $currencySymbol } from '../Utils/Helpers';

const AnalyticsContainer = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 24px;
  margin: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
`;

const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const AnalyticsTitle = styled.h2`
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const TimeFilter = styled.div`
  display: flex;
  gap: 8px;
`;

const TimeButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #21ce99, #00d4aa)' : 'rgba(255,255,255,0.1)'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #21ce99, #00d4aa)' : 'rgba(255,255,255,0.15)'};
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const MetricItem = styled.div`
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.05);
`;

const MetricLabel = styled.div`
  color: #aaa;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const MetricValue = styled.div`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const MetricChange = styled.div`
  font-size: 12px;
  color: ${props => props.isPositive ? '#21ce99' : '#ff6b6b'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ChartSection = styled.div`
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const ChartTitle = styled.h3`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const ChartPlaceholder = styled.div`
  height: 200px;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 14px;
`;

const InsightsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const InsightCard = styled.div`
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid ${props => props.color || '#21ce99'};
`;

const InsightTitle = styled.h4`
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const InsightContent = styled.p`
  color: #aaa;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
`;

const RiskMeter = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const RiskBar = styled.div`
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
`;

const RiskFill = styled.div`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => {
    if (props.percentage < 30) return '#21ce99';
    if (props.percentage < 70) return '#ffd93d';
    return '#ff6b6b';
  }};
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const CoinAnalytics = ({ coin, marketData, currency, exchangeRate }) => {
  const [timeframe, setTimeframe] = useState('1M');
  const [analytics, setAnalytics] = useState({
    volatility: 15.2,
    sharpeRatio: 1.8,
    maxDrawdown: -12.5,
    beta: 0.85,
    correlation: 0.72,
    volume24h: 2840000000,
    marketCap: 850000000000,
    dominance: 42.5
  });

  const curSymbol = $currencySymbol(currency);
  const currentPrice = marketData?.[coin]?.ticker?.price || 0;
  const priceChange = marketData?.[coin]?.ticker?.change || 0;

  const insights = [
    {
      title: "Volatility Analysis",
      content: "This coin shows moderate volatility, suitable for balanced portfolios.",
      color: "#21ce99"
    },
    {
      title: "Market Correlation",
      content: "High correlation with Bitcoin (0.72), consider for diversification.",
      color: "#ffd93d"
    },
    {
      title: "Risk Assessment",
      content: "Sharpe ratio of 1.8 indicates good risk-adjusted returns.",
      color: "#6c5ce7"
    }
  ];

  const riskPercentage = Math.min(100, Math.max(0, (analytics.volatility / 50) * 100));

  return (
    <AnalyticsContainer>
      <AnalyticsHeader>
        <AnalyticsTitle>{coin.toUpperCase()} Analytics</AnalyticsTitle>
        <TimeFilter>
          <TimeButton active={timeframe === '1W'} onClick={() => setTimeframe('1W')}>1W</TimeButton>
          <TimeButton active={timeframe === '1M'} onClick={() => setTimeframe('1M')}>1M</TimeButton>
          <TimeButton active={timeframe === '3M'} onClick={() => setTimeframe('3M')}>3M</TimeButton>
          <TimeButton active={timeframe === '1Y'} onClick={() => setTimeframe('1Y')}>1Y</TimeButton>
        </TimeFilter>
      </AnalyticsHeader>

      <MetricsGrid>
        <MetricItem>
          <MetricLabel>Current Price</MetricLabel>
          <MetricValue>{curSymbol}{$numberWithCommas(currentPrice.toFixed(2))}</MetricValue>
          <MetricChange isPositive={priceChange >= 0}>
            {priceChange >= 0 ? '↗' : '↘'} {Math.abs(priceChange).toFixed(2)}%
          </MetricChange>
        </MetricItem>

        <MetricItem>
          <MetricLabel>Volatility (30d)</MetricLabel>
          <MetricValue>{analytics.volatility.toFixed(1)}%</MetricValue>
          <MetricChange isPositive={analytics.volatility < 20}>
            {analytics.volatility < 20 ? '↗' : '↘'} {analytics.volatility < 20 ? 'Low' : 'High'} risk
          </MetricChange>
        </MetricItem>

        <MetricItem>
          <MetricLabel>Sharpe Ratio</MetricLabel>
          <MetricValue>{analytics.sharpeRatio.toFixed(2)}</MetricValue>
          <MetricChange isPositive={analytics.sharpeRatio > 1}>
            {analytics.sharpeRatio > 1 ? '↗' : '↘'} Good returns
          </MetricChange>
        </MetricItem>

        <MetricItem>
          <MetricLabel>Max Drawdown</MetricLabel>
          <MetricValue>{analytics.maxDrawdown.toFixed(1)}%</MetricValue>
          <MetricChange isPositive={analytics.maxDrawdown > -15}>
            {analytics.maxDrawdown > -15 ? '↗' : '↘'} Manageable risk
          </MetricChange>
        </MetricItem>

        <MetricItem>
          <MetricLabel>24h Volume</MetricLabel>
          <MetricValue>{curSymbol}{$numberWithCommas((analytics.volume24h / 1000000).toFixed(0))}M</MetricValue>
          <MetricChange isPositive={true}>
            ↗ High liquidity
          </MetricChange>
        </MetricItem>

        <MetricItem>
          <MetricLabel>Market Cap</MetricLabel>
          <MetricValue>{curSymbol}{$numberWithCommas((analytics.marketCap / 1000000000).toFixed(0))}B</MetricValue>
          <MetricChange isPositive={true}>
            ↗ Large cap
          </MetricChange>
        </MetricItem>
      </MetricsGrid>

      <ChartSection>
        <ChartTitle>Price Performance ({timeframe})</ChartTitle>
        <ChartPlaceholder>
          Interactive Chart Component - {timeframe} timeframe
        </ChartPlaceholder>
      </ChartSection>

      <ChartSection>
        <ChartTitle>Risk Assessment</ChartTitle>
        <RiskMeter>
          <span style={{ color: '#aaa', fontSize: '12px' }}>Risk Level</span>
          <RiskBar>
            <RiskFill percentage={riskPercentage} />
          </RiskBar>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
            {riskPercentage < 30 ? 'Low' : riskPercentage < 70 ? 'Medium' : 'High'}
          </span>
        </RiskMeter>
      </ChartSection>

      <InsightsSection>
        {insights.map((insight, index) => (
          <InsightCard key={index} color={insight.color}>
            <InsightTitle>{insight.title}</InsightTitle>
            <InsightContent>{insight.content}</InsightContent>
          </InsightCard>
        ))}
      </InsightsSection>
    </AnalyticsContainer>
  );
};

export default CoinAnalytics;

