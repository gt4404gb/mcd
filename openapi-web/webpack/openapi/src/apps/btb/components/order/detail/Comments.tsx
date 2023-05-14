import React, { useEffect, useState } from 'react';
import { Table, PageHeader, Button, Collapse } from '@aurum/pfe-ui';
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import CommentDialog from '../CommentDialog';

const { transferAntdTableHeaderArray2Object, getEntityColumnLabel } = common.helpers;

export default ({ order, onCommentAdded }: any) => {
  const [CommentDialogVisible, setCommentDialogVisible]: any = useState(false);
  const [activeKey, setActiveKey]: any = useState(null);

  const columns: any = transferAntdTableHeaderArray2Object([
    ['类型', 'type', (value: any) => getEntityColumnLabel(constants.btb.order.remarkType, value)],
    ['内容', 'remark', null, { className: 'ws-normal ws-max-width-300', }],
    ['添加人', 'createdUserName'],
    ['添加时间', 'createdTime'],
  ]);

  useEffect(() => {
    setActiveKey(order.logRecords.length > 0 ? '1': null);
  }, [order.logRecords]);
  return (
    <div className="order-block order-comments collapse-block">
      <CommentDialog orderId={order.orderId}
        visible={CommentDialogVisible}
        onClose={(isAdded: any) => {
          setCommentDialogVisible(false)
          if (isAdded) if (onCommentAdded) onCommentAdded();
        }} />
      <Collapse activeKey={activeKey} defaultActiveKey={[]} ghost onChange={setActiveKey}>
        <Collapse.Panel
          header={<PageHeader
            ghost={false}
            title="订单备注"
            extra={<Button key="add" type="primary" onClick={(e: any) => {
              e.stopPropagation();
              setCommentDialogVisible(true)
            }}>添加备注</Button>}
          >
          </PageHeader>
          } key="1">
          <Table
            rowKey="id"
            columns={columns}
            scroll={{ x: '100%' }}
            dataSource={order.logRecords}
            pagination={false} />
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}