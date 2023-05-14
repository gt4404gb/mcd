import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Select, Popconfirm, Radio, Tree } from '@aurum/pfe-ui';
import * as apis from '@/apps/openapi/common/apis'
import * as helper from '@/apps/openapi/common/helper';

import './styles/Edit.less';
import { CloseCircleFilled } from '@ant-design/icons';

let timer: any;
const defaultFormObj: any = {
  apiGroupId: null,
  skipVerify: 0,
  apiIds: []
};
export default ({ visible = false, dataSource = null, onClose }: any) => {
  const [form] = Form.useForm();
  const [record, setRecord]: any = useState({ ...defaultFormObj });
  const [merchantOptions, setMerchantOptions]: any = useState([]);
  const [appOptions, setAppOptions]: any = useState([]);
  const [apiGroupOptions, setApiGroupOptions]: any = useState([]);
  const [checkedKeys, setCheckedKeys]: any = useState([]);
  const [apiIds, setApiIds]: any = useState([]);
  const [treeData, setTreeData]: any = useState([]);
  const [fullTreeData, setFullTreeData]: any = useState([]);
  const [apiIdError, setApiIdError]: any = useState(null);
  const [apiMap, setApiMap]: any = useState({});

  useEffect(() => {
    if (dataSource) setRecord({ ...dataSource });
    (async () => {
      setMerchantOptions(await helper.getMerchantOptions('merchantId'));
      setApiGroupOptions(await helper.getApiGroupOptions());
      setApiMap(await helper.getApisMap());
    })();
  }, [dataSource]);

  useEffect(() => {
    if (visible === false) setRecord({ ...defaultFormObj });
    return () => {
      setApiIds([]);
      setCheckedKeys([]);
    }
  }, [visible]);

  useEffect(() => {
    form.resetFields();
  }, [record]);

  useEffect(() => {
    if (record.merchantId) {
      (async () => {
        const appOpts: any = await helper.getPublishedAppsOptions({merchantId: record.merchantId}, 'appId');
        if (appOpts[0]) {
          record.appId = appOpts[0].value;
          setRecord({ ...record });
        }
        setAppOptions(appOpts);
      })();
    }
  }, [record.merchantId]);

  useEffect(() => {
    (async () => {
      const _treeData: any = await helper.getApisByGroupIdTreeOptions(record.apiGroupId);
      setTreeData(_treeData);
      setFullTreeData(_treeData);
    })();
  }, [record.apiGroupId]);

  useEffect(() => {
    const treeKeys: any = treeData.map((it: any) => it.key);
    let _checkedKeys: any = apiIds.filter((id: any) => {
      return (treeKeys.indexOf(id) > -1) ? true : false
    });
    setCheckedKeys(_checkedKeys);
  }, [apiIds, treeData]);

  const updateContextApiIds: any = (apiIds: any) => {
    setApiIdError(apiIds.length > 0 ? null : '请至少选择一个接口');
    setApiIds(apiIds);
  }

  const save = async (formData: any) => {
    formData.apiIds = apiIds;
    const resp: any = await apis.getApiSubscriptionModule().add(formData);
    if (resp?.code === 'SUCCESS') {
      message.success('存储成功');
      onClose(true);
    } else {
      message.error(resp.msg || '存储失败');
    }
  }

  const filterTreeList: any = (value: string) => {
    if (value) {
      const _treeData: any = fullTreeData.filter((it: any) => it.title.match(new RegExp(value)) ? true : false);
      setTreeData(_treeData);
    } else {
      setTreeData(fullTreeData);
    }
  }

  return (<div className="subscribed-api-edit-container">
    <Drawer
      forceRender
      title="订阅设置"
      className="subscribed-api-edit-drawer"
      width={800}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right', }}>
          <Popconfirm icon='' onConfirm={() => { onClose(false); }} title="是否取消当前操作？" okText="是" cancelText="否" >
            <Button style={{ marginRight: 8 }} >取消</Button>
          </Popconfirm>
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
          if (apiIds.length <= 0) {
            setApiIdError('请至少选择一个接口');
            return;
          }
          save(values);
        }}
        onValuesChange={(changedValues: any, values: any) => {
          if (changedValues.merchantId !== undefined || changedValues.apiGroupId !== undefined) {
            setRecord({ ...values });
          }
        }}
      >
        <Form.Item style={{ display: 'none' }} hidden={true} name="id" >
          <Input />
        </Form.Item>
        <Form.Item label={$t('商户名称')} name="merchantId" rules={[{ required: true }]} >
          <Select
            showSearch
            options={merchantOptions}
            placeholder="请选择商户名称"
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item label={$t('应用名称')} name="appId" rules={[{ required: true }]} >
          <Select options={appOptions} placeholder="请选择应用名称" />
        </Form.Item>
        <Form.Item label={$t('接口分组')} name="apiGroupId" >
          <Select options={[{ value: null, label: '不限分组' }, ...apiGroupOptions]} placeholder="请选择接口分组" />
        </Form.Item>
        <Form.Item label={$t('API接口')} >
          <Input.Search style={{ marginBottom: 8 }} placeholder="请输入要搜索的接口名"
            onChange={(e: any) => {
              const value: any = e.target.value;
              clearTimeout(timer);
              timer = setTimeout(() => {
                filterTreeList(value);
              }, 500);
            }}
            onSearch={(value: any) => {
              filterTreeList(value);
            }} />
          <Tree
            checkable
            onCheck={(checkedKeysValue: any) => {
              let _apiIds: any = apiIds.filter((id: any) => (checkedKeys.indexOf(id) > -1) ? false : true);
              _apiIds = _apiIds.concat(checkedKeysValue);
              updateContextApiIds(Array.from(new Set(_apiIds)));
            }}
            onSelect={(selectKeyValues: any, nodeStruct: any) => {
              if (selectKeyValues.length <= 0) { //取消选择
                updateContextApiIds(apiIds.filter((id: any) => id != nodeStruct.node.key));
              } else { //选择
                apiIds.push(selectKeyValues[0]);
                updateContextApiIds(Array.from(new Set([...apiIds])));
              }
            }}
            checkedKeys={checkedKeys}
            treeData={treeData}
            className="api-options"
          />
          <div className="api-ids-empty-error">{apiIdError}</div>
        </Form.Item>

        {apiIds.length > 0 && <Form.Item label=" " colon={false}>
          {apiIds.map((id: any) => <span title={`[${apiMap[id].requestMethod}] ${apiMap[id].path}`} className="api-id-tag" key={id}>
            {apiMap[id].label} <CloseCircleFilled onClick={() => {
              updateContextApiIds(apiIds.filter((thisId: any) => thisId !== id));
            }} />
          </span>)}
        </Form.Item>}

        <Form.Item label={$t('验签')} name="skipVerify" rules={[{ required: true }]} >
          <Radio.Group>
            <Radio value={0}>是</Radio>
            <Radio value={1}>否</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Drawer>
  </div>);
}