import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Radio, InputNumber } from '@aurum/pfe-ui';
import * as apis from '@/apps/openapi/common/apis'
import EmployeeChooser from '../lib/EmployeeChooser';

export default ({ visible = false, dataSource = null, onClose }: any) => {
  const [form] = Form.useForm();
  const [record, setRecord]: any = useState({
    seqNo: 1,
    userInfo: {
      chineseNames: null,
      employeenumbers: null,
    }
  });

  useEffect(() => {
    if (dataSource) {
      setRecord({
        ...dataSource,
        userInfo: {
          employeenumbers: dataSource.employeeNumbers,
          chineseNames: dataSource.allEmployeeNumberAndNames,
        }
      });
    }
  }, [dataSource]);

  useEffect(() => {
    if (record) form.resetFields();
  }, [record]);

  const save = async (formData: any) => {
    const resp: any = await apis.getApiGroupModule().save({
      ...formData,
      employeeNumbers: formData.userInfo.employeenumbers,
      allEmployeeNumberAndNames: formData.userInfo.chineseNames
    });
    if (resp?.code === 'SUCCESS') {
      message.success('存储成功');
      onClose(true);
    } else {
      message.error(resp.msg || '存储失败');
    }
  }

  return (<div className="edit-container">
    <Drawer
      forceRender
      title="分组编辑"
      width={500}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'left', }}>
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
        <Form.Item label={$t('序号')} name="seqNo" rules={[{ required: true }]} >
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item label={$t('分组名称')} name="apiGroupName" rules={[{ required: true }]} >
          <Input maxLength={45} placeholder="限45个中文字符" />
        </Form.Item>
        <Form.Item label={$t('备注')} name="description" rules={[{ required: true }]} >
          <Input.TextArea maxLength={200} />
        </Form.Item>
        <Form.Item label={$t('对客展示')} name="showMerchant" rules={[{ required: true }]} >
          <Radio.Group>
            <Radio value={1}>是</Radio>
            <Radio value={0}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label={$t('分组负责人')} name="userInfo" >
          <EmployeeChooser />
        </Form.Item>
      </Form>
    </Drawer>
  </div>);
}