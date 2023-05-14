import React, { useState, useEffect } from 'react';
import { PageHeader, Descriptions, Collapse } from '@aurum/pfe-ui';

function cent2yuan(amount: any) {
  if (amount === 0) return 0;
  if (!amount) return '/';
  return (amount / 100).toFixed(2);
}
export default ({ order }: any) => {
  const [activeKey, setActiveKey]: any = useState(null);

  useEffect(() => {
    setActiveKey((order.extOrderInfo && order.extOrderInfo.orderAmount) > 0 ? '1' : null);
  }, [order.extOrderInfo]);
  return (
    <div className="order-block order-3party-info collapse-block">
      <Collapse activeKey={activeKey} defaultActiveKey={[]} ghost onChange={setActiveKey}>
        <Collapse.Panel header={<PageHeader
          ghost={false}
          title="第三方订单金额"
          subTitle={order.updateDate ? `${order.updateDate} 更新` : ''}
        >
        </PageHeader>} key="1">
          <Descriptions size="small" column={4} layout="vertical" colon={false}>
            <Descriptions.Item label="订单金额">{cent2yuan(order.extOrderInfo?.orderAmount)}</Descriptions.Item>
            <Descriptions.Item label="支付金额">{cent2yuan(order.extOrderInfo?.payAmount)}</Descriptions.Item>
            <Descriptions.Item label="平台优惠">{cent2yuan(order.extOrderInfo?.platformDiscountAmount)}</Descriptions.Item>
            <Descriptions.Item label="商户优惠">{cent2yuan(order.extOrderInfo?.shopDiscountAmount)}</Descriptions.Item>
          </Descriptions>
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}
