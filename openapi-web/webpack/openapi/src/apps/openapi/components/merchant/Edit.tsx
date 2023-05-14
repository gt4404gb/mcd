import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Select, Popconfirm } from '@aurum/pfe-ui';
import * as apis from '@/apps/openapi/common/apis'

const fetchSingleRecord: any = async (id: any) => {
  let rows: any = [];
  const resp: any = await apis.getMerchantModule().detail({ id });
  if (resp?.code === 'SUCCESS') {
    rows = resp.data;
  }
  return rows;
}

export default ({ visible = false, recordId, dataSource = null, onClose }: any) => {
  const [form] = Form.useForm();
  const [record, setRecord]: any = useState({});

  useEffect(() => {
    if (dataSource) setRecord(dataSource);
    return () => {
      setRecord(null);
    }
  }, [dataSource]);

  useEffect(() => {
    if (recordId) {
      (async () => {
        setRecord(await fetchSingleRecord(recordId));
      })();
    }
    return () => {
      setRecord(null);
    }
  }, [recordId]);

  useEffect(() => {
    if (visible === false) setRecord({});
  }, [visible]);

  useEffect(() => {
    if (record) form.resetFields();
  }, [record]);

  const save = async (formData: any) => {
    const resp: any = await apis.getMerchantModule().save(formData);
    if (resp?.code === 'SUCCESS') {
      message.success('存储成功');
      onClose(true);
    } else {
      message.error(resp.message || '存储失败');
    }
  }

  return (<div className="edit-container">
    <Drawer
      forceRender
      title="商户编辑"
      width={500}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right', }}>
          <Button style={{ marginRight: 8 }} onClick={() => { onClose(false); }}>取消</Button>
          <Button onClick={() => form.submit()} type="primary">存储</Button>
        </div>
      }
    >
      <Form layout="vertical"
        form={form}
        labelAlign="right"
        className="edit-form"
        initialValues={record}
        onFinish={(values: any) => {
          save(values);
        }}
      >
        <Form.Item style={{ display: 'none' }} hidden={true} name="id" >
          <Input />
        </Form.Item>
        <Form.Item label={$t('商户类型')} name="merchantType" rules={[{ required: true }]} >
          <Select options={[
            { value: 1, label: '麦中服务商' },
            { value: 2, label: '同业销售' },
            { value: 3, label: '异业合作' },
          ]} placeholder="请选择商户类型" />
        </Form.Item>
        <Form.Item label={$t('商户名称')} name="merchantName" rules={[{ required: true }]} >
          <Input maxLength={255} placeholder="限255个中文字符" />
        </Form.Item>
        {record?.id && <>
          <Form.Item label={$t('商户ID')} name="merchantId" >
            <Input disabled />
          </Form.Item>
        </>}
        <Form.Item label={$t('备注')} name="description" >
          <Input.TextArea rows={4} maxLength={200} />
        </Form.Item>
      </Form>
    </Drawer>
  </div>);
}