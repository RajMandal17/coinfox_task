import React, { Component } from 'react';
import {Link} from 'react-router-dom';
import Chart from "../Components/Chart";
import PriceAlert from "../Components/PriceAlert";
import { $numberWithCommas, $currencySymbol, returnMultiple } from '../Utils/Helpers';
import {translationStrings} from '../Utils/i18n';
import { getAlertsForCoin } from '../Utils/alertHelpers';
import styled from 'styled-components';

const AlertIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  padding: 4px 8px;
  background: rgba(33, 206, 153, 0.1);
  border: 1px solid rgba(33, 206, 153, 0.3);
  border-radius: 12px;
  font-size: 12px;
  color: #21ce99;
`;

const AlertToggle = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 8px 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: #21ce99;
  }
`;

const AlertSection = styled.div`
  margin: 16px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

class Coin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAlerts: false,
      coinAlerts: [],
      alertsLoading: true
    };
  }

  componentDidMount() {
    this.loadCoinAlerts();
    
    // Check if URL has #alerts fragment to auto-show alerts
    if (window.location.hash === '#alerts') {
      this.setState({ showAlerts: true });
    }
  }

  loadCoinAlerts = async () => {
    const coin = this.props.match.params["0"];
    if (coin) {
      try {
        const alerts = await getAlertsForCoin(coin);
        this.setState({ 
          coinAlerts: alerts,
          alertsLoading: false 
        });
      } catch (error) {
        console.error('Error loading coin alerts:', error);
        this.setState({ alertsLoading: false });
      }
    }
  };

  toggleAlerts = () => {
    this.setState({ showAlerts: !this.state.showAlerts });
  };

  render() {
    const string = translationStrings(this.props.language);
    // https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/docs/guides/scroll-restoration.md
    window.scrollTo(0, 0);


    // wait for market data before trying to render single coin
    if (!this.props.marketData) {
      return null;
    }

    const curSymbol = $currencySymbol(this.props.currency);
    const home = this.props.blockstack ? '/blockstack' : '/';
    const coin = this.props.match.params["0"] || 'X';
    const coinz = Object.keys(this.props.coinz).length > 0 ? this.props.coinz : false;
    const coinInfo = coinz && coin ? coinz[coin] : false;
    const exchangeRate = this.props.exchangeRate;
    const marketData = this.props.marketData ? this.props.marketData : false;
    const price = marketData[coin] && marketData[coin].ticker
      ? Number(marketData[coin].ticker.price) * exchangeRate
      : 0; //false

    const hodl = coinInfo && Number(coinInfo.hodl);
    const cost_basis = coinInfo && Number(coinInfo.cost_basis);
    const totalCostBasis = cost_basis * hodl;
    const currentValue = hodl * price;


    const volume24 = Boolean(marketData[coin] && marketData[coin].ticker) && marketData[coin].ticker.volume * price;
    // console.log(marketData[coin].ticker.volume, 'voluem?');

    const chartColor = !price || price >= cost_basis
      ? '#21ce99'
      : '#d82d2d';
    const headStyle = {
      backgroundColor: chartColor,
    };

    const changellyCoins = [
      'BTC',
      'ETH',
      'XMR',
      'ZEC',
      'DASH',
      'XRP',
      'LTC',
      'DOGE',
      'BCH',
      'BTG',
      'DGB',
      'EXP',
      'GAME',
      'LSK',
      'NLG',
      'NXT',
      'POT',
      'QTUM',
      'SYS',
      'XDN',
      'XVG'
    ];

    const changePrefix = "https://changelly.com/widget/v1?auth=email&";
    const changeSuffix = "&merchant_id=db206cefa712&address=&amount=1&ref_id=db206cefa712&color=" + chartColor.replace("#", "");

    const changellyBuy = changePrefix + "from=BTC&to=" + coin.toUpperCase() + changeSuffix;
    const changellySell = changePrefix + "from=" + coin.toUpperCase() + "&to=BTC" + changeSuffix;

    return (
      <div className="Coin">
        <Link className="menu" key='Menu' to='/menu'><i className="btn-menu fa fa-lg fa-bars" aria-hidden="true"></i></Link>
        <Link className="coinClose" to={home}><i className="btn-menu fa fa-lg fa-times" aria-hidden="true"></i></Link>

        <div className="coinCard">
          <h2>
            {coin.toUpperCase()}
            {this.state.coinAlerts.length > 0 && (
              <AlertIndicator>
                🚨 {this.state.coinAlerts.length} alert{this.state.coinAlerts.length !== 1 ? 's' : ''}
              </AlertIndicator>
            )}
          </h2>
          <h1>{curSymbol}{$numberWithCommas(price.toFixed(2))}</h1>
          <p>{returnMultiple(currentValue, totalCostBasis).toFixed(2)}x</p>

          <div className="theChart">
            <Chart chartColor={chartColor} exchangeRate={this.props.exchangeRate} ticker={coin} />
          </div>

          <AlertToggle onClick={this.toggleAlerts}>
            🚨 {this.state.showAlerts ? 'Hide' : 'Show'} Price Alerts
          </AlertToggle>

          {this.state.showAlerts && (
            <AlertSection>
              <PriceAlert
                coin={coin}
                currency={this.props.currency}
                marketData={this.props.marketData}
                exchangeRate={this.props.exchangeRate}
                coinz={this.props.coinz}
                language={this.props.language}
              />
            </AlertSection>
          )}

          {changellyCoins.includes(coin.toUpperCase()) &&
          <div className="listCoin">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={changellyBuy}>
              <button className="btn-buy" style={headStyle}>
                <i className="fa fa-money" aria-hidden="true"></i> Buy
              </button>
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={changellySell}>
              <button className="btn-buy" style={headStyle}>
                <i className="fa fa-line-chart" aria-hidden="true"></i> Sell
              </button>
            </a>

          </div>}

          {!changellyCoins.includes(coin.toUpperCase()) &&
          <div className="listCoin">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={"https://changelly.com/widget/v1?auth=email&from=ETH&to=BTC&merchant_id=db206cefa712&address=&amount=1&ref_id=db206cefa712&color=" + chartColor.replace("#", "")}>
              <button className="btn-buy" style={headStyle}>
                <i className="fa fa-line-chart" aria-hidden="true"></i> Trade Coins
              </button>
            </a>
          </div>}

          <div className="listCoin">
            <span className="left">
              {hodl}<br/>
              <span className="lightGray">{coin.toUpperCase() + " Holding"}</span>
            </span>
            <span className="right">
              {curSymbol}{$numberWithCommas( (currentValue).toFixed(2) )}<br/>
              <span className="lightGray">{string.total+curSymbol+string.holding}</span>
            </span>
          </div>

          <div className="listCoin">
            <span className="left">
              {curSymbol}{volume24 && $numberWithCommas(volume24.toFixed())}<br/>
              <span className="lightGray">{string.volume}</span>
            </span>
            <span className="right">
              {curSymbol}{$numberWithCommas((totalCostBasis).toFixed(2))}&nbsp;<span className="lightGray">({$numberWithCommas(cost_basis.toFixed(2))})</span><br/>
              <span className="lightGray">{string.costbasis}</span>
            </span>
          </div>

          <div className="trash listCoin">
            <span className="left">
            </span>
            <span className="right">
              <span onClick={()=>this.props.deleteCoin(coin, this.props.history)} className="lightGray"><i className="fa fa-trash" aria-hidden="true"></i></span>
            </span>
          </div>

        </div>
      </div>
    );
  }
}

export default Coin;
