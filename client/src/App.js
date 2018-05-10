import nem from 'nem-sdk';
import React, { Component } from 'react';
import { Container, Loader, Grid } from 'semantic-ui-react';
import Stomp from 'stompjs';
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
    this.client = null;
    this.socket = null;
  }

  state = {
    address: ADDRESS,
    endpoint: {},
    errors: [],
    formErrors: [],
    height: null,
    isLoading: true,
    isUpdating: false,
    messages: [],
    showCode: false,
    showCopyMessage: false,
    showEmbedCode: false,
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

      const { host, port } = endpointSocket;
      const hostAddress = host.split('://')[1];
      const url = `ws://${hostAddress}:${port}/w/messages/websocket`;

      if (this.socket) {
        this.socket.close();
      }

      this.socket = new WebSocket(url);
      this.client = Stomp.over(this.socket);
      this.client.debug = undefined;

      this.client.connect({}, () => {
        this.setState({
          socketConnected: true
        });

        this.client.subscribe('/blocks/new', data => {
          const res = JSON.parse(data.body);
          this.setState({
            height: res.height
          });
        });

        this.client.subscribe('/errors', data => {
          const err = JSON.parse(data.body);
          this.setState({
            errors: [...this.state.errors, err]
          });
        });

        this.client.subscribe(`/unconfirmed/${this.state.address}`, data => {
          const res = JSON.parse(data.body);
          this.setState({
            transactionsUnconfirmed: [
              res,
              ...this.state.transactionsUnconfirmed
            ]
          });
          this.newMessage(`${new Date().toLocaleTimeString()}: Received unconfirmed transaction…`);
        });

        this.client.subscribe(`/transactions/${this.state.address}`, data => {
          const res = JSON.parse(data.body);
          const hash = res.meta.hash.data;
          const shortHash = `${hash.substring(0, 4)}…${hash.substring(hash.length - 4)}`;
          this.setState({
            transactionsConfirmed: [res, ...this.state.transactionsConfirmed],
            transactionsUnconfirmed: this.state.transactionsUnconfirmed.filter(unconfirmed =>
                this.state.transactionsConfirmed.forEach(confirmed =>
                    unconfirmed.meta.hash.data === confirmed.meta.hash.data))
          });
          this.newMessage(`${new Date().toLocaleTimeString()}: Transaction ${shortHash} confirmed!`);
        });
      });
      resolve();
    });

  newMessage = message => {
    this.setState({ messages: [message, ...this.state.messages] });
  };

  handleWishClick = () => {
    this.setState({ showCode: !this.state.showCode, showOptions: false });
  };

  handleOptionsClick = () => {
    this.setState({
      showCode: false,
      showEmbedCode: false,
      showOptions: !this.state.showOptions
    });
  };

  handleEmbedClick = () => {
    this.setState({ showEmbedCode: !this.state.showEmbedCode });
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
        this.setState({ [name]: value.trim() });
    }
  };

  validateForm = () => {
    const errors = {};
    if (!nem.model.address.isValid(this.state.address)) {
      errors.address = 'Invalid address. Please double-check it.';
    }
    return { errors, isValid: !Object.getOwnPropertyNames(errors).length > 0 };
  };

  isValid = () => {
    const { errors, isValid } = this.validateForm();
    this.setState({ formErrors: errors });
    return isValid;
  };

  handleSubmit = () => {
    if (this.isValid()) {
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
    }
  };

  handleFetchRecentTransactions = async () => {
    const { endpoint, address, transactionsMax } = this.state;

    nem.com.requests.chain.height(endpoint).then(res => {
      this.setState({ height: res.height });
    });

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
            errors={this.state.errors}
            formErrors={this.state.formErrors}
            handleChange={this.handleChange}
            handleEmbedClick={this.handleEmbedClick}
            handleSubmit={this.handleSubmit}
            isUpdating={this.state.isUpdating}
            showEmbedCode={this.state.showEmbedCode}
            showOptions={this.state.showOptions}
            sortByValue={this.state.sortByValue}
            transactionsMax={this.state.transactionsMax}
          />
          <Grid padded="vertically" stackable style={{ paddingTop: '2rem' }}>
            <Loader active={this.state.isLoading} inline="centered" size="big">
              Fetching recent transactions…
            </Loader>
            <TransactionList
              address={this.state.address}
              height={this.state.height}
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
