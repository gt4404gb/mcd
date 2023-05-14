import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';

const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  merchantId: '',
  merchantName: '',
  merchantType: null,
  isAvailable: null,
}

const merchantTypeOptions: any = [
  { value: null, label: '不限' },
  { value: 1, label: '麦中服务商' },
  { value: 2, label: '同业销售' },
  { value: 3, label: '异业合作' },
];

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchConds, onSearch }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    searchObj.currentPage = searchObj.currentPage || initSearchObj.currentPage;
    searchObj.pageSize = searchObj.pageSize || initSearchObj.pageSize;
    sanitizeFields(searchObj);
    const resp: any = await apis.getMerchantModule().list(filterEmptyFields({ ...searchObj, pageIndex: searchObj.currentPage }));
    if (resp) {
      resp.data?.rows?.forEach((item: any) => item.key = item.id);
      resp.currentPage = searchObj.currentPage;
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    searchObj.currentPage = searchConds.currentPage || searchObj.currentPage;
    searchObj.pageSize = searchConds.pageSize || searchObj.pageSize;
    fetchList(searchObj)
  }, [searchObj, searchConds]);

  const isAvailableOptions: any = [
    { value: null, label: '不限' },
    { value: 0, label: '关闭' },
    { value: 1, label: '开启' },
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
            <Form.Item label={$t('商户编号')} name="merchantId" rules={[{ type: 'string', required: false }]}>
              <Input placeholder="请输入商户编号" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户名称')} name="merchantName" >
              <Input maxLength={255} placeholder="请输入商户名称" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('状态')} name="isAvailable" >
              <Select options={isAvailableOptions} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户类型')} name="merchantType" >
              <Select options={merchantTypeOptions} placeholder="请选择商户类型" />
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
