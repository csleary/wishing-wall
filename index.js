const express = require('express');
const http = require('http');
const nem = require('nem-sdk').default;
const path = require('path');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const payload = (type, data) => JSON.stringify({ type, data });

const handleEndpoints = (socket, message) => {
  let endpoint;
  let endpointSocket;
  let network;
  const address = message.data;

  if (address.startsWith('T')) {
    endpoint = nem.model.objects.create('endpoint')(
      'http://23.228.67.85',
      nem.model.nodes.defaultPort
    );
    endpointSocket = nem.model.objects.create('endpoint')(
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
        socket.send(payload('height', res.height));
      });

      nem.com.websockets.subscribe.account.transactions.unconfirmed(
        connector,
        res => {
          socket.send(payload('transactionsUnconfirmed', res));
        }
      );

      nem.com.websockets.subscribe.account.transactions.confirmed(
        connector,
        res => {
          socket.send(payload('transactionsConfirmed', res));
        }
      );
    },
    error => {
      socket.send(payload('error', error));
    }
  );
  socket.send(payload('node', {
      endpoint,
      endpointSocket,
      network
    }));
};

const handleIncomingTransactions = (socket, message) => {
  const { endpoint, address, transactionsMax } = message.data;

  nem.com.requests.chain.height(endpoint).then(res => {
    socket.send(payload('height', res.height));
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
        socket.send(payload('incomingTransactions', total));
      } else if (currentBatch.length === 25) {
        txId = currentBatch[currentBatch.length - 1].meta.id;
        fetchTransactions();
      } else {
        socket.send(payload('incomingTransactions', total));
      }
    } catch (error) {
      socket.send(payload('error', error));
    }
  };
  fetchTransactions();
};

wss.on('connection', socket => {
  socket.on('message', event => {
    const message = JSON.parse(event);
    switch (message.type) {
      case 'address':
        handleEndpoints(socket, message);
        break;
      case 'fetchIncomingTransactions':
        handleIncomingTransactions(socket, message);
        break;
      default:
    }
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

server.listen(8082);
