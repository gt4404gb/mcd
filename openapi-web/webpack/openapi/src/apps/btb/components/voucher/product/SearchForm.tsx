import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis';
import constants from '@/apps/btb/common/constants';

const { getEntityColumnOptions } = common.helpers;

export const initSearchObj: any = {
  currentPage: 1,
  pageSize: 50,
  state: null,
  templateCode: '',
  templateName: null,
  merchantName: '',
};

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchObj, onChangeSearchObj, onSearch }: any) => {
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    sanitizeFields(searchObj);
    const resp: any = await apis.getVoucherModule().templateQuery(filterEmptyFields(searchObj));
    if (resp) {
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    (async () => {
      await fetchList({ ...searchObj, pageNo: searchObj.currentPage });
    })();
  }, [searchObj]);

  return (
    <Form layout="vertical"
      form={form}
      className="search-form"
      initialValues={searchObj}
      onFinish={(values: any) => {
        if (onChangeSearchObj) {
          onChangeSearchObj({
            ...searchObj,
            ...values,
            currentPage: 1,
          });
        }
      }}
    >
      <div className="search-area">
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('资源编号')} name="templateCode">
              <Input placeholder="请输入资源编号" maxLength={30} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('资源名称')} name="templateName">
              <Input placeholder="请输入资源名称" maxLength={30} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('供应商')} name="merchantName">
              <Input placeholder="请输入" maxLength={30} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Space size="xs">
              <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
              <Button htmlType="reset" onClick={(it: any) => {
                if (onChangeSearchObj) onChangeSearchObj({ ...initSearchObj });
              }}>{$t('portal_reset')}</Button>
            </Space>
          </Col>
        </Row>
      </div>
    </Form>
  )
}
