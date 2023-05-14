import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Select } from '@aurum/pfe-ui';
import common from '@omc/common';
import './styles/SelectedOrders.less';

const { transferAntdTableHeaderArray2Object } = common.helpers;

const AMEND_METHOD_BY_RATE: any = 1;
const AMEND_METHOD_FIXED: any = 2;

export default ({ value = [], baseOrderId, forAudit = false, onChange }: any) => {
  const [selectedOrders, setSelectedOrders]: any = useState([]);
  const updateOrder: any = (order: any) => {
    const { amount, message }: any = updateAmountToAmend(order);
    order.amount = amount;
    order.message = message;
    if (onChange) onChange([...selectedOrders]);
  }

  const removeOrder: any = (order: any) => {
    const updOrders: any = selectedOrders.filter((it: any) => it.orderId !== order.orderId)
    if (onChange) onChange(updOrders);
  }

  const updateAmountToAmend: any = (order: any) => {
    let amount: any;
    if (order.amendMethod === AMEND_METHOD_BY_RATE) {
      amount = order.price * order.discountNumber / 100; // 此时 discountNumber 为百分比
    } else {
      amount = order.discountNumber * 100; // 此时 discountNumber 为元
    }
    let message: string = '';
    if (amount !== order.price) {
      message = `优惠金额：${((order.price - amount) / 100).toFixed(2)}元，折扣比例 ${(order.amendMethod === AMEND_METHOD_BY_RATE ? order.discount : (amount / order.price * 100).toFixed(2)) || '0'}%`;
    }
    return { amount, message };
  }

  const calcDiscountNumber: any = (value: any) => {
    let discountNum: any = value;
    if (value.match(/\.$/)) { // 处理输入时的小数点的残留.
      discountNum = value.replace(/\.$/, '')
    }
    discountNum = parseFloat(discountNum);
    if (isNaN(discountNum)) discountNum = 0;
    return discountNum;
  }

  useEffect(() => {
    setSelectedOrders(value.map((it: any) => {
      const order: any = { ...it };
      order.settlePrice = order.settlePrice || order.actualPrice;
      order.amendMethod = order.amendMethod || AMEND_METHOD_BY_RATE;
      if (order.discount === undefined) {
        order.discount = '100';
        order.discountNumber = 100;
      }
      if (order.amount === undefined) order.amount = order.price;

      return order;
    }));
  }, [value]);

  const tableHeaders: any = [
    ['订单号', 'orderId'],
    ['名称', 'orderName', (_: any, order: any) => order.orderGoods[0].spuName],
    ['数量/金额（元）', 'settlePrice', (settlePrice: any, order: any) => {
      const goods: any = order.orderGoods[0];
      return `${goods.count} / ${(settlePrice || order.price) / 100}元`;
    }]
  ];

  if (!forAudit) {
    tableHeaders.push(['改价方式', 'amendMethod', (amendMethod: any, order: any) => {
      return <div><Input.Group compact style={{ display: 'flex', alignItems: 'center' }}>
        <Select value={amendMethod} options={[
          { value: AMEND_METHOD_BY_RATE, label: '比例' },
          { value: AMEND_METHOD_FIXED, label: '固定金额' }
        ]} style={{ width: '150px' }}
          onChange={(value: any) => {
            order.amendMethod = value;
            if (value === AMEND_METHOD_BY_RATE) {
              order.discount = '100'; // 默认设置 100%
            } else {
              order.discount = '' + (order.price / 100); // 默认设置为原价（元）
            }
            order.discountNumber = calcDiscountNumber(order.discount);
            updateOrder(order);
          }} />
        <Input suffix={amendMethod === AMEND_METHOD_BY_RATE ? '%' : '元'}
          maxLength={8}
          value={order.discount}
          onChange={(e: any) => {
            let value: any = e.target.value;
            if (!value || /^\d+(\.\d+)?$/.test(value) || value.match(/\.$/)) {
              order.discount = value;
              order.discountNumber = calcDiscountNumber(value);

              if (order.amendMethod === AMEND_METHOD_BY_RATE) {
                if (order.discountNumber > 100) {
                  order.errorMessage = '折扣不能大于100%';
                  order.discount = '100';
                  order.discountNumber = 100;
                }
              } else {
                if ((order.discountNumber * 100) > order.price) {
                  order.errorMessage = '折扣不能大于原价';
                  order.discountNumber = order.price / 100;
                  order.discount = order.discountNumber + '';
                }
              }
              updateOrder(order);
            }
          }}
        />
      </Input.Group>
        {order.message && <div className="tip">{order.message}</div>}
      </div>
    }]);
  }

  tableHeaders.push(['改价后金额', 'amount', (amount: any) => `${(amount / 100).toFixed(2)}元`]);
  if (!forAudit) {
    tableHeaders.push(['操作', 'action', (_: any, order: any) => {
      if (order.orderId === baseOrderId) return null;
      return <Button type="link" onClick={() => {
        removeOrder(order);
      }} >移除</Button>
    }]);
  }
  return (<div className="selected-orders-field">
    <Table
      className="mcd-table orders-table"
      scroll={{ x: '100%' }}
      columns={transferAntdTableHeaderArray2Object(tableHeaders)}
      rowKey="orderId"
      dataSource={selectedOrders}
      pagination={false} />
  </div>);
}