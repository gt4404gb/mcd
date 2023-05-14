import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader, Descriptions, Tag, Form, Row, Col } from '@aurum/pfe-ui';
import constants from '@/apps/btb/common/constants';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis'
import Coupons from '@/apps/btb/components/voucher/product/Coupons';
import EquityCards from '@/apps/btb/components/voucher/product/EquityCards';
import './styles/ProductDetail.less'

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const { getEntityColumnLabel } = common.helpers;

enum RESOURCE_TYPE {
  COUPON = 1,
  EQUITY_CARD = 2
}
export default ({ history }: any) => {
  const [entity, setEntity]: any = useState({
    resourceType: RESOURCE_TYPE.COUPON, // 1. 优惠券， 2. 权益卡
    resourceList: [],
  });

  const [form] = Form.useForm();
  const { productId }: any = useParams();

  const fetchDetail: any = async (productId: any) => {
    if (!productId) return;
    const { data: detail }: any = await apis.getVoucherModule().templateDetail(productId);
    detail.templateCode = productId;
    setEntity(detail);
  }

  useEffect(() => {
    fetchDetail(productId);
    return () => {
      setEntity({});
    }
  }, [productId]);

  return (<div className="btb-voucher-template-detail">
    <PageHeader
      ghost={false}
      title="兑换码模板"
      tags={productId ? <Tag color="blue">{getEntityColumnLabel(constants.btb.voucherTemplate.state, entity.state)}</Tag> : []}
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
        wrapperCol={{ prefixCls: 'form-item-label' }}
        className="view-form"
        initialValues={entity}
      >
        <Row gutter={20}>
          {/* <Form.Item hidden={true} name="templateCode">
              <Input />
            </Form.Item> */}
          <Col span="6">
            <Form.Item label={$t('模板名称')} name="templateName">
              {entity.templateName}
            </Form.Item>
          </Col>
          <Col span="6">
            <Form.Item label={$t('模板简介')} name="introduction" >
              {entity.introduction}
            </Form.Item>
          </Col>
          <Col span="6">
            <Form.Item label={$t('模板时间')} >
              {entity.beginTime} ~ {entity.endTime}
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={20}>
          <Col span="6">
            <Form.Item label={$t('库存')}  >
              总库存 {entity.totalStock} ，剩余 {entity.leftStock}
            </Form.Item>
          </Col>
          <Col span="6">
            <Form.Item label="兑换内容" >
              {entity.resourceType === RESOURCE_TYPE.COUPON ? '优惠券' : '权益卡'}
            </Form.Item>
          </Col>
          <Col span="6">
            <Form.Item label={$t('兑换码有效期')} name="validityRange" >
              {entity.redeemValidityType === 0 ? '同模板有有效期' : `生成后${entity.redeemValidityDays || 0}天`}
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={20}>
          <Col span="6">
            <Form.Item label="自定义头部">{entity.redeemPrefix}</Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
    <div className="page-body">
      <div className="title">关联卡券</div>
      {entity.resourceType === RESOURCE_TYPE.COUPON &&
        <Coupons state={false} list={entity.resourceList || []} />}
      {entity.resourceType === RESOURCE_TYPE.EQUITY_CARD &&
        <EquityCards state={false} list={entity.resourceList || []} />}
    </div>
  </div>);
}