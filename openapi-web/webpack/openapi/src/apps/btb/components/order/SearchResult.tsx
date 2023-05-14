import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Tag } from '@aurum/pfe-ui';
// @ts-ignore
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import { Link } from 'react-router-dom';
import utils from '@/apps/btb/common/utils';
import PriceAmendDialog from './PriceAmendDialog';
import PriceAmendAuditDialog from './PriceAmendAuditDialog';
import PaymentDialog from './PaymentDialog';
import PaymentAuditDialog from './PaymentAuditDialog';
import OrderCancelDialog from './OrderCancelDialog';

const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  const tableHeaderColumnMatrix: any = [
    ['订单号', 'orderId', (value: any, order: any) => {
      return order.orderId;
    }, 220],
    ['第三方订单号', 'outRequestNo'],
    ['订单名称', 'orderName', (value: any, order: any) => {
      return order.orderGoods[0].spuName;
    }],
    ['商品类目', 'categoryName', (value: any, order: any) => {
      return order.orderGoods[0].categoryName;
    }],
    ['商户编号', 'merchantId'],
    ['商户名称', 'merchantName'],
    ['单价/数量', 'subtotal', (value: any, order: any) => {
      const goods: any = order.orderGoods[0];
      return `¥ ${goods.price / 100}/${goods.count}`;
    }],
    ['总金额', 'price', (value: any) => {
      return `¥ ${value / 100}`;
    }],
    ['结算价', 'settlePrice', (value: any) => {
      return `¥ ${value / 100}`;
    }],
    ['下单时间', 'date'],
    ['状态', 'status', (value: any, order: any) => {
      return <Tag color={getEntityColumnColor(constants.btb.order.status, value)} >
        {getEntityColumnLabel(constants.btb.order.status, value)}</Tag>
    }],
  ];

  let businessColumns: any = transferAntdTableHeaderArray2Object(tableHeaderColumnMatrix);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    render: (_: any, record: any) => {
      return <Space size="small">
        {utils.isOrderButtonEnabled('CHANGE_PRICE', record) &&
          <a key="change-price" type="link" onClick={() => {
            setPriceAmendDialogVisible(true);
            setOrderIdForAmend(record.orderId);
          }}>改价</a>}
        {utils.isOrderButtonEnabled('CHANGE_PRICE_AUDIT', record) &&
          <a key="audit" type="link" onClick={() => {
            setPriceAmendAuditDialogVisible(true);
            setOrderIdForAmendAudit(record.orderId);
          }}>改价审核</a>}
        {utils.isOrderButtonEnabled('PAY', record) &&
          <a key="pay" type="link" onClick={() => {
            setOrderIdForPayment(record.orderId);
            setOrderForPaymentDialogVisible(true)
          }}>支付</a>}
        {utils.isOrderButtonEnabled('PAY_AUDIT', record) &&
          <a key="pay-audit" type="link" onClick={() => {
            setOrderIdForPaymentAudit(record.orderId);
            setOrderForPaymentAuditDialogVisible(true)
          }}>支付审核</a>}
        {(utils.isOrderButtonEnabled('FORCE_CANCEL', record)) &&
          <a key="cancel" type="link" onClick={() => {
            setOrderId4CancelDialog(record.orderId);
            setVisible4CancelDialog(true);
          }}>取消</a>}
        <Link to={`/openapi/btb/order/detail/${record.orderId}`}>详情</Link>
      </Space>
    },
  }];

  // const [columns, setColumns]: any = useState(businessColumns);
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);

  const [orderIdForAmend, setOrderIdForAmend]: any = useState(null);
  const [priceAmendDialogVisible, setPriceAmendDialogVisible]: any = useState(false);

  const [orderIdForAmendAudit, setOrderIdForAmendAudit]: any = useState(null);
  const [priceAmendAuditDialogVisible, setPriceAmendAuditDialogVisible]: any = useState(false);

  const [orderIdForPayment, setOrderIdForPayment]: any = useState(null);
  const [orderForPaymentDialogVisible, setOrderForPaymentDialogVisible]: any = useState(false);

  const [orderForPaymentAuditDialogVisible, setOrderForPaymentAuditDialogVisible]: any = useState(false);
  const [orderIdForPaymentAudit, setOrderIdForPaymentAudit]: any = useState(null);

  const [visible4CancelDialog, setVisible4CancelDialog]: any = useState(false);
  const [orderId4CancelDialog, setOrderId4CancelDialog]: any = useState(null);

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.list;
      setTotalCount(dataSource.data.total);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  return (
    <div className="table-top-wrap" >
      <OrderCancelDialog
        orderId={orderId4CancelDialog}
        visible={visible4CancelDialog}
        onClose={(canceled: any) => {
          setOrderId4CancelDialog(null);
          setVisible4CancelDialog(false);
          if (canceled) {
            onChangeSearchConds({ ...searchConds });
          }
        }} />
      <PriceAmendDialog orderId={orderIdForAmend}
        visible={priceAmendDialogVisible}
        onClose={(isSaved: any) => {
          setOrderIdForAmend(null);
          setPriceAmendDialogVisible(false)
          if (isSaved) {
            onChangeSearchConds({
              currentPage: searchConds.currentPage,
              pageSize: searchConds.pageSize,
            });
          }
        }} />
      <PriceAmendAuditDialog orderId={orderIdForAmendAudit}
        visible={priceAmendAuditDialogVisible}
        onClose={(isSaved: any) => {
          setOrderIdForAmendAudit(null);
          setPriceAmendAuditDialogVisible(false)
          if (isSaved) {
            onChangeSearchConds({
              currentPage: searchConds.currentPage,
              pageSize: searchConds.pageSize,
            });
          }
        }} />
      <PaymentDialog orderId={orderIdForPayment}
        visible={orderForPaymentDialogVisible}
        onClose={(isSubmit: boolean) => {
          setOrderIdForPayment(null);
          setOrderForPaymentDialogVisible(false)
          if (isSubmit) {
            onChangeSearchConds({
              currentPage: searchConds.currentPage,
              pageSize: searchConds.pageSize,
            });
          }
        }} />
      <PaymentAuditDialog orderId={orderIdForPaymentAudit}
        visible={orderForPaymentAuditDialogVisible}
        onClose={(isSubmit: boolean) => {
          setOrderIdForPaymentAudit(null);
          setOrderForPaymentAuditDialogVisible(false)
          if (isSubmit) {
            onChangeSearchConds({
              orderId: orderIdForPaymentAudit
            });
          }
        }} />
      {/* <div className="table-top">
        <ListFilter filterColumns={filterColumns} onCheckedColumnsChanged={(checkedColumns: any) => {
          setColumns(businessColumns.concat(checkedColumns, actionColumns));
        }} />
      </div> */}
      <Table
        className="mcd-table"
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        columns={businessColumns.concat(actionColumns)}
        dataSource={dataRows}
        pagination={{
          hideOnSinglePage: true,
          pageSize: searchConds.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 50,
          showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
          current: dataSource.currentPage || searchConds.currentPage,
          total: totalCount,
          onChange: (currentPage: any, pageSize: any) => {
            onChangeSearchConds({
              currentPage,
              pageSize,
            });
          },
        }} />
    </div>
  )
}