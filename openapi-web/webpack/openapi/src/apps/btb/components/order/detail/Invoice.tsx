import React, { useState, useEffect } from 'react';
import common from '@omc/common';
import { Button, Table, PageHeader, Collapse } from '@aurum/pfe-ui';
import InvoiceDialog from '../InvoiceDialog';
import constants from '@/apps/btb/common/constants';

const { transferAntdTableHeaderArray2Object, getEntityColumnLabel } = common.helpers;

export default ({ list = [] }: any) => {
  const [invoices, setInvoices]: any = useState([])
  const [visible, setVisible]: any = useState(false);
  const [activeKey, setActiveKey]: any = useState(null);

  useEffect(() => {
    list.forEach((item: any, key: number) => {
      item.key = key;
    });
    setInvoices(list);
    setActiveKey(list.length > 0 ? '1': null);
  }, [list]);

  const tableHeaderMatrix: any = [
    ['发票类型', 'isElectronic', (_value: any) => '电子发票'],
    ['抬头类型', 'consigneeType', (value: any) => getEntityColumnLabel(constants.btb.invoice.type, value)],
    ['发票抬头', 'title'],
    ['税号', 'taxCode'],
    ['发票金额', 'price', (value: any) => `¥ ${(value / 100).toFixed(2)}`],
    ['邮箱', 'mail'],
    ['发票状态', 'status', (value: any) => getEntityColumnLabel(constants.btb.invoice.status, value)],
  ];

  const columns: any = transferAntdTableHeaderArray2Object(tableHeaderMatrix);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    render: (val: any, record: any) => {
      return (
        <Button key="view" type="link" onClick={() => {
          setVisible(true);
        }}>查看</Button>
      );
    },
  }];

  return (
    <div className="order-block order-invoice collapse-block">
      <InvoiceDialog visible={visible} onClose={() => {
        setVisible(false)
      }} />
      <Collapse activeKey={activeKey} defaultActiveKey={[]} ghost onChange={setActiveKey}>
        <Collapse.Panel header={<PageHeader
          ghost={false}
          title="发票信息"
          subTitle="订单完成后可申请电子发票。"
        />
        } key="1">
          <Table
            columns={columns.concat(actionColumns)}
            scroll={{ x: '100%' }}
            dataSource={invoices}
            pagination={false} />
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}