import React, { useEffect, useState } from 'react';
import { Form, Modal, Input, message } from '@aurum/pfe-ui';
import * as apis from '@/apps/douyin/common/apis';

import './styles/TaxConfigEditDialog.less';

export default ({ visible = false, data = {}, onClose }: any) => {
  const [entity, setEntity]: any = useState({});
  const [actionName, setActionName]: any = useState('add');
  const [form] = Form.useForm();

  useEffect(() => {
    if (data?.skuId) {
      setActionName('update');
    } else {
      setActionName('add');
    }
    if (data) setEntity(JSON.parse(JSON.stringify(data)));
  }, [data])

  useEffect(() => {
    form.resetFields();
  }, [entity]);

  return (<div className="tax-config-edit-container">
    <Modal width={550}
      className="tax-config-edit-dialog"
      maskClosable={false}
      visible={visible}
      onCancel={() => {
        if (onClose) onClose(false);
      }}
      onOk={() => {
        form.submit();
      }}
      title={`商品税率配置`}

    >
      <Form layout="vertical"
        form={form}
        labelAlign="right"
        className="edit-form"
        initialValues={entity}
        onFinish={async (values: any) => {
          let resp: any;
          if (actionName === 'add') {
            resp = await apis.getJimiaoModule().taxConfigAdd(values);
          } else {
            resp = await apis.getJimiaoModule().taxConfigUpdate({ ...values, skuId: entity.skuId });
          }
          if (!resp.success) {
            message.error(resp.message);
          } else {
            if (resp.data.success) {
              if (onClose) onClose(true);
            } else {
              message.error(resp.data.msg);
            }
          }
        }}
      >
        {(actionName === 'add') ?
          <Form.Item label={$t('商品编号')} name="skuId" rules={[{ required: true }]}>
            <Input maxLength={30} />
          </Form.Item>
          :
          <Form.Item label={$t('商品编号')} >
            {entity.skuId}
          </Form.Item>
        }
        <Form.Item label={$t('商品名称')} name="skuName" rules={[{ required: true }]}>
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item label={$t('税率Tax Id')} name="taxId" rules={[{ required: true }]}>
          <Input maxLength={10} />
        </Form.Item>
        <Form.Item label={$t('备注')} name="memo" rules={[{ required: true }]}>
          <Input.TextArea rows={4} maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  </div>);
}