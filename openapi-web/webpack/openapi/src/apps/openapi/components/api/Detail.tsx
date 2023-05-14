import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Select, InputNumber } from '@aurum/pfe-ui';
import * as apis from '@/apps/openapi/common/apis'
import common from '@omc/common';
import constants from '@/apps/openapi/common/constants';
import * as helper from '@/apps/openapi/common/helper';
import config from '@/common/config/config';

const { getEntityColumnOptions } = common.helpers;

const defaultApi: any = {
  skipVerify: 0,
  requestMethod: 'GET',
};

const fetchSingleRecord: any = async (id: any) => {
  let result: any = null;
  const resp: any = await apis.getApiModule().detail({ id });
  if (resp?.code === 'SUCCESS') result = resp.data;
  return result;
}

export default ({ visible = false, recordId, isAudit = false, onClose }: any) => {
  const [form] = Form.useForm();
  const [record, setRecord]: any = useState({ ...defaultApi });
  const [apiGroupOptions, setApiGroupOptions]: any = useState([]);
  const [importSwaggerJson, setImportSwaggerJson]: any = useState(null);
  const [checkedApiNodes, setCheckedApiNodes]: any = useState([]);

  useEffect(() => {
    (async () => {
      setApiGroupOptions(await helper.getApiGroupOptions());
    })();
  }, []);


  useEffect(() => {
    if (recordId) {
      (async () => {
        const result: any = await fetchSingleRecord(recordId);
        try {
          const respObj: any = JSON.parse(result['responses']);
          if (respObj?.['200']?.['examples']?.['application/json']) {
            result.examples = JSON.stringify(respObj['200']['examples']['application/json'], null, 4);
          }
        } catch (e: any) {
          console.error(e)
        }
        setRecord(result);
      })();
    }

    return () => {
      // setYapiProjectId(null)
      setRecord({});
    }
  }, [recordId]);

  useEffect(() => {
    if (record) form.resetFields();
  }, [record]);

  useEffect(() => {
    if (checkedApiNodes[0]) {
      const [path, method]: any = checkedApiNodes[0];
      const apiObj: any = importSwaggerJson.paths[path][method];
      if (apiObj.description) record.description = apiObj.description;
      if (apiObj.parameters) record.parameters = JSON.stringify(apiObj.parameters, null, 4);
      if (apiObj.responses) record.responses = JSON.stringify(apiObj.responses, null, 4);

      record.requestMethod = method.toUpperCase();
      if (!record.id) {
        record.path = record.targetPath = path;
        if (apiObj.summary) record.apiName = apiObj.summary;
      } else {
        if (!form.getFieldValue('path')) record.path = path;
        if (!form.getFieldValue('targetPath')) record.targetPath = path;
        if (!form.getFieldValue('summary')) record.summary = apiObj.summary;
      }
      record.stripPrefix = 0;
      form.setFieldsValue({ ...record })
      form.validateFields();
    }
  }, [checkedApiNodes]);

  const save: any = async (formData: any) => {
    let responses: any;
    try {
      responses = JSON.parse(formData['responses']);
    } catch (e: any) { }

    if (responses && formData.examples) {
      try {
        const examplesJson: any = JSON.parse(formData.examples);
        responses['200'] = responses['200'] || {};
        responses['200']['examples'] = responses['200']['examples'] || {};
        responses['200']['examples']['application/json'] = examplesJson;

        formData['responses'] = JSON.stringify(responses, null, 4);
      } catch (e: any) {
        console.error('返参示例不是JSON格式，请调整.', e.message)
        return false;
      }
    }
    if (!formData['parameters']) formData['parameters'] = '';
    if (!formData['responses']) formData['responses'] = '';
    formData['parameters'] = formData['parameters'].trim();
    formData['responses'] = formData['responses'].trim();

    const resp: any = await apis.getApiModule().save(formData);
    if (resp?.code === 'SUCCESS') {
      message.success('存储成功');
      onClose(true);
    } else {
      message.error(resp.msg || '存储失败');
    }
  }

  const requestSample: string = `格式必须是合法的Swagger JSON（parameters节点）
  [
    {
      "name": "Sign",
      "in": "header",
      "description": "签名",
      "required": false,
      "type": "string"
    },
    {
      "name": "Timestamp",
      "in": "header",
      "description": "时间戳",
      "required": false,
      "type": "string"
    },
    {
      "name": "TraceId",
      "in": "header",
      "description": "请求流水号",
      "required": false,
      "type": "string"
    },
    {
      "name": "Version",
      "in": "header",
      "description": "接口版本",
      "required": false,
      "type": "string"
    },
    {
      "name": "id",
      "in": "query",
      "description": "id",
      "required": true,
      "type": "integer",
      "format": "int64"
    }
  ]`;

  const respSample: string = `格式必须是合法的Swagger JSON（responses节点）
  {
    "200": {
      "description": "OK",
      "schema": {
        "$$ref": "#/definitions/返回参数«Api对象»"
      }
    },
    "401": {
      "description": "Unauthorized"
    },
    "403": {
      "description": "Forbidden"
    },
    "404": {
      "description": "Not Found"
    }
  }`;

  return (<div className="view-container">
    <Drawer
      forceRender
      title={isAudit ? 'API审核' : 'API查看'}
      width={800}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right', }}>

          {isAudit ? <>
            <Button style={{ marginRight: 8 }} onClick={() => {
              (async () => {
                let resp: any = await apis.getApiModule().auditReject({ id: record.id });
                if (resp?.code === 'SUCCESS') {
                  message.success('审核驳回')
                  onClose(constants.api.status.PENDING.value);
                } else {
                  message.error(resp.message);
                }
              })();
            }}>驳回</Button>
            <Button type="primary" onClick={() => {
              (async () => {
                let resp: any = await apis.getApiModule().auditVerify({ id: record.id });
                if (resp?.code === 'SUCCESS') {
                  message.success('审核通过')
                  onClose(constants.api.status.APPROVED.value);
                } else {
                  message.error(resp.message);
                }
              })();
            }}>通过</Button>
          </> : <Button type="primary" onClick={() => { onClose(false); }}>关闭</Button>}
        </div>
      }
    >
      <Form layout="vertical"
        form={form}
        labelAlign="right"
        className="view-form"
        initialValues={record}
      >
        <Form.Item style={{ display: 'none' }} hidden={true} name="id" >
          <Input />
        </Form.Item>
        <Form.Item label={$t('接口名称')} name="apiName" rules={[{ required: true }]} >
          <Input maxLength={60} placeholder="请输入接口名称" disabled />
        </Form.Item>
        <Form.Item label={$t('接口描述')} name="description"  >
          <Input.TextArea rows={3} maxLength={200} disabled />
        </Form.Item>
        <Form.Item label={$t('接口版本')} name="apiVersion" rules={[{ required: true }]} >
          <Input maxLength={10} placeholder="请输入接口版本号" disabled />
        </Form.Item>
        <Form.Item label={$t('接口分组')} name="apiGroupId" rules={[{ required: true }]} >
          <Select options={apiGroupOptions} placeholder="请选择接口分组" disabled />
        </Form.Item>
        <Form.Item label={$t('序号')} name="seqNo" rules={[{ required: true }]} >
          <InputNumber min={1} disabled />
        </Form.Item>
        <Form.Item label={$t('提供方')} name="isBffOrder" rules={[{ required: true }]} >
          <Select options={[
            { value: 0, label: 'PaaS' },
            { value: 1, label: 'BFF' }
          ]} placeholder="是否为提供方" disabled />
        </Form.Item>
        <Form.Item label={$t('调用方式')} name="requestMethod" rules={[{ required: true }]} >
          <Select options={getEntityColumnOptions(constants.api.requestMethod)} placeholder="请选择调用方式" disabled />
        </Form.Item>
        <Form.Item label={$t('访问路径')} name="path" rules={[{ required: true }]} >
          <Input maxLength={255} placeholder="请输入访问路径" addonBefore={config.OPENAPI_BASE_URL} disabled />
        </Form.Item>
        <Form.Item label={$t('转发路径')} name="targetPath" rules={[{ required: true }]} >
          <Input maxLength={255} placeholder="请输入转发路径" disabled />
        </Form.Item>
        <Form.Item label={$t('转发类型')} name="mappingType" rules={[{ required: true }]} >
          <Select options={[
            { value: 1, label: '拼接path' },
            { value: 2, label: '直接转发' },
          ]} placeholder="请选择转发类型" disabled />
        </Form.Item>
        {record.mappingType === 1 &&
          <Form.Item label={$t('移除前缀')} name="stripPrefix" rules={[{ required: true }]} >
            <InputNumber min={0} disabled />
          </Form.Item>}
        {/* <Form.Item label={$t('跳过验证')} name="skipVerify" rules={[{ required: true }]} >
          <Select options={[
            { value: 1, label: '是' },
            { value: 0, label: '否' },
          ]} placeholder="请选择是否跳过校验" disabled />
        </Form.Item> */}
        <Form.Item label={$t('输入参数')} name="parameters" >
          <Input.TextArea rows={8} disabled />
        </Form.Item>
        <Form.Item label={$t('返回结果')} name="responses"  >
          <Input.TextArea rows={8} disabled />
        </Form.Item>
        <Form.Item label={$t('返参示例')} name="examples">
          <Input.TextArea rows={8} disabled />
        </Form.Item>
      </Form>
    </Drawer >
  </div >);
}