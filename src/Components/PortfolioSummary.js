import React from 'react';
import styled from 'styled-components';
import { $numberWithCommas, $currencySymbol } from '../Utils/Helpers';

const SummaryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
  padding: 0 20px;
`;

const SummaryCard = styled.div`
  background: ${props => props.color || '#303032'};
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const CardTitle = styled.div`
  font-size: 14px;
  color: #aaa;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CardValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const CardChange = styled.div`
  font-size: 14px;
  color: ${props => props.isPositive ? '#21ce99' : props.isNegative ? '#ff6b6b' : '#aaa'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const ChangeIcon = styled.span`
  font-size: 12px;
`;

const PortfolioSummary = ({ totalPortfolio, marketData, coinz, currency, exchangeRate }) => {
  if (!totalPortfolio || !marketData || !coinz) {
    return null;
  }

  const { totalValue, totalBasis } = totalPortfolio;
  const totalReturn = totalValue - totalBasis;
  const returnPercentage = totalBasis > 0 ? ((totalReturn / totalBasis) * 100) : 0;
  
  // Calculate 24h change
  let total24hChange = 0;
  let total24hChangePercentage = 0;
  
  if (marketData) {
    Object.keys(coinz).forEach(coin => {
      if (marketData[coin] && marketData[coin].ticker) {
        const coinValue = coinz[coin].hodl * marketData[coin].ticker.price * exchangeRate;
        const change24h = marketData[coin].ticker.change || 0;
        total24hChange += coinValue * (change24h / 100);
      }
    });
    
    if (totalValue > 0) {
      total24hChangePercentage = (total24hChange / totalValue) * 100;
    }
  }

  const curSymbol = $currencySymbol(currency);

  return (
    <SummaryContainer>
      <SummaryCard>
        <CardTitle>Total Portfolio</CardTitle>
        <CardValue>{curSymbol}{$numberWithCommas(totalValue.toFixed(2))}</CardValue>
        <CardChange>
          {curSymbol}{$numberWithCommas(totalBasis.toFixed(2))} invested
        </CardChange>
      </SummaryCard>

      <SummaryCard color={totalReturn >= 0 ? '#1a4d2e' : '#4d1a1a'}>
        <CardTitle>Total Gain/Loss</CardTitle>
        <CardValue>{curSymbol}{$numberWithCommas(Math.abs(totalReturn).toFixed(2))}</CardValue>
        <CardChange isPositive={totalReturn >= 0} isNegative={totalReturn < 0}>
          <ChangeIcon>
            {totalReturn >= 0 ? '↗' : '↘'}
          </ChangeIcon>
          {totalReturn >= 0 ? '+' : '-'}{returnPercentage.toFixed(2)}%
        </CardChange>
      </SummaryCard>

      <SummaryCard color={total24hChange >= 0 ? '#1a4d2e' : '#4d1a1a'}>
        <CardTitle>24h Change</CardTitle>
        <CardValue>{curSymbol}{$numberWithCommas(Math.abs(total24hChange).toFixed(2))}</CardValue>
        <CardChange isPositive={total24hChange >= 0} isNegative={total24hChange < 0}>
          <ChangeIcon>
            {total24hChange >= 0 ? '↗' : '↘'}
          </ChangeIcon>
          {total24hChange >= 0 ? '+' : '-'}{Math.abs(total24hChangePercentage).toFixed(2)}%
        </CardChange>
      </SummaryCard>

      <SummaryCard>
        <CardTitle>Portfolio Health</CardTitle>
        <CardValue>{Math.min(100, Math.max(0, (Object.keys(coinz).length / 10) * 100 + (returnPercentage > 0 ? 20 : -10))).toFixed(0)}%</CardValue>
        <CardChange isPositive={returnPercentage > 0}>
          {Object.keys(coinz).length < 3 ? 'Low' : Object.keys(coinz).length < 6 ? 'Moderate' : 'High'} diversification
        </CardChange>
      </SummaryCard>
    </SummaryContainer>
  );
};

export default PortfolioSummary;

