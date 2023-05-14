import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { Form, Select, Table, Row, Col, Input, Button, message, Space } from '@aurum/pfe-ui';
import * as commonApis from '@/common/net/apis';
import * as apis from '@/common/net/apis_activity';
import '@/assets/styles/activity/list.less';

const { Option } = Select;

const mapStateToProps = (state: any) => {
  return {
    prizeLists: state.activity.prizeLists || [],  //第二部已关联的活动列表
    rewardDependedFields: state.activity.rewardDependedFields,
  }
}

const mapDispatchToProps = (dispatch: any) => ({

});

const initSearchObj: any = {
  activId: '', // 活动编号（精准查询）
  commodityId: '',//商品ID
  commodityName: '',//商品名称
  cityCode: '',//可售卖城市code
  channel: '',//可售渠道
  shopId: '',
  activType: 3
}

export default connect(mapStateToProps, mapDispatchToProps)(({ rowSelections, prizeLists, canOnlyView = false, rewardDependedFields }: any) => {
  const { activityId }: any = useParams();
  const [activityRows, setActivityRows]: any = useState([]);
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj, activId: activityId });
  const [saleOptions, setSaleOptions]: any = useState([]);
  const [selectedRowKeys1, setSelectedRowKeys1]: any = useState([]);
  const [shopOptions, setShopOptions]: any = useState([]);

  let searchActivityRows: any = useRef([]);

  //城市选择配置
  const cityFilterCodes: any = [];
  const defaultQueryCity: any = [];
  const queryCityMap: any = {};
  const cityMap: any = {};
  cityFilterCodes.map((c: any) =>
    defaultQueryCity.push({
      code: c,
      name: queryCityMap[c]
    })
  )
  const [queryCity, setQueryCity] = useState(defaultQueryCity);
  const options = queryCity && queryCity.map((c: any) => {
    cityMap[c.cityCode] = c.cityName;
    return <Option key={c.cityCode} value={c.cityCode}>{c.cityName}</Option>
  })


  let defaultColumns: any = [
    {
      title: '商品ID',
      dataIndex: 'spuId',
      key: 'shopId',
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '售卖渠道',
      dataIndex: 'channel',
      key: 'channel',
      render: (text: any, record: any) => {
        return record.channels.toString()
      }
    },
    {
      title: '售卖城市',
      dataIndex: 'cityCode',
      render: (text: any, record: any) => {
        return record.cities.toString()
      }
    }
  ];
  const [form] = Form.useForm();

  const rowSelection = {
    selectedRowKeys: selectedRowKeys1,
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      if (!canOnlyView) {
        setSelectedRowKeys1(selectedRowKeys)
        rowSelections(selectedRows)
      } else {
        message.error('当前活动状态不可编辑！')
      }
    }
  };

  useEffect(() => {
    if (!activityId) return;
    form.resetFields();
    (async () => {
      const { data: filterObj } = await commonApis.getMerchantModule().filter();
      if (filterObj && filterObj.cities && filterObj.cities.length > 0) {
        setQueryCity(filterObj.cities);
      }
      if (filterObj && filterObj.channel && filterObj.channel.length > 0) {
        filterObj.channel.map((item: any, index: any) => {
          if (item) {
            item.label = item.v;
            item.value = item.k;
          }
        })
        setSaleOptions(filterObj.channel);
      }

      if (filterObj && filterObj.shopTypes && filterObj.shopTypes.length > 0) {
        filterObj.shopTypes.map((item: any, index: any) => {
          if (item) {
            item.label = Object.values(item)?.[0]
            item.value = Object.keys(item)?.[0]
          }
        })
        setShopOptions(filterObj.shopTypes);
      }

    })()
  }, [activityId]);

  useEffect(() => {
    if (!activityId) return;
    form.resetFields();
    (async () => {
      const searchConds = { ...searchObj, activId: activityId };
      const { data: resultObj } = await apis.getProService().activList(searchConds);
      if (resultObj && resultObj.activList) {
        resultObj.activList.map((item: any, index:any) => {
          item.key = index;
        });
      }
      setActivityRows(resultObj.activList || []);
    })()
  }, [activityId, searchObj]);

  return (
    <div className="activity-list">
      <Form layout="vertical"
        form={form}
        className="search-form"
        initialValues={searchObj}
        onFinish={(values: any) => {
          const narrowSearchObj: any = {};
          Object.keys(values).map((key) => {
            narrowSearchObj[key] = values[key];
          });
          setSearchObj({ ...searchObj, ...narrowSearchObj });
        }}
        onValuesChange={(values: any) => {
        }}
      >
        <div className="search-area">
          <Row gutter={16}>
            <Col span={3}>
              <Form.Item label={$t('商品状态')} rules={[{ type: 'string', required: false }]}>
                <Select defaultValue={'1'}>
                  <Select.Option value={'1'}>预热中/已上架</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('售卖渠道')} name="channel" rules={[{ type: 'string', required: false }]}>
                <Select allowClear placeholder={$t('不限')} options={saleOptions} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('售卖城市')} name="cityCode">
                <Select
                  showSearch
                  allowClear
                  placeholder={$t('不限')}
                  value={cityFilterCodes}
                  optionFilterProp={'children'}
                  defaultActiveFirstOption={false}
                  onChange={(value: any) => {
                    queryCityMap[value] = cityMap[value] ? cityMap[value] : queryCityMap[value]
                  }}>
                  {options}
                </Select>
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('商品ID')} name="commodityId" >
                <Input maxLength={140} placeholder="请输入商品ID" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={3}>
              <Form.Item label={$t('商品名称')} name="commodityName" >
                <Input maxLength={140} placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            {rewardDependedFields.activityType === 3 && <Col span={3}>
              <Form.Item label={$t('店铺')} name="shopId" >
                <Select allowClear placeholder={$t('不限')} options={shopOptions} />
              </Form.Item>
            </Col>}
          </Row>
          <Row gutter={16}>
            <Col span={3}>
              <Space>
                <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
                <Button htmlType="reset" onClick={(it: any) => {
                  setSearchObj(initSearchObj);
                }}>{$t('portal_reset')}</Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Form>

      <div className="table-top-wrap" >
        <Table
          rowSelection={{
            type: 'checkbox',
            ...rowSelection,
          }}
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          columns={defaultColumns}
          dataSource={activityRows}
          pagination={false}
        />
      </div>
    </div>
  )
})
