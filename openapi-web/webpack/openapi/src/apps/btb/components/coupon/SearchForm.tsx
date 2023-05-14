import React, { useState, useEffect, useRef } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis';
import constants from '@/apps/btb/common/constants';
import { message } from 'antd';

const { getEntityColumnOptions } = common.helpers;
const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  orderId: '',
  code: null,
  status: null,
  tradeNo: null,
  lastId: '',
};

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchConds, onSearch, currPageSize }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);
  const lastIdRef: any = useRef('');
  const pageSizeRef: any = useRef(10);

  const fetchList: any = async (searchObj: any) => {
    sanitizeFields(searchObj);
    const resp: any = await apis.getBOSModule().queryCoupons(filterEmptyFields(searchObj));
    if (resp && resp.data) {
      if (resp.data?.list?.length < currPageSize) {
        message.warning('已到最后一页');
      }
      resp.currentPage = searchObj.currentPage;
      if (resp.data?.list?.length) {
        lastIdRef.current = resp.data?.list[resp.data.list.length - 1].id;
      }
      if (onSearch) onSearch(resp);
    } else {
      onSearch({});
    }
    form.resetFields();
  };

  useEffect(() => {
    if (!searchObj.orderId && !searchObj.code && !searchObj.tradeNo) {
      message.error('订单号、券码、交易号请至少输入一个');
      return;
    }
    if (pageSizeRef.current !== currPageSize) {
      lastIdRef.current = '';
      pageSizeRef.current = currPageSize;
    }
    if (searchConds.currentPage === 1) {
      lastIdRef.current = '';
    }
    const formData: any = {};
    formData.size = searchConds.pageSize || searchObj.pageSize;
    formData.orderId = searchObj.orderId;
    formData.status = searchObj.status;
    formData.tradeNo = searchObj.tradeNo;
    formData.code = searchObj.code;
    formData.lastId = lastIdRef.current;

    (async () => {
      await fetchList(formData);
    })();
  }, [searchObj, searchConds, currPageSize]);

  return (
    <Form layout="vertical"
      form={form}
      className="search-form"
      initialValues={searchObj}
      onFinish={(values: any) => {
        if (!values.orderId && !values.code && !values.tradeNo) {
          message.error('订单号、券码、交易号请至少输入一个');
          return;
        }
        searchConds['currentPage'] = 1;
        lastIdRef.current = '';
        searchConds['lastId'] = '';
        setSearchObj({ ...searchObj, ...values });
      }}
    >
      <div className="search-area">
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('订单号')} name="orderId">
              <Input placeholder="请输入订单号" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('券码')} name="code">
              <Input placeholder="请输入券码" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('状态')} name="status" >
              <Select options={getEntityColumnOptions(constants.btb.coupon.status, [{ value: null, label: '不限' }])} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('交易号')} name="tradeNo">
              <Input placeholder="请输入商户侧交易订单号" maxLength={36} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Space size="xs">
              <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
              <Button htmlType="reset" onClick={(it: any) => {
                lastIdRef.current = '';
                setSearchObj({ ...initSearchObj });
              }}>{$t('portal_reset')}</Button>
            </Space>
          </Col>
        </Row>
      </div>
    </Form>
  )
}
