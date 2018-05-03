import React from 'react';
import { Header as SUIHeader } from 'semantic-ui-react';

const Header = () => (
  <SUIHeader as="header">
    <h1
      style={{
        fontColor: '#333',
        fontFamily: 'Gloria Hallelujah',
        fontSize: '4rem',
        marginTop: 0,
        marginBottom: '3rem',
        textAlign: 'center'
      }}
    >
      <a href="/">Wishing Wall</a>
    </h1>
  </SUIHeader>
);

export default Header;
