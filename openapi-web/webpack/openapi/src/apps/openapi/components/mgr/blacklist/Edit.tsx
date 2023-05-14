import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Checkbox, Radio, Select, InputNumber } from '@aurum/pfe-ui';
import * as apis from '@/apps/openapi/common/apis'

export default ({ visible = false, record, onClose }: any) => {
  const [form] = Form.useForm();
  const [entity, setEntity]: any = useState({});

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  useEffect(() => {
    if (record) {
      setEntity({ ...record });
    }
    return () => {
      setEntity({});
    }
  }, [record]);

  const save: any = async (formData: any) => {
    const ipRows: any = formData.ip.split("\n");
    const ips: any = [];
    ipRows.forEach((row: any) => {
      const [startIp, endIp] = row.split(':');
      if (startIp) {
        ips.push({
          startIp,
          endIp: endIp || startIp,
          blackOrWhite: 0,
        })
      }
    });
    const resp: any = await apis.getCoreMgrModule().ipBatchAdd(ips);
    if (resp?.code === 'SUCCESS') {
      message.success('添加成功');
      onClose(true);
    } else {
      message.error(resp.message || '添加失败');
    }
  }

  return (<div className="edit-container">
    <Drawer
      forceRender
      maskClosable={false}
      title="黑名单配置"
      width={500}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right', }}>
          <Button style={{ marginRight: 8 }} onClick={() => { onClose(false); }}>取消</Button>
          <Button onClick={() => form.submit()} type="primary">添加</Button>
        </div>
      }
    >
      <Form layout="horizontal"
        form={form}
        labelAlign="right"
        labelCol={{ span: 5 }}
        className="edit-form"
        initialValues={entity}
        onFinish={(values: any) => {
          save(values);
        }}
      >
        <Form.Item hidden={true} name="id" >
          <Input />
        </Form.Item>
        <Form.Item name="ip" rules={[{ required: true }]}>
          <Input.TextArea
            placeholder={`请输入IP地址，多个请换行，示例：\n192.168.31.1\n192.168.2.10:192.168.2.90`}
            rows={15}
          />
        </Form.Item>
      </Form>
    </Drawer>
  </div>);
}