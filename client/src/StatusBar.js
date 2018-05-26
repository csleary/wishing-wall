import React from 'react';
import { Container, Grid, Icon, Message } from 'semantic-ui-react';

const StatusBar = props => (
  <Container fluid>
    <Grid padded>
      <Grid.Row>
        <Grid.Column>
          <Icon
            aria-label="Connection status"
            color={props.socketConnected ? 'green' : 'red'}
            name="circle"
            title={
              props.socketConnected
                ? `Connected to NEM Node '${props.nodeName}' (${
                    props.endpoint.host
                  }).`
                : 'Currently disconnected!'
            }
          />
          <span title="Recent activity.">{props.messages[0]}</span>
          {props.errors.length > 0 && (
            <Message
              color="red"
              error
              header="It appears we have encountered a problem. 😕"
              list={props.errors}
            />
          )}
        </Grid.Column>
      </Grid.Row>
    </Grid>
  </Container>
);

export default StatusBar;
