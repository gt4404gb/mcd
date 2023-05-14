import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';
import * as helper from '@/apps/openapi/common/helper';

const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  apiId: null,
  appId: null,
  isAvailable: null,
  isDeleted: null,
}

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchConds, onSearch }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [appOptions, setAppOptions]: any = useState([]);
  const [apiOptions, setApiOptions]: any = useState([]);
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    searchObj.currentPage = searchObj.currentPage || initSearchObj.currentPage;
    searchObj.pageSize = searchObj.pageSize || initSearchObj.pageSize;
    // filterEmptyFields(sanitizeFields(searchObj));
    const resp: any = await apis.getCoreMgrModule().list({
      ...filterEmptyFields(searchObj),
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

  useEffect(() => {
    (async () => {
      if (searchObj.appId) {
        setApiOptions(await helper.getSubscribedApiOptions({
          pageSize: 999,
          appId: searchObj.appId,
        }, 'apiId'));
      } else {
        const apiOpts: any = await helper.getApiOptions({ appId: searchObj.appId, pageNo: 1, pageSize: 999 });
        setApiOptions(apiOpts);
      }
      searchObj.apiId = null;
      setSearchObj({ ...searchObj });
    })();
  }, [searchObj.appId]);

  useEffect(() => {
    (async () => {
      const appOpts: any = await helper.getPublishedAppsOptions({}, 'appId');
      setAppOptions(appOpts);
      const apiOpts: any = await helper.getApiOptions({ pageNo: 1, pageSize: 999 });
      setApiOptions(apiOpts);
    })();
  }, [])

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
            <Form.Item label={$t('应用')} name="appId" >
              <Select
                options={[{ value: null, label: '不限' }, ...appOptions]}
                placeholder="请选择应用名称"
                allowClear
                showSearch
              />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('API')} name="apiId" >
              <Select
                showSearch
                options={[{ value: null, label: '不限' }, ...apiOptions]}
                placeholder="请选择API"
                optionFilterProp="label"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('配置状态')} name="isAvailable" >
              <Select options={[
                { value: null, label: '不限' },
                { value: 1, label: '已生效' },
                { value: 0, label: '未生效' }
              ] as any} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('是否删除')} name="isDeleted" >
              <Select options={[
                { value: null, label: '不限' },
                { value: 1, label: '是' },
                { value: 0, label: '否' }
              ] as any} />
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
