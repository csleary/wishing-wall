const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const nem = require('nem-sdk').default;
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', socket => {
  socket.on('address', address => {
    let endpoint;
    let endpointSocket;
    let network;

    if (address.startsWith('T')) {
      endpoint = nem.model.objects.create('endpoint')(
        // nem.model.nodes.defaultTestnet,
        'http://23.228.67.85',
        nem.model.nodes.defaultPort
      );
      endpointSocket = nem.model.objects.create('endpoint')(
        // nem.model.nodes.defaultTestnet,
        'http://23.228.67.85',
        nem.model.nodes.websocketPort
      );
      network = 'testnet';
    } else {
      endpoint = nem.model.objects.create('endpoint')(
        nem.model.nodes.defaultMainnet,
        nem.model.nodes.defaultPort
      );
      endpointSocket = nem.model.objects.create('endpoint')(
        nem.model.nodes.defaultMainnet,
        nem.model.nodes.websocketPort
      );
      network = 'mainnet';
    }

    const connector = nem.com.websockets.connector.create(
      endpointSocket,
      address
    );

    connector.connect().then(
      () => {
        nem.com.websockets.subscribe.chain.height(connector, res => {
          io.emit('height', res.height);
        });

        nem.com.websockets.subscribe.account.transactions.unconfirmed(
          connector,
          res => {
            io.emit('transactionsUnconfirmed', res);
          }
        );

        nem.com.websockets.subscribe.account.transactions.confirmed(
          connector,
          res => {
            io.emit('transactionsConfirmed', res);
          }
        );
      },
      err => {
        io.emit('error', err);
      }
    );
    socket.emit('node', { endpoint, endpointSocket, network });
  });

  socket.on(
    'fetchIncomingTransactions',
    ({ endpoint, address, transactionsMax }) => {
      nem.com.requests.chain.height(endpoint).then(res => {
        io.emit('height', res.height);
      });

      let txId;
      let total = [];
      const fetchTransactions = async () => {
        try {
          const incoming = await nem.com.requests.account.transactions.incoming(
            endpoint,
            address,
            null,
            txId
          );

          const currentBatch = incoming.data || [];
          total = [...total, ...currentBatch];
          if (total.length >= transactionsMax) {
            socket.emit('incomingTransactions', total);
          } else if (currentBatch.length === 25) {
            txId = currentBatch[currentBatch.length - 1].meta.id;
            fetchTransactions();
          } else {
            socket.emit('incomingTransactions', total);
          }
        } catch (err) {
          io.emit('error', err);
        }
      };
      fetchTransactions();
    }
  );
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

server.listen(8082);
