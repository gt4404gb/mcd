import React, { useEffect, useState } from 'react';
import { Table, Button, Modal } from '@aurum/pfe-ui';
export default ({ couponItemArr, visible, onClose }: any) => {

  const columns = [
    {
      title: '权益卡/券编号',
      dataIndex: 'cardCouponNo',
      key: 'cardCouponNo',
      width: 180,
      ellipsis: true,
    },
    {
      title: '权益卡/券名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      ellipsis: true,
    },
    {
      title: '投放开始时间',
      dataIndex: 'putStartTime',
      key: 'putStartTime',
      width: 110,
      ellipsis: true,
    },
    {
      title: '投放结束时间',
      dataIndex: 'putEndTime',
      key: 'putEndTime',
      width: 110,
      ellipsis: true,
    }
  ]
  return (
    <Modal width={1000} visible={visible} onCancel={() => { onClose() }}
      bodyStyle={{ paddingTop: '0' }}
      title="权益卡/券详情"
      footer={[
        <Button key="confirm" type="primary" onClick={() => { onClose() }}>关闭</Button>,
      ]}
    >
      <div className="coupon-select-modal row">
        <Table
          pagination={false}
          className="coupons-selector"
          scroll={{ x: 960 }}
          columns={columns}
          dataSource={couponItemArr}
        />
      </div>
    </Modal>
  )
}

