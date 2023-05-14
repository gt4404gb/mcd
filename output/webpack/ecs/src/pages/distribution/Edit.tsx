import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux'
import { Form, Input, Button, Row, Col, Breadcrumb, message, Cascader, Radio, Upload, Space, InputNumber, Modal } from '@aurum/pfe-ui';
import * as merchantAction from '@/redux/actions/merchantAction'
import Express from '@/components/distribution/edit/Express';

import '@/assets/styles/distribution/edit.less'

const initialMerchantDetail = {
  basicInfo: { //商品详情-基本信息
    categoryId: '', // 商品分类Id
    spuId: '',//SPU_ID
    spuName: '', // 商品名称
    spuNameEn: '',
    selling: '', //卖点
    sellingEn: '',
    images: [],//商品主图
    imagesEn: [],
    video: '',//商品视频
    videoImage: '',//视频主图
    videoImageEn: '',//视频英文主图
    detail: '', //商品详情
    detailEn: '',
    notesToBuy: '',//购买须知
    notesToBuyEn: '',
    shopId: '',
    flash: 0,
    listDisplay: 1
  },
  whitePhones: [], //白名单
  cascaderData: [],
  isNeedExtType: false,//是否需要展示关联卡券
  isNeedExtTypeEqual3: false //是否维护权益详情，只有卡才需要extType===3
}


const mapStateToProps = (state: any) => {
  return {
    currentStep: state.merchant.currentStep
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

var timer: any = false;
export default connect(mapStateToProps, mapDispatchToProps)(({ currentStep, gotoNexStep, executeAction }: any) => {
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const [merchantDetail, setMerchantDetail]: any = useState(JSON.parse(JSON.stringify(initialMerchantDetail)));
  const [canOnlyView, setCanOnlyView] = useState(false);
  const [form] = Form.useForm();
  const formEl: any = useRef(null);

  return <div className="distribution-edit">
    <Breadcrumb>
      <Breadcrumb.Item>
        <a href="/ecs/merchants">配送管理</a>
      </Breadcrumb.Item>
      <Breadcrumb.Item>运费模板</Breadcrumb.Item>
    </Breadcrumb>
    <div className="inner-container" >
      <Express />
    </div>
  </div>
});