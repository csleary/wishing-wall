const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const nem = require('nem-sdk').default;

// const endpoint = nem.model.objects.create('endpoint')(
//   nem.model.nodes.defaultMainnet,
//   nem.model.nodes.websocketPort
// );

const endpoint = { host: 'http://23.228.67.85', port: 7778 };
const address = 'TCQFU2U2UR27EYLADA6FNE6KY7ONFM7YH7ZYREBS';

const nemConnector = nem.com.websockets.connector.create(endpoint, address);

nemConnector.connect().then(
  () => {
    nem.com.websockets.subscribe.chain.height(nemConnector, res => {
      io.emit('height', res.height);
    });

    nem.com.websockets.subscribe.account.transactions.recent(
      nemConnector,
      res => {
        io.emit('transactionsRecent', res);
        io.send(`${new Date().toLocaleTimeString()}: Received recent transactions.`);
      }
    );

    nem.com.websockets.subscribe.account.transactions.confirmed(
      nemConnector,
      res => {
        io.emit('transactionsConfirmed', res);
        io.send(`${new Date().toLocaleTimeString()}: Received confirmed transaction!`);
      }
    );

    nem.com.websockets.subscribe.account.transactions.unconfirmed(
      nemConnector,
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
    nem.com.websockets.requests.account.transactions.recent(nemConnector);
  });
});

server.listen(5000);
