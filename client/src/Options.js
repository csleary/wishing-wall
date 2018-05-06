import React from 'react';
import { Form, Grid, Transition } from 'semantic-ui-react';

const Options = props => (
  <Transition
    animation="fade"
    duration={{ hide: 50, show: 200 }}
    unmountOnHide
    visible={props.showOptions}
  >
    <Grid centered padded="vertically">
      <Grid.Column width={10}>
        <Form onSubmit={props.handleSubmit}>
          <Form.Group>
            <Form.Input
              label="NEM Address"
              name="address"
              onChange={props.handleChange}
              placeholder="Address"
              value={props.address}
              width={12}
            />
            <Form.Input
              label="Limit"
              min="0"
              name="transactionsMax"
              onChange={props.handleChange}
              placeholder="e.g. 50"
              type="number"
              value={props.transactionsMax}
              width={4}
            />
          </Form.Group>
          <Form.Group>
            <Form.Checkbox
              label="Sort by value"
              name="sortByValue"
              onChange={props.handleChange}
              toggle
              checked={props.sortByValue}
            />
          </Form.Group>
          <Form.Button loading={props.isUpdating} type="submit">
            Update
          </Form.Button>
        </Form>
      </Grid.Column>
    </Grid>
  </Transition>
);

export default Options;
