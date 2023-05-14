import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, Select, message, Radio } from '@aurum/pfe-ui';
import moment from 'moment';
import { DateRangePicker } from '@omc/boss-widgets';
import common from '@omc/common';
import * as helper from '@/apps/openapi/common/helper';
import * as apis from '@/apps/openapi/common/apis';

const { filterEmptyFields, sanitizeFields } = common.helpers;

const initSearchObj: any = {
  merchantId: null,
  appId: null,
  apiId: null,
  startTime: null,
  endTime: null,
  isHour: 0,
  timeRange: [
    moment().startOf('day'),
    moment().endOf('day'),
  ]
}

export default ({ searchConds, onSearchBegin, onSearch, onTimeChange }: any) => {
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [merchantOptions, setMerchantOptions]: any = useState([]);
  const [appOptions, setAppOptions]: any = useState([]);
  const [apiOptions, setApiOptions]: any = useState([]);
  const [byInterval, setByInterval]: any = useState('today');

  const [form] = Form.useForm();

  useEffect(() => {
    fetchGatewayStats(searchObj);
    (async () => {
      setMerchantOptions(await helper.getMerchantOptions('merchantId'));
      setApiOptions(await helper.getApiOptions({ pageSize: 999 }));
    })();
  }, []);

  useEffect(() => {
    form.resetFields();
  }, [searchObj]);

  useEffect(() => {
    if (searchConds?.isHour !== undefined) {
      const newSearchObj: any = { ...searchObj, isHour: searchConds.isHour };
      fetchGatewayStats(newSearchObj);
      setSearchObj(newSearchObj);
    }
  }, [searchConds])

  useEffect(() => {
    if (typeof onTimeChange === 'function') onTimeChange(searchObj.timeRange);
  }, [searchObj.timeRange]);

  const fetchGatewayStats: any = async (searchObj: any) => {
    if (onSearchBegin) onSearchBegin();
    if (searchObj.timeRange.length == 2) {
      if (searchObj.timeRange?.[0]) searchObj.startTime = searchObj.timeRange[0].format('YYYY-MM-DD HH:mm:ss');
      if (searchObj.timeRange?.[1]) searchObj.endTime = searchObj.timeRange[1].format('YYYY-MM-DD HH:mm:ss');

      const endMSeconds = new Date(searchObj.endTime).getTime();
      const startMSeconds = new Date(searchObj.startTime).getTime();
      const intervalSeconds: any = Math.floor((endMSeconds - startMSeconds) / 1000);
      if (intervalSeconds > 86400) searchObj.isHour = 1; // 强制
    }

    sanitizeFields(searchObj);
    const resp: any = await apis.getGatewayModule().dashboard(filterEmptyFields({ ...searchObj, timeRange: null }));
    if (resp.code !== 'SUCCESS') {
      message.warn(resp.msg);
    } else {
      resp.searchObj = searchObj;
      if (onSearch) onSearch(resp);
    }
  };

  const onIntervalChage: any = (intervalAlias: any) => {
    if (intervalAlias === 'today') {
      searchObj.timeRange = [
        moment().startOf('day'),
        moment().endOf('day')
      ]
    } else if (intervalAlias === 'yesterday') {
      searchObj.timeRange = [
        moment().subtract(1, 'days').startOf('day'),
        moment().subtract(1, 'days').endOf('day')
      ]
    } else if (intervalAlias === '7days') {
      searchObj.timeRange = [
        moment().subtract(6, 'days').startOf('day'),
        moment().endOf('day')
      ]
    }
    setByInterval(intervalAlias);

    fetchGatewayStats(searchObj);
    setSearchObj({ ...searchObj });
  };

  return (
    <Form
      layout="vertical"
      form={form}
      className="search-form"
      initialValues={searchObj}
      onFinish={(values: any) => {
        fetchGatewayStats({ ...values, isHour: searchObj.isHour });
      }}
      onValuesChange={(changedValues: any, values: any) => {
        if ('merchantId' in changedValues) {
          (async () => {
            if (changedValues.merchantId) {
              const appOpts: any = await helper.getPublishedAppsOptions({ merchantId: changedValues.merchantId }, 'appId');
              setAppOptions(appOpts);
              setApiOptions([]);
            } else {
              setAppOptions([]);
              setApiOptions(await helper.getApiOptions({ pageSize: 999 }));
            }
            form.setFieldsValue({ appId: null, apiId: null });
          })();
        } else if ('appId' in changedValues) {
          if (changedValues.appId) {
            (async () => {
              setApiOptions(await helper.getSubscribedApiOptions({
                pageSize: 999,
                merchantId: values.merchantId,
                appId: changedValues.appId,
              }, 'apiId'));
            })();
          } else {
            setApiOptions([]);
          }
          form.setFieldsValue({ apiId: null });
        } else if ('timeRange' in changedValues) {
        }
      }}
    >
      <div className="search-area">
        <Row gutter={32} align="bottom">
          <Col span={3}>
            <Form.Item label={$t('选择日期')} name="timeRange" >
              <DateRangePicker
                allowClear={false}
                showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                format="YYYY-MM-DD HH:mm:ss"
                disabledDate={(current: any) => current && current > moment().endOf('day')}
                onOpenChange={(isOpen: any, value: any) => {
                  if (!isOpen) {
                    const timeRange: any = form.getFieldValue('timeRange');
                    if (timeRange.length < 2) return;

                    const DATE_FORMAT: any = "YYYY-MM-DD HH:mm:ss";

                    const tooLate: any = timeRange[1] && timeRange[1].diff(timeRange[0], 'days') > 7;
                    if (tooLate) {
                      timeRange[1] = moment(timeRange[0].format(DATE_FORMAT), DATE_FORMAT).add(7, 'days');
                      searchObj.timeRange = [...timeRange];
                      message.warn('日期范围不能超过7天，自动修正为7天');
                      // setSearchObj({ ...searchObj });
                    }
                    searchObj.timeRange = [...timeRange];
                    setSearchObj({ ...searchObj });

                    // byInterval 设置
                    let today: any = moment();
                    let yesterday: any = moment().subtract(1, 'days');
                    let days7: any = moment().subtract(7, 'days');

                    if (timeRange[0].format(DATE_FORMAT) === today.startOf('day').format(DATE_FORMAT)
                      && timeRange[1].format(DATE_FORMAT) === today.endOf('day').format(DATE_FORMAT)) {
                      setByInterval('today');
                    } else if (timeRange[0].format(DATE_FORMAT) === yesterday.startOf('day').format(DATE_FORMAT)
                      && timeRange[1].format(DATE_FORMAT) === yesterday.endOf('day').format(DATE_FORMAT)) {
                      setByInterval('yesterday');
                    } else if (timeRange[0].format(DATE_FORMAT) === days7.startOf('day').format(DATE_FORMAT)
                      && timeRange[1].format(DATE_FORMAT) === moment().endOf('day').format(DATE_FORMAT)) {
                      setByInterval('7days');
                    } else {
                      setByInterval(null);
                    }
                  }
                }}
                placeholder={[
                  '开始时间', '结束时间'
                ]} />
            </Form.Item>
          </Col>
          <Col span={3}>
            <div className="by-day">
              <Radio.Group defaultValue="today" buttonStyle="solid">
                <Radio.Button value="today" onClick={() => onIntervalChage('today')}>今天</Radio.Button>
                <Radio.Button value="yesterday" onClick={() => onIntervalChage('yesterday')}>昨天</Radio.Button>
                <Radio.Button value="7days" onClick={() => onIntervalChage('7days')}>近七天</Radio.Button>
              </Radio.Group>
            </div>
          </Col>
        </Row>
        <Row gutter={32} align="bottom">
          <Col span={3}>
            <Form.Item label={$t('商户')} name="merchantId" >
              <Select
                showSearch
                options={[{ value: null, label: '不限' }, ...merchantOptions]}
                placeholder="请选择商户名称"
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('应用')} name="appId">
              <Select
                options={[{ value: null, label: '不限' }, ...appOptions]}
                placeholder="请选择应用名称" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item label={$t('API')} name="apiId" >
              <Select
                showSearch
                options={[{ value: null, label: '不限' }, ...apiOptions]}
                placeholder="请选择API"
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Button className="non-input-field" type="primary" htmlType="submit">{$t('portal_search')}</Button>
          </Col>
        </Row>
      </div>
    </Form>
  )
}
