import React from 'react';
import QRCode from 'qrcode.react';

const QrCode = props => {
  // 1: Testnet, 2: Mainnet.
  const version = props.address.startsWith('T') ? 1 : 2;
  const paymentData = {
    v: version,
    type: 2,
    data: {
      addr: props.address.replace(/-/g, ''),
      amount: null,
      msg: null
    }
  };

  return (
    <QRCode
      value={JSON.stringify(paymentData)}
      size={256}
      fgColor="#71685b"
      bgColor="#fff"
      level="M"
    />
  );
};

export default QrCode;
