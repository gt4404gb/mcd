import React, { useState, useEffect } from 'react';
import { Table, PageHeader, Button, Collapse } from '@aurum/pfe-ui';
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import * as apis from '@/apps/btb/common/apis';
import PaymentDialog from '../PaymentDialog';
import PaymentAuditDialog from '../PaymentAuditDialog';
import utils from '@/apps/btb/common/utils';

const { transferAntdTableHeaderArray2Object, getEntityColumnLabel } = common.helpers;

export default ({ order, list = [], onPaymentChange }: any) => {
  const [logs, setLogs]: any = useState([])
  const [paymentDialogVisible, setPaymentDialogVisible]: any = useState(false);
  const [paymentAuditDialogVisible, setPaymentAuditDialogVisible]: any = useState(false);
  const [activeKey, setActiveKey]: any = useState(null);

  useEffect(() => {
    list.forEach((item: any, key: number) => item.key = item.credentialsId || key);
    setLogs([...list]);
    setActiveKey(list.length > 0 ? '1': null);
  }, [list]);

  const columns: any = transferAntdTableHeaderArray2Object([
    ['类型', 'type', (value: any, record: any) => {
      return <div className="combo-type">
        {record.urls?.length > 0 &&
          <div className="receipt-images">{record.urls.map((filename: any, key: number) => (
            <a key={key} target="_blank" href={apis.getBOSModule().getCredentialImageUrl(filename)}>
              <img src={apis.getBOSModule().getCredentialImageUrl(filename)} />
            </a>
          ))}
          </div>}
        <span>{value}</span>
      </div>;
    }],
    ['交易流水号', 'tradeId'],
    ['支付方式', 'payType', (value: any, record: any) => {
      return getEntityColumnLabel(constants.btb.order.payType, value)
    }],
    ['金额', 'price', (value: any, record: any) => {
      return `¥ ${value / 100}`;
    }],
    ['状态', 'status', (value: any, record: any) => {
      return getEntityColumnLabel(constants.btb.order.auditType, value)
    }],
    ['添加时间', 'createdTime'],
    ['添加人', 'createdUserName'],
    ['备注', 'remark', null, { 
      className: 'ws-normal ws-max-width-300',
    }],
    ['审核人', 'auditUserName'],
    ['审核时间', 'auditTime'],
    ['审核备注', 'auditRemark', null, { className: 'ws-normal ws-max-width-200' }],
  ]);

  const buttons: any = [];

  if (utils.isOrderButtonEnabled('PAY', order)) {
    buttons.push(<Button key="pay" type="primary" onClick={(e: any) => {
      e.stopPropagation();
      setPaymentDialogVisible(true)
    }}>支付</Button>,
    );
  }

  if (utils.isOrderButtonEnabled('PAY_AUDIT', order)) {
    buttons.push(<Button key="pay-audit" type="primary" onClick={(e: any) => {
      e.stopPropagation();
      setPaymentAuditDialogVisible(true)
    }}>支付审核</Button>);
  }

  return (
    <div className="order-block order-trade-log collapse-block">
      <PaymentDialog orderId={order.orderId}
        visible={paymentDialogVisible}
        onClose={() => {
          setPaymentDialogVisible(false)
          if (onPaymentChange) onPaymentChange();
        }} />
      <PaymentAuditDialog orderId={order.orderId}
        visible={paymentAuditDialogVisible}
        onClose={() => {
          setPaymentAuditDialogVisible(false)
          if (onPaymentChange) onPaymentChange();
        }} />
      <Collapse activeKey={activeKey} defaultActiveKey={[]} ghost onChange={setActiveKey}>
        <Collapse.Panel header={<PageHeader
          ghost={false}
          title="收退款记录"
          extra={buttons}
        >
        </PageHeader>
        } key="1">
          <Table
            columns={columns}
            scroll={{ x: '100%' }}
            dataSource={logs}
            pagination={false} />
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}