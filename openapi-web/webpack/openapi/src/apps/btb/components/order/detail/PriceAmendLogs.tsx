import React, { useState, useEffect } from 'react';
import { Button, Table, PageHeader, Collapse } from '@aurum/pfe-ui';
import common from '@omc/common';
import PriceAmendDialog from '../PriceAmendDialog';
import PriceAmendAuditDialog from '../PriceAmendAuditDialog';
import utils from '@/apps/btb/common/utils';

const { transferAntdTableHeaderArray2Object } = common.helpers;

export default ({ order, list = [], onPriceAmend }: any) => {
  const [amendHistory, setAmendHistory]: any = useState([])
  const [priceAmendDialogVisible, setPriceAmendDialogVisible]: any = useState(false);
  const [priceAmendAuditDialogVisible, setPriceAmendAuditDialogVisible]: any = useState(false);
  const [activeKey, setActiveKey]: any = useState(null);

  useEffect(() => {
    if (list) {
      list.forEach((item: any, key: number) => {
        item.key = key;
      });
      setAmendHistory(list);
      setActiveKey(list.length > 0 ? '1': null);
    }
  }, [list]);

  const columns: any = transferAntdTableHeaderArray2Object([
    ['增补类型', 'type', (value: any) => value === 1 ? '批采优惠' : value],
    ['修改金额', 'price', (value: any) => `¥ ${(value / 100).toFixed(2)}`],
    ['修改后金额', 'postPrice', (value: any) => `¥ ${(value / 100).toFixed(2)}`],
    ['状态', 'status', (value: any, record: any) => {
      if (value === 0) {
        return '待审核'
      } else if (value === 1) {
        return '审核通过'
      } else if (value === 2) {
        return '已驳回';
      } else {
        return value;
      }
    }],
    ['备注', 'remark', null, { className: 'ws-normal' }],
    ['提交人', 'applyName'],
    ['提交时间', 'applyTime'],
    ['审核人', 'auditName'],
    ['审核时间', 'auditTime'],
    ['审核备注', 'auditRemark', null, { className: 'ws-normal' }],
  ]);

  const buttons: any = [];

  if (utils.isOrderButtonEnabled('CHANGE_PRICE', order)) {
    buttons.push(<Button key="change-price" type="primary" onClick={(e: any) => {
      e.stopPropagation();
      setPriceAmendDialogVisible(true)
    }}>改价</Button>);
  }

  if (utils.isOrderButtonEnabled('CHANGE_PRICE_AUDIT', order)) {
    buttons.push(<Button key="change-price-audit" type="primary" onClick={(e: any) => {
      e.stopPropagation();
      setPriceAmendAuditDialogVisible(true)
    }}>改价审核</Button>);
  }

  return (
    <div className="order-block price-amend collapse-block">
      <PriceAmendDialog orderId={order.orderId}
        visible={priceAmendDialogVisible}
        onClose={() => {
          setPriceAmendDialogVisible(false)
          if (onPriceAmend) onPriceAmend();
        }} />
      <PriceAmendAuditDialog orderId={order.orderId}
        visible={priceAmendAuditDialogVisible}
        onClose={(isSaved: any) => {
          setPriceAmendAuditDialogVisible(false)
          if (onPriceAmend) onPriceAmend();
        }} />
      <Collapse activeKey={activeKey} defaultActiveKey={[]} ghost onChange={setActiveKey}>
        <Collapse.Panel header={<PageHeader
          ghost={false}
          title="订单变更"
          subTitle="待支付订单可以通过订单增补调整订单价格。"
          extra={buttons}
        >
        </PageHeader>
        } key="1">
          <Table
            columns={columns}
            scroll={{ x: '100%' }}
            dataSource={amendHistory}
            pagination={false} />
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}
