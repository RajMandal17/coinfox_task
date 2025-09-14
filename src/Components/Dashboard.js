import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { $numberWithCommas, $currencySymbol } from '../Utils/Helpers';

const DashboardContainer = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const WelcomeSection = styled.div`
  color: white;
`;

const WelcomeTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #21ce99, #00d4aa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const WelcomeSubtitle = styled.p`
  color: #aaa;
  margin: 8px 0 0 0;
  font-size: 16px;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? 'linear-gradient(135deg, #21ce99, #00d4aa)' : 'rgba(255,255,255,0.1)'};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 206, 153, 0.3);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const MetricCard = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(33, 206, 153, 0.3);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const MetricTitle = styled.h3`
  color: #aaa;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
`;

const MetricIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color || 'linear-gradient(135deg, #21ce99, #00d4aa)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const MetricValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
`;

const MetricChange = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.isPositive ? '#21ce99' : '#ff6b6b'};
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
`;

const ChartTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
`;

const InsightsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;

const InsightCard = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
`;

const InsightTitle = styled.h4`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

const InsightContent = styled.p`
  color: #aaa;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
`;

const Dashboard = ({ totalPortfolio, marketData, coinz, currency, exchangeRate }) => {
  const [portfolioHealth, setPortfolioHealth] = useState(85);
  const [riskLevel, setRiskLevel] = useState('Moderate');
  const [insights, setInsights] = useState([
    {
      title: "Portfolio Diversification",
      content: "Your portfolio is well-diversified across 8 different cryptocurrencies, reducing overall risk."
    },
    {
      title: "Top Performer",
      content: "Bitcoin has been your best performing asset, contributing 45% to total gains this month."
    },
    {
      title: "Rebalancing Opportunity",
      content: "Consider rebalancing your portfolio as Ethereum allocation has drifted above target."
    }
  ]);

  const curSymbol = $currencySymbol(currency);
  const { totalValue, totalBasis } = totalPortfolio || {};
  const totalReturn = totalValue - totalBasis;
  const returnPercentage = totalBasis > 0 ? ((totalReturn / totalBasis) * 100) : 0;

  return (
    <DashboardContainer>
      <Header>
        <WelcomeSection>
          <WelcomeTitle>Welcome back!</WelcomeTitle>
          <WelcomeSubtitle>Here's your portfolio overview for today</WelcomeSubtitle>
        </WelcomeSection>
        <QuickActions>
          <ActionButton>Add Coin</ActionButton>
          <ActionButton primary>Export Data</ActionButton>
        </QuickActions>
      </Header>

      <MetricsGrid>
        <MetricCard>
          <MetricHeader>
            <MetricTitle>Total Portfolio Value</MetricTitle>
            <MetricIcon>💰</MetricIcon>
          </MetricHeader>
          <MetricValue>{curSymbol}{$numberWithCommas(totalValue?.toFixed(2) || '0.00')}</MetricValue>
          <MetricChange isPositive={totalReturn >= 0}>
            {totalReturn >= 0 ? '↗' : '↘'} {returnPercentage.toFixed(2)}% this month
          </MetricChange>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>Portfolio Health</MetricTitle>
            <MetricIcon color="linear-gradient(135deg, #ff6b6b, #ff8e8e)">❤️</MetricIcon>
          </MetricHeader>
          <MetricValue>{portfolioHealth}%</MetricValue>
          <MetricChange isPositive={portfolioHealth > 70}>
            {portfolioHealth > 70 ? '↗' : '↘'} Excellent diversification
          </MetricChange>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>Risk Level</MetricTitle>
            <MetricIcon color="linear-gradient(135deg, #ffd93d, #ffed4e)">⚠️</MetricIcon>
          </MetricHeader>
          <MetricValue>{riskLevel}</MetricValue>
          <MetricChange isPositive={riskLevel === 'Low'}>
            {riskLevel === 'Low' ? '↗' : '↘'} Moderate volatility
          </MetricChange>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>Active Coins</MetricTitle>
            <MetricIcon color="linear-gradient(135deg, #6c5ce7, #a29bfe)">🪙</MetricIcon>
          </MetricHeader>
          <MetricValue>{Object.keys(coinz || {}).length}</MetricValue>
          <MetricChange isPositive={true}>
            ↗ Well diversified
          </MetricChange>
        </MetricCard>
      </MetricsGrid>

      <ChartsSection>
        <ChartCard>
          <ChartTitle>Portfolio Performance</ChartTitle>
          <div style={{ height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
            Chart Component Placeholder
          </div>
        </ChartCard>
        
        <ChartCard>
          <ChartTitle>Asset Allocation</ChartTitle>
          <div style={{ height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
            Pie Chart Placeholder
          </div>
        </ChartCard>
      </ChartsSection>

      <InsightsSection>
        {insights.map((insight, index) => (
          <InsightCard key={index}>
            <InsightTitle>{insight.title}</InsightTitle>
            <InsightContent>{insight.content}</InsightContent>
          </InsightCard>
        ))}
      </InsightsSection>
    </DashboardContainer>
  );
};

export default Dashboard;

