import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, message, Modal } from '@aurum/pfe-ui';
import CouponShow from './CouponShow';
import '@/assets/styles/order/detail.less';
import * as orderApis from '@/common/net/apis_order';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
export default (({ giftRecords, searchObj, totalCount, setSearchObj }: any) => {

  const [couponModalVisble, makeCouponModalVisble] = useState(false);
  const [couponItemArr, setCouponItemArr]: any = useState([]);
  const colums = [
    {
      dataIndex: 'giftTypeDesc',
      key: 'giftTypeDesc',
      title: '赠送方式',
      width: 150
    },
    {
      dataIndex: 'release',
      key: 'release',
      title: '赠送进度',
      width: 150,
      render: (d: any, item: any, index: any) => {
        return '已被领取 ' + item.receivedCount + ' ' + ' /共 ' + item.totalCount + ' 可送'
      }
    },
    {
      dataIndex: 'records',
      key: 'records',
      title: '领取详情',
      width: 200,
      render: (d: any, item: any, index: any) => {
        return item?.records?.length ? <Button type="link" size='small' onClick={() => { onShowNewCoupon(item) }}>查看详情</Button> : null
      }
    },
    {
      dataIndex: '',
      key: '',
      title: '',
      width: 200
    }
  ]
  const couponColums = [{
    title: '领取时间',
    dataIndex: 'receivedTime',
    key: 'receivedTime',
    width: 180,
    ellipsis: true,
  },
  {
    title: '领取人会员昵称',
    dataIndex: 'receivedNickName',
    key: 'receivedNickName',
    width: 120,
    ellipsis: true,
  },
  {
    title: '领取人会员id',
    dataIndex: 'receivedUserId',
    key: 'receivedUserId',
    width: 110,
    ellipsis: true,
  }]

  const onShowNewCoupon = (item: any) => {
    setCouponItemArr(item.records);
    makeCouponModalVisble(true);
  }

  return (
    <div className="activity-list table-container">
      <Modal width={1000} visible={couponModalVisble} onCancel={() => { makeCouponModalVisble(false); }}
        bodyStyle={{ paddingTop: '0' }}
        title="领取详情"
        footer={[
          <Button key="confirm" type="primary" onClick={() => { makeCouponModalVisble(false) }}>关闭</Button>,
        ]}
      >
        <div className="coupon-select-modal row">
          <Table
            pagination={false}
            className="coupons-selector"
            scroll={{ x: 960 }}
            columns={couponColums}
            dataSource={couponItemArr}
          />
        </div>
      </Modal>
      <div className="table-top-wrap" >
        <Table
          pagination={false}
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          columns={colums}
          dataSource={[giftRecords]} />
      </div>
    </div>
  )
})
