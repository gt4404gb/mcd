import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Checkbox, Radio, Select } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis'
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
const { getEntityColumnOptions } = common.helpers;

export default ({ visible = false, record, onClose }: any) => {
  const [form] = Form.useForm();
  const [entity, setEntity]: any = useState({});

  useEffect(() => {
    if (record) {
      const r: any = { ...record }
      r.refuseType = 1;
      r.approvalStatus = null;
      setEntity(r);
    }
    return () => {
      setEntity(null);
    }
  }, [record]);

  useEffect(() => {
    if (visible === false) setEntity({});
  }, [visible]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const audit = async (formData: any) => {
    const resp: any = await apis.getBMSModule().accessCheck({
      approvalDesc: formData.approvalDesc,
      approvalStatus: formData.approvalStatus,
      id: formData.id,
      refuseType: formData.refuseType,
    });
    if (resp?.success) {
      message.success('审核完成');
      onClose(true);
    } else {
      message.error(resp.message || '审核失败');
    }
  }

  return (<div className="edit-container">
    <Drawer
      forceRender
      title="准入审核"
      width={500}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right', }}>
          <Button style={{ marginRight: 8 }} onClick={() => { onClose(false); }}>取消</Button>
          <Button onClick={() => form.submit()} type="primary">保存</Button>
        </div>
      }
    >
      <Form
        layout="vertical"
        form={form}
        labelAlign="right"
        className="edit-form"
        initialValues={entity}
        onFinish={(values: any) => {
          audit(values);
        }}
        onValuesChange={(chgValues: any, values: any) => {
          if (chgValues.approvalStatus !== undefined) {
            setEntity(values);
          }
        }}
      >
        <Form.Item style={{ display: 'none' }} hidden={true} name="id" >
          <Input />
        </Form.Item>
        <Form.Item label={$t('企业名称')} name="companyName" rules={[{ required: true }]}>
          <Input maxLength={100} placeholder="请输入企业名称" disabled />
        </Form.Item>
        <Form.Item label={$t('联系人')} name="name" rules={[{ required: true }]} >
          <Input maxLength={50} placeholder="请输入联系人" disabled />
        </Form.Item>
        <Form.Item label={$t('合作类型')} name="cooperationType" rules={[{ required: true }]} >
          <Checkbox.Group options={getEntityColumnOptions(constants.btb.merchantAudit.cooperationType)} disabled />
        </Form.Item>
        <Form.Item label={$t('合作意向')} name="cooperationIntention" >
          <Input.TextArea rows={4} maxLength={1000} disabled />
        </Form.Item>
        <Form.Item label={$t('审核结果')} name="approvalStatus" rules={[{ required: true }]} >
          <Radio.Group options={getEntityColumnOptions(constants.btb.merchantAudit.approvalStatus).filter((item: any) => item.value != 0)} />
        </Form.Item>
        {
          entity['approvalStatus'] === constants.btb.merchantAudit.approvalStatus.REJECTED.value &&
          <Form.Item label={$t('驳回类型')} name="refuseType" rules={[{ required: true }]} >
            <Select options={getEntityColumnOptions(constants.btb.merchantAudit.refuseType)} placeholder="请说明驳回类型" />
          </Form.Item>
        }
        <Form.Item label={$t('审核备注')} name="approvalDesc" >
          <Input.TextArea rows={4} maxLength={3000} showCount/>
        </Form.Item>
      </Form>
    </Drawer>
  </div>);
}