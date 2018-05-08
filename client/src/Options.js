import React from 'react';
import { Form, Grid, Icon, Transition } from 'semantic-ui-react';

const Options = props => (
  <Transition
    animation="fade"
    duration={{ hide: 50, show: 200 }}
    unmountOnHide
    visible={props.showOptions}
  >
    <Grid centered padded="vertically">
      <Grid.Column computer={10} mobile={16}>
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
          <Form.Group inline>
            <Form.Checkbox
              label="Sort by value"
              name="sortByValue"
              onChange={props.handleChange}
              toggle
              checked={props.sortByValue}
            />
            <a
              href={`?address=${props.address}&sortByValue=${
                props.sortByValue
              }&max=${props.transactionsMax}`}
            >
              <Icon
                circular
                inverted
                label="Save your options as a link:"
                link
                name="linkify"
                style={{ marginLeft: '1rem' }}
                title="Bookmark this link to save your address/options."
              />
            </a>
          </Form.Group>
          <Form.Group inline>
            <Form.Button loading={props.isUpdating} type="submit">
              Update
            </Form.Button>
            {props.formErrors.address && (
              <span style={{ color: 'red' }}>{props.formErrors.address}</span>
            )}
          </Form.Group>
        </Form>
      </Grid.Column>
    </Grid>
  </Transition>
);

export default Options;
