import React, { useState, useEffect } from 'react';
import { Table, PageHeader, Collapse } from '@aurum/pfe-ui';
import common from '@omc/common';

const { transferAntdTableHeaderArray2Object } = common.helpers;

export default ({ order, list = [] }: any) => {
  const [goodsList, setGoodsList]: any = useState([]);
  const [settlement, setSettlement]: any = useState({
    discountAmount: 0,
    goodsAmount: 0,
    realAmount: 0,
  });

  useEffect(() => {
    if (order) {
      settlement.goodsAmount = order.totalPrice;
      settlement.realAmount = order.actualPrice;
      settlement.discountAmount = settlement.goodsAmount - order.actualPrice;
      setSettlement({ ...settlement });
    }
  }, [order]);

  useEffect(() => {
    list.forEach((item: any, key: number) => {
      item.key = key;
    });
    setGoodsList(list);
  }, [list]);

  const tableHeaderMatrix: any = [
    ['商品', 'name', (value: any, record: any) => {
      return <div className="combo-name">
        <img src={record.url} />
        <span>{value}</span>
      </div>
    }],
    ['规格', 'spec'],
    ['单价', 'price', (value: any, record: any) => {
      return `¥ ${(record.price / 100).toFixed(2)}`;
    }],
    ['数量', 'count'],
    ['总金额', 'subtotal', (_: any, record: any) => {
      return `¥ ${(record.price * record.count / 100).toFixed(2)}`;
    }],
  ];

  const columns: any = transferAntdTableHeaderArray2Object(tableHeaderMatrix);

  return (
    <div className="order-block order-goods-list collapse-block">
      <Collapse defaultActiveKey={['1']} ghost>
        <Collapse.Panel header={<PageHeader ghost={false} title="商品清单"></PageHeader>} key="1">
          <Table
            columns={columns}
            scroll={{ x: '100%' }}
            dataSource={goodsList}
            pagination={false} />
          <div className="calc-area">
            <div className="amount">
              <span className="label">总金额</span>
              <span className="value">
                <span className="currency">¥</span>
                <span className="number">{(settlement.goodsAmount / 100).toFixed(2)}</span>
              </span>
            </div>
            <div className="discount">
              <span className="label">活动折扣</span>
              <span className="value">
                <span className="currency">¥</span>
                <span className="number">{settlement.discountAmount ? - (settlement.discountAmount / 100).toFixed(2) : 0}</span>
              </span>
            </div>
            <div className="subtotal">
              <span className="label">结算价</span>
              <span className="value">
                <span className="currency currency-highlight">¥</span>
                <span className="number">{(settlement.realAmount / 100).toFixed(2)}</span>
              </span>
            </div>
          </div>
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}
