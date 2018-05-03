import React from 'react';
import QRCode from 'qrcode.react';
import { address } from './App';

const QrCode = () => {
  // 1: Testnet, 2: Mainnet.
  const paymentData = {
    v: 1,
    type: 2,
    data: {
      addr: address.replace(/-/g, ''),
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
