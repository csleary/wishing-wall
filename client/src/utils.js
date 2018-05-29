import React from 'react';
import nem from 'nem-sdk';

const mosaicAmount = (amount, mosaics) => {
  const xem = mosaics.find(el => el.mosaicId.namespaceId === 'nem' && el.mosaicId.name === 'xem');
  if (xem) return xem.quantity * 10 ** -6 * amount;
  return 0;
};

const calculateAmount = tx => {
  const { type } = tx;
  if (type === 4100) {
    const { _xem, _mosaics } = tx.otherTransaction;
    if (_mosaics) return mosaicAmount(_xem.amount, _mosaics);
    return _xem.amount;
  }
  const { _xem, _mosaics } = tx;
  if (_mosaics) return mosaicAmount(_xem.amount, _mosaics);
  return _xem.amount;
};

const filterTransactions = (address, transactionList) =>
  transactionList.filter(tx => {
    if (tx.type === 257 && tx.recipient.value === address) return true;
    if (
      tx.type === 4100 &&
      tx.otherTransaction.type === 257 &&
      tx.otherTransaction.recipient.value === address
    ) {
      return true;
    }
    return false;
  });

const renderMessage = tx => {
  const { message, otherTransaction } = tx;
  const data = message || (otherTransaction && otherTransaction.message);
  if (data && data.encrypted) {
    return (
      <span aria-label="Message encrypted" role="img" title="Message encrypted">
        🤐
      </span>
    );
  }
  const decoded = nem.utils.format.hexMessage({
    payload: data.payload,
    type: 1
  });
  if (!decoded) {
    return (
      <span
        aria-label="No message included!"
        role="img"
        title="No message included!"
      >
        😶
      </span>
    );
  }
  return decoded;
};

const sortTransactions = transactionList => {
  const sorted = transactionList.sort((a, b) => calculateAmount(b) - calculateAmount(a));
  return sorted;
};

export { filterTransactions, calculateAmount, renderMessage, sortTransactions };
