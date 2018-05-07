import nem from 'nem-sdk';
import React, { Component } from 'react';
import { Container, Loader, Grid } from 'semantic-ui-react';
import Footer from './Footer';
import Header from './Header';
import Options from './Options';
import StatusBar from './StatusBar';
import TransactionList from './TransactionList';
import WishButton from './WishButton';
import { fetchIncomingTransactions } from './utils';

const ADDRESS = 'TDJO3IMOI4QNYVYWWLCRQZ25W2QFRWHTLPK5WSL7';

class App extends Component {
  constructor(props) {
    super(props);
    this.copyMessageDelay = null;
  }

  state = {
    address: ADDRESS,
    endpoint: {},
    errors: [],
    height: null,
    isLoading: true,
    isUpdating: false,
    messages: [],
    showCode: false,
    showCopyMessage: false,
    showOptions: false,
    socketConnected: false,
    sortByValue: true,
    transactionsConfirmed: [],
    transactionsMax: 100,
    transactionsRecent: [],
    transactionsUnconfirmed: []
  };

  async componentDidMount() {
    this.handleParams().then(() => {
      this.nemNodeConnect().then(() => {
        this.handleFetchRecentTransactions();
      });
    });
  }

  handleParams = () =>
    new Promise(resolve => {
      const queries = window.location.search.length
        ? window.location.search.substring(1).split('&')
        : [];
      queries.forEach(query => {
        const pair = query.split('=');
        const key = pair[0];
        const value = pair[1];
        if (value === 'true' || value === 'false') {
          pair[1] = value === 'true';
        }
        if (parseInt(value, 10)) {
          pair[1] = parseInt(value, 10);
        }
        if (key === 'max') {
          pair[0] = 'transactionsMax';
        }
        this.setState({ [pair[0]]: pair[1] });
      });
      resolve();
    });

  nemNodeConnect = () =>
    new Promise(resolve => {
      let endpoint;
      let endpointSocket;
      const { address } = this.state;

      if (address.startsWith('T')) {
        endpoint = nem.model.objects.create('endpoint')(
          'http://23.228.67.85',
          nem.model.nodes.defaultPort
        );
      } else {
        endpoint = nem.model.objects.create('endpoint')(
          nem.model.nodes.defaultMainnet,
          nem.model.nodes.defaultPort
        );
      }

      this.setState(() => ({ endpoint }));

      if (address.startsWith('T')) {
        endpointSocket = nem.model.objects.create('endpoint')(
          'http://23.228.67.85',
          nem.model.nodes.websocketPort
        );
      } else {
        endpointSocket = nem.model.objects.create('endpoint')(
          nem.model.nodes.defaultMainnet,
          nem.model.nodes.websocketPort
        );
      }

      this.setState(() => ({ endpointSocket }));

      const connector = nem.com.websockets.connector.create(
        endpointSocket,
        address
      );

      connector.connect().then(
        () => {
          this.setState({
            socketConnected: true
          });

          nem.com.websockets.subscribe.chain.height(connector, res => {
            this.setState({
              height: res.height
            });
          });

          nem.com.websockets.subscribe.account.transactions.confirmed(
            connector,
            res => {
              this.setState({
                transactionsConfirmed: [
                  ...this.state.transactionsConfirmed,
                  res
                ],
                transactionsUnconfirmed: this.state.transactionsUnconfirmed.filter(tx => !this.state.transactionsConfirmed.includes(tx))
              });
              this.newMessage(`${new Date().toLocaleTimeString()}: Received confirmed transaction!`);
            }
          );

          nem.com.websockets.subscribe.account.transactions.unconfirmed(
            connector,
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
          resolve();
        },
        err => {
          this.setState({ errors: [...this.state.errors, err] });
        }
      );
    });

  newMessage = message => {
    this.setState({ messages: [message, ...this.state.messages] });
  };

  handleWishClick = () => {
    this.setState({ showCode: !this.state.showCode, showOptions: false });
  };

  handleOptionsClick = () => {
    this.setState({ showCode: false, showOptions: !this.state.showOptions });
  };

  handleCopyTimeout = () => {
    clearTimeout(this.copyMessageDelay);
    this.setState({ showCopyMessage: true });
    this.copyMessageDelay = setTimeout(() => {
      this.setState({ showCopyMessage: false });
    }, 2000);
  };

  handleChange = (e, { name, value }) => {
    switch (name) {
      case 'sortByValue':
        this.setState({ sortByValue: !this.state.sortByValue });
        break;
      case 'transactionsMax':
        if (value) {
          this.setState({ [name]: parseInt(value, 10) });
        }
        break;
      default:
        this.setState({ [name]: value });
    }
  };

  handleSubmit = () => {
    this.setState({
      isUpdating: true
    });
    this.nemNodeConnect()
      .then(() => {
        this.handleFetchRecentTransactions();
      })
      .catch(err => {
        this.setState({
          errors: [...this.state.errors, err],
          isUpdating: false
        });
      });
  };

  handleFetchRecentTransactions = async () => {
    const { endpoint, address, transactionsMax } = this.state;
    this.newMessage(`${new Date().toLocaleTimeString()}: Fetching recent transactions…`);
    const transactionsRecent = await fetchIncomingTransactions(
      endpoint,
      address,
      transactionsMax
    );
    if (transactionsRecent) {
      this.setState({
        isLoading: false,
        isUpdating: false,
        transactionsConfirmed: [],
        transactionsRecent,
        transactionsUnconfirmed: []
      });
      const count = transactionsRecent.length;
      const showTransactionsMax =
        transactionsMax < count && transactionsMax !== 100
          ? ` (displaying${
              this.state.sortByValue ? ' top' : ' '
            } ${transactionsMax})`
          : '';
      this.newMessage(`${new Date().toLocaleTimeString()}: Received ${count} recent transaction${count >
          1 && 's'}${showTransactionsMax}.`);
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
          endpointSocket={this.state.endpointSocket}
          socketConnected={this.state.socketConnected}
          transactionsMax={this.state.transactionsMax}
        />
        <Container>
          <Header />
          <WishButton
            address={this.state.address}
            handleOptionsClick={this.handleOptionsClick}
            handleWishClick={this.handleWishClick}
            handleCopyTimeout={this.handleCopyTimeout}
            showCode={this.state.showCode}
            showCopyMessage={this.state.showCopyMessage}
            showOptions={this.state.showOptions}
          />
          <Options
            address={this.state.address}
            handleChange={this.handleChange}
            handleSubmit={this.handleSubmit}
            isUpdating={this.state.isUpdating}
            showOptions={this.state.showOptions}
            sortByValue={this.state.sortByValue}
            transactionsMax={this.state.transactionsMax}
          />
          <Grid padded="vertically" stackable style={{ paddingTop: '2rem' }}>
            <Loader active={this.state.isLoading} inline="centered" size="big">
              Fetching recent transactions…
            </Loader>
            <TransactionList
              sortByValue={this.state.sortByValue}
              transactionsConfirmed={this.state.transactionsConfirmed}
              transactionsUnconfirmed={this.state.transactionsUnconfirmed}
              transactionsMax={this.state.transactionsMax}
              transactionsRecent={this.state.transactionsRecent}
            />
            <Footer height={this.state.height} />
          </Grid>
        </Container>
      </div>
    );
  }
}

export default App;
