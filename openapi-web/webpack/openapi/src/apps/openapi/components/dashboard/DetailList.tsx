import React from 'react';
import common from '@omc/common';
import { Table, Modal } from '@aurum/pfe-ui';

const { transferAntdTableHeaderArray2Object } = common.helpers;

export default ({ title, labels, columns, visible = false, onClose }: any) => {
  return <Modal width={800} className="detail-modal" visible={visible}
    onCancel={() => {
      if (onClose) onClose(false);
    }}
    footer={null}
    title={title}
  >
    <Table
      className="mcd-table"
      scroll={{ x: '100%' }}
      rowKey="order"
      columns={transferAntdTableHeaderArray2Object(labels || [])}
      dataSource={columns || []}
      pagination={false} />
  </Modal>
}