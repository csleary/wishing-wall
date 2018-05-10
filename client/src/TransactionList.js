import React from 'react';
import { Grid, Icon, Header, Label } from 'semantic-ui-react';
import {
  filterTransactions,
  formatAmount,
  renderMessage,
  sortTransactions
} from './utils';

const renderIcon = (sortByValue, index) => {
  if (index === 0 && sortByValue) {
    return (
      <Icon
        circular
        fitted
        name="trophy"
        size="large"
        style={{
          backgroundColor: '#ff9f1a',
          boxShadow: 'none',
          color: '#fff'
        }}
        title="Top message!"
      />
    );
  } else if (index === 0 && !sortByValue) {
    return (
      <Icon
        name="clock"
        size="big"
        style={{
          color: '#d2c3ac',
          fontSize: '3rem',
          margin: '0 0 0 -.25rem'
        }}
        title="Most recent message."
      />
    );
  }
  return (
    <Icon
      name="comment"
      size="large"
      style={{
        color: '#d2c3ac',
        marginLeft: '0.5rem',
        marginRight: 0
      }}
    />
  );
};

const isUnconfirmed = (height, tx) => {
  if (height && tx.meta.height > height) {
    return true;
  }
  return false;
};

const TransactionList = props => {
  const transactionList = [
    ...props.transactionsUnconfirmed,
    ...props.transactionsConfirmed,
    ...props.transactionsRecent
  ];
  const filtered = filterTransactions(props.address, transactionList);
  const sorted = props.sortByValue ? sortTransactions(filtered) : filtered;
  sorted.length = props.transactionsMax;

  return sorted.map((tx, index) => (
    <Grid.Row className="transaction" key={tx.meta.hash.data}>
      {isUnconfirmed(props.height, tx) && (
        <Label
          corner="right"
          color="red"
          icon="clock"
          title="This transaction has not yet been confirmed by the network."
        />
      )}
      <Grid.Column
        style={{ padding: 0 }}
        textAlign="left"
        width={2}
        verticalAlign="top"
      >
        {renderIcon(props.sortByValue, index)}
      </Grid.Column>
      <Grid.Column textAlign="center" verticalAlign="middle" width={12}>
        <Header
          size={index === 0 ? 'large' : 'medium'}
          style={{ wordBreak: 'break-word' }}
        >
          {renderMessage(tx)}
        </Header>
      </Grid.Column>
      <Grid.Column
        style={{ padding: 0 }}
        textAlign="right"
        width={2}
        verticalAlign="bottom"
      >
        <Header size="small">{formatAmount(tx)} XEM</Header>
      </Grid.Column>
    </Grid.Row>
  ));
};

export default TransactionList;
