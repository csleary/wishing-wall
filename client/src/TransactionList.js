import React from 'react';
import { Grid, Icon, Header } from 'semantic-ui-react';
import {
  filterTransactions,
  formatAmount,
  renderMessage,
  sortTransactions
} from './utils';

const TransactionList = props => {
  const transactionList = [
    ...props.transactionsRecent,
    ...props.transactionsConfirmed
  ];
  const filtered = filterTransactions(transactionList);
  const sorted = props.sortByValue ? sortTransactions(filtered) : filtered;

  return sorted.map((tx, index) => (
    <Grid.Row className="transaction" key={tx.meta.hash.data}>
      <Grid.Column
        style={{ padding: 0 }}
        textAlign="left"
        width={2}
        verticalAlign="top"
      >
        {index === 0 ? (
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
        ) : (
          <Icon
            name="comment"
            size="large"
            style={{
              color: '#d2c3ac',
              marginLeft: '0.6rem',
              marginRight: 0
            }}
          />
        )}
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
