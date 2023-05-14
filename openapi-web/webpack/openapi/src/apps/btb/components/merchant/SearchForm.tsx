import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis';
import constants from '@/apps/btb/common/constants';

const { getEntityColumnOptions } = common.helpers;
const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  companyName: null,
  merchantId: null,
  merchantType: null,
  availableFlag: null,
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
    const resp: any = await apis.getBMSModule().fetchMerchantList(filterEmptyFields({
      ...searchObj,
      limit: searchObj.pageSize,
      page: searchObj.currentPage
    }));
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
            <Form.Item label={$t('商户编号')} name="merchantId" rules={[{ type: 'string', required: false }]}>
              <Input placeholder="请输入商户编号" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户名称')} name="companyName" >
              <Input maxLength={11} placeholder="请输入商户名称" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('状态')} name="availableFlag" >
              <Select options={getEntityColumnOptions(constants.btb.merchant.availableFlag, [{ value: null, label: '不限' }])} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户类型')} name="merchantType" >
              <Select options={getEntityColumnOptions(constants.btb.merchant.type, [{ value: null, label: '不限' }])} />
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
              <Link to={`/openapi/btb/merchant/edit`}><Button>{$t('portal_add')}</Button></Link>
            </Space>
          </Col>
        </Row>
      </div>
    </Form>
  )
}
