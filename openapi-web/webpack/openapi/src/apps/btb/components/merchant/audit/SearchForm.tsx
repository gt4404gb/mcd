import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis';
import constants from '@/apps/btb/common/constants';

const { getEntityColumnOptions } = common.helpers;
const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  name: '',
  mobile: '',
  companyName: '',
  status: null,
}

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchConds, onSearch }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    searchObj.currentPage = searchObj.currentPage || initSearchObj.currentPage;
    searchObj.pageSize = searchObj.pageSize || initSearchObj.pageSize;
    sanitizeFields(searchObj);
    const resp: any = await apis.getBMSModule().accessList(filterEmptyFields({ ...searchObj, limit: searchObj.pageSize, page: searchObj.currentPage }));
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
            <Form.Item label={$t('姓名')} name="name" rules={[{ type: 'string', required: false }]}>
              <Input placeholder="请输入姓名" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('手机号')} name="phone" >
              <Input maxLength={11} placeholder="请输入手机号" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('公司名称')} name="companyName" >
              <Input maxLength={255} placeholder="请输入公司名称" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('状态')} name="status" >
              <Select options={getEntityColumnOptions(constants.btb.merchantAudit.approvalStatus, [{ value: null, label: '不限' }])} />
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
