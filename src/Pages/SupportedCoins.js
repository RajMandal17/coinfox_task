import React, { Component } from 'react';
import {Link} from 'react-router-dom';
import {translationStrings} from '../Utils/i18n';
import fetch from "fetch-retry";
import styled from 'styled-components';

const SupportedCoinsList = styled.ul`
  background: #303032;
  margin-top: 0px;
  list-style: none;
  padding: 65px 20px 0px 20px;
`;
const SupportedCoinItem = styled.li`
  border-bottom: 1px solid hsla(0,0%,100%,.1);
  color: white;
  padding: 10px 0;
`;

class SupportedCoins extends Component {

  constructor(props) {
    super(props);
    this.state = {
      supported: []
    }
  }

  componentWillMount () {
    // Add delay to avoid API rate limiting conflicts
    setTimeout(() => {
      fetch("https://api.coingecko.com/api/v3/coins/list")
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(coins => {
          this.setState({
            supported: coins.map(c => ({
              "code": c.symbol,
              "name": c.name,
              "statuses": ["primary"]
            }))
          })
        })
        .catch((e) => {
          console.warn('Failed to load supported coins', e);
          this.setState({ supported: [] });
        })
    }, 5000); // 5 second delay to avoid rate limiting conflicts
  }

  render() {
    console.log(this.state.supported, 'where coisn');

    return (
      <div className="SupportedCoins">
        <div id="topMenu">
          <Link className="menu" key='nav' to={'/menu'}>
            <i className="btn-menu fa fa-lg fa-times" aria-hidden="true"></i>
          </Link>
        </div>
        <div>
          <SupportedCoinsList>
          {this.state.supported.map((coin)=>(
            <SupportedCoinItem>
              {coin.name} ({coin.code})
            </SupportedCoinItem>
          ))}
          </SupportedCoinsList>
        </div>
      </div>
    );
  }
}

export default SupportedCoins;
