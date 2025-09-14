import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Highcharts from 'highcharts';
import PortfolioAnalytics from '../Components/PortfolioAnalytics';
import { $numberWithCommas, $currencySymbol } from '../Utils/Helpers';
import { translationStrings } from '../Utils/i18n';

// Load Highcharts modules
require('highcharts/modules/stock')(Highcharts);
require('highcharts/indicators/indicators')(Highcharts);
require('highcharts/indicators/ema')(Highcharts);
require('highcharts/indicators/rsi')(Highcharts);
require('highcharts/indicators/macd')(Highcharts);

// Styled Components
const AnalyticsDashboard = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  padding: 20px;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
`;

const BackButton = styled(Link)`
  color: #aaa;
  font-size: 24px;
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: #21ce99;
  }
`;

const DashboardTitle = styled.h1`
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #21ce99, #00d4aa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ChartSection = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ControlButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(135deg, #21ce99, #00d4aa)' : 'rgba(255,255,255,0.1)'};
  color: ${props => props.active ? 'white' : '#aaa'};
  border: 1px solid ${props => props.active ? 'transparent' : 'rgba(255,255,255,0.2)'};
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? 'linear-gradient(135deg, #21ce99, #00d4aa)' : 'rgba(255,255,255,0.2)'};
    color: white;
  }
`;

const ChartContainer = styled.div`
  height: 400px;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  margin-bottom: 16px;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ComparisonSection = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
`;

const ComparisonChart = styled.div`
  height: 300px;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
`;

const TechnicalIndicators = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

const IndicatorCard = styled.div`
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.1);
`;

const IndicatorLabel = styled.div`
  color: #aaa;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const IndicatorValue = styled.div`
  color: ${props => {
    if (props.trend === 'bullish') return '#21ce99';
    if (props.trend === 'bearish') return '#ff6b6b';
    return 'white';
  }};
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const IndicatorTrend = styled.div`
  color: #666;
  font-size: 11px;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #aaa;
  font-size: 16px;
`;

