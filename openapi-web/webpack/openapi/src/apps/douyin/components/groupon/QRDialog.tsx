import React, { useState, useEffect } from 'react'
import { Button, Modal, Tabs, message, Input } from '@aurum/pfe-ui';

const QRCode = require('qrcode');

export default ({ show = false, title, url, onClose }: any) => {
  const [visible, setVisible]: any = useState(false);
  const [image, setImage]: any = useState(false);
  useEffect(() => {
    setVisible(show);
  }, [show]);

  useEffect(() => {
    QRCode.toDataURL(url, function (err: any, url: string) {
      setImage(url);
    });
  }, [url]);

  return (
    <Modal className="qrcode-modal" visible={visible} onCancel={() => {
      setVisible(false);
      if (onClose) onClose();
    }} footer={null}
      style={{ textAlign: 'center' }}
    >
      <div>
        {url && <a target="_blank" rel="noopener noreferrer" href={url}><h2 style={{ color: '#1890FF' }} dangerouslySetInnerHTML={{ __html: title }} ></h2></a>}
        {image &&
          <div>
            <img alt="" src={image} />
          </div>
        }
      </div>
    </Modal>
  )
};