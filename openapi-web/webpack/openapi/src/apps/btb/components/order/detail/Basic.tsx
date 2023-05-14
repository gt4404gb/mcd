import React, { useState } from 'react';
import common from '@omc/common';
import { PageHeader, Descriptions, Tag, Button } from '@aurum/pfe-ui';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import OrderCancelDialog from '../OrderCancelDialog';
import constants from '@/apps/btb/common/constants';
import utils from '@/apps/btb/common/utils';

const { getEntityColumnColor, getEntityColumnLabel } = common.helpers;
export default ({ order, onOrderCanceled }: any) => {
  const [orderCancelDialogVisible, setOrderCancelDialogVisible]: any = useState(false);

  return (
    <div className="order-block order-basic">
      {orderCancelDialogVisible && <OrderCancelDialog
        orderId={order.orderId}
        visible={orderCancelDialogVisible}
        onClose={(canceled: any) => {
          setOrderCancelDialogVisible(false)
          if (canceled) onOrderCanceled(true);
        }} />}
      <PageHeader
        ghost={false}
        title="订单详情"
        extra={(checkMyPermission('btb:orders:cancel') && utils.isOrderButtonEnabled('FORCE_CANCEL', order)) ? [
          <Button key="cancel" onClick={() => {
            setOrderCancelDialogVisible(true);
          }}>取消订单</Button>,
        ] : []}
      >
        <Descriptions size="small" column={4} layout="vertical" colon={false}>
          <Descriptions.Item label="订单编号">{order.orderId}</Descriptions.Item>
          <Descriptions.Item label="第三方订单号">{order.outRequestNo || '/'}</Descriptions.Item>
          <Descriptions.Item label="商户ID">{order.merchantId}</Descriptions.Item>
          <Descriptions.Item label="商户名">{order.merchantName}</Descriptions.Item>
          <Descriptions.Item label="下单时间">{order.createdTime}</Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={getEntityColumnColor(constants.btb.order.status, order.orderStatus)} >
              {getEntityColumnLabel(constants.btb.order.status, order.orderStatus)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="支付方式">
            <Tag color={getEntityColumnColor(constants.btb.order.payType, order.payType)} >
              {getEntityColumnLabel(constants.btb.order.payType, order.payType)}
            </Tag>
          </Descriptions.Item>
          {order.cancelReason && <Descriptions.Item label="取消原因">{order.cancelReason}</Descriptions.Item>}
        </Descriptions>
      </PageHeader>
    </div>
  )
}
