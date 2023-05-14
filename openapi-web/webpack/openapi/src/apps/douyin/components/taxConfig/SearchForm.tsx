import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/douyin/common/apis';
import { IconExclamationCircle } from '@aurum/icons';

export const initSearchObj: any = {
  currentPage: 1,
  pageSize: 20,
}

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchObj, onChangeSearchObj, onSearch }: any) => {
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    sanitizeFields(searchObj);
    const resp: any = await apis.getJimiaoModule().taxConfigList(filterEmptyFields(searchObj));
    if (resp) {
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    const params: any = {
      page: searchObj.currentPage,
      size: searchObj.pageSize,
    }
    if (searchObj.skuId) params.skuId = searchObj.skuId.split(',');
    if (searchObj.skuName) params.skuName = searchObj.skuName;

    fetchList(params);
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
            currentPage: 1
          });
        }
      }}
    >
      <div className="search-area">
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item
              label={$t('商品编号')}
              name="skuId"
              tooltip={{
                title: '多个商品编号用逗号分隔，如: 1111,2222',
                icon: <IconExclamationCircle />,
              }}
            >
              <Input placeholder="请输入商品编号" maxLength={30} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商品名称')} name="skuName">
              <Input placeholder="请输入商品名称" maxLength={50} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Space size='xs'>
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
