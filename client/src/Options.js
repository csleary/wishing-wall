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
              onBlur={props.handleBlur}
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
                link
                name="linkify"
                style={{ marginLeft: '1rem' }}
                title="Bookmark this link to save your address/options."
              />
            </a>
            <Icon
              circular
              inverted
              link
              onClick={props.handleEmbedClick}
              name="code"
              style={{ marginLeft: '1rem' }}
              title="Click to show widget/embed code to add a Wishing Wall to your site."
            />
          </Form.Group>
          {props.showEmbedCode && (
            <Form.Group>
              <Form.TextArea
                label="Embed a Wishing Wall on your own site:"
                readOnly
                rows={1}
                style={{
                  resize: 'none',
                  wordBreak: 'break-all'
                }}
                value={`<iframe src="${window.location.protocol}//${
                  window.location.host
                }?address=${props.address}&sortByValue=${
                  props.sortByValue
                }&max=${
                  props.transactionsMax
                }" height="500px" width="100%"></iframe>`}
                width={16}
              />
            </Form.Group>
          )}
          <Form.Group inline>
            <Form.Button
              disabled={!props.valid}
              loading={props.isUpdating}
              type="submit"
            >
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
