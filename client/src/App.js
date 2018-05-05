import nem from 'nem-sdk';
import React, { Component } from 'react';
import { Container, Loader, Grid } from 'semantic-ui-react';
import Footer from './Footer';
import Header from './Header';
import StatusBar from './StatusBar';
import TransactionList from './TransactionList';
import WishButton from './WishButton';
import { fetchIncomingTransactions } from './utils';

const query = window.location.search.substring(1).split('=');
const params = { [query[0]]: query[1] };
const ADDRESS = params.address || 'TDJO3IMOI4QNYVYWWLCRQZ25W2QFRWHTLPK5WSL7';

const ENDPOINT = ADDRESS.startsWith('T')
  ? nem.model.objects.create('endpoint')(
      nem.model.nodes.defaultTestnet,
      nem.model.nodes.defaultPort
    )
  : nem.model.objects.create('endpoint')(
      nem.model.nodes.defaultMainnet,
      nem.model.nodes.defaultPort
    );

const WEBSOCKET_ENDPOINT = ADDRESS.startsWith('T')
  ? nem.model.objects.create('endpoint')(
      // nem.model.nodes.defaultTestnet,
      'http://23.228.67.85',
      // nem.model.nodes.websocketPort
      7778
    )
  : nem.model.objects.create('endpoint')(
      nem.model.nodes.defaultMainnet,
      nem.model.nodes.websocketPort
    );

const nemWsConnector = nem.com.websockets.connector.create(
  WEBSOCKET_ENDPOINT,
  ADDRESS
);
let copyMessageDelay = null;

class App extends Component {
  state = {
    errors: [],
    height: '',
    isLoading: true,
    messages: [],
    node: '',
    showCode: false,
    showCopyMessage: false,
    socketConnected: false,
    sortByValue: true,
    transactionsConfirmed: [],
    transactionsMax: 100,
    transactionsRecent: [],
    transactionsUnconfirmed: []
  };

  async componentDidMount() {
    this.handleFetchRecentTransactions();

    nemWsConnector.connect().then(
      async () => {
        this.setState({
          node: WEBSOCKET_ENDPOINT,
          socketConnected: true
        });

        nem.com.websockets.subscribe.chain.height(nemWsConnector, res => {
          this.setState({
            height: res.height
          });
        });

        // nem.com.websockets.subscribe.account.transactions.recent(
        //   nemWsConnector,
        //   res => {
        //     this.setState({
        //       isLoading: false,
        //       transactionsRecent: res.data
        //     });
        //     this.newMessage(`${new Date().toLocaleTimeString()}: Received recent transactions.`);
        //   }
        // );

        nem.com.websockets.subscribe.account.transactions.confirmed(
          nemWsConnector,
          res => {
            this.setState({
              transactionsConfirmed: [...this.state.transactionsConfirmed, res]
            });
            this.newMessage(`${new Date().toLocaleTimeString()}: Received confirmed transaction!`);
          }
        );

        nem.com.websockets.subscribe.account.transactions.unconfirmed(
          nemWsConnector,
          res => {
            this.setState({
              transactionsUnconfirmed: [
                ...this.state.transactionsUnconfirmed,
                res
              ]
            });
            this.newMessage(`${new Date().toLocaleTimeString()}: Received unconfirmed transaction.`);
          }
        );

        nem.com.websockets.requests.account.transactions.recent(nemWsConnector);
      },
      err => {
        this.setState({ errors: [...this.state.errors, err] });
      }
    );
  }

  newMessage = message => {
    this.setState({ messages: [message, ...this.state.messages] });
  };

  handleClick = () => {
    this.setState({ showCode: !this.state.showCode });
  };

  handleCopyTimeout = () => {
    clearTimeout(copyMessageDelay);
    this.setState({ showCopyMessage: true });
    copyMessageDelay = setTimeout(() => {
      this.setState({ showCopyMessage: false });
    }, 2000);
  };

  handleFetchRecentTransactions = async () => {
    this.newMessage(`${new Date().toLocaleTimeString()}: Fetching recent transactions…`);
    const transactionsRecent = await fetchIncomingTransactions(
      ADDRESS,
      this.state.transactionsMax
    );
    if (transactionsRecent) {
      this.setState({ isLoading: false, transactionsRecent });
      const count = transactionsRecent.length;
      this.newMessage(`${new Date().toLocaleTimeString()}: Received ${count} recent transaction${count >
          1 && 's'}.`);
    } else {
      this.setState({ isLoading: false });
      this.newMessage(`${new Date().toLocaleTimeString()}: No recent transactions found.`);
    }
  };

  render() {
    return (
      <div>
        <StatusBar
          errors={this.state.errors}
          messages={this.state.messages}
          node={this.state.node}
          socketConnected={this.state.socketConnected}
        />
        <Container>
          <Header />
          <WishButton
            handleClick={this.handleClick}
            handleCopyTimeout={this.handleCopyTimeout}
            showCode={this.state.showCode}
            showCopyMessage={this.state.showCopyMessage}
          />
          <Grid padded="vertically" stackable>
            <Loader active={this.state.isLoading} inline="centered" size="big">
              Fetching recent transactions…
            </Loader>
            <TransactionList
              sortByValue={this.state.sortByValue}
              transactionsRecent={this.state.transactionsRecent}
              transactionsConfirmed={this.state.transactionsConfirmed}
            />
            <Footer height={this.state.height} />
          </Grid>
        </Container>
      </div>
    );
  }
}

export default App;
export { ADDRESS, ENDPOINT };
