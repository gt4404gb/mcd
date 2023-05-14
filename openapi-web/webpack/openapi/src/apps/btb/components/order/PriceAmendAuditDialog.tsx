import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, message, PageHeader, } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis'
import SelectedOrders from './SelectedOrders';

import './styles/PriceAmendAuditDialog.less';

export default ({ visible = false, orderId, onClose }: any) => {
  const [form] = Form.useForm();
  const [entity, setEntity]: any = useState({});
  const [selectedOrders, setSelectedOrders]: any = useState([]);

  let actionMethod: any;

  useEffect(() => {
    if (visible) {
      fetchOrderDetail(orderId);
    }
  }, [orderId, visible]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const fetchOrderDetail: any = async (orderId: any) => {
    if (!orderId) return;
    const { data: order }: any = await apis.getBOSModule().detail({ orderId });
    const entity: any = {
      orderId: order?.orderId,
      auditRemark: '',
    };
    if (order?.changeRecords) {
      const changeRecord: any = order.changeRecords.pop();
      entity.remark = changeRecord.remark;
      entity.tagId = changeRecord.tagId;
      entity.applyId = changeRecord.applyId;
      entity.applyInfo = `${changeRecord.applyName} 提交于：${changeRecord.applyTime}`;
    }
    setEntity(entity);

    const resp: any = await apis.getBOSModule().fetchOrdersToPriceAmendAudit(orderId);
    const orders: any = resp.data.applyList.map((it: any) => {
      const order: any = {};
      order.orderId = it.orderId;
      order.merchantName = it.merchantName;

      order.orderGoods = [{
        count: it.count,
        spuName: it.name,
      }];
      order.price = it.prePrice;
      order.amount = it.postPrice;
      return order;
    })
    setSelectedOrders(orders);
  }

  const _actionPriceAmendAudit: any = async (formData: any, status: number) => {
    const resp: any = await apis.getBOSModule().priceAmendAudit({
      orderId,
      applyId: formData.applyId,
      remark: formData.auditRemark,
      status, // 通过
      tagId: entity.tagId,
    });
    if (resp?.success) {
      message.success(`审核${status === 1 ? '通过' : '拒绝'}`);
      onClose(true);
    } else {
      message.error(resp.message || '审核操作失败');
    }
  }

  const actionPassPriceAmendAudit: any = async (formData: any) => {
    await _actionPriceAmendAudit(formData, 1);
  }

  const actionRejectPriceAmendAudit: any = async (formData: any) => {
    await _actionPriceAmendAudit(formData, 2);
  }

  return (<div className="amend-audit-container">
    <Modal width={800}
      className="amend-audit-modal"
      maskClosable={false}
      visible={visible} onCancel={() => {
        if (onClose) onClose();
      }} footer={null}
      title="改价审核"
    >
      <Form layout="vertical"
        form={form}
        labelAlign="right"
        labelCol={{ span: 4 }}
        className="amend-form"
        initialValues={entity}
        onFinish={(values: any) => {
          actionMethod(values);
        }}
      >
        <PageHeader title="改价订单" className="block-header" />
        <SelectedOrders value={selectedOrders} forAudit={true} />
        {entity.remark && <Form.Item label={$t('备注')} >
          <div className="ws-normal">{entity.remark}</div>
        </Form.Item>}
        <Form.Item hidden={true} name="applyId">
          <Input />
        </Form.Item>
        <Form.Item label={$t('审核备注')} name="auditRemark" >
          <Input.TextArea rows={4} maxLength={500} />
        </Form.Item>
      </Form>
      <div className="actions">
        <Button onClick={() => {
          actionMethod = actionPassPriceAmendAudit;
          form.submit();
        }} type="primary">审核通过</Button>
        <Button style={{ marginLeft: 8 }} onClick={() => {
          actionMethod = actionRejectPriceAmendAudit;
          form.submit();
        }} >驳回</Button>
      </div>
    </Modal>
  </div>);
}