import React, { useState, useEffect } from 'react';
import { Table, Form, Input, Button, Modal, message, Radio, PageHeader } from '@aurum/pfe-ui';
//import { PictureWall } from '@omc/boss-widgets';
import PictureWall from '@/compoments/picture-wall/PictureWall';
import * as apis from '@/apps/btb/common/apis';
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import './styles/PaymentAuditDialog.less';

const { transferAntdTableHeaderArray2Object } = common.helpers;

function getReceipt(records: any) {
  const recordsMapByStatus: any = {};
  let receipt: any;
  records.forEach((record: any) => {
    recordsMapByStatus[record.status] = record;
  });

  const auditTypeStatusEnum: any = constants.btb.order.auditType;

  if (recordsMapByStatus[auditTypeStatusEnum.PASSED.value]) {
    receipt = recordsMapByStatus[auditTypeStatusEnum.PASSED.value];
  } else if (recordsMapByStatus[auditTypeStatusEnum.PENDING.value]) {
    receipt = recordsMapByStatus[auditTypeStatusEnum.PENDING.value];
  } else if (recordsMapByStatus[auditTypeStatusEnum.REJECTED.value]) {
    receipt = recordsMapByStatus[auditTypeStatusEnum.REJECTED.value];
  }
  return receipt;
}

export default ({ visible = false, orderId, onClose }: any) => {
  const [selectedOrders, setSelectedOrders]: any = useState([]);
  const [entity, setEntity]: any = useState({});
  const [amount, setAmount]: any = useState({});

  const [form] = Form.useForm();
  const updateAmountToPay: any = (orders: any) => {
    let amount = 0;
    orders.forEach((it: any) => {
      amount += it.price;
    });
    return amount;
  }

  const fetchOrderDetail: any = async (orderId: any) => {
    if (!orderId) return;
    const { data: order }: any = await apis.getBOSModule().detail({ orderId });
    const _entity: any = {
      orderId: order?.orderId,
      merchantId: order?.merchantId,
      serialNumber: null,
      urls: [],
      orders: [],
      remark: null
    };

    if (order?.records?.length > 0) {
      const receipt: any = getReceipt(order.records);
      if (receipt) {
        _entity.serialNumber = receipt.tradeId;
        _entity.urls = receipt.urls?.map((filename: any) => {
          return {
            url: apis.getBOSModule().getCredentialImageUrl(filename),
          }
        });
        _entity.id = receipt.credentialsId;
        _entity.remark = receipt.remark;
        setEntity(_entity);
      }
    }
    const resp: any = await apis.getBOSModule().fetchOrdersToAudit({ orderId: order.orderId });
    setSelectedOrders(resp.data || []);
    form.resetFields();
  }

  useEffect(() => {
    fetchOrderDetail(orderId);
  }, [orderId, visible]);

  useEffect(() => {
    const amount: any = updateAmountToPay(selectedOrders);
    setAmount(amount);
  }, [selectedOrders]);

  const payAudit: any = async (formData: any) => {
    const resp: any = await apis.getBOSModule().auditReceipt({
      id: formData.id,
      orderId: orderId,
      remark: formData.auditRemark,
      status: formData.status,
    });
    if (resp?.success) {
      message.success(resp.message);
      onClose(true);
    } else {
      message.error(resp.message);
    }
  }

  return (<div className="payment-audit-dialog">
    <Modal width={700} className="payment-audit-modal"
      maskClosable={false}
      visible={visible} onCancel={() => {
        if (onClose) onClose(false);
      }} footer={null}
      title="审核汇款凭证"
    >
      <PageHeader title="已付款订单" className="block-header" />
      {selectedOrders.length > 0 && <Table
        className="mcd-table related-orders-table"
        scroll={{ x: '100%' }}
        columns={transferAntdTableHeaderArray2Object([
          ['订单号', 'orderId'],
          ['名称', 'orderName', (_: any, order: any) => order.name],
          ['数量/金额（元）', 'price', (_: any, order: any) => {
            return `${order.count} / ${(order.price) / 100}元`;
          }]
        ])}
        rowKey="orderId"
        dataSource={selectedOrders}
        pagination={false} />}
      <Form layout="horizontal"
        form={form}
        labelAlign="right"
        labelCol={{ span: 4 }}
        className="payment-audit-form"
        initialValues={entity}
        onFinish={(values: any) => {
          payAudit(values);
        }}
      >
        <Form.Item hidden={true} name="merchantId" >
          <Input />
        </Form.Item>
        <Form.Item label={$t('汇款总金额')} >
          <span className="amount-to-pay">{(amount || 0) / 100}</span> 元
        </Form.Item>

        {entity.urls?.length > 0 && <Form.Item label={$t('汇款凭证')} name="urls" >
          <PictureWall
            action={apis.getBOSModule().getUploadImageUrl()}
            disabled={true}
          />
        </Form.Item>}
        <Form.Item label={$t('银行流水号')} >
          <div>{entity.serialNumber}</div>
        </Form.Item>
        <Form.Item label={$t('备注')} >
          <div className="ws-normal">{entity.remark}</div>
        </Form.Item>
        <Form.Item name="id" hidden={true}><Input /></Form.Item>
        <Form.Item label={$t('审核备注')} name="auditRemark" >
          <Input.TextArea rows={4} showCount maxLength={500} />
        </Form.Item>
        <Form.Item label={$t('审核状态')} name="status" rules={[{ required: true }]} >
          <Radio.Group>
            <Radio value={constants.btb.order.auditType.PASSED.value}>通过</Radio>
            <Radio value={constants.btb.order.auditType.REJECTED.value}>拒绝</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
      <div className="actions">
        <Button onClick={() => {
          form.submit();
        }} type="primary">审核</Button>
        <Button style={{ marginLeft: 8 }} onClick={() => { onClose(false); }}>取消</Button>
      </div>
    </Modal>
  </div>);
}