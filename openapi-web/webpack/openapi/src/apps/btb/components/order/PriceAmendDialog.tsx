import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, PageHeader, Alert, message } from '@aurum/pfe-ui';
import constants from '@/apps/btb/common/constants';
import RelatedOrdersSelector from '../libs/RelatedOrdersSelector';
import * as apis from '@/apps/btb/common/apis'
import SelectedOrders from './SelectedOrders';
import FormItem from 'antd/lib/form/FormItem';

import './styles/PriceAmendDialog.less';

export default ({ visible = false, orderId, onClose }: any) => {
  const [form] = Form.useForm();
  const [entity, setEntity]: any = useState({
    selectedOrders: [],
  });
  const [orderSelectorVisible, setOrderSelectorVisible]: any = useState(false);

  useEffect(() => {
    if (visible) {
      fetchOrderDetail(orderId);
    }
  }, [orderId, visible]);

  const fetchOrderDetail: any = async (orderId: any) => {
    if (!orderId) return;
    const { data: order }: any = await apis.getBOSModule().detail({ orderId });
    const entity: any = {
      orderId: order?.orderId,
      merchantId: order?.merchantId,
      remark: null,
      changeOrderList: []
    };

    order.orderGoods = order.goods;
    order.orderGoods[0].spuName = order.orderGoods[0].name;
    order.price = order.actualPrice;
    entity.selectedOrders = [order];
    setEntity(entity);
    form.resetFields();
  }

  const actionPriceAmendApply = async (values: any) => {
    const formData: any = {
      changeOrderList: values.selectedOrders.map((it: any) => {
        return {
          orderId: it.orderId,
          price: Math.round(it.amount === undefined ? it.price : it.amount),
          type: 1, // 批采优惠
        }
      }),
      remark: values.remark
    };

    const resp: any = await apis.getBOSModule().priceAmendApply(formData);
    if (resp?.success) {
      message.success('改价申请已提交，请等待审核');
      onClose(true);
    } else {
      message.error(resp.message || '提交审核失败');
    }
  }

  return (<div className="amend-container">
    <Modal width={1000}
      className="amend-modal"
      maskClosable={false}
      visible={visible} onCancel={() => {
        if (onClose) onClose();
      }} footer={null}
      title={`改价申请`}
    >
      {orderSelectorVisible && <RelatedOrdersSelector visible={orderSelectorVisible}
        selectedItemIds={entity.selectedOrders.map((it: any) => it.orderId)}
        title="待支付订单"
        searchConds={{
          merchantId: entity?.merchantId,
          status: constants.btb.order.status.NOT_PAID.value,
        }}
        onClose={(selectedItems: any) => {
          entity.selectedOrders = [...form.getFieldValue('selectedOrders'), ...selectedItems];
          setEntity({ ...entity });
          form.resetFields();
          setOrderSelectorVisible(false)
        }} />}
      <Alert message="可选择同一商户的多个待支付订单发起改价。" type="warning" />
      <Form layout="vertical"
        form={form}
        labelAlign="right"
        labelCol={{ span: 4 }}
        className="amend-form"
        initialValues={entity}
        onFinish={actionPriceAmendApply}
        onValuesChange={(chgValues: any, values: any) => {
          if (chgValues.selectedOrders) {
            chgValues.selectedOrders.forEach((it: any) => {
              if (it.errorMessage) {
                message.destroy();
                message.warn(it.errorMessage);
                delete it.errorMessage;
              }
            })
            entity.selectedOrders = chgValues.selectedOrders;
            setEntity({ ...entity });
          }
        }}
      >
        {entity.selectedOrders.length < 10 && <PageHeader
          title="改价订单"
          className="block-header"
          extra={[
            <Button key="btn-add-order" type="link" onClick={() => {
              setOrderSelectorVisible(true);
            }}>添加订单</Button>
          ]}
        />}
        {/* rules={[{ required: true }]} extra={calculateMessage ? <span style={{ color: 'red' }}>{calculateMessage}</span> : null}> */}
        <FormItem name="selectedOrders" >
          <SelectedOrders baseOrderId={orderId} />
        </FormItem>
        <Form.Item style={{ display: 'none' }} hidden={true} name="applyId" >
          <Input />
        </Form.Item>
        <Form.Item label={$t('备注')} name="remark" >
          <Input.TextArea rows={4} maxLength={500} />
        </Form.Item>
        <div className="actions">
          <Button htmlType="submit" type="primary">提交审核</Button>
          <Button style={{ marginLeft: 8 }} onClick={() => { onClose(false); }}>稍后操作</Button>
        </div>
      </Form>
    </Modal>
  </div>);
}