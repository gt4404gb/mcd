import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';

const { filterEmptyFields, sanitizeFields } = common.helpers;

const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  seqNo: '',
  apiGroupName: '',
};

export default ({ searchConds, onSearch }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    searchObj.currentPage = searchObj.currentPage || initSearchObj.currentPage;
    searchObj.pageSize = searchObj.pageSize || initSearchObj.pageSize;
    sanitizeFields(searchObj);
    const resp: any = await apis.getApiGroupModule().list(filterEmptyFields({ ...searchObj, pageIndex: searchObj.currentPage }));
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
            <Form.Item label={$t('分组序号')} name="seqNo" rules={[{ type: 'string', required: false }]}>
              <Input placeholder="请输入分组序号" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('分组名称')} name="apiGroupName" >
              <Input maxLength={50} placeholder="请输入分组名称" />
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
}
