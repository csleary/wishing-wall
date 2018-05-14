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

// const ADDRESS = 'TDJO3IMOI4QNYVYWWLCRQZ25W2QFRWHTLPK5WSL7';
const ADDRESS = 'NAER66DXCNYEBNMTWAPKG7CU27CMUPTQQDSM2KL6';

class App extends Component {
  constructor(props) {
    super(props);
    this.copyMessageDelay = null;
    this.client = null;
    this.socket = null;
    this.subscriptionBlocks = null;
  }

  state = {
    address: ADDRESS,
    endpoint: {},
    errors: [],
    formErrors: {},
    height: null,
    isLoading: true,
    isUpdating: false,
    messages: [],
    network: '',
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

  socketConnect = (clientSuccess, clientError) => {
    const checkSocket = () => {
      if (this.socket && this.socket.readyState === 1) {
        this.socket.close();
      }
      if (!this.socket || this.socket.readyState === 3) {
        this.socket = new WebSocket(this.socketUrl());
        this.client = Stomp.over(this.socket);
        // this.client.debug = undefined;
        this.client.heartbeat.outgoing = 0;
        this.client.heartbeat.incoming = 0;
        this.client.maxWebSocketFrameSize = 128 * 1024;
        this.client.connect({}, clientSuccess, clientError);
      } else {
        setTimeout(checkSocket, 100);
      }
    };
    checkSocket();
  };

  nemNodeConnect = () =>
    new Promise(resolve => {
      let endpoint;
      let endpointSocket;
      const { address } = this.state;

      if (address.startsWith('T')) {
        endpoint = nem.model.objects.create('endpoint')(
          // nem.model.nodes.defaultTestnet,
          'http://23.228.67.85',
          nem.model.nodes.defaultPort
        );
        endpointSocket = nem.model.objects.create('endpoint')(
          'http://23.228.67.85',
          nem.model.nodes.websocketPort
        );
        this.setState({ network: 'testnet' });
      } else {
        endpoint = nem.model.objects.create('endpoint')(
          // nem.model.nodes.defaultMainnet,
          'https://london.nemchina.com',
          // nem.model.nodes.defaultPort
          7891 // https
        );
        endpointSocket = nem.model.objects.create('endpoint')(
          // nem.model.nodes.defaultMainnet,
          'https://london.nemchina.com',
          // nem.model.nodes.websocketPort
          7779 // wss
        );
        this.setState({ network: 'mainnet' });
      }
      this.setState(() => ({ endpoint, endpointSocket }));

      const clientSuccess = () => {
        this.setState({
          socketConnected: true
        });

        this.newMessage(`${new Date().toLocaleTimeString()}: Websocket connected.`);

        this.subscriptionBlocks = this.client.subscribe('/blocks/new', data => {
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
          const shortHash = `${hash.substring(0, 3)}…${hash.substring(hash.length - 3)}`;
          this.setState({
            transactionsConfirmed: [res, ...this.state.transactionsConfirmed],
            transactionsUnconfirmed: this.state.transactionsUnconfirmed.filter(unconfirmed =>
                this.state.transactionsConfirmed.forEach(confirmed =>
                    unconfirmed.meta.hash.data === confirmed.meta.hash.data))
          });
          this.newMessage(`${new Date().toLocaleTimeString()}: Transaction ${shortHash} confirmed!`);
        });
        resolve();
      };

      const clientError = () => {
        this.setState({
          socketConnected: false
        });
        this.newMessage(`${new Date().toLocaleTimeString()}: Websocket error. Reconnecting…`);

        this.socketConnect(clientSuccess, clientError);
      };
      this.socketConnect(clientSuccess, clientError);
    });

  socketUrl = () => {
    const { host, port } = this.state.endpointSocket;
    const hostAddress = host.split('://')[1];
    const socketProtocol = host.split('://')[0] === 'https' ? 'wss' : 'ws';
    return `${socketProtocol}://${hostAddress}:${port}/w/messages/websocket`;
  };

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
    const { formErrors } = this.state;
    delete formErrors[name];
    switch (name) {
      case 'address':
        this.setState({ [name]: value.trim().replace(/-/g, '') });
        if (!value.length) {
          formErrors[name] =
            'Please enter the NEM address you wish to monitor.';
        } else if (!nem.model.address.isValid(value)) {
          formErrors[name] = 'Invalid address. Please double-check it.';
        }
        break;
      case 'sortByValue':
        this.setState({ [name]: !this.state.sortByValue });
        break;
      case 'transactionsMax':
        if (value) {
          this.setState({ [name]: parseInt(value, 10) });
        } else {
          this.setState({ [name]: 0 });
        }
        break;
      default:
        break;
    }
    this.setState(...this.state.formErrors, { formErrors });
    this.validate();
  };

  validate = () => {
    if (Object.getOwnPropertyNames(this.state.formErrors).length) {
      this.setState({ valid: false });
    } else {
      this.setState({ valid: true });
    }
  };

  handleSubmit = () => {
    if (this.state.valid) {
      this.client.disconnect(() => {
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
    const count = transactionsRecent.length;
    if (count) {
      this.setState({
        isLoading: false,
        isUpdating: false,
        transactionsConfirmed: [],
        transactionsRecent,
        transactionsUnconfirmed: []
      });
      const showTransactionsMax =
        transactionsMax < count && transactionsMax !== 100
          ? ` (displaying${
              this.state.sortByValue ? ' top' : ' '
            } ${transactionsMax})`
          : '';
      this.newMessage(`${new Date().toLocaleTimeString()}: Received ${count} recent transaction${
          count === 1 ? '' : 's'
        }${showTransactionsMax}.`);
    } else {
      this.setState({ isLoading: false, isUpdating: false });
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
            valid={this.state.valid}
          />
          <Grid padded="vertically" stackable style={{ paddingTop: '2rem' }}>
            <Loader active={this.state.isLoading} inline="centered" size="big">
              Fetching recent transactions…
            </Loader>
            {!this.state.isLoading && (
              <TransactionList
                address={this.state.address}
                height={this.state.height}
                network={this.state.network}
                sortByValue={this.state.sortByValue}
                transactionsConfirmed={this.state.transactionsConfirmed}
                transactionsUnconfirmed={this.state.transactionsUnconfirmed}
                transactionsMax={this.state.transactionsMax}
                transactionsRecent={this.state.transactionsRecent}
              />
            )}
            <Footer height={this.state.height} network={this.state.network} />
          </Grid>
        </Container>
      </div>
    );
  }
}

export default App;
