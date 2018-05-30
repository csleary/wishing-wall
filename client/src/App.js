import nem from 'nem-sdk';
import React, { Component } from 'react';
import { Container, Loader, Grid } from 'semantic-ui-react';
import Footer from './Footer';
import Header from './Header';
import Options from './Options';
import StatusBar from './StatusBar';
import TransactionList from './TransactionList';
import WishButton from './WishButton';

const ADDRESS = 'TDJO3IMOI4QNYVYWWLCRQZ25W2QFRWHTLPK5WSL7';

let copyMessageDelay = null;
let socket;
const protocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:';
const port = process.env.NODE_ENV === 'development' ? ':8082' : '';
const socketUrl = `${protocol}//${window.location.hostname}${port}`;

window.onbeforeunload = () => {
  socket.close();
};

class App extends Component {
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
    nodeName: '',
    showCode: false,
    showCopyMessage: false,
    showEmbedCode: false,
    showOptions: false,
    showHeader: true,
    socketConnected: false,
    sortByValue: false,
    transactionsMax: 10,
    transactionsRecent: [],
    transactionsUnconfirmed: [],
    valid: true
  };

  async componentDidMount() {
    this.handleParams();
    this.socketConnect().then(() => {
      this.handleListeners();
      socket.onclose = e => {
        if (e.code !== 1005) this.socketReconnect();
      };
      this.handleFetchRecentTransactions();
    });
  }

  socketReconnect = () => {
    if (socket && socket.readyState === 1) socket.close();
    this.newMessage('Socket disconnected. Reconnecting…');
    this.socketConnect().then(() => {
      this.newMessage('Socket reconnected.');
      this.handleListeners();
      this.handleFetchRecentTransactions();
    });
  };

  handleParams = () => {
    const options = ['address', 'max', 'showHeader', 'sortByValue'];
    const queries = window.location.search.length
      ? window.location.search.substring(1).split('&')
      : [];
    queries.forEach(query => {
      const pair = query.split('=');
      const key = pair[0];
      const value = pair[1];
      if (!options.includes(key)) {
        return;
      }
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
  };

  payload = (type, data) => JSON.stringify({ type, data });

  socketConnect = () =>
    new Promise(resolve => {
      const checkSocket = success => {
        if (!socket || socket.readyState === 3) {
          socket = new WebSocket(socketUrl);
        }
        if (socket && socket.readyState === 1) {
          success();
        } else {
          setTimeout(() => checkSocket(success), 100);
        }
      };

      checkSocket(() => {
        socket.send(this.payload('address', this.state.address));

        socket.addEventListener('message', event => {
          const message = JSON.parse(event.data);
          if (message.type === 'node') {
            const { endpoint, network, nodeName } = message.data;
            this.setState({
              endpoint,
              network,
              nodeName,
              socketConnected: true
            });
            resolve();
          }
        });
      });
    });

  handleListeners = () => {
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'height':
          this.setState({
            height: message.data
          });
          break;
        case 'transactionsUnconfirmed':
          return this.transactionsUnconfirmed(message.data);
        case 'transactionsConfirmed':
          return this.transactionsConfirmed(message.data);
        case 'transactionsRecent':
          return this.transactionsRecent(message.data);
        case 'error':
          this.setState({
            errors: [...this.state.errors, message.data]
          });
          break;
        default:
          break;
      }
    });
  };

  transactionsUnconfirmed = tx => {
    if (Array.isArray(tx)) {
      this.setState({
        transactionsUnconfirmed: tx
      });
      this.newMessage(`${new Date().toLocaleTimeString()}: Received unconfirmed transaction${
          tx.length > 1 ? 's' : ''
        }…`);
    } else {
      this.setState({
        transactionsUnconfirmed: [
          tx,
          ...this.state.transactionsUnconfirmed.filter(el => el.signature !== tx.signature)
        ]
      });
      this.newMessage(`${new Date().toLocaleTimeString()}: Received unconfirmed transaction…`);
    }
  };

  transactionsConfirmed = tx => {
    const hash = tx.transactionInfo.hash.data;
    const shortHash = `${hash.substring(0, 3)}…${hash.substring(hash.length - 3)}`;
    this.setState({
      transactionsUnconfirmed: [
        ...this.state.transactionsUnconfirmed.filter(el => el.signature !== tx.signature)
      ],
      transactionsRecent: [
        tx,
        ...this.state.transactionsRecent.filter(el => el.signature !== tx.signature)
      ]
    });
    this.newMessage(`${new Date().toLocaleTimeString()}: Transaction ${shortHash} confirmed!`);
  };

  transactionsRecent = transactionsRecent => {
    const { transactionsMax } = this.state;
    const count = transactionsRecent.length;
    if (count) {
      this.setState({
        isLoading: false,
        isUpdating: false,
        transactionsRecent
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
      this.newMessage(`${new Date().toLocaleTimeString()}: No recent transactions found. How tragic.`);
    }
  };

  handleFetchRecentTransactions = () => {
    const { address, network, transactionsMax } = this.state;
    this.newMessage(`${new Date().toLocaleTimeString()}: Fetching recent transactions…`);

    socket.send(this.payload('fetchIncomingTransactions', {
        address,
        network,
        transactionsMax
      }));
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
    clearTimeout(copyMessageDelay);
    this.setState({ showCopyMessage: true });
    copyMessageDelay = setTimeout(() => {
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
        this.setState({ [name]: parseInt(value, 10) });
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
      this.setState({
        isUpdating: true
      });
      this.socketReconnect();
    }
  };

  render() {
    return (
      <div>
        <StatusBar
          errors={this.state.errors}
          messages={this.state.messages}
          endpoint={this.state.endpoint}
          nodeName={this.state.nodeName}
          socketConnected={this.state.socketConnected}
        />
        <Container>
          {this.state.showHeader && <Header />}
          <WishButton
            address={this.state.address}
            handleOptionsClick={this.handleOptionsClick}
            handleWishClick={this.handleWishClick}
            handleCopyTimeout={this.handleCopyTimeout}
            network={this.state.network}
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
                isUpdating={this.state.isUpdating}
                network={this.state.network}
                sortByValue={this.state.sortByValue}
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
