import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Form, Table, Space, Row, Col, Input, Button, Select, Tabs, TreeSelect, DatePicker, message, IconFont, Empty } from '@aurum/pfe-ui';
import { format } from 'date-fns';
import moment from 'moment';
import * as orderApis from '@/common/net/apis_order';
import '@/assets/styles/order/list.less'
import '@/assets/styles/common.less'
import ShopNavs from '@/components/ShopNavs';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
// @ts-ignore
import { timeSlot, ab2str } from '@/common/helper';
import SelectShop from '@/components/SelectShop';
const { Option } = Select;
const { RangePicker }: any = DatePicker;
const { TabPane } = Tabs;

const initSearchObj: any = {
  categoryIds: [],    //商品品类ID
  pageNum: 1,
  pageSize: 50,
  shopIds: null,         //店铺ID
  orderId: '', //订单ID
  createStartTime: '', //订单创建的开始时间
  createEndTime: '', //订单创建的结束时间
  channel: '', //订单来源
  commodityName: '', //商品名称
  payChannel: '',   //支付渠道
  orderStatus: '',         //订单状态
  phoneNo: '',  //下单手机号
  userId: '',
  skuId: '',
  spuId: '',
  orderType: -1, //订单类型
  mylFlag: '',
  payStartTime: '',
  payEndTime: '',
  refundedStartTime: '',
  refundedEndTime: '',
  partyDate: '', //活动日期
  partyStartTime: '',//活动开始时间
  storeCodeList: '',//餐厅code
}
let timeSlots: any = timeSlot();

