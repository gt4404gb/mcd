import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader, Descriptions, Tag, Form, Input, Button, Row, Col, Radio, Popconfirm, message, Tooltip, InputNumber } from '@aurum/pfe-ui';
import { QuestionCircleFilled } from '@ant-design/icons';
import moment from 'moment';
// @ts-ignore
import { DateRangePicker } from '@omc/boss-widgets';
import constants from '@/apps/btb/common/constants';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis'
import Coupons from '@/apps/btb/components/voucher/product/Coupons';
import EquityCards from '@/apps/btb/components/voucher/product/EquityCards';
import VoucherValidityRangeField from '@/apps/btb/components/voucher/product/VoucherValidityRangeField';
import './styles/ProductEdit.less'

const md5: any = require('md5');
const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const { getEntityColumnLabel } = common.helpers;

enum RESOURCE_TYPE {
  COUPON = 1,
  EQUITY_CARD = 2
}
export default ({ history }: any) => {
  const [entity, setEntity]: any = useState({
    timeRange: [
      moment().startOf('day'),
      moment().add(180, 'days').endOf('day')
    ],
    validityRange: {
      type: 0,
      days: 30,
    },
    resourceType: RESOURCE_TYPE.COUPON, // 1. 优惠券， 2. 权益卡
    resourceList: [],
  });

  const [form] = Form.useForm();
  const { productId }: any = useParams();

  const fetchDetail: any = async (productId: any) => {
    if (!productId) return;
    const { data: detail }: any = await apis.getVoucherModule().templateDetail(productId);
    detail.timeRange = [moment(detail.beginTime, DATE_FORMAT), moment(detail.endTime, DATE_FORMAT)];
    detail.validityRange = {
      type: detail.redeemValidityType,
      days: detail.redeemValidityDays || (detail.redeemValidityType === 0 ? 0 : 30),
    };
    detail.templateCode = productId;
    setEntity(detail);
  }

  const save: any = async (formData: any) => {
    if (formData.timeRange) {
      if (formData.timeRange[0]) formData.beginTime = formData.timeRange[0].format('YYYY-MM-DD HH:mm:ss');
      if (formData.timeRange[1]) formData.endTime = formData.timeRange[1].format('YYYY-MM-DD HH:mm:ss');
    }
    formData.redeemValidityType = formData.validityRange.type;
    formData.redeemValidityDays = formData.validityRange.days;
    if (productId) formData.templateCode = productId;
    formData.resourceList = entity.resourceList || [];
    const resp: any = await apis.getVoucherModule().templateSave(formData);
    if (resp?.success) {
      message.success('凭证模板保存成功');
      history.push('/openapi/btb/voucher/products');
    } else {
      message.error(resp.message || '凭证模板保存失败');
    }
  }

  useEffect(() => {
    fetchDetail(productId);
    return () => {
      setEntity({});
    }
  }, [productId]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  return (<div className="btb-voucher-product-edit">
    <div className="edit-info-wrapper">
      <PageHeader
        ghost={false}
        title="兑换码模板"
        tags={productId ? <Tag color="blue">{getEntityColumnLabel(constants.btb.voucherTemplate.state, entity.state)}</Tag> : []}
        extra={[
          <Button key="save" type="primary" htmlType="submit" onClick={() => {
            form.submit();
          }}>保存</Button>,
          <Popconfirm key="cancel" onConfirm={() => {
            history.push('/openapi/btb/voucher/products');
          }} title={`取消后所有编辑的数据将丢失，确认要取消吗？`} okText="确认" cancelText="取消" >
            <Button >取消</Button>
          </Popconfirm>
        ]}
      >
        <Descriptions size="small" column={4} layout="vertical" colon={false}>
          <Descriptions.Item label="创建人">{entity.addOperator}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{entity.addTime}</Descriptions.Item>
          <Descriptions.Item label="更新人">{entity.updateOperator}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{entity.updateTime}</Descriptions.Item>
        </Descriptions>
      </PageHeader>
      <div className="page-body">
        <div className="title">模板信息</div>
        <Form layout="vertical"
          form={form}
          className="edit-form"
          initialValues={entity}
          onFinish={(values: any) => {
            save(values);
          }}
          onValuesChange={(chgValues: any, values: any) => {
            if ('resourceType' in chgValues) {
              setEntity({ ...entity, ...values, resourceList: [] });
            }
          }}
        >
          <Row gutter={20}>
            <Form.Item hidden={true} name="templateCode">
              <Input />
            </Form.Item>
            <Col span="6">
              <Form.Item label={$t('模板名称')} name="templateName" rules={[{ required: true }]}>
                <Input maxLength={30} placeholder="请输入模板名称" />
              </Form.Item>
            </Col>
            <Col span="6">
              <Form.Item label={$t('模板简介')} name="introduction" >
                <Input maxLength={500} placeholder="请输入模板简介" />
              </Form.Item>
            </Col>
            <Col span="7">
              <Form.Item label={$t('模板时间')} name="timeRange" rules={[{ required: true }]}>
                <DateRangePicker
                  allowClear={false}
                  showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                  format="YYYY-MM-DD HH:mm:ss"
                  placeholder={[
                    '开始时间', '结束时间'
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={20}>
            <Col span="6">
              {(productId && entity.state !== constants.btb.voucherTemplate.state.TO_SUBMIT.value) ?
                <>
                  <Form.Item name="totalStock" hidden={true} >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item label={$t('库存')}  >
                    总库存 {entity.totalStock} ，剩余 {entity.leftStock}
                  </Form.Item>
                </>
                :
                <Form.Item label={$t('库存')} name="totalStock" rules={[{ required: true }]} >
                  <InputNumber placeholder="请输入库存" min={1} maxLength={9} style={{ width: '100%' }} />
                </Form.Item>}
            </Col>
            <Col span="6">
              <Form.Item name="resourceType" label={<span>兑换内容 <Tooltip title="支持兑换多张优惠券或一张权益卡"><QuestionCircleFilled /></Tooltip></span>} rules={[{ required: true }]}>
                <Radio.Group disabled={(productId && entity.state !== constants.btb.voucherTemplate.state.TO_SUBMIT.value) ? true : false}>
                  <Radio value={RESOURCE_TYPE.COUPON}>优惠券</Radio>
                  <Radio value={RESOURCE_TYPE.EQUITY_CARD}>权益卡</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span="7">
              <Form.Item label={$t('兑换码有效期')} name="validityRange" rules={[{ required: true }]} >
                <VoucherValidityRangeField />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={20}>
            <Col span="6">
              <Form.Item label={<span>自定义头部 <Tooltip title="兑换码18位，支持自定义前2-4位"><QuestionCircleFilled /></Tooltip></span>} name="redeemPrefix"
                rules={[
                  { required: true, message: '请输入3位字母或数字' },
                  { pattern: /[a-zA-Z\d]{3}/, message: '请输入3位字母或数字' },
                ]} >
                <Input className="header-field" addonBefore="V" maxLength={3} addonAfter={md5(new Date().getTime()).substring(0, 14)} placeholder="请输入3位数字或者字母" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
    <div className="page-body">
      <div className="title">关联卡券</div>
      {entity.resourceType === RESOURCE_TYPE.COUPON &&
        <Coupons canEdit={(!productId || entity.state === constants.btb.voucherTemplate.state.TO_SUBMIT.value) ? true : false} list={entity.resourceList || []} onChange={(rows: any) => {
          entity.resourceList = rows;
        }} />}
      {entity.resourceType === RESOURCE_TYPE.EQUITY_CARD &&
        <EquityCards canEdit={(!productId || entity.state === constants.btb.voucherTemplate.state.TO_SUBMIT.value) ? true : false} list={entity.resourceList || []} onChange={(rows: any) => {
          entity.resourceList = rows;
        }} />}
    </div>
  </div>);
}