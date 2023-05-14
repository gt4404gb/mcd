import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Select } from '@aurum/pfe-ui';
import * as apis from '@/apps/openapi/common/apis'
import WIPList from './WIPList';

export default ({ visible = false, app, onClose }: any) => {
  const [form] = Form.useForm();
  const [ipList, setIPList]: any = useState({});
  const [entity, setEntity]: any = useState({});
  const [searchObj, setSearchObj]: any = useState({
    blackOrWhite: 1,
    currentPage: 1,
    pageSize: 10,
  });

  const fetchWipList: any = async (searchObj: any) => {
    let result: any = {};
    const resp: any = await apis.getCoreMgrModule().ipList(searchObj);
    if (resp?.code === 'SUCCESS') {
      result = resp.data;
    }
    return result;
  }


  useEffect(() => {
    if (app) {
      setEntity({
        appId: app.appId,
        appName: app.appName,
      });
      setSearchObj({
        ...searchObj,
        appId: app.appId,
        pageIndex: searchObj.currentPage,
      })
    }
    return () => {
      setIPList([]);
    }
  }, [app]);


  useEffect(() => {
    (async () => {
      if (visible) {
        setIPList(await fetchWipList({ ...searchObj, appId: app.appId}));
      }
    })();
  }, [searchObj, visible]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const save = async (formData: any) => {
    const ipRows: any = formData.ip.split("\n");
    const ips: any = [];
    ipRows.forEach((row: any) => {
      const [startIp, endIp] = row.split(':');
      if (startIp) {
        ips.push({
          startIp,
          endIp: endIp || startIp,
          blackOrWhite: 1,
          appId: formData.appId,
        })
      }
    });

    if (!ips[0]) return;
    const resp: any = await apis.getCoreMgrModule().ipBatchAdd(ips);
    if (resp?.code === 'SUCCESS') {
      message.success('添加成功');
      onClose(true);
    } else {
      message.error(resp.msg || '添加失败');
    }
  }

  return (<div className="edit-container">
    <Drawer
      forceRender
      maskClosable={false}
      title="应用IP白名单"
      width={500}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right', }}>
          <Button style={{ marginRight: 8 }} onClick={() => { onClose(false); }}>取消</Button>
          <Button onClick={() => { form.submit(); }} type="primary">添加</Button>
        </div>
      }
    >
      <Form layout="vertical"
        form={form}
        labelAlign="right"
        className="edit-form"
        initialValues={entity}
        onFinish={(values: any) => {
          save({ ...values });
        }}
      >
        <Form.Item label={$t('应用编号')} name="appId" rules={[{ required: true }]} >
          <Input maxLength={32} disabled />
        </Form.Item>
        <Form.Item label={$t('应用名称')} name="appName" rules={[{ required: true }]} >
          <Input maxLength={15} disabled />
        </Form.Item>
        <Form.Item label={$t('批量添加')} name="ip" rules={[{ required: true }]} >
          <Input.TextArea
            placeholder={`请输入IP地址，多个请换行，示例：\n192.168.31.1\n192.168.2.100:192.168.2.199`}
            rows={10} />
        </Form.Item>
      </Form>

      <WIPList dataSource={ipList} searchObj={searchObj} onSearch={(search: any) => {
        setSearchObj({
          ...searchObj,
          pageIndex: search.currentPage,
          pageSize: search.pageSize,
        })
      }} />
    </Drawer>
  </div>);
}