export default ((props: any) => { 
  const [merchants, setMerchants]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [currenTab, setCurrentTab]: any = useState('-1');
  const [saleOptions, setSaleOptions]: any = useState([]);
  const [payChannels, setPayChannels]: any = useState([]);
  const [orderTypes, setOrderTypes]: any = useState([]);
  const [typeItemOptions, setTypeItemOptions]: any = useState([]);
  const [orderStatus, setOrderStatus]: any = useState([]);
  const [orderStatusHtml, setOrderStatusHtml]: any = useState([]);
  const [columns, setColumns]: any = useState([]);
  const [keyValue, setKeyValue]: any = useState('');
  const dateRange: any = useRef([]);
  const dateRangePay: any = useRef([]);
  const dateRangeRefunded: any = useRef([]);
  const [expand, setExpand]: any = useState(false);
  const [exportName, setExportName] = useState('导出');

  const filterColumns = ['giftDesc']
  let defaultColumns = [
    {
      dataIndex: 'shopId',
      key: 'shopId',
      title: '店铺ID',
      fixed: 'left',
      width: 80
    },
    {
      dataIndex: 'shopName',
      key: 'shopName',
      title: '店铺名称',
      fixed: 'left',
      width: 100
    },
    {
      dataIndex: 'orderId',
      key: 'orderId',
      fixed: 'left',
      title: '订单号',
      width: 200,
      render: (text: any) => <Link to={'/ecs/orders/detail/' + text}>{text}</Link>,
    },
    {
      dataIndex: 'createdTime',
      key: 'createdTime',
      title: '下单时间',
      width: 200,
    },
    {
      dataIndex: 'orderChannelDesc',
      key: 'orderChannelDesc',
      title: '订单来源',
      width: 100
    },
    {
      dataIndex: 'payChannelDesc',
      key: 'payChannelDesc',
      title: '支付方式',
      width: 120,
    },
    {
      dataIndex: 'userId',
      key: 'userId',
      title: '会员ID',
      width: 250,
    },
    {
      dataIndex: 'skuImage',
      key: 'skuImage',
      title: '商品',
      width: 280,
      render: (d: any, item: any, index: any) => {
        return item.goods?.map((i: any, index: any) => {
          return <div className="pro-line" key={index}>
            {i.skuImage && <img className="tableImg" src={i.skuImage} />}
            <div className="tableMess">
              <p>{i.spuName}</p>
              <p>{i.skuName}</p>
            </div>
          </div>
        })
      }
    },
    {
      dataIndex: 'price',
      key: 'price',
      title: '单价/数量',
      width: 100,
      render: (d: any, item: any, index: any) => {
        return item.goods?.map((i: any, index: any) => {
          return <div className="cout-line" key={index}>
            <div>{i.price}</div>
            <div>{i.count}件</div>
          </div>
        })
      }
    },
    {
      dataIndex: 'spuId',
      key: 'spuId',
      title: '商品ID',
      width: 80,
      render: (d: any, item: any, index: any) => {
        return item.goods?.map((i: any, index: any) => {
          return <div className="cout-line" key={index}>
            <div>{i.spuId}</div>
          </div>
        })
      }
    },
    {
      dataIndex: 'skuId',
      key: 'skuId',
      title: 'skuId',
      width: 100,
      render: (d: any, item: any, index: any) => {
        return item.goods?.map((i: any, index: any) => {
          return <div className="cout-line" key={index}>
            <div>{i.skuId}</div>
          </div>
        })
      }
    },
    {
      dataIndex: 'categoryName',
      key: 'categoryName',
      title: '商品类目',
      width: 180,
      render: (d: any, item: any, index: any) => {
        return item.goods?.map((i: any, index: any) => {
          return <div className="category-line" key={index}>
            <div>{i.categoryName}</div>
          </div>
        })
      }
    },
    {
      dataIndex: 'giftDesc',
      key: 'giftDesc',
      title: '麦有礼',
      width: 100
    },
    {
      dataIndex: 'userName',
      key: 'userName',
      title: '下单人',
      width: 100,
    },
    {
      dataIndex: 'payAmount',
      key: 'payAmount',
      title: '订单金额',
      width: 100,
      render: (d: any) => {
        return d
      }
    },
    {
      dataIndex: 'orderStatusDesc',
      key: 'orderStatusDesc',
      title: '订单状态',
      width: 120,
    },
    {
      dataIndex: 'phoneNo',
      key: 'phoneNo',
      title: '下单手机号',
      width: 120,
    }
  ]

  const partyColumns = [
    {
      dataIndex: 'storeName',
      key: 'storeName',
      title: '餐厅名称',
      width: 100
    },
    {
      dataIndex: 'partyDate',
      key: 'partyDate',
      title: '活动日期',
      width: 120
    },
    {
      dataIndex: 'partyStartTime',
      key: 'partyStartTime',
      title: '活动开始时间',
      width: 120
    },
    {
      dataIndex: 'partyEndTime',
      key: 'partyEndTime',
      title: '活动结束时间',
      width: 120
    }
  ]
  const [form] = Form.useForm();

  useEffect(() => {
    let partyDataIndex = ['storeName', 'partyDate', 'partyStartTime', 'partyEndTime'];
    if (searchObj.shopIds == 5) {
      defaultColumns = defaultColumns.concat(partyColumns);
      setColumns(defaultColumns);
    } else {
      setColumns(defaultColumns.filter((it: any) => {
        return !partyDataIndex.includes(it.dataIndex);
      }));
    }
  }, [searchObj.shopIds])


  const initData = async (shopId: any) => {
    setSearchObj({ ...searchObj, shopIds: shopId })
    const { data: filterObj } = await orderApis.getMerchantModule().filter({ shopId: shopId });
    //商品类目
    if (filterObj && filterObj.categories && filterObj.categories.length > 0) {
      modifyCategoriesData(filterObj.categories);
      setTypeItemOptions(filterObj.categories);
    }

    //订单来源
    if (filterObj && filterObj.channel && filterObj.channel.length > 0) {
      filterObj.channel.map((item: any, index: any) => {
        if (item) {
          item.key = item.k;
          item.label = item.v;
          item.value = item.k;
        }
      })
      setSaleOptions(filterObj.channel);
    }

    //支付方式
    if (filterObj && filterObj.payChannel && filterObj.payChannel.length > 0) {
      filterObj.payChannel.map((item: any, index: any) => {
        if (item) {
          item.key = item.k;
          item.label = item.v;
          item.value = item.k;
        }
      })
      setPayChannels(filterObj.payChannel);
    }

    //订单状态
    if (filterObj && filterObj.orderStatus && filterObj.orderStatus.length > 0) {
      filterObj.orderStatus.map((item: any, index: any) => {
        if (item) {
          item.key = item.k;
          item.label = item.v;
          item.value = item.k;
        }
      })
      setOrderStatus(filterObj.orderStatus);
    }

    //订单类型
    if (filterObj && filterObj.orderType && filterObj.orderType.length > 0) {
      filterObj.orderType.map((item: any, index: any) => {
        if (item) {
          item.key = item.k;
          item.label = item.v;
          item.value = item.k;
        }
      })
      setOrderTypes(filterObj.orderType);
    }
  }

  useEffect(() => {
    initData('');
  }, []);

  useEffect(() => {
    form.resetFields();
    if (searchObj.shopIds === null) {
      return;
    }
    (async () => {
      const searchConds = { ...searchObj };
      searchConds.orderStatus = currenTab == '-1' ? '' : currenTab;
      if (searchConds.categoryIds.length > 0) {
        searchConds.categoryIds = searchConds.categoryIds.join(',')
      }
      if (dateRange.current?.length > 0) {
        searchConds.createStartTime = dateRange.current[0].format('YYYY-MM-DD HH:mm:ss');
        searchConds.createEndTime = dateRange.current[1].format('YYYY-MM-DD HH:mm:ss');
      }

      //收款
      if (dateRangePay.current?.length > 0) {
        searchConds.payStartTime = dateRangePay.current[0].format('YYYY-MM-DD HH:mm:ss');
        searchConds.payEndTime = dateRangePay.current[1].format('YYYY-MM-DD HH:mm:ss');
      }
      //退款
      if (dateRangeRefunded.current?.length > 0) {
        searchConds.refundedStartTime = dateRangeRefunded.current[0].format('YYYY-MM-DD HH:mm:ss');
        searchConds.refundedEndTime = dateRangeRefunded.current[1].format('YYYY-MM-DD HH:mm:ss');
      }
      searchConds.partyDate = searchConds.partyDate ? searchConds.partyDate.format('YYYY-MM-DD') : '';
      searchConds.storeCodeList = searchConds.storeCodeList.value;
      const res = await orderApis.getMerchantModule().list(searchConds);
      if (res.success && res.data) {
        const resultObj = res.data;
        if (resultObj && resultObj.list && resultObj.list.length > 0) {
          setMerchants(resultObj.list);
          setTotalCount(resultObj?.total)
        } else {
          setMerchants([]);
          setTotalCount(resultObj?.total)
        }
      } else if(!res.success) {
        message.error(res?.message || '接口查询失败')
      }
    })()

  }, [searchObj]);

  useEffect(() => {
    if (!orderStatus.length) return;
    let _html = orderStatus.map((item: any) => {
      return <TabPane key={item.value} tab={item.label}></TabPane>
    })
    setOrderStatusHtml(_html);
  }, [orderStatus])

  const handleTabClick = async (e: any) => {
    if (e) {
      setCurrentTab(e)
      const narrowSearchObj: any = searchObj;
      narrowSearchObj.pageNum = 1;
      narrowSearchObj.orderStatus = e;
      setSearchObj({ ...searchObj, ...narrowSearchObj });
    }
  };

  const modifyCategoriesData = async (data: any) => {
    if (data && data.length > 0) {
      data.map((item: any) => {
        item.key = item.ruleId;
        item.value = item.ruleId;
        item.title = item.name;
        if (item.subCategories && item.subCategories.length > 0) {
          modifyCategoriesData(item.subCategories);
          item.children = item.subCategories
        }
      });
    }
  };

  const onChange = (value: any, dateString: any) => {
    dateRange.current = value;
  }

  const onChange1 = (value: any, dateString: any) => {
    dateRangePay.current = value;
  }

  const onChange2 = (value: any, dateString: any) => {
    dateRangeRefunded.current = value;
  }

  const backFunc = async (shopId: any) => {
    initData(shopId)
  }

  const callSearchFunc = (orderId: any) => {
    (async () => {
      let params: any = {
        orderId
      }
      try {
        const { data: result, message: resultMessage } = await orderApis.getMerchantModule().orderCheck(params);
        if (result) {
          const { history } = props;
          history.push('/ecs/orders/detail/' + orderId);
        } else {
          message.error('订单号不存在!')
        }
      } catch (e) {
        message.error('接口异常，请重试!')
      }
    })()
  }

  const exportExcel = async () => {
    if (!merchants.length) {
      message.error('请重新选择')
      return;
    }

    const searchConds = { ...searchObj };
    searchConds.orderStatus = currenTab == '-1' ? '' : currenTab;
    if (searchConds.categoryIds.length > 0) {
      searchConds.categoryIds = searchConds.categoryIds.join(',')
    }
    if (dateRange.current?.length > 0) {
      searchConds.createStartTime = dateRange.current[0].format('YYYY-MM-DD HH:mm:ss');
      searchConds.createEndTime = dateRange.current[1].format('YYYY-MM-DD HH:mm:ss');
    }
    //收款
    if (dateRangePay.current?.length > 0) {
      searchConds.payStartTime = dateRangePay.current[0].format('YYYY-MM-DD HH:mm:ss');
      searchConds.payEndTime = dateRangePay.current[1].format('YYYY-MM-DD HH:mm:ss');
    }
    //退款
    if (dateRangeRefunded.current?.length > 0) {
      searchConds.refundedStartTime = dateRangeRefunded.current[0].format('YYYY-MM-DD HH:mm:ss');
      searchConds.refundedEndTime = dateRangeRefunded.current[1].format('YYYY-MM-DD HH:mm:ss');
    }

    const validateRes: any = await orderApis.getMerchantModule().exportValidate(searchConds);
    if (!validateRes.success) {
      message.error(validateRes.message)
    } else {
      setExportName('导出中 ...')
      try {
        const buffResp: any = await orderApis.getMerchantModule().export({ ...searchConds, totalCount: validateRes.data });
        ab2str(buffResp, (resp: any) => {
          if (!resp.success && resp.message) {
            message.error(resp.message);
          } else {
            const reader: any = new FileReader();
            reader.readAsDataURL(new Blob([buffResp])); // 转换为base64，可以直接放入a的href
            reader.onload = function (e: any) {
              const aElement: any = document.getElementById('orders-export'); //获取a标签元素
              aElement.download = `订单列表_${format(new Date(), 'yyyyMMddHHmmss')}.csv`;
              aElement.href = e.target.result;
              const event = new MouseEvent('click');
              aElement.dispatchEvent(event);
            };
          }
          setExportName('导出')
        });
      } catch {
        setExportName('导出')
      }
    }
  }

  return (
    <div className="order-list table-container">
      <Form layout="vertical"
        form={form}
        className="search-form"
        initialValues={searchObj}
        onFinish={(values: any) => {
          const narrowSearchObj: any = {};
          Object.keys(values).map((key) => {
            narrowSearchObj[key] = values[key];
          });
          narrowSearchObj.pageNum = 1;
          setSearchObj({ ...searchObj, ...narrowSearchObj });
        }}
        onValuesChange={(values: any) => {
        }}
      >
        <a id="orders-export"></a>
        <div className="search-nav">
          <ShopNavs callBackFunc={backFunc} />
        </div>
        <div className="search-area">
          <Row gutter={32}>
            <Col span={3}>
              <Form.Item label={$t('订单编号')} name='orderId'>
                <Input style={{ width: '100%' }} placeholder="请输入订单编号" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('下单手机号')} name='phoneNo' rules={[{ type: 'string', required: false }]}>
                <Input placeholder="请输入下单手机号" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('下单时间')}>
                <RangePicker
                  picker="date"
                  style={{ width: '100%' }}
                  showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                  onChange={onChange}
                  key={keyValue}
                  disabledDate={(current: any) => {
                    return current && current > moment().endOf('day');
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('商品类目')} name='categoryIds'>
                <TreeSelect
                  style={{ width: '100%' }}
                  dropdownStyle={{ maxHeight: 800, overflow: 'auto' }}
                  placeholder={$t('请选择')}
                  showSearch={false}
                  allowClear
                  treeCheckable={true}
                  showCheckedStrategy='SHOW_PARENT'
                  treeData={typeItemOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={32}>
            <Col span={3}>
              <Form.Item label={$t('商品名称')} name='commodityName' rules={[{ type: 'string', required: false }]}>
                <Input maxLength={140} placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('订单来源')} name='channel' >
                <Select allowClear placeholder={$t('不限')} options={saleOptions} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('支付方式')} name='payChannel' >
                <Select allowClear placeholder={$t('不限')} options={payChannels} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('会员ID')} name='userId' >
                <Input style={{ width: '100%' }} placeholder="请输入会员ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={32} style={{ display: expand ? '' : 'none' }}>
            <Col span={3}>
              <Form.Item label={$t('skuId')} name='skuId' >
                <Input style={{ width: '100%' }} placeholder="请输入商品skuId" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('商品ID')} name='spuId' >
                <Input style={{ width: '100%' }} placeholder="请输入商品ID" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('收款时间')}>
                <RangePicker
                  picker="date"
                  showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                  onChange={onChange1}
                  key={keyValue}
                  disabledDate={(current: any) => {
                    return current && current > moment().endOf('day');
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('退款时间')}>
                <RangePicker
                  picker="date"
                  showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                  onChange={onChange2}
                  key={keyValue}
                  disabledDate={(current: any) => {
                    return current && current > moment().endOf('day');
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={32} style={{ display: expand ? '' : 'none' }}>
            {(!searchObj.shopIds || searchObj.shopIds == 1 || searchObj.shopIds == 2 || searchObj.shopIds == 3) &&
              <Col span={3}><Form.Item label={$t('订单类型')} name='orderType' >
                <Select allowClear options={orderTypes} />
              </Form.Item></Col>}
            <Col span={3}><Form.Item label={$t('麦有礼')} name='mylFlag' >
              <Select
                placeholder="不限"
                allowClear
              >
                <Option value={1}>是</Option>
                <Option value={0}>否</Option>
              </Select>
            </Form.Item></Col>
            {(!searchObj.shopIds || searchObj.shopIds == 5) && <Col span={3}><Form.Item name="partyDate" label="活动日期">
              <DatePicker format={'YYYY/MM/DD'} />
            </Form.Item></Col>}

            {(!searchObj.shopIds || searchObj.shopIds == 5) && <Col span={3}><Form.Item name="partyStartTime" label="活动开始时间">
              <Select allowClear options={timeSlots} />
            </Form.Item></Col>}

            {(!searchObj.shopIds || searchObj.shopIds == 5) && <Col span={3}><Form.Item name="storeCodeList" label="餐厅">
              <SelectShop mode='multiple' />
            </Form.Item></Col>}
          </Row>
          <Row gutter={32}>
            <Col span={6}>
              <Space size={'xs'}>
                <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
                <Button htmlType="reset" onClick={(it: any) => {
                  setKeyValue(new Date());
                  dateRange.current = [];
                  dateRangePay.current = [];
                  dateRangeRefunded.current = [];
                  let shopIds = searchObj.shopIds;
                  setSearchObj({ ...initSearchObj, shopIds: shopIds });
                }}>{$t('portal_reset')}</Button>

                <Button disabled={!checkMyPermission('ecs:ecsLego:export')} onClick={(it: any) => {
                  if (!searchObj.shopIds) {
                    message.error('请选择店铺');
                    return;
                  }
                  if (exportName !== '导出') {
                    return
                  } else {
                    exportExcel();
                  }
                }}>{exportName}</Button>
                <a
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setExpand(!expand);
                  }}
                >
                  {expand ? '隐藏查询条件' : '全部查询条件'} {expand ? <IconFont type="icon-xiangshang" /> : <IconFont type="icon-xiangxia" />}
                </a>
              </Space>
            </Col>
          </Row>
        </div>
      </Form>

      <Tabs defaultActiveKey={currenTab} onChange={(e) => { handleTabClick(e) }} type="card" custype="common">
        {orderStatusHtml}
      </Tabs>
      <div className="table-top-wrap" >
        {merchants?.length > 0 && <Table
          scroll={{ x: '100%' }}
          rowKey={record => record.orderId}
          tableLayout="fixed"
          columns={columns}
          dataSource={merchants}
          expanded
          allFilterColumns={filterColumns}
          pagination={{
            hideOnSinglePage: false,
            pageSize: searchObj.pageSize,
            defaultPageSize: 50,
            showSizeChanger: true,
            showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
            current: searchObj.pageNum,
            total: totalCount,
            onShowSizeChange: (current: any, size: any) => { },
            onChange: (pageNum: any, pageSize: any) => {
              setSearchObj({ ...searchObj, pageNum, pageSize });
            },
            position: ['bottomLeft']
          }}
        />}

        {!merchants || merchants.length == 0 &&
          <Empty />
        }
      </div>
    </div >
  )
});
