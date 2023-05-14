import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
import * as orderAction from '@/redux/actions/orderAction'
import { Row, Col, Steppers, Breadcrumb } from '@aurum/pfe-ui';
import OrderInfo from '@/components/order/detail/OrderInfo';
import '@/assets/styles/order/detail.less'
import * as orderApis from '@/common/net/apis_order';

const { Stepper } = Steppers;

var timer: any = false;

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

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ history, refreshRandom}: any) => {
  const { orderCode }: any = useParams();
  const [statusBars, setStatusBars]: any = useState([]);
  const [statusBarsHtml, setStatusBarsHtml]: any = useState([]);
  const [orderDetail, setOrderDetail]: any = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: data }: any = await orderApis.getMerchantModule().detail({ orderId: orderCode })
      if (data) {
        if (data.statusBars) {
          setStatusBars(data.statusBars);
        }
        setOrderDetail(data);
      } else {
        history.push('/ecs/orders');
      }
    })();
  }, [orderCode, refreshRandom]);

  useEffect(() => {
    if (!statusBars.length || statusBars.length < 3) return;
    let _html = statusBars.map((item: any, index: any) => {
      if (item.status === 2) {//进行时
        setCurrentIndex(index+1);
      }
      return <Stepper title={item.orderStatusDesc} key={item.orderStatus}></Stepper>
    })
    setStatusBarsHtml(_html);

  }, [statusBars])


  return <div className="order-detail">
    <Breadcrumb>
      <Breadcrumb.Item>
        <a href="/ecs/orders">订单管理</a>
      </Breadcrumb.Item>
      <Breadcrumb.Item>订单详情</Breadcrumb.Item>
      <Breadcrumb.Item>{orderDetail?.shopName}</Breadcrumb.Item>
    </Breadcrumb>
    <Row style={{ marginBottom: '20px', paddingTop: '10px', paddingBottom: '10px', paddingLeft: '10px', paddingRight: '10px', }}>
      <Col span={12}>
        <Steppers current={currentIndex}>
          {statusBarsHtml}
        </Steppers>
      </Col>
    </Row>
    <div className="inner-container" >
      <OrderInfo orderDetail={orderDetail} />
    </div>
  </div>
  }));