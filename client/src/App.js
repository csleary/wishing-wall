import nem from 'nem-sdk';
import React, { Component } from 'react';
import { Container, Loader, Grid } from 'semantic-ui-react';
import Footer from './Footer';
import Header from './Header';
import StatusBar from './StatusBar';
import TransactionList from './TransactionList';
import WishButton from './WishButton';

// const address = 'TCQFU2U2UR27EYLADA6FNE6KY7ONFM7YH7ZYREBS';
const address = 'TDJO3IMOI4QNYVYWWLCRQZ25W2QFRWHTLPK5WSL7';
const endpoint = { host: 'http://23.228.67.85', port: 7778 };
// const endpoint = nem.model.objects.create('endpoint')(
//   nem.model.nodes.defaultMainnet,
//   nem.model.nodes.websocketPort
// );
const nemConnector = nem.com.websockets.connector.create(endpoint, address);
let copyMessageDelay = null;

class App extends Component {
  state = {
    errors: [],
    height: '',
    isLoading: true,
    messages: [],
    showCode: false,
    showCopyMessage: false,
    socketConnected: false,
    transactionsConfirmed: [],
    transactionsRecent: [],
    transactionsUnconfirmed: []
  };

  async componentDidMount() {
    nemConnector.connect().then(
      () => {
        this.setState({
          socketConnected: true
        });
        nem.com.websockets.subscribe.chain.height(nemConnector, res => {
          this.setState({
            height: res.height
          });
        });

        nem.com.websockets.subscribe.account.transactions.recent(
          nemConnector,
          res => {
            this.setState({
              isLoading: false,
              transactionsRecent: res.data
            });
            this.newMessage(`${new Date().toLocaleTimeString()}: Received recent transactions.`);
          }
        );

        nem.com.websockets.subscribe.account.transactions.confirmed(
          nemConnector,
          res => {
            this.setState({
              transactionsConfirmed: [...this.state.transactionsConfirmed, res]
            });
            this.newMessage(`${new Date().toLocaleTimeString()}: Received confirmed transaction!`);
          }
        );

        nem.com.websockets.subscribe.account.transactions.unconfirmed(
          nemConnector,
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

        nem.com.websockets.requests.account.transactions.recent(nemConnector);
      },
      err => {
        this.setState({ errors: [...this.state.errors, err] });
      }
    );
  }

  newMessage = message => {
    this.setState({ messages: [...this.state.messages, message] });
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

  render() {
    return (
      <div>
        <StatusBar
          errors={this.state.errors}
          messages={this.state.messages}
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
export { address };
