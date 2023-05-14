import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Select, Radio, InputNumber, Upload, Tree, IconFont } from '@aurum/pfe-ui';
import * as apis from '@/apps/openapi/common/apis'
import common from '@omc/common';
import constants from '@/apps/openapi/common/constants';
import * as helper from '@/apps/openapi/common/helper';
import config from '@/common/config/config';

const { getEntityColumnOptions } = common.helpers;

const defaultApi: any = {
  skipVerify: 0,
  requestMethod: 'GET',
  seqNo: 1,
  apiVersion: '1.0',
  mappingType: 2,
  isBffOrder: 0,
  stripPrefix: 0,
};

const fetchSingleRecord: any = async (id: any) => {
  let result: any = null;
  const resp: any = await apis.getApiModule().detail({ id });
  if (resp?.code === 'SUCCESS') result = resp.data;
  return result;
}

export default ({ visible = false, recordId, dataSource = null, onClose }: any) => {
  const [form] = Form.useForm();
  const [record, setRecord]: any = useState({ ...defaultApi });
  const [previewUrl, setPreviewUrl]: any = useState(null);
  const [apiGroupOptions, setApiGroupOptions]: any = useState([]);
  const [importType, setImportType]: any = useState(3);
  const [importSwaggerJson, setImportSwaggerJson]: any = useState(null);
  const [importApiTree, setImportApiTree]: any = useState([]);
  // const [swaggerUrl, setSwaggerUrl]: any = useState('');
  const [yapiProjectId, setYapiProjectId]: any = useState(null);
  const [checkedApiNodes, setCheckedApiNodes]: any = useState([]);

  useEffect(() => {
    (async () => {
      setApiGroupOptions(await helper.getApiGroupOptions());
    })();
  }, []);

  useEffect(() => {
    if (dataSource) {
      setRecord({ ...dataSource });
    }
    return () => {
      setRecord({});
      setYapiProjectId(null)
    }
  }, [dataSource]);

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
          // console.error(e)
        }
        setRecord(result);
      })();
    }

    return () => {
      setYapiProjectId(null)
      setRecord({});
      setPreviewUrl(null);
    }
  }, [recordId]);

  useEffect(() => {
    if (visible === false) setRecord({ ...defaultApi });
    return () => {
      setImportSwaggerJson(null);
      setImportApiTree([]);
      setPreviewUrl(null);
    }
  }, [visible]);

  useEffect(() => {
    updatePreviewUrl(record);
    if (record) form.resetFields();
  }, [record]);

  useEffect(() => {
    const apiTree: any = [];
    if (importSwaggerJson) {
      Object.entries(importSwaggerJson.paths).forEach(([pathName, methods]: any) => {
        Object.entries(methods).forEach(([methodName, method]: any) => {
          let tag_desc: any = '';
          importSwaggerJson['tags'].some((tagObj: any) => {
            if (tagObj.name === method.tags[0]) {
              tag_desc = `[${tagObj.description}]`
            }
          })
          apiTree.push({ key: [pathName, methodName], title: `${tag_desc} ${importSwaggerJson.basePath}${pathName} | ${methodName} | ${method.summary}` })
        });
      });
    }
    setImportApiTree(apiTree);
  }, [importSwaggerJson]);

  useEffect(() => {
    setImportApiTree([]);
    setYapiProjectId(null);
  }, [importType]);

  useEffect(() => {
    if (checkedApiNodes[0]) {
      const [path, method]: any = checkedApiNodes[0];
      const apiObj: any = importSwaggerJson.paths[path][method];
      if (apiObj.description) record.description = apiObj.description;
      if (apiObj.parameters) record.parameters = JSON.stringify(apiObj.parameters, null, 4);
      if (apiObj.responses) record.responses = JSON.stringify(apiObj.responses, null, 4);

      record.requestMethod = method.toUpperCase();
      if (!record.id) {
        record.path = (importSwaggerJson.basePath || '') + path;
        if (apiObj.summary) record.apiName = apiObj.summary;
      } else {
        if (!form.getFieldValue('path')) record.path = (importSwaggerJson.basePath || '') + path;
        // if (!form.getFieldValue('targetPath')) record.targetPath = path;
        if (!form.getFieldValue('summary')) record.summary = apiObj.summary;
      }
      record.stripPrefix = 0;
      form.setFieldsValue({ ...record })
      form.validateFields();
    }
  }, [checkedApiNodes]);

  const updatePreviewUrl: any = (formData: any) => {
    if (formData.mappingType === 1) {
      const prefixNums: any = formData.stripPrefix || 0;
      let path: any = formData.path || '';
      if (!path.match(/^\//)) path = '/' + path;
      path = '/' + (path.split('/').slice(prefixNums + 1)).join('/');
      setPreviewUrl((formData.targetPath || '') + path);
    } else {
      setPreviewUrl(formData.targetPath || '');
    }
  };

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

  return (<div className="edit-container">
    <Drawer
      forceRender
      title="API编辑"
      width={800}
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
        onValuesChange={(chgValues: any, values: any) => {
          if ('mappingType' in chgValues
          ) {
            setRecord(values);
          } else {
            updatePreviewUrl(values);
          }
        }}
      >
        <Form.Item style={{ display: 'none' }} hidden={true} name="id" >
          <Input />
        </Form.Item>
        <Form.Item label="导入Swagger">
          <Radio.Group onChange={(e: any) => { setImportType(e.target.value) }} value={importType}>
            <Radio value={3}>从YAPI项目</Radio>
            <Radio value={1}>从文件</Radio>
            {/* <Radio value={2}>从地址</Radio> */}
          </Radio.Group>
          <Input.Group compact style={{ marginTop: 15 }}>
            {importType === 1 ?
              <>
                <Upload name="file"
                  fileList={[]}
                  beforeUpload={(file: any) => {
                    const reader = new FileReader();
                    reader.readAsText(file);// 将文件读取为文本
                    reader.onload = (e: any) => { // 文件读取完成后的回调
                      if (e.target.result) {
                        let error = false;
                        try {
                          const jsonText: string = e.target.result;
                          const jsonObj: any = JSON.parse(jsonText)
                          if (jsonObj?.swagger && jsonObj?.paths) {
                            setImportSwaggerJson(jsonObj)
                          } else {
                            error = true
                          }
                        } catch (e: any) {
                          error = true
                        } finally {
                          if (error) {
                            message.error('请使用 YAPI 导出的Swagger 2.0 JSON文件')
                          }
                        }
                      }
                    }
                    return false;
                  }}>
                  <Button><IconFont type="icon-shangchuan" />选择JSON文件</Button>
                </Upload>
              </>
              :
              <>
                <Input.Search value={yapiProjectId}
                  onChange={(e: any) => { setYapiProjectId(e.target.value) }}
                  placeholder="请填写 YAPI 的页面地址"
                  enterButton="导入" onSearch={() => {
                    (async () => {
                      try {
                        if (!yapiProjectId) {
                          throw new Error('请输入YAPI项目ID或者YAPI接口URL');
                        }
                        let yid: any = yapiProjectId;
                        if (yid.match(/^https/)) {
                          yid = yapiProjectId.replace(/https:\/\/api-docs\.mcd\.com\.cn\/project\/(\d+)?.+/, '$1');
                        }
                        const jsonObj: any = await apis.getApiGroupModule().yapiSwaggerJSON(yid);
                        if (jsonObj.errcode) {
                          message.error(jsonObj.errmsg);
                          setImportApiTree([]);
                        } else {
                          if (jsonObj?.swagger && jsonObj?.paths) {
                            setImportSwaggerJson(jsonObj)
                          }
                        }
                      } catch (e: any) {
                        message.error(e.message)
                      }
                    })()
                  }} />
              </>
            }
          </Input.Group>
          {importApiTree.length > 0 && <Tree treeData={importApiTree}
            checkable
            style={{ height: 350, overflow: 'auto', marginTop: '10px' }}
            checkedKeys={checkedApiNodes}
            onCheck={(checkedKeysValues: any, info: any) => {
              setCheckedApiNodes([info.node.key]);
            }}
          />}
        </Form.Item>
        <Form.Item label={$t('接口名称')} name="apiName" rules={[{ required: true }]} >
          <Input maxLength={60} placeholder="请输入接口名称" />
        </Form.Item>
        <Form.Item label={$t('接口描述')} name="description"  >
          <Input.TextArea rows={3} maxLength={200} />
        </Form.Item>
        <Form.Item label={$t('接口版本')} name="apiVersion" rules={[{ required: true }]} >
          <Input maxLength={10} placeholder="请输入接口版本号" />
        </Form.Item>
        <Form.Item label={$t('接口分组')} name="apiGroupId" rules={[{ required: true }]} >
          <Select options={apiGroupOptions} placeholder="请选择接口分组" />
        </Form.Item>
        <Form.Item label={$t('序号')} name="seqNo" rules={[{ required: true }]} >
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item label={$t('提供方')} name="isBffOrder" rules={[{ required: true }]} >
          <Select options={[
            { value: 0, label: 'PaaS' },
            { value: 1, label: 'BFF' }
          ]} placeholder="是否为提供方" />
        </Form.Item>
        <Form.Item label={$t('调用方式')} name="requestMethod" rules={[{ required: true }]} >
          <Select options={getEntityColumnOptions(constants.api.requestMethod)} placeholder="请选择调用方式" />
        </Form.Item>
        <Form.Item label={$t('访问路径')} name="path" rules={[{ required: true }]} >
          <Input maxLength={255} placeholder="请输入访问路径" addonBefore={config.OPENAPI_BASE_URL} />
        </Form.Item>
        <Form.Item label={$t('转发路径')} name="targetPath" rules={[{ required: true }]} >
          <Input maxLength={255} placeholder="请填写 serviceName + path 或 url + path" />
        </Form.Item>
        <Form.Item label={$t('转发类型')} name="mappingType" rules={[{ required: true }]} help={<span>直接转发：请求「访问路径」会直接转发到「转发路径」
          <br />拼接 URL：请求「访问路径」会结合「移除前缀」拼接路径进行转发，适合 path 带有参数的路径，如 /store/{`{usCode}`}/detail</span>}>
          <Select options={[
            { value: 1, label: '拼接path' },
            { value: 2, label: '直接转发' },
          ]} placeholder="请选择转发类型" />
        </Form.Item>
        <Form.Item label={$t('移除前缀')} hidden={record.mappingType === 1 ? false : true} name="stripPrefix" rules={[{ required: true }]} >
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item label={$t('转发地址')}  >
          {previewUrl}
        </Form.Item>

        {/* <Form.Item label={$t('跳过验证')} name="skipVerify" rules={[{ required: true }]} >
          <Select options={[
            { value: 1, label: '是' },
            { value: 0, label: '否' },
          ]} placeholder="请选择是否跳过校验" />
        </Form.Item> */}
        <Form.Item label={$t('输入参数')} name="parameters" rules={[{
          validator: async (_, value) => {
            if (!value) return;
            if (value?.match(/originalRef/)) {
              throw new Error('参数中包含 originalRef或 $ref字段，可能不是合法的YAPI导出的JSON');
            }

            let jsonObj: any = null;
            try {
              jsonObj = JSON.parse(value);
            } catch (e: any) {
              throw new Error('请输入合法的Swagger JSON数组')
            } finally {
              if (!Array.isArray(jsonObj)) {
                throw new Error('请输入合法的Swagger JSON数组')
              }
            }
          }
        }]}>
          <Input.TextArea rows={8} placeholder={requestSample} />
        </Form.Item>
        <Form.Item label={$t('返回结果')} name="responses" rules={[{
          validator: async (_, value) => {
            if (!value) return;
            if (value?.match(/originalRef/)) {
              throw new Error('参数中包含 originalRef或 $ref字段，可能不是合法的YAPI导出的JSON');
            }
            try { JSON.parse(value); } catch (e: any) { throw new Error('请输入合法的Swagger JSON') }
          }
        }]} >
          <Input.TextArea rows={8} placeholder={respSample} />
        </Form.Item>
        <Form.Item label={$t('返参示例')} name="examples" rules={[{ required: false },
        {
          validator: async (_, value) => {
            if (value)
              try { JSON.parse(value); } catch (e: any) { throw new Error('请输入合法的Swagger JSON') }
          }
        }]} >
          <Input.TextArea rows={8} />
        </Form.Item>
      </Form>
    </Drawer >
  </div >);
}