import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux'
import * as orderAction from '@/redux/actions/orderAction'
import { Table, Button, Modal, Row, Col } from '@aurum/pfe-ui';
import * as orderApis from '@/common/net/apis_order';
import { message } from 'antd';

const mapStateToProps = (state: any) => {
  return {
    refreshRandom: state.order.refreshRandom
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  toRefreshRandom: (payload: any) => dispatch({
    type: orderAction.ORDER_ORDER_REFRESH,
    payload
  })
});
export default connect(mapStateToProps, mapDispatchToProps) (({ orderCode, orderItemId, visible, onClose, toRefreshRandom, cancelNum }: any) => {
  const [loading, setLoading] = useState(false);
  const [coupondata, setCouponData] = useState({
    couponCodes: [],
    couponId: '',
    orderId: '',
    couponName: '',
    orderItemId: '',
    phone: '',
    sendNum: '',
    userId: '',
  });

  useEffect(() => {
    if (!visible) {
      return;
    }
    (async () => {
      const { data: data }: any = await orderApis.getMerchantModule().couponDetail({ orderId: orderCode, orderItemId: orderItemId })
      if (data) {
        setCouponData(data);
      }
    })();
  }, [visible])

  const handleOk = () => {
    setLoading(true);
    (async () => {
      const result: any = await orderApis.getMerchantModule().couponUseStatusSync({ orderId: orderCode, orderItemId: orderItemId })
      if (result && result.data) {
        onClose();
        toRefreshRandom(Math.random());
        setLoading(false);
      } else {
        setLoading(false);
        message.error(result.message)
      }
    })();
  };

  const columns = [
    {
      title: '券码',
      dataIndex: 'couponCode',
      key: 'couponCode',
      width: 180,
      ellipsis: true,
    },
    {
      title: '领取会员',
      dataIndex: 'bindUser',
      key: 'bindUser',
      width: 120,
      ellipsis: true,
    },
    {
      title: '使用情况',
      dataIndex: 'useDesc',
      key: 'useDesc',
      width: 110,
      ellipsis: true,
    },
    {
      title: '领取时间',
      dataIndex: 'redeemTime',
      key: 'redeemTime',
      width: 110,
      ellipsis: true,
    },
    {
      title: '核销开始时间',
      dataIndex: 'redeemStartTime',
      key: 'redeemStartTime',
      width: 110,
      ellipsis: true,
    },
    {
      title: '核销结束时间',
      dataIndex: 'redeemEndTime',
      key: 'redeemEndTime',
      width: 110,
      ellipsis: true,
    },
    {
      title: '作废时间',
      dataIndex: 'cancelTime',
      key: 'cancelTime',
      width: 110,
      ellipsis: true,
    }
  ]
  return (
    <Modal width={1100} visible={visible} onCancel={() => { onClose() }}
      bodyStyle={{ paddingTop: '0' }}
      title="订单券码"
      footer={[
        <Button key="submit" disabled={cancelNum <= 0} type="primary" loading={loading} onClick={handleOk}>
          更新核销
        </Button>,
      ]}
    >
      <div className="look-coupon">
        <Row gutter={32} className="form-block">
          <Col span={4}>
            <label>卡券编码:</label>
          </Col>
          <Col span={4}>
            <label>卡券名称:</label>
          </Col>
          <Col span={4}>
            <label>发放数量:</label>
          </Col>
          <Col span={4}>
            <span>{coupondata.couponId}</span>
          </Col>
          <Col span={4}>
            <span>{coupondata.couponName}</span>
          </Col>
          <Col span={4}>
            <span>{coupondata.sendNum}</span>
          </Col>
          <Col span={4}>
            <label>下单手机号:</label>
          </Col>
          <Col span={4}>
            <label>下单会员:</label>
          </Col>
          <Col span={4}>

          </Col>
          <Col span={4}>
            <span>{coupondata.phone}</span>
          </Col>
          <Col span={4}>
            <span>{coupondata.userId}</span>
          </Col>
        </Row>
        <Table
        // @ts-ignore
          pagination={{position : ['none']}}
          className="coupons-selector"
          scroll={{ x: 960 }}
          columns={columns}
          dataSource={coupondata.couponCodes}
        />
      </div>
    </Modal>
  )
})