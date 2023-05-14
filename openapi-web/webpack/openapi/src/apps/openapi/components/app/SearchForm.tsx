import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';
import { useParams, withRouter } from 'react-router';
import constants from '@/apps/openapi/common/constants';

const { filterEmptyFields, sanitizeFields } = common.helpers;

const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  appId: '',
  appName: '',
  merchantId: '',
  merchantName: '',
  isAvailable: null,
  status: constants.app.status.PASSED.value,
}

const isAvailableOptions: any = [
  { value: null, label: '不限' },
  { value: 0, label: '关闭' },
  { value: 1, label: '开启' },
];

export default withRouter(({ searchConds, onSearch, history }: any) => {
  const { merchantId }: any = useParams();

  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [form] = Form.useForm();
  // const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    searchObj.status = searchConds.status || searchObj.status || initSearchObj.status;
    searchObj.currentPage = searchConds.currentPage || searchObj.currentPage || initSearchObj.currentPage;
    searchObj.pageSize = searchConds.pageSize || searchObj.pageSize || initSearchObj.pageSize;
    sanitizeFields(searchObj);
    if (merchantId) {
      history.push(`/openapi/apps`);
      searchObj.merchantId = merchantId;
    }
    const resp: any = await apis.getAppModule().list(filterEmptyFields({ ...searchObj, pageIndex: searchObj.currentPage }));
    if (resp) {
      resp.currentPage = searchObj.currentPage;
      resp.data.rows = resp.data.rows.map((item: any) => {
        item.status = searchObj.status;
        return item;
      });
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    fetchList(searchObj)
  }, [searchObj, searchConds]);

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
        <Form.Item name="status" hidden={true}>
          <Input />
        </Form.Item>
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('应用编号')} name="appId" rules={[{ type: 'string', required: false }]}>
              <Input placeholder="请输入应用编号" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('应用名称')} name="appName" >
              <Input maxLength={60} placeholder="请输入应用名称" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户编号')} name="merchantId" rules={[{ type: 'string', required: false }]}>
              <Input placeholder="请输入商户编号" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户名称')} name="merchantName" >
              <Input maxLength={255} placeholder="请输入商户名称" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={32} /* style={{ display: expand ? 'block' : 'none' }} */>
          <Col span={3}>
            <Form.Item label={$t('状态')} name="isAvailable" >
              <Select options={isAvailableOptions} />
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
});