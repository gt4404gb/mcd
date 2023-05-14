import React, { useState, useEffect } from 'react';
import { Form, Select, Button, Modal, message, Alert } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis'
import './styles/OrderCancelDialog.less';

export default ({ visible = false, orderId, onClose }: any) => {
  const [form] = Form.useForm();
  const [entity, setEntity]: any = useState({});
  const [options, setOptions]: any = useState([]);
  const [cancelLoading, setCancelLoading]: any = useState(false);

  const getCancelReason: any = async (orderId: any) => {
    if (!orderId) return;
    const resp: any = await apis.getBOSModule().getOrderCancelReason(orderId);
    if (!resp.success) {
      resp.data = {
        cancelReasons: [],
        desc: resp.message,
        flag: false,
      }
    }
    if (resp.data) {
      resp.data.cancelReasons = resp.data.cancelReasons || [];
      const _options: any = resp.data.cancelReasons.map((it: any) => {
        return {
          value: it,
          label: it,
        }
      })
      setOptions(_options);
      setEntity({ ...resp.data, orderId });
    }
  }

  useEffect(() => {
    getCancelReason(orderId);
  }, [orderId, visible]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const cancelOrder: any = async (formData: any) => {
    setCancelLoading(true);
    const resp: any = await apis.getBOSModule().cancelOrder(orderId, {
      cancelReason: formData.cancelReason,
    });
    setCancelLoading(false);
    if (resp?.success) {
      message.success('成功取消订单' || resp.message);
      onClose(true);
    } else {
      message.error(resp.message);
    }
  }

  return (<div className="order-cancel-dialog">
    <Modal width={500} className="order-cancel-modal"
      maskClosable={false}
      visible={visible}
      title="取消订单"
      onCancel={() => {
        if (onClose) onClose(false);
      }}
      footer={[
        <Button key="close" onClick={() => { if (onClose) onClose(false); }}>关闭</Button>,
        <Button key="confirm" type="primary"
          hidden={entity.flag ? false : true}
          disabled={cancelLoading}
          onClick={() => {
            if (entity.flag) {
              if (!cancelLoading) form.submit();
            } else {
              if (onClose) onClose(false);
            }
          }}>确定取消{cancelLoading ? '...': ''}</Button>
      ]}
    >
      {entity.flag && <Alert message="注：当前订单非在线支付，不会退款。" type="warning" />}
      {entity.flag ? <Form layout="horizontal"
        form={form}
        labelAlign="right"
        labelCol={{ span: 4 }}
        className="order-cancel-form"
        initialValues={entity}
        onFinish={(values: any) => {
          cancelOrder(values);
        }}
      >
        <Form.Item label={$t('订单编号')}>
          {entity.orderId}
        </Form.Item>
        <Form.Item label={$t('取消原因')} name="cancelReason" rules={[{ required: true }]}>
          <Select options={options} placeholder="请选择取消原因" />
        </Form.Item>
        <Form.Item label={$t('退款金额')} >
          {entity.showPrice || 0}元
        </Form.Item>
        <Form.Item label={$t('退款说明')} >
          <div className="refund-info" dangerouslySetInnerHTML={{ __html: entity.desc }} />
        </Form.Item>
      </Form> :
        <div className="message-wrapper">
          <div className="refund-info" dangerouslySetInnerHTML={{ __html: entity.desc }} />
        </div>
      }
    </Modal>
  </div>);
}