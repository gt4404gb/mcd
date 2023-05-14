import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, Space } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis';
import constants from '@/apps/btb/common/constants';
import MerchantSelectField from '../../libs/MerchantSelectField';

const { getEntityColumnOptions } = common.helpers;
export const initSearchObj: any = {
  currentPage: 1,
  pageSize: 10,
  code: null,
  orderId: '',
  outRequestNo: null,
  status: null,
  redeemCustomerId: null,
  merchantId: null,
  codeType: null,
}

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchObj, onChangeSearchObj, onSearch }: any) => {
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    // sanitizeFields(searchObj);
    const formData: any = filterEmptyFields(searchObj);
    delete formData.currentPage;
    const resp: any = await apis.getVoucherModule().redeemCodeQuery(formData);
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
            currentPage: 1
          });
        }
      }}
    >
      <div className="search-area">
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('兑换码类型')} name="codeType">
              <Select options={getEntityColumnOptions(constants.btb.voucherCode.codeType, [{ value: null, label: '全部' }])} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('兑换码')} name="redeemCode">
              <Input placeholder="请输入兑换码" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('交易号')} name="orderId">
              <Input placeholder="请输入交易号" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('状态')} name="status" >
              <Select options={getEntityColumnOptions(constants.btb.voucherCode.status, [{ value: null, label: '不限' }])} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('兑换账户')} name="redeemCustomerId">
              <Input placeholder="请输入兑换账户" maxLength={36} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('分销商')} name="merchantId">
              <MerchantSelectField type={constants.btb.merchant.type.DISTRIBUTOR.value} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('供应商')} name="supplierMerchantId">
              <MerchantSelectField type={constants.btb.merchant.type.SUPPLIER.value} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('Sku_id')} name="templateCode">
              <Input placeholder="请输入Sku_id" />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Space size="xs">
              <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
              <Button htmlType="reset" onClick={(it: any) => {
                window.history.replaceState({}, '', '/openapi/btb/voucher/codes')
                if (onChangeSearchObj) onChangeSearchObj({ ...initSearchObj });
              }}>{$t('portal_reset')}</Button>
            </Space>
          </Col>
        </Row>
      </div>
    </Form>
  )
}