class Analytics extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      portfolioChart: null,
      comparisonChart: null,
      timeframe: '30d',
      chartType: 'value',
      showIndicators: true,
      portfolioData: [],
      comparisonData: [],
      technicalIndicators: {},
      loading: true
    };
  }

  componentDidMount() {
    this.generatePortfolioData();
    this.generateComparisonData();
  }

  componentWillUnmount() {
    // Clean up charts
    if (this.state.portfolioChart) {
      this.state.portfolioChart.destroy();
    }
    if (this.state.comparisonChart) {
      this.state.comparisonChart.destroy();
    }
  }

  generatePortfolioData = () => {
    const { coinz, marketData, exchangeRate, totalPortfolio } = this.props;
    
    if (!coinz || !marketData || !totalPortfolio) {
      this.setState({ loading: false });
      return;
    }

    // Generate historical portfolio data (simulated)
    const days = this.state.timeframe === '7d' ? 7 : this.state.timeframe === '30d' ? 30 : 90;
    const portfolioData = [];
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Simulate portfolio value changes
      const baseValue = totalPortfolio.totalValue;
      const volatility = 0.1; // 10% volatility
      const trend = 0.002; // 0.2% daily growth trend
      const randomChange = (Math.random() - 0.5) * volatility;
      const trendChange = trend * (days - i);
      
      const portfolioValue = baseValue * (1 + trendChange + randomChange);
      portfolioData.push([date.getTime(), portfolioValue]);
    }

    this.setState({ portfolioData }, () => {
      this.renderPortfolioChart();
      this.calculateTechnicalIndicators();
    });
  };

  generateComparisonData = () => {
    const days = this.state.timeframe === '7d' ? 7 : this.state.timeframe === '30d' ? 30 : 90;
    const btcData = [];
    const ethData = [];
    const marketData = [];
    const today = new Date();
    
    // Simulate BTC, ETH, and market index data
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // BTC simulation (higher volatility)
      const btcBase = 45000;
      const btcVolatility = 0.15;
      const btcTrend = 0.003;
      const btcChange = (Math.random() - 0.5) * btcVolatility + btcTrend * (days - i);
      const btcValue = btcBase * (1 + btcChange);
      
      // ETH simulation
      const ethBase = 3000;
      const ethVolatility = 0.18;
      const ethTrend = 0.004;
      const ethChange = (Math.random() - 0.5) * ethVolatility + ethTrend * (days - i);
      const ethValue = ethBase * (1 + ethChange);
      
      // Market index simulation (lower volatility)
      const marketBase = 100;
      const marketVolatility = 0.08;
      const marketTrend = 0.001;
      const marketChange = (Math.random() - 0.5) * marketVolatility + marketTrend * (days - i);
      const marketValue = marketBase * (1 + marketChange);
      
      btcData.push([date.getTime(), btcValue]);
      ethData.push([date.getTime(), ethValue]);
      marketData.push([date.getTime(), marketValue]);
    }

    this.setState({ 
      comparisonData: { btcData, ethData, marketData },
      loading: false 
    }, () => {
      this.renderComparisonChart();
    });
  };

  renderPortfolioChart = () => {
    const { portfolioData, chartType, showIndicators } = this.state;
    const { currency } = this.props;
    
    const chartOptions = {
      credits: { enabled: false },
      chart: {
        backgroundColor: 'transparent',
        height: 400,
        zoomType: 'x'
      },
      title: { text: '' },
      xAxis: {
        type: 'datetime',
        gridLineColor: 'rgba(255,255,255,0.1)',
        lineColor: 'rgba(255,255,255,0.2)',
        tickColor: 'rgba(255,255,255,0.2)',
        labels: { style: { color: '#aaa' } }
      },
      yAxis: {
        title: { 
          text: `Portfolio Value (${currency})`,
          style: { color: '#aaa' }
        },
        gridLineColor: 'rgba(255,255,255,0.1)',
        labels: { 
          style: { color: '#aaa' },
          formatter: function() {
            return $currencySymbol(currency) + $numberWithCommas(this.value.toFixed(0));
          }
        }
      },
      legend: {
        enabled: true,
        itemStyle: { color: '#aaa' }
      },
      plotOptions: {
        area: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, 'rgba(33, 206, 153, 0.3)'],
              [1, 'rgba(33, 206, 153, 0.05)']
            ]
          },
          marker: { radius: 2 },
          lineWidth: 2,
          color: '#21ce99'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#21ce99',
        style: { color: 'white' },
        formatter: function() {
          return `<b>${Highcharts.dateFormat('%b %d, %Y', this.x)}</b><br/>
                  Portfolio Value: ${$currencySymbol(currency)}${$numberWithCommas(this.y.toFixed(2))}`;
        }
      },
      series: [{
        name: 'Portfolio Value',
        type: chartType === 'value' ? 'area' : 'line',
        data: portfolioData,
        color: '#21ce99'
      }]
    };

    // Add technical indicators if enabled
    if (showIndicators && portfolioData.length > 20) {
      // Moving Average
      chartOptions.series.push({
        name: 'MA(20)',
        type: 'line',
        color: '#ffd93d',
        lineWidth: 1,
        data: this.calculateMovingAverage(portfolioData, 20)
      });

      // RSI indicator in separate pane
      chartOptions.yAxis = [
        chartOptions.yAxis,
        {
          title: { text: 'RSI', style: { color: '#aaa' } },
          height: '20%',
          top: '75%',
          offset: 0,
          lineWidth: 1,
          gridLineColor: 'rgba(255,255,255,0.1)',
          labels: { style: { color: '#aaa' } },
          plotLines: [
            { value: 70, color: '#ff6b6b', width: 1, dashStyle: 'dash' },
            { value: 30, color: '#21ce99', width: 1, dashStyle: 'dash' }
          ]
        }
      ];

      chartOptions.series.push({
        name: 'RSI(14)',
        type: 'line',
        yAxis: 1,
        color: '#ff6b6b',
        lineWidth: 1,
        data: this.calculateRSI(portfolioData, 14)
      });
    }

    const chart = Highcharts.chart('portfolio-chart', chartOptions);
    this.setState({ portfolioChart: chart });
  };

  renderComparisonChart = () => {
    const { comparisonData } = this.state;
    
    const chartOptions = {
      credits: { enabled: false },
      chart: {
        backgroundColor: 'transparent',
        height: 300
      },
      title: { text: '' },
      xAxis: {
        type: 'datetime',
        gridLineColor: 'rgba(255,255,255,0.1)',
        lineColor: 'rgba(255,255,255,0.2)',
        tickColor: 'rgba(255,255,255,0.2)',
        labels: { style: { color: '#aaa' } }
      },
      yAxis: {
        title: { 
          text: 'Normalized Performance (%)',
          style: { color: '#aaa' }
        },
        gridLineColor: 'rgba(255,255,255,0.1)',
        labels: { 
          style: { color: '#aaa' },
          formatter: function() {
            return this.value.toFixed(1) + '%';
          }
        }
      },
      legend: {
        enabled: true,
        itemStyle: { color: '#aaa' }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#21ce99',
        style: { color: 'white' },
        shared: true
      },
      series: [
        {
          name: 'Your Portfolio',
          data: this.normalizeData(this.state.portfolioData),
          color: '#21ce99',
          lineWidth: 2
        },
        {
          name: 'Bitcoin',
          data: this.normalizeData(comparisonData.btcData),
          color: '#f7931a',
          lineWidth: 1
        },
        {
          name: 'Ethereum',
          data: this.normalizeData(comparisonData.ethData),
          color: '#627eea',
          lineWidth: 1
        },
        {
          name: 'Crypto Market',
          data: this.normalizeData(comparisonData.marketData),
          color: '#666',
          lineWidth: 1,
          dashStyle: 'dash'
        }
      ]
    };

    const chart = Highcharts.chart('comparison-chart', chartOptions);
    this.setState({ comparisonChart: chart });
  };

  normalizeData = (data) => {
    if (!data || data.length === 0) return [];
    
    const firstValue = data[0][1];
    return data.map(([timestamp, value]) => [
      timestamp,
      ((value - firstValue) / firstValue) * 100
    ]);
  };

  calculateMovingAverage = (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, [, value]) => acc + value, 0);
      result.push([data[i][0], sum / period]);
    }
    return result;
  };

  calculateRSI = (data, period) => {
    const result = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i][1] - data[i-1][1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);

      if (i >= period) {
        const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push([data[i][0], rsi]);
      }
    }
    return result;
  };

  calculateTechnicalIndicators = () => {
    const { portfolioData } = this.state;
    
    if (portfolioData.length < 20) return;

    const currentPrice = portfolioData[portfolioData.length - 1][1];
    const ma20 = this.calculateMovingAverage(portfolioData, 20);
    const rsi = this.calculateRSI(portfolioData, 14);
    
    const currentMA20 = ma20.length > 0 ? ma20[ma20.length - 1][1] : currentPrice;
    const currentRSI = rsi.length > 0 ? rsi[rsi.length - 1][1] : 50;

    // MACD calculation (simplified)
    const ema12 = this.calculateEMA(portfolioData, 12);
    const ema26 = this.calculateEMA(portfolioData, 26);
    const macd = ema12[ema12.length - 1][1] - ema26[ema26.length - 1][1];

    this.setState({
      technicalIndicators: {
        ma20: {
          value: currentMA20,
          trend: currentPrice > currentMA20 ? 'bullish' : 'bearish',
          signal: currentPrice > currentMA20 ? 'Above MA(20)' : 'Below MA(20)'
        },
        rsi: {
          value: currentRSI,
          trend: currentRSI > 70 ? 'bearish' : currentRSI < 30 ? 'bullish' : 'neutral',
          signal: currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral'
        },
        macd: {
          value: macd,
          trend: macd > 0 ? 'bullish' : 'bearish',
          signal: macd > 0 ? 'Bullish Signal' : 'Bearish Signal'
        }
      }
    });
  };

  calculateEMA = (data, period) => {
    const result = [];
    const multiplier = 2 / (period + 1);
    let ema = data[0][1];

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        ema = data[i][1];
      } else {
        ema = (data[i][1] * multiplier) + (ema * (1 - multiplier));
      }
      result.push([data[i][0], ema]);
    }
    return result;
  };

  setTimeframe = (timeframe) => {
    this.setState({ timeframe }, () => {
      this.generatePortfolioData();
      this.generateComparisonData();
    });
  };

  setChartType = (chartType) => {
    this.setState({ chartType }, () => {
      this.renderPortfolioChart();
    });
  };

  toggleIndicators = () => {
    this.setState({ showIndicators: !this.state.showIndicators }, () => {
      this.renderPortfolioChart();
    });
  };

  render() {
    const { 
      timeframe, 
      chartType, 
      showIndicators, 
      technicalIndicators, 
      loading 
    } = this.state;
    
    const { currency = 'USD', totalPortfolio, coinz } = this.props;
    const string = translationStrings(this.props.language);

    if (!coinz || Object.keys(coinz).length === 0) {
      return (
        <AnalyticsDashboard>
          <DashboardHeader>
            <BackButton to="/">
              <i className="fa fa-arrow-left" aria-hidden="true"></i>
            </BackButton>
            <DashboardTitle>📊 Portfolio Analytics</DashboardTitle>
            <div></div>
          </DashboardHeader>
          <LoadingState>
            Add coins to your portfolio to view analytics
          </LoadingState>
        </AnalyticsDashboard>
      );
    }

    return (
      <AnalyticsDashboard>
        <DashboardHeader>
          <BackButton to="/">
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
          </BackButton>
          <DashboardTitle>📊 Portfolio Analytics</DashboardTitle>
          <div></div>
        </DashboardHeader>

        {/* Portfolio Value Chart */}
        <ChartSection>
          <ChartHeader>
            <ChartTitle>📈 Portfolio Performance</ChartTitle>
            <ChartControls>
              <ControlButton
                active={chartType === 'value'}
                onClick={() => this.setChartType('value')}
              >
                Value
              </ControlButton>
              <ControlButton
                active={chartType === 'line'}
                onClick={() => this.setChartType('line')}
              >
                Line
              </ControlButton>
              <ControlButton
                active={showIndicators}
                onClick={this.toggleIndicators}
              >
                Indicators
              </ControlButton>
              {['7d', '30d', '90d'].map(tf => (
                <ControlButton
                  key={tf}
                  active={timeframe === tf}
                  onClick={() => this.setTimeframe(tf)}
                >
                  {tf}
                </ControlButton>
              ))}
            </ChartControls>
          </ChartHeader>
          
          {loading ? (
            <LoadingState>Loading portfolio data...</LoadingState>
          ) : (
            <ChartContainer id="portfolio-chart" />
          )}

          {/* Technical Indicators */}
          {showIndicators && Object.keys(technicalIndicators).length > 0 && (
            <TechnicalIndicators>
              <IndicatorCard>
                <IndicatorLabel>Moving Average (20)</IndicatorLabel>
                <IndicatorValue trend={technicalIndicators.ma20?.trend}>
                  {$currencySymbol(currency)}{$numberWithCommas(technicalIndicators.ma20?.value?.toFixed(2) || '0')}
                </IndicatorValue>
                <IndicatorTrend>{technicalIndicators.ma20?.signal}</IndicatorTrend>
              </IndicatorCard>

              <IndicatorCard>
                <IndicatorLabel>RSI (14)</IndicatorLabel>
                <IndicatorValue trend={technicalIndicators.rsi?.trend}>
                  {technicalIndicators.rsi?.value?.toFixed(1) || '0'}
                </IndicatorValue>
                <IndicatorTrend>{technicalIndicators.rsi?.signal}</IndicatorTrend>
              </IndicatorCard>

              <IndicatorCard>
                <IndicatorLabel>MACD</IndicatorLabel>
                <IndicatorValue trend={technicalIndicators.macd?.trend}>
                  {technicalIndicators.macd?.value?.toFixed(2) || '0'}
                </IndicatorValue>
                <IndicatorTrend>{technicalIndicators.macd?.signal}</IndicatorTrend>
              </IndicatorCard>
            </TechnicalIndicators>
          )}
        </ChartSection>

        {/* Comparison Charts */}
        <ChartsGrid>
          <ComparisonSection>
            <ChartHeader>
              <ChartTitle>📊 Market Comparison</ChartTitle>
            </ChartHeader>
            {loading ? (
              <LoadingState>Loading comparison data...</LoadingState>
            ) : (
              <ComparisonChart id="comparison-chart" />
            )}
          </ComparisonSection>

          {/* Portfolio Analytics Component */}
          <div>
            <PortfolioAnalytics
              coinz={this.props.coinz}
              marketData={this.props.marketData}
              exchangeRate={this.props.exchangeRate}
              totalPortfolio={totalPortfolio}
              currency={currency}
              language={this.props.language}
            />
          </div>
        </ChartsGrid>
      </AnalyticsDashboard>
    );
  }
}

export default Analytics;
