const express = require('express');
const http = require('http');
const {
  AccountHttp,
  Address,
  BlockchainListener,
  ChainHttp,
  ConfirmedTransactionListener,
  NEMLibrary,
  NodeHttp,
  NetworkTypes,
  UnconfirmedTransactionListener
} = require('nem-library');
const path = require('path');
const WebSocket = require('ws');

const NODE_MAINNET = '199.217.118.114';
const NODE_TESTNET = '104.128.226.60';
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const payload = (type, data) => JSON.stringify({ type, data });

const isEncrypted = tx => {
  const { message, otherTransaction } = tx;
  const data = message || (otherTransaction && otherTransaction.message);
  if (data && data.constructor.name === 'EncryptedMessage') {
    data.encrypted = true;
  }
};

const handleEndpoints = (socket, message) => {
  NEMLibrary.reset();
  let network;
  let nodeHttp;
  const address = message.data;

  if (address.startsWith('T')) {
    NEMLibrary.bootstrap(NetworkTypes.TEST_NET);
    nodeHttp = new NodeHttp([
      { protocol: 'http', domain: NODE_TESTNET, port: 7890 }
    ]);
    network = 'testnet';
  } else {
    NEMLibrary.bootstrap(NetworkTypes.MAIN_NET);
    nodeHttp = new NodeHttp([
      { protocol: 'http', domain: NODE_MAINNET, port: 7890 }
    ]);
    network = 'mainnet';
  }

  nodeHttp.getNodeInfo().subscribe(node => {
    socket.send(payload('node', {
        endpoint: node.endpoint,
        network,
        nodeName: node.identity.name
      }));
  });

  const blockHeight = new BlockchainListener().newHeight();
  blockHeight.subscribe(
    height => {
      socket.send(payload('height', height));
    },
    error => {
      socket.send(payload('error', `NEM node connection error: ${error}`));
    }
  );

  const preparedAddress = new Address(address);
  const unconfirmed = new UnconfirmedTransactionListener().given(preparedAddress);
  unconfirmed.subscribe(
    res => {
      socket.send(payload('transactionsUnconfirmed', res));
    },
    error => {
      socket.send(payload('error', `NEM node connection error: ${error}`));
    }
  );

  const confirmed = new ConfirmedTransactionListener().given(preparedAddress);
  confirmed.subscribe(
    res => {
      socket.send(payload('transactionsConfirmed', res));
    },
    error => {
      socket.send(payload('error', `NEM node connection error: ${error}`));
    }
  );
};

const handleIncomingTransactions = (socket, message) => {
  const { address, network, transactionsMax } = message.data;

  let accountHttp;
  if (network === 'testnet') {
    accountHttp = new AccountHttp([
      { protocol: 'http', domain: NODE_TESTNET, port: 7890 }
    ]);
  } else {
    accountHttp = new AccountHttp([
      { protocol: 'http', domain: NODE_MAINNET, port: 7890 }
    ]);
  }

  const chainHttp = new ChainHttp();
  chainHttp.getBlockchainHeight().subscribe(height => {
    socket.send(payload('height', height));
  });

  const preparedAddress = new Address(address);
  const pageSize = 100;
  const recent = accountHttp.incomingTransactionsPaginated(preparedAddress, {
    pageSize
  });

  let total = [];
  recent.subscribe(
    incoming => {
      incoming.forEach(tx => {
        isEncrypted(tx);
      });
      total = [...total, ...incoming];
      if (total.length < transactionsMax && incoming.length === pageSize) {
        recent.nextPage();
      } else {
        recent.complete();
      }
    },
    error => {
      socket.send(payload('error', `NEM node connection error: ${error}`));
    },
    () => {
      socket.send(payload('transactionsRecent', total));
    }
  );
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
  socket.on('close', () => {});
  socket.on('error', () => {});
});

app.use(express.static(path.resolve(__dirname, 'client', 'build')));
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

server.listen(8082);
