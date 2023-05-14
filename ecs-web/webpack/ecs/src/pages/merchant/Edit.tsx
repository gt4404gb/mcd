import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux'
import { Row, Col, Steppers, Breadcrumb } from '@aurum/pfe-ui';
import * as merchantAction from '@/redux/actions/merchantAction'
import ActivityEditInfo from '@/components/merchant/edit/Info';
import ActivityEditRule from '@/components/merchant/edit/Rule';
import Dikaer from '@/components/merchant/edit/Dikaer';
import Stock from '@/components/merchant/edit/Stock';
import '@/assets/styles/merchant/edit.less'
const { Stepper } = Steppers;

const mapStateToProps = (state: any) => {
  return {
    currentStep: state.merchant.currentStep,
    IsAuction: state.merchant.IsAuction,   //是否是拍卖商品
    shopId: state.merchant.shopId
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  executeAction: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_EXECUTE_ACTION,
    payload
  }),
  gotoNexStep: (payload: any) => {
    dispatch({
      type: merchantAction.MERCHANT_NEXT_STEP,
      payload
    })
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(({ history, currentStep, gotoNexStep, executeAction, IsAuction, shopId }: any) => {
  const [stepperHtml, setStepperHtml]: any = useState([]);

  useEffect(() => {
    console.log('currentStep', currentStep)
    let shopId = Number(location.search?.split("?")[1]);
    let _html = <Steppers current={currentStep}>
      <Stepper title="商品基本信息"></Stepper>
      <Stepper title="商品售卖信息"></Stepper>
      <Stepper title="商品上架信息"></Stepper>
    </Steppers>
    if (shopId && shopId !== 5) {
      _html = <Steppers current={currentStep}>
        <Stepper title="商品基本信息"></Stepper>
        <Stepper title="商品售卖信息"></Stepper>
        <Stepper title="商品规格信息"></Stepper>
        <Stepper title="商品上架信息"></Stepper>
      </Steppers>
    }
    setStepperHtml(_html)
  }, [currentStep, shopId])


  return <div id="merchant-edit" className="merchant-edit">
    <Breadcrumb>
      <Breadcrumb.Item>
        <a href="/ecs/merchants">商品列表</a>
      </Breadcrumb.Item>
      <Breadcrumb.Item>商品详情</Breadcrumb.Item>
    </Breadcrumb>

    <Row>
      <Col span={12}>
        <div style={{marginBottom:'16px'}}>
          {stepperHtml}
        </div>
      </Col>
    </Row>
    <div className="inner-container" >
      <ActivityEditInfo
        /* @ts-ignore */
        STEP={1}
        onActionCompleted={(result: any) => {
          if (result) {
            gotoNexStep(1);
            if (result.id) {
              history.push('/ecs/merchants/edit/' + result.id + '?' + result.shopId);
            }
          }
        }} />
      <ActivityEditRule
        /* @ts-ignore */
        STEP={2}
        onActionCompleted={(isSaved: boolean) => {
          if (isSaved) {
            gotoNexStep(1)
          }
        }} />
      {shopId !== 5 && <Dikaer
        /* @ts-ignore */
        STEP={3}
        onActionCompleted={(isSaved: boolean) => {
          if (isSaved) {
            gotoNexStep(1)
          }
        }} />}
      <Stock
        /* @ts-ignore */
        STEP={shopId !== 5 ? 4 : 3}
        onActionCompleted={(isSaved: boolean) => {
          if (isSaved) {
            gotoNexStep(1)
          }
        }} />
    </div>
  </div>
});