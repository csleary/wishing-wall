const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const nem = require('nem-sdk').default;

// const endpoint = nem.model.objects.create('endpoint')(
//   nem.model.nodes.defaultMainnet,
//   nem.model.nodes.websocketPort
// );

const WEBSOCKET_ENDPOINT = { host: 'http://23.228.67.85', port: 7778 };
const ADDRESS = 'TCQFU2U2UR27EYLADA6FNE6KY7ONFM7YH7ZYREBS';

const nemWsConnector = nem.com.websockets.connector.create(
  WEBSOCKET_ENDPOINT,
  ADDRESS
);

nemWsConnector.connect().then(
  () => {
    nem.com.websockets.subscribe.chain.height(nemWsConnector, res => {
      io.emit('height', res.height);
    });

    nem.com.websockets.subscribe.account.transactions.recent(
      nemWsConnector,
      res => {
        io.emit('transactionsRecent', res);
        io.send(`${new Date().toLocaleTimeString()}: Received recent transactions.`);
      }
    );

    nem.com.websockets.subscribe.account.transactions.confirmed(
      nemWsConnector,
      res => {
        io.emit('transactionsConfirmed', res);
        io.send(`${new Date().toLocaleTimeString()}: Received confirmed transaction!`);
      }
    );

    nem.com.websockets.subscribe.account.transactions.unconfirmed(
      nemWsConnector,
      res => {
        io.emit('transactionsUnconfirmed', res);
        io.send(`${new Date().toLocaleTimeString()}: Received unconfirmed transaction.`);
      }
    );
  },
  err => {
    io.emit('error', err);
  }
);

io.on('connect', socket => {
  socket.on('fetchTransactions', () => {
    nem.com.websockets.requests.account.transactions.recent(nemWsConnector);
  });
});

server.listen(5000);
