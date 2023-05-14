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
  templateCode: null,
  orderId: null,
  outRequestNo: null,
  merchantId: null,
  sendType: null,
}

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchObj, onChangeSearchObj, onSearch }: any) => {
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);

  const fetchList: any = async (searchObj: any) => {
    sanitizeFields(searchObj);
    const resp: any = await apis.getVoucherModule().orderQuery(filterEmptyFields(searchObj));
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
            <Form.Item label={$t('发放方式')} name="sendType">
              <Select options={getEntityColumnOptions(constants.btb.voucherOrder.sendType, [{ value: null, label: '全部' }])} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('交易号')} name="orderId">
              <Input placeholder="请输入交易号" maxLength={36} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('分销商')} name="merchantId">
              <MerchantSelectField type={constants.btb.merchant.type.DISTRIBUTOR.value} />
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
