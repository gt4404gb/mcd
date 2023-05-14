import React, { useState, useEffect } from 'react';
import { Table, Form, Input, Button, Modal, message, PageHeader, Alert } from '@aurum/pfe-ui';
// import { PictureWall } from '@omc/boss-widgets';
import PictureWall from '@/compoments/picture-wall/PictureWall';
import * as apis from '@/apps/btb/common/apis';
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import RelatedOrdersSelector from '../libs/RelatedOrdersSelector';
import './styles/PaymentDialog.less';

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
  const [form] = Form.useForm();
  const [orderSelectorVisible, setOrderSelectorVisible]: any = useState(false);
  const [selectedOrders, setSelectedOrders]: any = useState([]);

  const [entity, setEntity]: any = useState({});
  let actionMethod: any;

  const fetchOrderDetail: any = async (orderId: any) => {
    if (!orderId) return;
    const { data: order }: any = await apis.getBOSModule().detail({ orderId });
    const _entity: any = {
      orderId: order?.orderId,
      amount: order?.actualPrice,
      merchantName: order?.merchantName,
      merchantId: order?.merchantId,

      serialNumber: null,
      urls: [],
      orders: [],
      remark: null
    };

    setEntity(_entity);
    order.orderGoods = order.goods;
    order.orderGoods[0].spuName = order.orderGoods[0].name;
    order.settlePrice = order.actualPrice;
    setSelectedOrders([order]);
  }

  const updateAmountToPay: any = (orders: any) => {
    const entity: any = {};
    entity.amount = 0;
    entity.orders = orders.map((it: any) => {
      entity.amount += it.settlePrice;
      return {
        orderId: it.orderId,
        amount: it.settlePrice,
      }
    });
    return entity;
  }

  const applyPayAudit: any = async (formData: any) => {
    formData.urls = formData.urls.map((urlObj: any) => urlObj.filename);
    formData.orders = entity.orders;
    formData.merchantId = entity.merchantId;
    const resp: any = await apis.getBOSModule().submitReceipt(formData);
    if (resp?.success) {
      message.success('提交成功，请等待财务审核' || resp.message);
      onClose(true);
    } else {
      message.error(resp.message);
    }
  }

  useEffect(() => {
    fetchOrderDetail(orderId);
  }, [orderId, visible]);

  useEffect(() => {
    if (visible) {
      if (entity) {
        form.resetFields();
      }
    }
  }, [entity, visible]);

  useEffect(() => {
    const data: any = updateAmountToPay(selectedOrders);
    setEntity({ ...entity, ...data });
  }, [selectedOrders]);

  return (<div className="payment-dialog">
    <Modal width={700} className="payment-modal"
      maskClosable={false}
      visible={visible} onCancel={() => {
        if (onClose) onClose(false);
      }} footer={null}
      title="上传汇款凭证"
    >
      {orderSelectorVisible && <RelatedOrdersSelector visible={orderSelectorVisible}
        selectedItemIds={selectedOrders.map((it: any) => it.orderId)}
        title="待支付订单"
        searchConds={{
          merchantId: entity.merchantId,
          status: constants.btb.order.status.NOT_PAID.value,
        }}
        onClose={(selectedItems: any) => {
          setSelectedOrders([...selectedOrders, ...selectedItems]);
          setOrderSelectorVisible(false)
        }} />}
      <Alert message="如汇款对应多个订单，可选择关联多个订单号，一并发起汇款支付审核。" type="warning" />
      {selectedOrders.length < 10 && <PageHeader
        title="付款订单"
        className="block-header"
        extra={[
          <Button key="btn-add-order" type="link" onClick={() => {
            setOrderSelectorVisible(true);
          }}>添加订单</Button>
        ]}
      />}
      {selectedOrders.length > 0 && <Table
        className="mcd-table related-orders-table"
        scroll={{ x: '100%' }}
        columns={transferAntdTableHeaderArray2Object([
          ['订单号', 'orderId'],
          ['名称', 'orderName', (_: any, order: any) => order.orderGoods[0].spuName],
          ['数量/金额（元）', 'settlePrice', (settlePrice: any, order: any) => {
            const goods: any = order.orderGoods[0];
            return `${goods.count} / ${settlePrice / 100}元`;
          }],
          ['操作', 'orderId', (orderId: any) => {
            if (orderId === entity.orderId) return null;
            return <Button type="link" onClick={() => {
              setSelectedOrders(selectedOrders.filter((it: any) => it.orderId !== orderId));
            }} >移除</Button>
          }]
        ])}
        rowKey="orderId"
        dataSource={selectedOrders}
        pagination={false} />}
      <Form layout="horizontal"
        form={form}
        labelAlign="right"
        labelCol={{ span: 4 }}
        className="payment-form"
        initialValues={entity}
        onFinish={(values: any) => {
          actionMethod(values);
        }}
      >
        <Form.Item label={$t('汇款总金额')} >
          <span className="amount-to-pay">{(entity.amount || 0) / 100}</span> 元
        </Form.Item>
        <Form.Item label={$t('汇款凭证')} name="urls" rules={[{ required: true, message: '请上传真实有效的凭证' }]} extra={<div className="tip">仅支持jpg/png格式，文件不可超过10M！</div>}>
          <PictureWall
            action={apis.getBOSModule().getUploadImageUrl()}
            maxLength={5}
            maxBytes={10 * 1024 * 1024}
            allowedMimes={['png', 'jpg', 'jpeg']}
            onUploaded={(files: any) => {
              files.forEach((file: any) => {
                file.url = apis.getBOSModule().getCredentialImageUrl(file.filename);
              });
            }}
          />
        </Form.Item>
        <Form.Item label={$t('银行流水号')} name="serialNumber" rules={[{ required: true }]} >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item label={$t('备注')} name="remark" >
          <Input.TextArea rows={4} showCount maxLength={300} />
        </Form.Item>
      </Form>
      <div className="actions">
        <Button onClick={() => {
          actionMethod = applyPayAudit
          form.submit();
        }} type="primary">提交审核</Button>
        <Button style={{ marginLeft: 8 }} onClick={() => { onClose(false); }}>取消</Button>
      </div>
    </Modal>
  </div>);
}