import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Form, Select, Table, Space, Row, Col, Input, Button, DatePicker, Tabs, message, Menu, TreeSelect } from '@aurum/pfe-ui';
import moment from 'moment';
import * as apis from '@/common/net/apis_auction';
import * as apis1 from '@/common/net/apis_activity';
import constants from '@/common/constants';
import '@/assets/styles/auction/list.less';
import { getAtivityTypeOptions, getAuctionStateOptions } from '@/common/helper';
const { RangePicker }: any = DatePicker;
const { TabPane } = Tabs;
const initSearchObj: any = {
  pageNum: 1,
  pageSize: 10,
  activityId: '', // 活动编号（精准查询）
  name: '', // 活动名称（模糊查询）
  beginTime: null, // 活动开始日期
  endTime: null, // 活动结束日期  
  activityType: '',//活动类型
  activityStatus: '', //活动状态
  addOperator: '',
}

export default ((props: any) => {
  const [acutionRows, setAcutionRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [currenTab, setCurrentTab]: any = useState('0');

  const TAB_RECORD = "1";

  let defaultColumns: any = [
    {
      title: $t('商品ID'),
      dataIndex: 'spuId',
      key: 'spuId',
      width: 100,
    },
    {
      title: $t('商品名称'),
      dataIndex: 'spuName',
      key: 'spuName',
      width: 150,
    },
    {
      title: $t('活动名称'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: any, record: any) => <Link to={'/ecs/activity/edit/' + record.activityId + '/isShow'}>{text}</Link>
    },
    {
      title: $t('活动编号'),
      dataIndex: 'activityId',
      key: 'activityId',
      width: 120,
    },
    {
      title: $t('活动类型'),
      dataIndex: 'activityTypeDesc',
      key: 'activityTypeDesc',
      width: 100,
    },
    {
      title: '活动开始时间',
      dataIndex: 'beginTime',
      key: 'beginTime',
      width: 175,
    },
    {
      title: '活动结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 175,
    },
    {
      title: '竞拍状态',
      dataIndex: 'statusDesc',
      key: 'statusDesc',
      width: 100,
    },
    {
      title: '参与人',
      dataIndex: 'userName',
      key: 'userName',
      width: 175,
    },
  ];

  let defaultRecordColumns: any = [
    {
      title: $t('商品ID'),
      dataIndex: 'spuId',
      key: 'spuId',
      width: 120,
    },
    {
      title: $t('商品名称'),
      dataIndex: 'spuName',
      key: 'spuName',
      width: 150,
    },
    {
      title: $t('活动名称'),
      dataIndex: 'activityName',
      key: 'activityName',
      width: 150,
      render: (text: any, record: any) => <Link to={'/ecs/activity/edit/' + record.activityId}>{text}</Link>
    },
    {
      title: $t('活动编号'),
      dataIndex: 'activityId',
      key: 'activityId',
      width: 120,
    },
    {
      title: $t('活动类型'),
      dataIndex: 'activityTypeDesc',
      key: 'activityTypeDesc',
      width: 100,
    },
    {
      title: '活动开始时间',
      dataIndex: 'beginTime',
      key: 'beginTime',
      width: 175,
    },
    {
      title: '活动结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 175,
    },
    {
      title: '出价次数',
      dataIndex: 'totalBidSeq',
      key: 'totalBidSeq',
      width: 100,
      render: (text: any, record: any) => <text>{text}次</text>
    },
    {
      title: $t('竞拍状态'),
      dataIndex: 'statusDesc',
      key: 'statusDesc',
      width: 120,
    },
    {
      title: $t('参与人'),
      dataIndex: 'nickName',
      key: 'nickName',
      width: 175,
    },
    {
      title: $t('出价'),
      dataIndex: 'payObjValueDesc',
      key: 'payObjValueDesc',
      width: 120,
    },
  ];
  const [columns, setColumns]: any = useState(defaultColumns);
  const [statusOptions, setStatusOptions]: any = useState([]);
  const [typeOptions, setTypeOptions]: any = useState([]);
  const [typeItemOptions, setTypeItemOptions]: any = useState([]);

  const [form] = Form.useForm();

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    form.resetFields();
    const searchConds = { ...searchObj };
    requsetList(searchConds);
  }, [searchObj]);

  useEffect(() => {
    form.resetFields();
    const searchConds = { ...searchObj };
    requsetList(searchConds);
  }, [currenTab]);

  const initData = async () => {
    const { data: filterObj } = await apis.getAcutionList().filter();
    if (filterObj && filterObj.categories && filterObj.categories.length > 0) {
      modifyCategoriesData(filterObj.categories);
      setTypeItemOptions(filterObj.categories);
    }
    setStatusOptions([{ label: '不限状态', value: -1 }].concat(getAuctionStateOptions()));
    setTypeOptions(getAtivityTypeOptions().filter((item: any) => {
      return (item.value === constants.activity.TYPE_CODE.RED_PACKET) ? true : false;
    }));
  }

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

  const requsetList = async (searchConds: any) => {
    try {
      let resp: any = null;
      if (searchConds && searchConds.categoryRuleIds && searchConds.categoryRuleIds.length > 0) {
        searchConds.categoryRuleIds = searchConds.categoryRuleIds.join(',')
      }
      if (currenTab == TAB_RECORD) {
        resp = await apis1.getActivityService().recordList(searchConds);
      } else {
        resp = await apis1.getActivityService().signList(searchConds);
      }
      resetTableColumns();
      if (resp.success) {
        if (resp.data && resp.data.list) {
          setAcutionRows(resp.data.list);
          setTotalCount(resp.data.total);
        } else {
          setAcutionRows([]);
          setTotalCount(0);
        }
      } else {
        throw new Error('Failed')
      }
    } catch (e) {
    }
  };

  const handleTabClick = async (e: any) => {
    if (e) {
      setCurrentTab(e)
    }
  };

  const resetTableColumns = () => {
    let tableColumns = getTableColumns();
    setColumns(tableColumns);
  }

  const getTableColumns = () => {
    if (currenTab == TAB_RECORD) {
      return defaultRecordColumns;
    } else {
      return defaultColumns;
    }
  }

  return (
    <div className="acution-list table-container">
      <Form layout="vertical"
        form={form}
        className="search-form"
        initialValues={searchObj}
        onFinish={(values: any) => {
          const narrowSearchObj: any = {};
          Object.keys(values).map((key) => {
            if (key === 'dateRange') {
              if (values.dateRange) {
                if (values.dateRange[0]) narrowSearchObj.activityStartTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
                if (values.dateRange[1]) narrowSearchObj.activityEndTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
                if (narrowSearchObj.activityStartTime && narrowSearchObj.activityEndTime) {
                  narrowSearchObj.dateRange = [moment(narrowSearchObj.activityStartTime, 'YYYY-MM-DD HH:mm:ss'), moment(narrowSearchObj.activityEndTime, 'YYYY-MM-DD HH:mm:ss')];
                }
              } else {
                narrowSearchObj.activityStartTime = narrowSearchObj.activityEndTime = null;
                narrowSearchObj.dateRange = [];
              }
            } else if (key === 'activityStatus' && values[key] === -1) {
              narrowSearchObj[key] = null;
            } else {
              narrowSearchObj[key] = values[key];
            }
          });
          narrowSearchObj.pageNum = 1;
          setSearchObj({ ...searchObj, ...narrowSearchObj });
        }}
        onValuesChange={(values: any) => {
        }}
      >
        <div className="search-area">
          <Row gutter={32}>
            <Col span={3}>
              <Form.Item label={$t('活动编号')} name="activityId" rules={[{ type: 'string', required: false }]}>
                <Input placeholder="请输入活动编号" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('活动名称')} name="activityName" >
                <Input maxLength={15} placeholder="请输入活动名称" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('活动类型')} name="activityType" >
                <Select placeholder={$t('不限类型')} options={typeOptions} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('状态')} name="status">
                <Select placeholder={$t('不限状态')} options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={32}>
            <Col span={3}>
              <Form.Item label={$t('活动期间')} name="dateRange">
                <RangePicker
                  picker="date"
                  format="YYYY-MM-DD HH:mm:ss"
                  showTime
                  allowEmpty={[true, true]}
                  value={[moment(searchObj.activityStartTime, 'YYYY-MM-DD HH:mm:ss'), moment(searchObj.activityEndTime, 'YYYY-MM-DD HH:mm:ss')]}
                />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('会员ID')} name="userId" rules={[{ type: 'string', required: false }]}>
                <Input placeholder="请输入会员ID" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('会员手机号')} name="phone" >
                <Input maxLength={11} placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('商品类目')} name="categoryRuleIds" >
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
              <Form.Item label={$t('商品名称')} name="spuName">
                <Input placeholder="请输入商品名称" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('商品ID')} name="spuId">
                <Input placeholder="请输入商品ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={32}>
            <Col span={3}>
              <Space size='xs'>
                <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
                <Button htmlType="reset" onClick={(it: any) => {
                  setSearchObj(initSearchObj);
                }}>{$t('portal_reset')}</Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Form>

      <Tabs defaultActiveKey={currenTab} onChange={(e) => { handleTabClick(e) }} type="card" custype="common">
        <TabPane key="0" tab='报名记录'></TabPane>
        <TabPane key="1" tab='出价记录'></TabPane>
      </Tabs>
      <div className="table-top-wrap" >
        <Table
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          columns={columns}
          dataSource={acutionRows}
          pagination={{
            pageSize: searchObj.pageSize,
            showQuickJumper: true,
            showSizeChanger: true,
            defaultPageSize: 50,
            showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
            current: searchObj.pageNum,
            total: totalCount,
            onShowSizeChange: (current: any, size: any) => { },
            onChange: (page: any, pageSize: any) => {
              setSearchObj({ ...searchObj, pageNum: page, pageSize });
            },
            position: ['bottomLeft']
          }} />
      </div>
    </div>
  )
})