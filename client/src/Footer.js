import React from 'react';
import { Grid, Icon, Statistic, Transition } from 'semantic-ui-react';

const today = new Date();
const year = today.getFullYear();

const Footer = props => (
  <Grid.Row textAlign="center" style={{ paddingTop: '4rem' }}>
    <Grid.Column>
      <p>
        The Wishing Wall is built with <a href="https://nem.io">NEM</a> blocks.
      </p>
      <Transition visible={!!props.height} animation="fade" duration="1000">
        <Statistic size="small" style={{ color: '#d2c3ac' }}>
          <Statistic.Value style={{ color: '#d2c3ac' }}>
            <Icon name="cube" style={{ paddingRight: '.25rem' }} />
            {props.height}
          </Statistic.Value>
          <p>{props.network.toUpperCase()}</p>
        </Statistic>
      </Transition>
      <p>
        &copy; {year !== 2018 && <span>2018&ndash;</span>}
        {year} <a href="https://ochremusic.com">Christopher Leary</a>
      </p>
      <p>
        To support continued development, donations on{' '}
        <a
          href={`${window.location.protocol}${
            window.location.pathname
          }?address=NC7KCRGLODPZM6F6E64W4AABKLLONP2XY7FNEMP3&sortByValue=true&max=20`}
        >
          my own Wishing Wall
        </a>{' '}
        are very welcome.
      </p>
    </Grid.Column>
  </Grid.Row>
);

export default Footer;
