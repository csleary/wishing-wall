import React from 'react';
import nem from 'nem-sdk';

const formatAmount = tx => {
  const { nemValue } = nem.utils.format;
  const { amount, otherTrans } = tx.transaction;
  const newAmount = amount || (otherTrans && otherTrans.amount);

  if (newAmount && newAmount > 0) {
    const formatted = nemValue(newAmount);
    const string = `${formatted[0]}.${formatted[1]}`;
    return string.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '');
  }
  return 0;
};

const filterTransactions = (address, transactionList) =>
  transactionList.filter(tx => {
    if (tx.transaction.type === 257 && tx.transaction.recipient === address) {
      return true;
    }
    if (
      tx.transaction.type === 4100 &&
      tx.transaction.otherTrans.type === 257 &&
      tx.transaction.otherTrans.recipient === address
    ) {
      return true;
    }
    return false;
  });

const renderMessage = tx => {
  const { message, otherTrans } = tx.transaction;
  const newMessage = message || (otherTrans && otherTrans.message);
  if (newMessage.type === 2) {
    // const myPrivate = '';
    // const senderPub = tx.transaction.signer;
    // const hexMessage = nem.crypto.helpers.decode(
    //   myPrivate,
    //   senderPub,
    //   message.payload
    // );
    // const msg = nem.utils.format.hexToUtf8(hexMessage);
    // return !msg ? '🤐' : msg;
    return (
      <span aria-label="Message encrypted" role="img" title="Message encrypted">
        🤐
      </span>
    );
  }
  const msg = nem.utils.format.hexMessage(newMessage);
  if (!msg) {
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
  return msg;
};

const sortTransactions = transactionList => {
  const sorted = transactionList.sort((a, b) => {
    const checkType = tx => {
      if (tx.transaction.type === 4100) {
        return tx.transaction.otherTrans.amount;
      }
      return tx.transaction.amount;
    };
    return checkType(b) - checkType(a);
  });

  const unique = sorted.filter((tx, index, list) => !index || tx !== list[index - 1]);
  return unique;
};

export { filterTransactions, formatAmount, renderMessage, sortTransactions };
