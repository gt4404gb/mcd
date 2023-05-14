import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import { useParams, withRouter } from 'react-router';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';
import * as helper from '@/apps/openapi/common/helper';

const { filterEmptyFields, sanitizeFields } = common.helpers;

const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  apiGroupId: null,
  apiId: null,
  apiName: '',
  merchantId: null,
  merchantName: '',
  appId: null,
  appName: '',
};

export default withRouter(({ searchConds, onSearch, history }: any) => {
  const { appId }: any = useParams();

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
    if (appId) {
      history.push(`/openapi/subscribed/apis`);
      searchObj.appId = appId;
    }
    const resp: any = await apis.getApiSubscriptionModule().list(filterEmptyFields({ ...searchObj, pageIndex: searchObj.currentPage }));
    if (resp) {
      resp.data?.rows?.forEach((item: any) => item.key = item.id);
      resp.currentPage = searchObj.currentPage;
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    fetchList(searchObj)
  }, [searchObj]);

  useEffect(() => {
    setSearchObj({ ...searchObj, ...searchConds })
  }, [searchConds]);

  return (
    <Form layout="vertical"
      form={form}
      className="search-form"
      initialValues={searchObj}
      onFinish={(values: any) => {
        setSearchObj({ ...values, currentPage: 1 });
      }}
    >
      <div className="search-area">
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('接口编号')} name="apiId" rules={[{ type: 'string', required: false }]}>
              <Input maxLength={10} placeholder="请输入接口编号" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('接口名称')} name="apiName" >
              <Input maxLength={60} placeholder="请输入接口名称" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('应用编号')} name="appId" >
              <Input placeholder="请输入应用编号" maxLength={255} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('应用名称')} name="appName" >
              <Input maxLength={32} placeholder="请输入应用名称" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('接口分组')} name="apiGroupId" >
              <Select options={apiGroupOptions} placeholder="不限分组" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户编号')} name="merchantId" >
              <Input placeholder="请输入商户编号" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户名称')} name="merchantName" >
              <Input maxLength={255} placeholder="请输入商户名称" />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Space size='xs'>
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
});