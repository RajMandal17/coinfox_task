import React, { Component } from 'react';
import { BrowserRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import {
  isUserSignedIn,
  putFile,
  getFile
} from 'blockstack';

import fetch from 'fetch-retry';

import Home from './Pages/Home';
import Coin from './Pages/Coin';
import Pie from './Pages/Pie';
import Menu from './Pages/Menu';
import SupportedCoins from './Pages/SupportedCoins';
import Analytics from './Pages/Analytics';

import './App.css';
import Blockstack from "./Components/Blockstack";
import NotificationSystem, { showNotification } from "./Components/Notifications";
import RealTimeMonitoring from "./Components/RealTimeMonitoring";

import { translationStrings } from './Utils/i18n';
const string = translationStrings();const supportedCurrencies = [
  ['AUD', '$'],
  ['BGN', 'лв'],
  ['BRL', 'R$'],
  // ['BTC', '฿'],
  ['CAD', '$'],
  ['CHF', 'Fr.'],
  ['CNY', '¥'],
  ['CZK', 'Kč'],
  ['DKK', 'kr'],
  ['EUR', '€'],
  ['GBP', '£'],
  ['HKD', '$'],
  ['HRK', 'kn'],
  ['HUF', 'Ft'],
  ['IDR', 'Rp'],
  ['ILS', '₪'],
  ['INR', '₹'],
  ['JPY', '¥'],
  ['KRW', '₩'],
  ['MXN', '$'],
  ['MYR', 'RM'],
  ['NOK', 'kr'],
  ['NZD', '$'],
  ['PHP', '₱'],
  ['PLN', 'zł'],
  ['RON', 'lei'],
  // ['RUR', '₽'],
  ['SEK', 'kr'],
  ['SGD', '$'],
  ['THB', '฿'],
  ['TRY', '₺'],
  // ['UAH', '₴'],
  ['USD', '$'],
  ['ZAR', 'R'],
];


// @TODO yo generator
// https://github.com/blockstack/blockstack-app-generator

class App extends Component {
  // Symbol correction mapping for common invalid symbols
  symbolCorrections = {
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

  // Migrate invalid symbols in existing portfolio
  migrateInvalidSymbols = async (coinz) => {
    if (!coinz || Object.keys(coinz).length === 0) return coinz;

    let migratedCoinz = { ...coinz };
    let hasChanges = false;
    const migratedSymbols = [];

    try {
      // Fetch coin list to validate symbols
      const listRes = await fetch("https://api.coingecko.com/api/v3/coins/list");
      if (!listRes.ok) throw new Error(`Coins list HTTP ${listRes.status}`);
      const allCoins = await listRes.json();

      // Check each symbol in the portfolio
      Object.keys(coinz).forEach(symbol => {
        const coinExists = allCoins.some(coin => coin.symbol === symbol);
        
        if (!coinExists) {
          // Check if it can be corrected
          const correctedSymbol = this.symbolCorrections[symbol];
          if (correctedSymbol) {
            // Check if the corrected symbol exists
            const correctedExists = allCoins.some(coin => coin.symbol === correctedSymbol);
            if (correctedExists) {
              // Move the data to the corrected symbol
              migratedCoinz[correctedSymbol] = migratedCoinz[symbol];
              delete migratedCoinz[symbol];
              hasChanges = true;
              migratedSymbols.push(`${symbol} → ${correctedSymbol}`);
              console.log(`Migrated invalid symbol: ${symbol} → ${correctedSymbol}`);
            }
          }
        }
      });

      // Save migrated portfolio if changes were made
      if (hasChanges) {
        if (isUserSignedIn()) {
          const encrypt = true;
          const data = {
            coinz: migratedCoinz,
            pref: this.state.pref || { currency: "USD" }
          };
          await putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt);
          console.log('Migrated portfolio saved to Blockstack');
        } else {
          localStorage.setItem("coinz", JSON.stringify(migratedCoinz));
          console.log('Migrated portfolio saved to localStorage');
        }

        // Show notification about migration
        if (migratedSymbols.length > 0) {
          showNotification('info', `Fixed invalid symbols: ${migratedSymbols.join(', ')}`);
        }
      }

    } catch (e) {
      console.warn('Failed to migrate invalid symbols:', e);
    }

    return migratedCoinz;
  }

  constructor() {
    super();

    this.state = {
      coinz: {},
      pref: {},
      marketData: false, // no data yet
      exchangeRates: { USD: 1 }, // defaults to 1 for US Dollar
      blockstack: isUserSignedIn(), //returns true if user is logged in
      gaiaStorage: 'coinfox.json',
      supportedCurrencies: supportedCurrencies,
    }

    // Rate limiting and caching
    this.apiCallQueue = [];
    this.isProcessingQueue = false;
    this.lastApiCall = 0;
    this.minApiInterval = 2000; // 2 seconds between API calls
    this.maxRetries = 3;
    this.backoffMultiplier = 2;
    this.marketDataCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    this.marketDataRefreshTimer = null;
    this.rateLimitHits = 0;
    this.circuitBreakerOpen = false;
    this.circuitBreakerTimeout = null;
  }

  // Rate limiting and caching methods
  makeRateLimitedRequest = async (url, options = {}) => {
    return new Promise((resolve, reject) => {
      this.apiCallQueue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  processQueue = async () => {
    if (this.isProcessingQueue || this.apiCallQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.apiCallQueue.length > 0) {
      const { url, options, resolve, reject } = this.apiCallQueue.shift();
      
      try {
        const result = await this.executeRequest(url, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
      
      // Wait before processing next request
      await this.delay(this.minApiInterval);
    }
    
    this.isProcessingQueue = false;
  }

  executeRequest = async (url, options = {}, retryCount = 0) => {
    // Check circuit breaker
    if (this.circuitBreakerOpen) {
      throw new Error('Circuit breaker is open - API temporarily disabled');
    }

    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.minApiInterval) {
      await this.delay(this.minApiInterval - timeSinceLastCall);
    }
    
    this.lastApiCall = Date.now();
    
    try {
      console.log(`🌐 API Request: ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CoinFox-App/1.0',
          ...options.headers
        }
      });
      
      // Handle rate limiting
      if (response.status === 429) {
        this.rateLimitHits++;
        console.warn(`⚠️ Rate limited (hit #${this.rateLimitHits})`);
        
        if (this.rateLimitHits >= 3) {
          this.openCircuitBreaker();
          throw new Error('Rate limit exceeded - circuit breaker opened');
        }
        
        // Exponential backoff for retries
        const backoffDelay = Math.pow(this.backoffMultiplier, retryCount) * 1000;
        console.log(`⏳ Retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        if (retryCount < this.maxRetries) {
          await this.delay(backoffDelay);
          return this.executeRequest(url, options, retryCount + 1);
        } else {
          throw new Error('Max retries exceeded');
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Reset rate limit counter on success
      this.rateLimitHits = 0;
      this.closeCircuitBreaker();
      
      return response;
      
    } catch (error) {
      console.error('❌ API Request failed:', error.message);
      throw error;
    }
  }

  openCircuitBreaker = () => {
    console.warn('🔌 Opening circuit breaker - stopping API calls for 5 minutes');
    this.circuitBreakerOpen = true;
    
    if (this.circuitBreakerTimeout) {
      clearTimeout(this.circuitBreakerTimeout);
    }
    
    this.circuitBreakerTimeout = setTimeout(() => {
      this.closeCircuitBreaker();
    }, 5 * 60 * 1000); // 5 minutes
  }

  closeCircuitBreaker = () => {
    console.log('🔌 Closing circuit breaker - resuming API calls');
    this.circuitBreakerOpen = false;
    this.rateLimitHits = 0;
    
    if (this.circuitBreakerTimeout) {
      clearTimeout(this.circuitBreakerTimeout);
      this.circuitBreakerTimeout = null;
    }
  }

  getCachedData = (key) => {
    const cached = this.marketDataCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📋 Using cached data for:', key);
      return cached.data;
    }
    return null;
  }

  setCachedData = (key, data) => {
    this.marketDataCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  addExistingCoin(storage, key, payload) {
    // if user had coin, add more
    const existingPriceAvg = storage.coinz[key].cost_basis;
    const existingHodl = storage.coinz[key].hodl;

    const addPriceAvg = payload.cost_basis;
    const addHodl = payload.hodl;

    const newHodl = addHodl + existingHodl;
    const newTotalValue = (addPriceAvg * addHodl) + (existingPriceAvg * existingHodl);

    const newPriceAvg = newTotalValue / newHodl;

    storage.coinz[key] = {
      cost_basis: newPriceAvg,
      hodl: newHodl
    };

    return storage.coinz;
  }

  saveCoinToStorage = (key, payload) => {
    const storage = this.readLocalStorage();
    if (storage.coinz[key]) {
      const newCoinz = this.addExistingCoin(storage, key, payload);

      localStorage.setItem("coinz", JSON.stringify(newCoinz));
      this.setState({ coinz: newCoinz })

    } else {
      // must be a new coin
      storage.coinz[key] = payload;
      const newCoinz = storage.coinz;

      localStorage.setItem("coinz", JSON.stringify(newCoinz));
      // must re-fetch market data if new coin
      this.marketData(newCoinz);
      this.setState({ coinz: newCoinz })
    }
  }

  saveCoinToGaia = (key, payload) => {
    // @TODO make this a function that returns a promise

    // @TODO DO THIS READING FROM STATE INSTEAD!!!
    // NO REASON TO getFile IF IT WILL BE OVERWRITTEN


    const decrypt = true;
    getFile(this.state.gaiaStorage, decrypt)
      .then((gaia) => {
        const jsonGaia = JSON.parse(gaia);
        const gaiaCoinz = jsonGaia.coinz && jsonGaia.coinz || {};
        const gaiaPref = jsonGaia.pref && jsonGaia.pref || { currency: "USD" };
        const userData = {
          coinz: gaiaCoinz,
          pref: gaiaPref
        };
        return userData;
      })
      .then((storage) => {
        console.log(storage.coinz, storage.pref, 'for gaia to save');
        const encrypt = true;

        if (storage.coinz[key]) {
          //user already has this coin
          const newCoinz = this.addExistingCoin(storage, key, payload);
          const data = {
            coinz: newCoinz,
            pref: storage.pref
          };

          putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt)
            .then(() => {
              this.marketData(newCoinz);
            })
            .then(() => {
              this.setState({
                coinz: newCoinz,
                pref: storage.pref
              })
            })
            .catch((ex) => {
              console.log(ex, 'Gaia put exception');
            })
        } else {
          // must be a new coin
          storage.coinz[key] = payload;
          const newCoinz = storage.coinz;
          const data = {
            coinz: newCoinz,
            pref: storage.pref
          };

          putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt)
            .then(() => {
              this.marketData(newCoinz);
            })
            .then(() => {
              this.setState({
                coinz: newCoinz,
                pref: storage.pref
              })
            })
            .catch((ex) => {
              console.log(ex, 'Gaia put exception');
            })
        }

      })
  }

  addCoinz = (coin) => {
    const ticker = coin.ticker;
    const costBasis = coin.avg_cost;
    const hodl = coin.hodl;

    if (!ticker || !costBasis || !hodl) {
      alert(string.fillticker);
    } else {
      const payload = {
        cost_basis: costBasis,
        hodl: hodl
      };
      if (isUserSignedIn()) {
        this.saveCoinToGaia(ticker, payload);
      } else {
        this.saveCoinToStorage(ticker, payload);
      }
      // go back
      //history.goBack()
      alert(ticker.toUpperCase() + string.added)
    }
  }

  fetchThen = (endpoint) => {
    const promise = new Promise(function (resolve, reject) {
      let handleFetchErr = function (res) {
        if (!res.ok) {
          throw Error(res.statusText);
        }
        return res;
      };

      const retryFetch = {
        retries: 3,
        retryDelay: 1000
      };

      fetch(endpoint, retryFetch)
        .then(handleFetchErr)
        .then((res) => {
          return res.json()
        })
        .then(res => {
          resolve(res);
        })
        .catch(e => {
          console.log(e);
          reject();
        });
    });

    return promise;
  }

  // _percentOfPortfolio (coinz) {
  //   let totalPortfolio = 0;
  //   // coinz.forEach((coin) => {
  //   //   const currentValue = coin.hodl * price;
  //   //   totalPortfolio = totalPortfolio + currentValue;
  //   // })
  //   for (const coin in coinz) {
  //     const price = this.state.marketData[coin];
  //     console.log(coinz[coin].hodl, price)
  //     const currentValue = coinz[coin].hodl * price;
  //     totalPortfolio = totalPortfolio + currentValue;
  //   }
  //   console.log(totalPortfolio);
  //   return totalPortfolio;
  // }

  marketData = async (userCoinz) => {
    try {
      console.log('🔍 marketData called with:', Object.keys(userCoinz || {}));
      
      if (!userCoinz || Object.keys(userCoinz).length === 0) {
        console.log('❌ No coins in portfolio');
        this.setState({ marketData: {} });
        return;
      }

      // Check cache first
      const cacheKey = `marketData_${JSON.stringify(Object.keys(userCoinz).sort())}`;
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        this.setState({ marketData: cachedData });
        return;
      }

      let marketData = {};
      const userTickers = Object.keys(userCoinz);
      const invalidSymbols = [];

      console.log('📋 User tickers:', userTickers);

      // Fetch full list to map symbol -> id with rate limiting
      let usersCoinList = [];
      try {
        console.log('🌐 Fetching coin list from CoinGecko...');
        const listResponse = await this.makeRateLimitedRequest("https://api.coingecko.com/api/v3/coins/list");
        const allCoins = await listResponse.json();
        console.log('📊 Total coins from API:', allCoins.length);
        usersCoinList = allCoins.filter(coin => userTickers.includes(coin.symbol));
        console.log('✅ Found matching coins:', usersCoinList.map(c => c.symbol));
        
        // Identify invalid symbols
        userTickers.forEach(ticker => {
          const coinExists = allCoins.some(coin => coin.symbol === ticker);
          if (!coinExists) {
            invalidSymbols.push(ticker);
          }
        });
      } catch (e) {
        console.warn('❌ Failed to fetch coins list', e);
        this.setState({ marketData: {} });
        return;
      }

      // Log invalid symbols for debugging
      if (invalidSymbols.length > 0) {
        console.warn('Invalid coin symbols found in portfolio:', invalidSymbols);
        // Could show a notification here, but for now just log
      }

      const usersCoinIds = usersCoinList.map(coin => coin.id);
      if (usersCoinIds.length === 0) {
        console.warn('No valid coin symbols found in portfolio');
        this.setState({ marketData: {} });
        return;
      }

      // @TODO modify price based on userPref
      const currency = "usd";
      let usersMarketData = {};
      try {
        console.log('💰 Fetching prices for coin IDs:', usersCoinIds);
        const priceResponse = await this.makeRateLimitedRequest(
          `https://api.coingecko.com/api/v3/simple/price?ids=${usersCoinIds.join("%2C")}&vs_currencies=${currency}&include_24hr_vol=true&include_24hr_change=true`
        );
        usersMarketData = await priceResponse.json();
        console.log('💵 Price data received:', Object.keys(usersMarketData));
      } catch (e) {
        console.warn('❌ Failed to fetch price data', e);
        this.setState({ marketData: {} });
        return;
      }

      userTickers.forEach(t => {
        try {
          const meta = usersCoinList.find(c => c.symbol === t);
          if (!meta) {
            // Symbol not found in CoinGecko list
            marketData[t] = {
              ticker: {
                base: t.toUpperCase(),
                target: currency.toUpperCase(),
                price: 0,
                volume: 0,
                change: 0
              },
              timestamp: Math.floor(new Date().getTime() / 100),
              success: false,
              error: "Invalid coin symbol"
            };
            console.log(`❌ ${t.toUpperCase()}: Invalid coin symbol`);
            return;
          }
          const dataForId = usersMarketData[meta.id];
          if (!dataForId) {
            // Price data not available for this coin
            marketData[t] = {
              ticker: {
                base: t.toUpperCase(),
                target: currency.toUpperCase(),
                price: 0,
                volume: 0,
                change: 0
              },
              timestamp: Math.floor(new Date().getTime() / 100),
              success: false,
              error: "Price data unavailable"
            };
            console.log(`⚠️ ${t.toUpperCase()}: Price data unavailable`);
            return;
          }
          marketData[t] = {
            ticker: {
              base: t.toUpperCase(),
              target: currency.toUpperCase(),
              price: dataForId[currency],
              volume: dataForId.usd_24h_vol,
              change: dataForId.usd_24h_change
            },
            timestamp: Math.floor(new Date().getTime() / 100),
            success: true,
            error: ""
          }
          console.log(`✅ ${t.toUpperCase()}: $${dataForId[currency]}`);
        } catch (e) {
          console.log(e, `Error processing ticker: ${t}`)
          marketData[t] = {
            ticker: {
              base: t.toUpperCase(),
              target: currency.toUpperCase(),
              price: 0,
              volume: 0,
              change: 0
            },
            timestamp: Math.floor(new Date().getTime() / 100),
            success: false,
            error: "Processing error"
          };
        }
      });
      console.log('📈 Final marketData:', marketData);
      
      // Cache the result
      this.setCachedData(cacheKey, marketData);
      
      this.setState({ marketData });
    } catch (e) {
      console.warn('❌ marketData error', e);
      this.setState({ marketData: {} });
    }
  }

  readLocalStorage() {
    const userCoinData = localStorage.coinz ? JSON.parse(localStorage.coinz) : {};
    const userPref = localStorage.pref ? JSON.parse(localStorage.pref) : { currency: "USD" };

    return { coinz: userCoinData, pref: userPref }
  }

  fetchExchangeRates = () => {
    //TODO replace with CoinGecko local currency pricing 



    // const currencies = this.state.supportedCurrencies.map((cur) => {
    //   return cur[0];
    // });
    // const endpoint = 'https://api.fixer.io/latest?base=USD&symbols=' + currencies.toString();

    // return fetch(endpoint)
    //   .then(function (res) {
    //     if (!res.ok) {
    //       throw Error(res.statusText);
    //     }
    //     return res;
    //   })
    //   .then((res) => res.json())
    //   .then((res) => {
    //     // set default to US 1
    //     res.rates.USD = 1;
    //     this.setState({ exchangeRates: res.rates });
    //   }
    //   )
  }

  totalPortfolio = (exchangeRate) => {

    const coinz = this.state.coinz ? this.state.coinz : false;
    const marketData = this.state.marketData ? this.state.marketData : false;

    let totalValue = 0;
    let totalBasis = 0;

    for (const coin in coinz) {
      const costBasis = coinz[coin].cost_basis;
      const hodl = coinz[coin].hodl;
      const basisForCoin = costBasis * hodl;

      // if we have the price data
      if (marketData[coin]) {
        // set price to 0 if it doesnt exist
        const price = (marketData[coin] && marketData[coin].ticker && marketData[coin].ticker.price)
          ? Number(marketData[coin].ticker.price)
          : 0;
        // coinPrice adjusted for exchange rate
        let coinPrice = price * exchangeRate;
        const valueForCoin = coinPrice * hodl;

        totalValue = totalValue + valueForCoin;
      }
      totalBasis = totalBasis + basisForCoin;
    }

    return {
      totalValue: totalValue,
      totalBasis: totalBasis
    }
  }

  redirectToHttps = () => {
    const userHasCoins = Boolean(localStorage.coinz);
    const https = window.location.protocol == "https:"
    // no coins, http visitor, redirect to https
    if (localStorage.https === "true" || !userHasCoins && !https) {
      window.location.protocol = "https:";

      // user has coins on http  
      // send them to https with coin string
    } else if (userHasCoins && !https) {
      console.log('redirect to https with coin string');
      const base64 = btoa(JSON.stringify(localStorage));
      localStorage.setItem('https', "true");
      window.location.href = "https://coinfox.co?import=" + base64;
    }
  }
  componentDidMount() {
    if (!window.location.origin.includes('localhost')) {
      this.redirectToHttps()
    }

    // Start periodic market data refresh
    this.startMarketDataRefresh();

    // check for portfolio import string
    var searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("import")) {
      const importPortfolio = JSON.parse(atob(searchParams.get("import")));
      const alreadyImported = searchParams.get("import") == localStorage.getItem("lastImport");

      if (alreadyImported) {
        console.log('already imported this portfolio');
        window.location.search = "x";
      } else {
        // import the new portfolio
        if (importPortfolio.pref) {
          localStorage.setItem("pref", importPortfolio.pref);
        }
        if (importPortfolio.coinz) {
          localStorage.setItem("coinz", importPortfolio.coinz);
        }
        localStorage.setItem("lastImport", searchParams.get("import"));
        window.location.search = ""
      }
    }


    // @TODO find out why isUserSignedIn re:true, even if blockstack isnt running
    if (isUserSignedIn() && window.location.pathname == "/blockstack") {
      // @TODO make this a function that returns a promise
      const decrypt = true;
      getFile(this.state.gaiaStorage, decrypt)
        .then((gaia) => {

          console.log('gimme gaia', gaia);

          const jsonGaia = JSON.parse(gaia);
          const gaiaCoinz = jsonGaia.coinz && jsonGaia.coinz || {};
          const gaiaPref = jsonGaia.pref && jsonGaia.pref || { currency: "USD" };
          const userData = {
            coinz: gaiaCoinz,
            pref: gaiaPref
          };
          return userData;
        })
        // @TODO return promise here, then setState
        .then((userData) => {
          // Migrate any invalid symbols in the portfolio
          return this.migrateInvalidSymbols(userData.coinz).then((migratedCoinz) => {
            return { ...userData, coinz: migratedCoinz };
          });
        })
        .then((userData) => {
          this.setState(userData);
        })
        .then(() => {
          this.marketData(this.state.coinz);
        })
        .then(() => {
          this.fetchExchangeRates();
        })
        .catch((ex) => {
          console.log(ex, 'Gaia get exception');


          // @TODO dont assume all exceptions are missing gaia file

          const encrypt = true;
          const data = {
            coinz: this.state.coinz,
            pref: { currency: "USD" }
          };
          putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt)
            .then(() => {
              window.location.reload();
            })
            .catch((ex) => {
              console.log(ex, 'Gaia put exception');
            })
        })

    } else {
      const storage = this.readLocalStorage();
      // Migrate any invalid symbols in the portfolio
      this.migrateInvalidSymbols(storage.coinz).then((migratedCoinz) => {
        this.marketData(migratedCoinz);
        this.setState({
          coinz: migratedCoinz,
          pref: storage.pref
        });
      });
      this.fetchExchangeRates();
    }

  }

  saveNewPref = (name, value) => {
    if (isUserSignedIn()) {
      const encrypt = true;
      const data = {
        coinz: this.state.coinz,
        pref: { [name]: value }
      };
      // set state first, to avoid waiting for storage to update
      this.setState({
        pref: data.pref
      });
      putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt)
        .catch((ex) => {
          console.log(ex, 'Gaia put exception');
        })
    } else {
      const prefs = JSON.parse(localStorage.getItem("pref")) || {};
      prefs[name] = value;
      localStorage.setItem("pref", JSON.stringify(prefs));
      this.setState({ pref: prefs });
    }
  }


  deleteCoin = (coin, history) => {
    var strconfirm = window.confirm(string.remove + coin.toUpperCase() + string.fromportfolio);
    if (strconfirm === true) {

      const current = this.state.coinz;
      Object.assign({}, current);
      delete current[coin];

      if (isUserSignedIn()) {
        // delete from blockstack
        const data = {
          coinz: current,
          pref: this.state.pref
        };
        const encrypt = true;
        putFile(this.state.gaiaStorage, JSON.stringify(data), encrypt)
          // may not need to set state, because it should read from storage again
          .then(() => {
            this.setState({
              coinz: current
            })
          })
          .catch((ex) => {
            console.log(ex, 'Gaia put exception');
          })

      } else {
        // delete from localStorage
        localStorage.setItem("coinz", JSON.stringify(current));
        // go back home
      }

      // then go back
      history.goBack();

    }
  }

  componentWillUnmount() {
    // Clean up the market data refresh timer
    if (this.marketDataRefreshTimer) {
      clearInterval(this.marketDataRefreshTimer);
      this.marketDataRefreshTimer = null;
    }
  }

  startMarketDataRefresh = () => {
    // Clear any existing timer
    if (this.marketDataRefreshTimer) {
      clearInterval(this.marketDataRefreshTimer);
    }

    // Set up periodic refresh every 5 minutes (respectful of API limits)
    this.marketDataRefreshTimer = setInterval(() => {
      const { coinz } = this.state;
      if (coinz && Object.keys(coinz).length > 0) {
        console.log('🔄 Auto-refreshing market data...');
        this.marketData(coinz);
      }
    }, 300000); // 5 minutes

    console.log('⏰ Started automatic price updates every 5 minutes');
  }

  render() {
    const exchangeRate = this.state.exchangeRates[this.state.pref.currency]
      ? this.state.exchangeRates[this.state.pref.currency]
      : 1; // default 1 for USD

    const totalPortfolio = this.totalPortfolio(exchangeRate);

    return (
      <BrowserRouter>
        <div>
          <NotificationSystem />
          <RealTimeMonitoring 
            coinz={this.state.coinz}
            marketData={this.state.marketData}
          />
          <Switch>
            <Route exact path="/"
              render={
                (props) => <Home {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  exchangeRate={exchangeRate}
                  supportedCurrencies={this.state.supportedCurrencies}
                  totalPortfolio={totalPortfolio}
                  currency={this.state.pref && this.state.pref.currency || "USD"}
                  language={this.state.pref && this.state.pref.language || "EN"}
                  addCoinz={this.addCoinz}
                  saveNewPref={this.saveNewPref}
                />
              }
            />

            <Route exact path="/blockstack"
              render={
                (props) => <Blockstack {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  exchangeRate={exchangeRate}
                  supportedCurrencies={this.state.supportedCurrencies}
                  currency={this.state.pref && this.state.pref.currency || "USD"}
                  language={this.state.pref && this.state.pref.language || "EN"}
                  addCoinz={this.addCoinz}
                  saveNewPref={this.saveNewPref}
                />
              }
            />

            <Route path="/coin/*"
              render={
                (props) => <Coin {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  blockstack={this.state.blockstack}
                  exchangeRate={exchangeRate}
                  deleteCoin={this.deleteCoin}
                  currency={this.state.pref && this.state.pref.currency || "USD"}
                  language={this.state.pref && this.state.pref.language || "EN"}
                />
              }
            />

            <Route path="/pie"
              render={
                (props) => <Pie {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  exchangeRate={exchangeRate}
                  totalPortfolio={totalPortfolio}
                  language={this.state.pref && this.state.pref.language || "EN"}
                />
              }
            />

            <Route path="/menu"
              render={
                (props) => <Menu {...props}
                  addCoinz={this.addCoinz}
                  blockstack={this.state.blockstack}
                  pref={this.state.pref}
                  saveNewPref={this.saveNewPref}
                  supportedCurrencies={this.state.supportedCurrencies}
                  currency={this.state.pref && this.state.pref.currency || "USD"}
                  language={this.state.pref && this.state.pref.language || "EN"}
                />
              }
            />

            <Route path="/supportedcoins" component={SupportedCoins} />

            <Route path="/analytics"
              render={
                (props) => <Analytics {...props}
                  coinz={this.state.coinz}
                  marketData={this.state.marketData}
                  exchangeRate={exchangeRate}
                  totalPortfolio={totalPortfolio}
                  currency={this.state.pref && this.state.pref.currency || "USD"}
                  language={this.state.pref && this.state.pref.language || "EN"}
                />
              }
            />

          </Switch>
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
