import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Drawer,
  message,
  Select,
  AutoComplete,
} from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis'
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
const { getEntityColumnOptions } = common.helpers;

export default ({ visible = false, merchantId, record, onClose }: any) => {
  const [form] = Form.useForm();
  const [entity, setEntity]: any = useState({});
  const [usernames, setUsernames]: any = useState([]);

  useEffect(() => {
    if (visible) {
      const entity: any = record || {};
      entity.merchantId = merchantId;
      setEntity(entity);
    }
    return () => {
      setEntity(null);
    }
  }, [record, merchantId, visible]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const save = async (formData: any) => {
    let method: any = apis.getBMSModule().addContact;
    if (formData.id) {
      method = apis.getBMSModule().updateContact;
    }
    formData.cooperationType = parseInt(formData.cooperationType)
    formData.userId = parseInt(formData.userId)
    const resp: any = await method(formData);
    message.destroy();
    if (resp?.success) {
      message.success('保存成功');
      onClose(true);
    } else {
      message.error(resp.message || '保存失败');
    }
  }


  const onUsernameSelect: any = (value: any) => {
    const selectedUsers: any = usernames.filter((item: any) => item.value === value);
    if (selectedUsers[0]) {
      form.setFieldsValue({
        username: selectedUsers?.[0].label.split('(')[0],
        userId: value
      })
    }
  }

  let timer: any;
  const onUsernameSearch: any = async (searchValue: any) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      (async () => {
        const resp: any = await apis.getXmenModule().queryEmployeesByName(searchValue);
        const usernames: any = resp.data?.map((item: any) => ({
          value: item.employeeNumber,
          label: `${item.chineseName}(${item.englishName})@${item.organizationName}`,
        }));
        setUsernames(usernames);
      })();
    }, 500)
  }

  return (<div className="edit-container">
    <Drawer
      forceRender
      title="联系人管理"
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
          save(values);
        }}
      >
        <Form.Item style={{ display: 'none' }} hidden={true} name="id" >
          <Input />
        </Form.Item>
        <Form.Item style={{ display: 'none' }} hidden={true} name="merchantId" >
          <Input />
        </Form.Item>
        <Form.Item label={$t('业务类型')} name="cooperationType" rules={[{ required: true, message: '请选择业务类型' }]}>
          <Select options={getEntityColumnOptions(constants.btb.merchantAudit.cooperationType)} placeholder="请选择业务类型" />
        </Form.Item>
        <Form.Item label={$t('角色类型')} name="type" rules={[{ required: true, message: '请选择角色类型' }]}>
          <Select options={getEntityColumnOptions(constants.btb.merchant.contactType)} placeholder="请选择角色类型" />
        </Form.Item>
        <Form.Item label={$t('姓名')} name="username" rules={[{ required: true }]}>
          <AutoComplete
            options={usernames}
            onSelect={onUsernameSelect}
            onSearch={onUsernameSearch}
          />
        </Form.Item>
        <Form.Item label={$t('工号')} name="userId" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={$t('手机号')} name="phone">
          <Input maxLength={11} />
        </Form.Item>
        <Form.Item label={$t('邮箱')} name="mail" rules={[{ type: 'email' }]}>
          <Input />
        </Form.Item>
      </Form>
    </Drawer>
  </div >);
}