import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, message } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis'
import './styles/CommentDialog.less';

export default ({ visible = false, orderId, onClose }: any) => {
  const [form] = Form.useForm();
  const [entity, setEntity]: any = useState({
    orderId,
    remark: null,
  });
  const actionAddComment: any = async (formData: any) => {
    const resp: any = await apis.getBOSModule().orderRemarkAdd(formData);
    if (resp?.success) {
      message.success('成功添加备注' || resp.message);
      onClose(true);
    } else {
      message.error(resp.message);
    }
  }

  useEffect(() => {
    if (visible) {
      if (entity) {
        form.resetFields();
      }
    }
  }, [entity, visible]);

  useEffect(() => {
    entity.orderId = orderId;
    setEntity({...entity});
  }, [orderId]);

  return (<div className="comment-dialog">
    <Modal width={700} className="comment-modal"
      maskClosable={false}
      visible={visible} onCancel={() => {
        if (onClose) onClose(false);
      }} footer={null}
      title="添加备注"
    >
      <Form layout="vertical"
        form={form}
        className="comment-form"
        initialValues={entity}
        onFinish={(values: any) => {
          actionAddComment(values);
        }}
      >
        <Form.Item hidden={true} name="orderId">
          <Input />
        </Form.Item>
        <Form.Item label="" name="remark" >
          <Input.TextArea rows={6} showCount maxLength={300} />
        </Form.Item>
        <div className="actions">
          <Button htmlType="submit" type="primary">确定</Button>
          <Button style={{ marginLeft: 8 }} onClick={() => { onClose(false); }}>取消</Button>
        </div>
      </Form>
    </Modal>
  </div>);
}