import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Select, Radio } from '@aurum/pfe-ui';
// import { PictureWall } from '@omc/boss-widgets';
import PictureWall from '@/compoments/picture-wall/PictureWall';
import * as apis from '@/apps/openapi/common/apis'
import * as helper from '@/apps/openapi/common/helper';

const fetchSingleRecord: any = async (id: any) => {
  let result: any = {};
  const resp: any = await apis.getAppModule().detail({ id });
  if (resp?.code === 'SUCCESS') {
    result = resp.data;
    result.groupIds = Array.from(new Set(result.groupIds));
  }
  return result;
}

export default ({ visible = false, recordId, dataSource = null, isDuplicated = false, isAudit = false, onClose }: any) => {
  const [form] = Form.useForm();
  const [record, setRecord]: any = useState({});
  const [merchantOptions, setMerchantOptions]: any = useState([]);
  const [apiGroupOptions, setApiGroupOptions]: any = useState([]);
  const [actionFNName, setActionFNName]: any = useState(null);

  useEffect(() => {
    (async () => {
      setMerchantOptions(await helper.getMerchantOptions('merchantId'));
      const { data }: any = await apis.getApiGroupModule().list({ pageIndex: 1, pageSize: 100 });
      const options: any = data.rows?.map((item: any) => {
        return {
          value: item.id,
          label: item.groupName,
        }
      });
      setApiGroupOptions(options);
    })();
  }, []);

  useEffect(() => {
    if (dataSource) {
      const _record: any = { ...dataSource };
      if (isDuplicated) delete _record.id;
      setRecord(_record);
    }
    return () => {
      setRecord({});
    }
  }, [dataSource, isDuplicated]);

  useEffect(() => {
    if (recordId) {
      (async () => {
        const _record: any = await fetchSingleRecord(recordId)
        if (isDuplicated) delete _record.id;
        setRecord(_record);
      })();
    }
    return () => {
      setRecord({});
    }
  }, [recordId, isDuplicated]);

  useEffect(() => {
    if (visible === false) setRecord({});
  }, [visible]);

  useEffect(() => {
    if (record) form.resetFields();
  }, [record]);

  useEffect(() => {
    if (actionFNName) form.submit();
  }, [actionFNName]);

  const save = async (formData: any) => {
    if (actionFNName === 'actionSave') {
      const resp: any = await apis.getAppModule().save(formData);
      if (resp?.code === 'SUCCESS') {
        message.success('存储成功');
        onClose(true);
      } else {
        message.error(resp.msg || '存储失败');
      }
    } else if (actionFNName === 'actionPass') {
      formData.verifyDescription = formData.auditRemark;
      delete formData.auditRemark;
      const resp: any = await apis.getAppModule().approve(formData);
      if (resp?.code === 'SUCCESS') {
        message.success('通过审核');
        onClose(true);
      } else {
        message.error(resp.msg || '操作失败');
      }
    } else if (actionFNName === 'actionReject') {
      formData.rejectDescription = formData.auditRemark;
      delete formData.auditRemark;
      const resp: any = await apis.getAppModule().reject(formData);
      if (resp?.code === 'SUCCESS') {
        message.success('驳回申请');
        onClose(true);
      } else {
        message.error(resp.msg || '操作失败');
      }
    }
    setActionFNName(null);
  }

  return (<div className="edit-container">
    <Drawer
      forceRender
      title={record.id ? `应用编辑` : `应用新增`}
      width={500}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right', }}>
          {!isAudit ? <>
            <Button style={{ marginRight: 8 }} onClick={() => { onClose(false); }}>取消</Button>
            <Button onClick={() => {
              // form.submit();
              setActionFNName('actionSave')
            }} type="primary">存储</Button>
          </>
            : <>
              <Button style={{ marginRight: 8 }} onClick={() => {
                setActionFNName('actionReject');
              }}>驳回</Button>
              <Button onClick={() => {
                setActionFNName('actionPass');
              }} type="primary">审核通过</Button>
            </>}
        </div>
      }
    >
      <Form 
        layout="vertical"
        form={form}
        labelAlign="right"
        className="edit-form"
        initialValues={record}
        onFinish={(values: any) => {
          save({ ...values });
        }}
        onFinishFailed={(values: any) => {
          setActionFNName(null)
        }}
      >
        <Form.Item style={{ display: 'none' }} hidden={true} name="id" >
          <Input />
        </Form.Item>
        {record.id && <Form.Item label={$t('应用编号')} name="appId" rules={[{ required: true }]} >
          <Input maxLength={32} disabled />
        </Form.Item>}
        <Form.Item label={$t('商户名称')} name="merchantId" rules={[{ required: true }]} >
          <Select options={merchantOptions} placeholder="请选择商户" disabled={record.id ? true : false} />
        </Form.Item>
        <Form.Item label={$t('应用名称')} name="appName" rules={[{ required: true }]} >
          <Input maxLength={15} placeholder="应用名称需与使用场景有关" />
        </Form.Item>
        <Form.Item label={$t('应用描述')} name="description" rules={[{ required: true }]} help="限制 512*512 px，300kb 以内，建议使用 PNG 透底图片" >
          <Input.TextArea maxLength={140} rows={5} placeholder="应用描述需与使用场景有关" />
        </Form.Item>
        <Form.Item label={$t('应用图标')} name="icon" >
          <PictureWall
            action={apis.getBOSModule().getUploadImageUrlWithoutSign()}
            maxBytes={300 * 1024}
            allowedMimes={['png', 'jpg', 'jpeg']}
          />
        </Form.Item>
        <Form.Item label={$t('申请原因')} name="applyReason" rules={[{ required: true }]} >
          <Input.TextArea maxLength={500} rows={5} placeholder="请描述使用场景" />
        </Form.Item>
        <Form.Item name="groupIds" label="订阅接口" rules={[{ required: true, message: '请选择订阅接口' }]}>
          <Select placeholder="请选择订阅接口" mode="multiple" options={apiGroupOptions} />
        </Form.Item>
        {<Form.Item label={$t('签名方式')} name="paramKey" rules={[{ required: true, message: '请选择签名方式' }]}>
          <Select options={[
            { value: 'MD5_KEY', label: 'MD5' },
            { value: 'CHINA_ALGORITHM', label: 'CHINA_ALGORITHM(国密)' },
          ]} />
        </Form.Item>}
        <Form.Item label={$t('OAuth')} name="skipToken" rules={[{ required: true }]}>
          <Radio.Group options={[
            { value: 0, label: '是' },
            { value: 1, label: '否' }
          ]}></Radio.Group>
        </Form.Item>
        {record.id && <Form.Item label={$t('Sign Key')} name="key" >
          <Input disabled />
        </Form.Item>}
        {/* <Form.Item label={$t('备注')} name="description" rules={[{ required: true }]} >
          <Input.TextArea rows={5} maxLength={200} />
        </Form.Item> */}
        {isAudit && <Form.Item label={$t('审核备注')} name="auditRemark" rules={[{ required: true }]} >
          <Input.TextArea rows={5} maxLength={500} placeholder="请填写审核备注" />
        </Form.Item>}
      </Form>
    </Drawer>
  </div>);
}