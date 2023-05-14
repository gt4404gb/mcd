import React, { useState, useEffect } from 'react';
import { Col, Row, Modal, Table } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis';

export default ({ coupon, visible, onClose }: any) => {
    const { transferAntdTableHeaderArray2Object, getEntityColumnLabel } = common.helpers;
    const tableHeaderColumnMatrix: any = [
    ['商品名称', 'couponName'],
    ['券码', 'couponCode'],
    ['绑定手机', 'bindPhone', (value: any) => value || '/'],
    ['绑定用户', 'bindId', (value: any) => value || '/'],
    ['使用渠道', 'tradeChannel', (value: any) => getEntityColumnLabel('global/channel', value)],
    ['使用时间', 'createdDate', (value: any) => value || '/'],
    ['使用门店', 'tradeStoreId', (value: any, record: any) => {
      if (!value && !record.tradeStoreName) return '/';
      return `${value || ''} ${record.tradeStoreName || ''}`
    }],
  ];

  const columns: any = transferAntdTableHeaderArray2Object(tableHeaderColumnMatrix);

  const [logs, setLogs]: any = useState([]);

  useEffect(() => {
    if (coupon) {
      (async () => {
        const resp: any = await apis.getBOSModule().queryCouponHistory({ id: coupon.id });
        const logs: any = resp.data.map((item: any, key: number) => {
          item.key = key;
          item.couponName = coupon.couponName;
          item.couponCode = coupon.couponCode;
          item.bindPhone = coupon.bindPhone;
          item.bindId = coupon.bindId;
          return item;
        });
        setLogs(logs);
      })();
    }
  }, [coupon]);

  return (
    <Modal width={800} className="payment-modal" visible={visible}
      onCancel={() => {
        if (onClose) onClose(false);
      }}
      footer={null}
      title="券码使用记录"
    >
      <div className="table-top-wrap" >
        <Row>
          <Col span={24}>
            可用次数：可用 {coupon?.availableTradeCount || 0} / 总 {coupon?.totalTradeCount || 0}次
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Table
              className="mcd-table"
              scroll={{ x: '100%' }}
              tableLayout="fixed"
              columns={columns}
              dataSource={logs}
              pagination={false} />
          </Col>
        </Row>
      </div>
    </Modal>
  )
}