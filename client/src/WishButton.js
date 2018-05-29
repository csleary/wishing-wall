import nem from 'nem-sdk';
import React from 'react';
import { Button, Grid, Icon, Transition } from 'semantic-ui-react';
import QrCode from './QrCode';

const handleCopy = props => {
  const textarea = document.createElement('textarea');
  textarea.id = 'temp-nem-address';
  textarea.style.height = 0;
  document.body.appendChild(textarea);
  textarea.value = document.querySelector('.nem-address').innerText;
  textarea.select();
  const canCopy = document.execCommand('copy');
  if (canCopy) {
    document.execCommand('copy');
    textarea.selectionEnd = textarea.selectionStart;
    props.handleCopyTimeout();
  }
  document.body.removeChild(textarea);
};

const handleKeyPress = (props, e) => {
  if (e.charCode === 13) {
    handleCopy(props);
  }
};

const WishButton = props => (
  <Grid padded="vertically" stackable>
    <Grid.Row className="wish-button">
      <Grid.Column textAlign="center">
        <Button
          icon
          labelPosition="left"
          onClick={props.handleWishClick}
          size="large"
          style={{
            backgroundColor: '#47a3d1',
            color: '#fff',
            marginRight: 0,
            width: '16rem'
          }}
          tabIndex="0"
          title="Click for address information."
        >
          <Icon name="qrcode" />
          {props.showCode ? 'Done?' : 'Make a Wish'}
        </Button>
        <Button
          circular
          icon
          onClick={props.handleOptionsClick}
          size="large"
          style={{ margin: 0, position: 'absolute', right: 0 }}
          title="Click to open the settings."
        >
          <Icon name="setting" />
        </Button>
      </Grid.Column>
    </Grid.Row>
    <Transition
      animation="fade"
      duration={{ hide: 50, show: 200 }}
      unmountOnHide
      visible={props.showCode}
    >
      <Grid.Row centered columns="2">
        <Grid.Column textAlign="center">
          <QrCode address={props.address} />
        </Grid.Column>
        <Grid.Column>
          <p>
            Please send messages to this
            {props.network === 'testnet' ? <em> testnet </em> : ' '}
            address to display them below (click to copy):
          </p>
          <div
            className="nem-address"
            role="button"
            tabIndex="0"
            onClick={() => handleCopy(props)}
            onKeyPress={e => handleKeyPress(props, e)}
          >
            {nem.utils.format.address(props.address)}
          </div>
          <Transition
            animation="fade"
            duration={{ hide: 400, show: 50 }}
            unmountOnHide
            visible={props.showCopyMessage}
          >
            <p style={{ color: '#47a3d1', textAlign: 'center' }}>
              <Icon name="thumbs outline up" />
              Address copied to clipboard!
            </p>
          </Transition>
          <p>
            Both normal and multisignature transactions will be displayed.
            Remember to <strong>not</strong> encrypt your message (unless of
            course, you wish for it to remain private).
          </p>
        </Grid.Column>
      </Grid.Row>
    </Transition>
  </Grid>
);

export default WishButton;
