import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';

const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  ip: null,
}

const { filterEmptyFields } = common.helpers;

export default ({ searchConds, onSearch }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    searchObj.currentPage = searchObj.currentPage || initSearchObj.currentPage;
    searchObj.pageSize = searchObj.pageSize || initSearchObj.pageSize;
    const resp: any = await apis.getCoreMgrModule().ipList({
      ...filterEmptyFields(searchObj),
      blackOrWhite: 0,
      pageSize: searchObj.pageSize,
      pageIndex: searchObj.currentPage
    });
    if (resp) {
      resp.currentPage = searchObj.currentPage;
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    searchObj.currentPage = searchConds.currentPage || searchObj.currentPage;
    searchObj.pageSize = searchConds.pageSize || searchObj.pageSize;
    fetchList(searchObj);
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
      onValuesChange={(chgValues: any, values: any) => {
        if ('appId' in chgValues) {
          setSearchObj({ ...searchObj, appId: chgValues.appId });
        }
      }}
    >
      <div className="search-area">
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('IP')} name="ip" >
              <Input />
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
