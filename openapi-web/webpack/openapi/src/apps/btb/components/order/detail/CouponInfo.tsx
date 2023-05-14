import React from 'react';
import { PageHeader, Descriptions, Button, Collapse, message } from '@aurum/pfe-ui';
import utils from '@/apps/btb/common/utils';

export default ({ order, data }: any) => {
  const buttons: any = [];
  if (utils.isOrderButtonEnabled('EXPORT_COUPON', order)) {
    buttons.push(<Button key="export-coupon" onClick={() => {
      message.info('暂不实现');
    }}>导出核销</Button>);
  }

  if (utils.isOrderButtonEnabled('EXPORT_USED_COUPON', order)) {
    buttons.push(<Button key="export-used-coupon" type="primary" onClick={() => {
      alert('暂不实现');
    }}>导出券码</Button>);
  }
  return (
    <div className="order-block order-coupon-info collapse-block">
      <Collapse defaultActiveKey={['1']} ghost>
        <Collapse.Panel header={<PageHeader
          ghost={false}
          title="券码"
          subTitle="券码需在有效期内使用，请勿泄露券码。"
          extra={buttons}
        >
        </PageHeader>
        } key="1">
          <Descriptions size="small" column={5} layout="vertical" colon={false}>
            <Descriptions.Item label="总数">{data.total || '/'}</Descriptions.Item>
            <Descriptions.Item label="待使用">{data.unUsed || '/'}</Descriptions.Item>
            <Descriptions.Item label="已绑定">{data.bind || '/'}</Descriptions.Item>
            <Descriptions.Item label="已核销">{data.used || '/'}</Descriptions.Item>
            <Descriptions.Item label="已作废">{data.invalid || '/'}</Descriptions.Item>
          </Descriptions>
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}
