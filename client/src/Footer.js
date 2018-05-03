import React from 'react';
import { Grid, Icon, Statistic, Transition } from 'semantic-ui-react';

const Footer = props => (
  <Grid.Row textAlign="center" style={{ paddingTop: '4rem' }}>
    <Grid.Column>
      <p>
        The Wishing Wall is built with <a href="https://nem.io">NEM</a> blocks.
      </p>
      <Transition visible={!!props.height} animation="fade" duration="1000">
        <Statistic size="small">
          <Statistic.Value style={{ color: '#d2c3ac' }}>
            <Icon name="cube" style={{ paddingRight: '.25rem' }} />
            {props.height}
          </Statistic.Value>
        </Statistic>
      </Transition>
    </Grid.Column>
  </Grid.Row>
);

export default Footer;
