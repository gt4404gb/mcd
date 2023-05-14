import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter, useParams } from 'react-router-dom';
import { Form, Input, Button, Row, Col, Breadcrumb, message, Cascader, Radio, Upload, Space, InputNumber, Modal } from '@aurum/pfe-ui';
import * as merchantAction from '@/redux/actions/merchantAction'
import District from './District';
import regionData from './region';
import RegionSelector from './RegionSelector';
import TreeList from './TreeList'

const defaultPrizeItem = {
  name: ['南京', '上海'], // 可配送区域
  firstNum: 1, // 首件（个）
  charge: 0.00, // 运费（元）
  nextNum: 1, //续建（个）
  nextCharge: 0.00, // 续件（元）
  errorMsg: '',
};

const initialExpressDetail = {
  name: '',
  style: 1,
  expressList: [{
    name: ['南京', '上海', '广州'], // 可配送区域
    firstNum: 1, // 首件（个）
    charge: 0.00, // 运费（元）
    nextNum: 1, //续建（个）
    nextCharge: 0.00, // 续件（元）
    errorMsg: '',
  }]
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

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ history, currentStep, gotoNexStep, executeAction }: any) => {
  const [expressDetail, setExpressDetail]: any = useState(JSON.parse(JSON.stringify(initialExpressDetail)));
  const [canOnlyView, setCanOnlyView] = useState(false);
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const [regionModalVisble, makeRegionModalVisble] = useState(true);
  const [source, setSource]: any = useState(null);
  const [value, setValue] = useState(1);

  const onAddPrizeItem = () => {
    const rewardWay = form.getFieldValue('expressList');
    const prizeItem: any = { ...defaultPrizeItem };
    expressDetail.expressList.push(prizeItem);
    updateExpressDetail(expressDetail);
  }

  const updateExpressDetail = (expressDetail: any) => {
    expressDetail.expressList = [...expressDetail.expressList];
    setExpressDetail({ ...expressDetail });
    form.setFieldsValue({
      expressList: expressDetail.expressList
    });
  }

  const toBack = () => {
    history.push('/ecs/distribution');
  }


  const onChange = (e: any) => {
    console.log(e.target.value)
    setValue(e.target.value);
  };

  return <div className={'express'}>
    <RegionSelector visible={regionModalVisble} regionData={regionData.data} onClose={(selectedCoupons: any, source: any) => {
      if (selectedCoupons.length > 0) {
        let rewardItem: any;
        let rewardItemKey: number = 0;

        rewardItem = expressDetail.rewardList[rewardItemKey];
        if (rewardItem) {
          const selectedCoupon: any = selectedCoupons[0];
          const prizeItem = rewardItem.prizeList[source.key];
          prizeItem.couponId = selectedCoupon.couponId;
          prizeItem.couponName = selectedCoupon.couponTitle;
          prizeItem.tradeEndTime = selectedCoupon.tradeEndTime;
          form.setFieldsValue({
            expressList: expressDetail.expressList,
          });
        }
      }
      makeRegionModalVisble(false);
    }} source={source} />

    <Form
      ref={formEl}
      layout="vertical"
      initialValues={expressDetail}
      scrollToFirstError={true}
      form={form}
      onFinishFailed={(values) => {
        console.log('values', values)
      }}
      onFinish={(values) => {
        (async function () {

        })();
      }}
      onValuesChange={(value) => {

      }}
    >
      <Row>
      </Row>
      <Row>
        <Col span={12}>
          <Row className="form-block" gutter={32}>
            <Col className="gutter-row" span={6}>
              <Form.Item label={$t('模板名称')} name={'name'} rules={[{ type: 'string', required: true }]} >
                <Input maxLength={25} width={200} disabled={canOnlyView} />
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={6}>
              <Form.Item name={'style'} label={$t('计费方式')}>
                <Radio.Group onChange={onChange}>
                  <Radio value={1} disabled={canOnlyView}>
                    按件数
                  </Radio>
                  <Radio value={0} disabled={canOnlyView}>
                    按重量
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col className="gutter-row" span={12}>
              <Form.Item label={$t('配送区域')}>
                <District
                  expressList={expressDetail.expressList}
                  field="expressList"
                  value={value}
                  onAddPrizeItem={() => onAddPrizeItem()}
                  onSelectNew={(key: any) => {
                    makeRegionModalVisble(true);
                    setSource({
                      roleType: '',
                      key
                    });
                  }}
                  onRemove={(key: any) => {
                    expressDetail.expressList = expressDetail.expressList.filter((item: any, iterKey: number) => {
                      return iterKey !== key;
                    });
                    updateExpressDetail(expressDetail);
                  }}
                />
              </Form.Item>
            </Col>

            <Col className="gutter-row" span={12} style={{ paddingTop: '20px', paddingBottom: 40 }}>
              <Space size='xs'>
                {!canOnlyView && <Button type="primary" htmlType="submit" >{$t('保存')}</Button>}
                <Button onClick={toBack}>{$t('返回')}</Button>
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
    </Form>
  </div >
}));