import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';
import constants from '@/apps/openapi/common/constants';
import * as helper from '@/apps/openapi/common/helper';

const { getEntityColumnOptions, filterEmptyFields, sanitizeFields } = common.helpers;

const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  apiId: '',
  apiName: '',
  apiGroupId: null,
  method: null,
  isAvailable: null,
  targetPath: null,
  path: null,
}

export default ({ searchConds, onSearch }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);
  const [apiGroupOptions, setApiGroupOptions]: any = useState([]);

  useEffect(() => {
    (async () => {
      setApiGroupOptions([{ value: null, label: '不限分组' }].concat(await helper.getApiGroupOptions()));
    })();
  }, []);

  const fetchList: any = async (searchObj: any) => {
    searchObj.currentPage = searchObj.currentPage || initSearchObj.currentPage;
    searchObj.pageSize = searchObj.pageSize || initSearchObj.pageSize;
    sanitizeFields(searchObj);
    const resp: any = await apis.getApiModule().list(filterEmptyFields({ ...searchObj, pageIndex: searchObj.currentPage }));
    if (resp) {
      resp.data?.rows?.forEach((item: any) => item.key = item.id);
      resp.currentPage = searchObj.currentPage;
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    searchObj.status = searchConds.status;
    searchObj.currentPage = searchConds.currentPage || searchObj.currentPage;
    searchObj.pageSize = searchConds.pageSize || searchObj.pageSize;
    fetchList(searchObj)
  }, [searchObj, searchConds]);

  const apiIsAvailableOptions: any = [
    { value: null, label: '不限' },
    { value: 1, label: '开启' },
    { value: 0, label: '关闭' },
  ];

  return (
    <Form layout="vertical"
      form={form}
      className="search-form"
      initialValues={searchObj}
      onFinish={(values: any) => {
        searchConds['currentPage'] = 1;
        setSearchObj({ ...values });
      }}
    >
      <div className="search-area">
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('接口编号')} name="apiId" >
              <Input placeholder="请输入接口编号" maxLength={10} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('接口名称')} name="apiName" >
              <Input maxLength={60} placeholder="请输入接口名称" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('访问路径')} name="path" >
              <Input maxLength={60} placeholder="请输入访问路径" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('转发路径')} name="targetPath" >
              <Input maxLength={60} placeholder="请输入转发路径" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('接口分组')} name="apiGroupId" >
              <Select options={apiGroupOptions} placeholder="不限分组" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('调用方式')} name="method" >
              <Select options={getEntityColumnOptions(constants.api.requestMethod, [{ value: null, label: '不限' }])} placeholder="不限调用方式" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('是否可用')} name="isAvailable" >
              <Select options={apiIsAvailableOptions} placeholder="不限是否可用" />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Space size="xs">
              <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
              <Button htmlType="reset" onClick={(it: any) => {
                setSearchObj({ ...initSearchObj });
              }}>{$t('portal_reset')}</Button>
            </Space>
          </Col>
        </Row>
      </div>
    </Form>
  )
}
