import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Input, Button, Select, message, Space } from '@aurum/pfe-ui';
import { format } from 'date-fns';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import common from '@omc/common';
import * as apis from '@/apps/btb/common/apis';
import constants from '@/apps/btb/common/constants';
// @ts-ignore
import { DateRangePicker } from '@omc/boss-widgets';
import utils from '@/apps/btb/common/utils';

const { getEntityColumnOptions } = common.helpers;
const initSearchObj: any = {
  currentPage: 1,
  pageSize: 100,
  orderId: '',
  merchantId: null,
  orderedAt: [],
  status: null,
  outRequestNo: null,
  sendType: null,
}

const { filterEmptyFields, sanitizeFields } = common.helpers;

export default ({ searchConds, onSearch }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [form] = Form.useForm();
  const [expand, setExpand]: any = useState(false);
  const [merchantIdOptions, setMerchantIdOptions]: any = useState([]);

  const fetchMerchants: any = async (searchObj: any) => {
    const resp: any = await apis.getBMSModule().fetchMerchantList(filterEmptyFields({
      limit: 200,
      page: 1
    }));
    const options: any = [{ value: null, label: '不限' }];
    if (resp) {
      resp.data?.rows?.forEach((item: any) => {
        options.push({
          value: item.merchantId, label: item.companyName
        });
      });
    }
    setMerchantIdOptions(options);
  };

  const fetchOrders: any = async (searchObj: any) => {
    sanitizeFields(searchObj);
    const resp: any = await apis.getBOSModule().orderList(filterEmptyFields(searchObj));
    if (resp) {
      resp.data?.list?.forEach((item: any) => item.key = item.orderId);
      resp.currentPage = searchObj.currentPage;
      if (onSearch) onSearch(resp);
    }
    form.resetFields();
  };

  useEffect(() => {
    const formData: any = {};
    formData.pageNo = searchConds.currentPage || searchObj.currentPage;
    formData.pageSize = searchConds.pageSize || searchObj.pageSize;
    formData.orderId = searchObj.orderId;
    formData.outRequestNo = searchObj.outRequestNo;
    formData.status = searchObj.status;
    formData.sendType = searchObj.sendType;
    formData.merchantId = searchObj.merchantId;

    if (searchObj.orderedAt.length === 2) {
      formData.createStartTime = searchObj.orderedAt[0].format('YYYY-MM-DD 00:00:00');
      formData.createEndTime = searchObj.orderedAt[1].format('YYYY-MM-DD 23:59:59');
    }
    (async () => {
      await fetchOrders(formData)
      await fetchMerchants();
    })();
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
      <a id="orders-export"></a>
      <div className="search-area">
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('订单号')} name="orderId" rules={[{ type: 'string', required: false }]}>
              <Input placeholder="请输入订单号" maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('第三方订单号')} name="outRequestNo" rules={[{ type: 'string', required: false }]}>
              <Input placeholder="请输入第三方订单号" maxLength={36} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('商户')} name="merchantId" >
              <Select options={merchantIdOptions} placeholder="请选择商户名称" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('下单日期')} name="orderedAt" >
              <DateRangePicker format="YYYY-MM-DD" placeholder={[
                '开始日期', '结束日期'
              ]} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={32} align="top" justify="start">
          <Col span={3}>
            <Form.Item label={$t('状态')} name="status" >
              <Select options={getEntityColumnOptions(constants.btb.order.status, [{ value: null, label: '不限' }])} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('发放类型')} name="sendType" >
              <Select options={getEntityColumnOptions(constants.btb.order.sendType, [{ value: null, label: '不限' }])} />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
          <Space size="xs">
            <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
            {(checkMyPermission('btb:orders:export')) &&
              <Button key="export" onClick={async () => {
                const values: any = form.getFieldsValue();
                let queries: any = {};
                if (values.merchantId) queries.merchantId = values.merchantId;
                if (values.orderId) queries.orderId = values.orderId;
                if (values.orderedAt[0]) queries.createStartTime = values.orderedAt[0].format('YYYY-MM-DD 00:00:00');
                if (values.orderedAt[1]) queries.createEndTime = values.orderedAt[1].format('YYYY-MM-DD 23:59:59');
                if (values.status) queries.status = values.status;
                if (values.sendType) queries.sendType = values.sendType;
                const buffResp: any = await apis.getECOModule().getOrderExportUrl(queries);
                utils.ab2str(buffResp, (resp: any) => {
                  if (!resp.success && resp.message) {
                    message.error(resp.message);
                  } else {
                    const reader: any = new FileReader();
                    reader.readAsDataURL(new Blob([buffResp])); // 转换为base64，可以直接放入a的href
                    reader.onload = function (e: any) {
                      const aElement: any = document.getElementById('orders-export'); //获取a标签元素
                      aElement.download = `B2B_卡券售卖报表_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`;
                      aElement.href = e.target.result;
                      const event = new MouseEvent('click');
                      aElement.dispatchEvent(event);
                    };
                  }
                });
              }}>导出</Button>}
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
