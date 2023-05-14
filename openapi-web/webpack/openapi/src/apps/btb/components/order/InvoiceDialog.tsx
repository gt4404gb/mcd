import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, message, Select, Space, Row, Col } from '@aurum/pfe-ui';

export default ({ visible = false, orderId, isAudit = false, onClose }: any) => {
  return (<div className="invoice-container">
    <Modal width={550} className="invoice-dialog" visible={visible} onCancel={() => {
      if (onClose) onClose();
    }} footer={null}
      title={`发票信息`}
    >
      发票信息
    </Modal>
  </div>);
}