import React, { Component } from 'react';
import {translationStrings} from '../Utils/i18n';
import fetch from "fetch-retry";
import styled from 'styled-components';
import VirtualizedSelect from 'react-virtualized-select'
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css'
import 'react-virtualized-select/styles.css'
import { showNotification } from './Notifications';

const Title = styled.h3`
  color: white;
`;
const AddCoinWrapper = styled.div`
  margin: 10px auto;
  padding: 10px 10px;
  max-width: 1100px;
`;
const Form = styled.form`
  margin: auto;
`;
const TickerSelector = styled(VirtualizedSelect)`
  color: black;
  text-align: left;
  & .Select-control {
    border-radius: 0px;
  }
`;
const Input = styled.input`
  width: 100%;
  font-family: Roboto, sans-serif;
  font-size: 16px;
  margin: 5px 0px;
  padding: 0px 10px;
  height: 36px;
  box-sizing: border-box;
  ::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
    color: #aaa;
    opacity: 1; /* Firefox */
}
`;
const SubmitButton = styled.button`
  width: 100%;
  font-family: Roboto, sans-serif;
  font-weight: 100;
  background-color: rgb(33, 206, 153);
  color: white;
  border: none;
  font-size: 20px;
  line-height: 20px;
  margin: 5px 0px;
  height: 36px;
  box-sizing: border-box;
  cursor: pointer;
  ::after {
    content: '';
    position: absolute;
    z-index: -1;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    opacity: 0;
    box-shadow: 0px 0px 6px 2px #21ce99;
    -webkit-transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
  :hover::after {
    opacity: 1;
  }
`;
class AddCoin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_ticker: "",
      avg_cost_basis: "",
      hodl: "",
      supported: [],
      coinList: [], // Store full coin list for validation
      validationError: "", // Store validation error message
      loadingCoins: true // Add loading state
    }
    
    // Common symbol corrections mapping
    this.symbolCorrections = {
      'btcusd': 'btc',
      'ethusd': 'eth',
      'bnbusd': 'bnb',
      'adausd': 'ada',
      'solusd': 'sol',
      'dotusd': 'dot',
      'dogeusd': 'doge',
      'avaxusd': 'avax',
      'maticusd': 'matic',
      'ltcusd': 'ltc',
      'linkusd': 'link',
      'uniusd': 'uni',
      'aaveusd': 'aave',
      'sushiusd': 'sushi',
      'cakeusd': 'cake',
      'busdusd': 'busd',
      'usdtusd': 'usdt',
      'usdcusd': 'usdc',
      'daiusd': 'dai'
    };
  }
  addCoin = (e) => {
    e.preventDefault();
    
    // Validate that a ticker is selected
    if (!this.state.selected_ticker) {
      this.setState({ validationError: "Please select a coin from the dropdown." });
      return;
    }
    
    let ticker = this.state.selected_ticker.code.toLocaleLowerCase();
    
    // Check if the symbol needs correction
    const correctedSymbol = this.symbolCorrections[ticker];
    if (correctedSymbol) {
      ticker = correctedSymbol;
      // Show notification about the correction
      showNotification('info', `Corrected "${this.state.selected_ticker.code.toUpperCase()}" to "${ticker.toUpperCase()}"`);
    }
    
    // Validate that the selected symbol exists in CoinGecko's list
    const coinExists = this.state.coinList.some(coin => coin.symbol === ticker);
    if (!coinExists) {
      this.setState({ validationError: `"${ticker.toUpperCase()}" is not a valid coin symbol. Please select a coin from the dropdown list.` });
      return;
    }
    
    // Clear any previous validation errors
    this.setState({ validationError: "" });
    
    const avg_cost = Number(this.state.avg_cost_basis);
    const hodl = Number(this.state.hodl);

    const payload = {
      ticker: ticker,
      avg_cost: avg_cost,
      hodl: hodl,
    };

    this.props.addCoinz(payload);
    this.setState({
      ticker: "",
      avg_cost_basis: "",
      hodl: "",
      selected_ticker: "",
      validationError: ""
    });
    
    // Show success notification
    showNotification('success', `${payload.ticker.toUpperCase()} added to your portfolio!`);
  }

  onChange = (item, e) => {
    var text = e.target.value;
    this.setState({[item]: text});
  }

  componentWillMount () {
    // Add delay to avoid API rate limiting conflicts with main market data
    setTimeout(() => {
      // Fetch coin list from CoinGecko API
      fetch("https://api.coingecko.com/api/v3/coins/list")
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(coins => {
          console.log('Fetched coins from API:', coins.length);
          if (this.refs.addRef) {
            // Filter out invalid symbols that are commonly confused
            const invalidSymbols = new Set([
              'btcusd', 'ethusd', 'bnbusd', 'adausd', 'solusd', 'dotusd', 
              'dogeusd', 'avaxusd', 'maticusd', 'ltcusd', 'linkusd', 'uniusd',
              'aaveusd', 'sushiusd', 'cakeusd', 'busdusd', 'usdtusd', 'usdcusd', 'daiusd'
            ]);
            
            const validCoins = coins.filter(coin => !invalidSymbols.has(coin.symbol.toLowerCase()));
            console.log('Valid coins after filtering:', validCoins.length);
            
            this.setState({
              options: validCoins.map(c => ({
                "code": c.symbol,
                "name": c.name,
                "statuses": ["primary"]
              })),
              coinList: validCoins, // Store full coin list for validation
              loadingCoins: false // Set loading to false
            });
            
            console.log('Options set in state:', this.state.options.length);
          }
        })
        .catch((e) => {
          console.error('Failed to load coins list:', e);
          // Fallback to popular coins if API fails
          if (this.refs.addRef) {
            const fallbackCoins = [
              { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
              { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
              { id: 'binancecoin', symbol: 'bnb', name: 'BNB' },
              { id: 'cardano', symbol: 'ada', name: 'Cardano' },
              { id: 'solana', symbol: 'sol', name: 'Solana' },
              { id: 'polkadot', symbol: 'dot', name: 'Polkadot' },
              { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin' },
              { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche' },
              { id: 'polygon-pos', symbol: 'matic', name: 'Polygon' },
              { id: 'litecoin', symbol: 'ltc', name: 'Litecoin' },
              { id: 'chainlink', symbol: 'link', name: 'Chainlink' },
              { id: 'uniswap', symbol: 'uni', name: 'Uniswap' },
              { id: 'aave', symbol: 'aave', name: 'Aave' },
              { id: 'sushi', symbol: 'sushi', name: 'SushiSwap' },
              { id: 'pancakeswap-token', symbol: 'cake', name: 'PancakeSwap' },
              { id: 'binance-usd', symbol: 'busd', name: 'Binance USD' },
              { id: 'tether', symbol: 'usdt', name: 'Tether' },
              { id: 'usd-coin', symbol: 'usdc', name: 'USD Coin' },
              { id: 'dai', symbol: 'dai', name: 'Dai' }
            ];
            
            this.setState({
              options: fallbackCoins.map(c => ({
                "code": c.symbol,
                "name": c.name,
                "statuses": ["primary"]
              })),
              coinList: fallbackCoins,
              loadingCoins: false // Set loading to false
            });
            
            console.log('Using fallback coins:', fallbackCoins.length);
          }
        })
    }, 3000); // 3 second delay to avoid rate limiting conflicts
  }
  // Utility function to clean invalid coins from portfolio
  cleanInvalidCoins = () => {
    try {
      const coins = localStorage.getItem('coinz');
      if (coins) {
        const parsedCoins = JSON.parse(coins);
        const invalidSymbols = new Set([
          'btcusd', 'ethusd', 'bnbusd', 'adausd', 'solusd', 'dotusd', 
          'dogeusd', 'avaxusd', 'maticusd', 'ltcusd', 'linkusd', 'uniusd',
          'aaveusd', 'sushiusd', 'cakeusd', 'busdusd', 'usdtusd', 'usdcusd', 'daiusd'
        ]);
        
        let cleaned = false;
        const cleanedCoins = {};
        
        Object.keys(parsedCoins).forEach(symbol => {
          if (!invalidSymbols.has(symbol.toLowerCase())) {
            cleanedCoins[symbol] = parsedCoins[symbol];
          } else {
            cleaned = true;
            console.log(`Removing invalid coin: ${symbol}`);
          }
        });
        
        if (cleaned) {
          localStorage.setItem('coinz', JSON.stringify(cleanedCoins));
          showNotification('success', 'Cleaned up invalid coins from your portfolio');
          
          // Trigger portfolio refresh if parent component has refresh method
          if (this.props.refreshPortfolio) {
            this.props.refreshPortfolio();
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning invalid coins:', error);
    }
  }
  handleTickerChange = (selected_ticker) => {
    console.log('Coin selected:', selected_ticker);
    this.setState({ selected_ticker, validationError: "" });
  }
  render() {
    
    const { selected_ticker, options, loadingCoins } = this.state;
    const string = translationStrings(this.props.language);

    // const avgCostBasis = "Average Cost Basis ("+ $currencySymbol(this.state.preferences.currency) +"/per coin)"
    const avgCostBasis = string.avgcost;
    return (
      <AddCoinWrapper ref="addRef" >
        <Title>{string.addcoin}</Title>
        {this.state.validationError && (
          <div style={{ 
            color: '#ff6b6b', 
            backgroundColor: '#ffe6e6', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '10px',
            border: '1px solid #ff6b6b'
          }}>
            {this.state.validationError}
          </div>
        )}
        
        {/* Portfolio cleanup button */}
        <div style={{ marginBottom: '10px' }}>
          <button
            type="button"
            onClick={this.cleanInvalidCoins}
            style={{
              backgroundColor: '#ff9500',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🧹 Clean Invalid Coins
          </button>
          <span style={{ 
            color: '#aaa', 
            fontSize: '12px', 
            marginLeft: '10px' 
          }}>
            Remove any invalid coin symbols from your portfolio
          </span>
        </div>
        <Form className="" onSubmit={this.addCoin}>

          <TickerSelector 
            name="form-select-ticker"
            placeholder={loadingCoins ? "Loading coins..." : string.ticker}
            value={selected_ticker}
            labelKey="code"
            valueKey="code"
            onChange={this.handleTickerChange}
            options={options}
            disabled={loadingCoins}
            clearable={true}
            searchable={true}
          />
          {loadingCoins && (
            <div style={{ 
              color: '#aaa', 
              fontSize: '12px', 
              marginTop: '5px',
              textAlign: 'center'
            }}>
              🔄 Loading coin list...
            </div>
          )}
          <br/>
          <Input type="number"
            autoComplete='off' spellCheck='false' autoCorrect='off'
            onChange={(e) => this.onChange("avg_cost_basis", e)}
            value={this.state.avg_cost_basis}
            placeholder={avgCostBasis}/>
          <br/>
          <Input type="number"
            autoComplete='off' spellCheck='false' autoCorrect='off'
            onChange={(e) => this.onChange("hodl", e)}
            value={this.state.hodl}
            placeholder={string.numberheld}/>
          <br/>
          <SubmitButton type="submit">{string.go}</SubmitButton>
        </Form>
      </AddCoinWrapper>
    );
  }
}

export default AddCoin;
