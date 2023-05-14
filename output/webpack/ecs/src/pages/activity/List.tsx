import React, { useState, useEffect } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Form, Select, Table, Space, Row, Col, Input, InputNumber, Button, DatePicker, Popconfirm, message, Modal, Tag } from '@aurum/pfe-ui';
import moment from 'moment';
// @ts-ignore 
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';

const { RangePicker }: any = DatePicker;

import * as apis from '@/common/net/apis_activity';
import * as activityActions from '@/redux/actions/activityActions';
import constants from '@/common/constants';
import { getActivityStateColor, getAtivityStateLabel, getAtivityTypeLabel, getAtivityStateOptions, getEachOptions } from '@/common/helper';
import '@/assets/styles/activity/list.less';
import { useRef } from 'react';

const mapStateToProps = (state: any) => {
  return {
    activities: state.activity.activities || {},
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  fetchList: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_LIST_ASYNC,
    payload,
  })
});

const initSearchObj: any = {
  pageNum: 1,
  pageSize: 10,
  activityId: '', // 活动编号（精准查询）
  activityName: '', // 活动名称（模糊查询）
  activityStartTime: null, // 活动开始日期
  activityEndTime: null, // 活动结束日期  
  activityType: '',//活动类型
  activityStatus: '', //活动状态
  addOperator: '',
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ activities, fetchList, history }: any) => {
  const [activityRows, setActivityRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [searchObj, setSearchObj]: any = useState({ ...initSearchObj });
  const [statusObj, notifyStatusChange]: any = useState({});
  const [downVisible, setDownVisible]: any = useState(false);
  const [statusOptions, setStatusOptions]: any = useState([]);
  const [typeOptions, setTypeOptions]: any = useState([]);
  const curId: any = useRef('');
  const tips: any = useRef('');

  let defaultColumns: any = [
    {
      title: $t('活动编号'),
      dataIndex: 'activityId',
      key: 'activityId',
    },
    {
      title: $t('活动名称'),
      dataIndex: 'activityName',
      key: 'activityName',
      render: (text: any, record: any) => {
        let link = <Link to={'/ecs/activity/edit/' + record?.activityId + '/isShow'}>{text}</Link>;
        if (record.activityType === 3) {
          link = <Link to={'/ecs/theme/edit/' + record?.activityId + '/isShow'}>{text}</Link>;
        }
        return link
      }
    },
    {
      title: $t('活动类型'),
      dataIndex: 'activityTypeDesc',
      key: 'activityTypeDesc',
    },
    {
      title: $t('活动排序'),
      dataIndex: 'sortNo',
      key: 'sortNo',
      render: (text: any, fields: any) => (
        <span>{fields.sortNo !== -1 ? fields.sortNo : '/'}</span>
      ),
    },
    {
      title: '活动开始时间',
      dataIndex: 'activityStartTime',
      key: 'activityStartTime',
    },
    {
      title: '活动结束时间',
      dataIndex: 'activityEndTime',
      key: 'activityEndTime',
    },
    {
      title: $t('更新时间'),
      dataIndex: 'activityUpdateTime',
      key: 'activityUpdateTime',
      render: (text: any, fields: any) => (
        <span>{fields.activityUpdateTime}</span>
      ),
    },
    {
      title: $t('状态'),
      dataIndex: 'activityStatus',
      key: 'activityStatus',
      render: (value: any, fields: any) => {
       return <div className='activityStatus'><span className={`tag-${getActivityStateColor(value)}`}></span>{fields.activityStatusDesc}</div>
      },
    },
    {
      title: $t('Action'),
      key: 'action',
      fixed: 'right',
      render: (text: any, record: any) => {
        const actionOnline: any = <Popconfirm icon=""  key="action-online" onConfirm={() => {
          notifyStatusChange({ id: record.activityId, status: constants.activity.STATE_CODE.ONLINE });
        }} title="确认要上线吗？" okText="确认" cancelText="取消">
          <a key="online" type="link">{$t('上线')}</a>
        </Popconfirm>
        const actionOffline: any = <a key="offline" type="link" onClick={() => {
          downTip(record.activityId);
        }}>{$t('下线')}</a>
        const ationEdit: any = <Link key="action-edit" to={'/ecs/activity/edit/' + record.activityId}>编辑</Link>;
        const ationThemeEdit: any = <Link key="action-edit" to={'/ecs/theme/edit/' + record.activityId}>编辑</Link>;
        const actions: any = [];
        if (record && record.opts && record.opts.length > 0) {
          record.opts.map((item: any) => {
            if (item.optCode === 'down' && checkMyPermission('ecs:ecsLego:activitiesdown')) {
              actions.push(actionOffline);
            } else if (item.optCode === 'edit' && checkMyPermission('ecs:ecsLego:activitiesEdit')) {
              if (record.activityType === 3) {
                actions.push(ationThemeEdit);
              } else if (record.activityType !== 3) {
                actions.push(ationEdit);
              }
            } else if (item.optCode === 'up' && checkMyPermission('ecs:ecsLego:activitiesup')) {
              actions.push(actionOnline);
            }
          });
        } else {
          actions.push(<span key="none">/</span>);
        }

        return (
          <Space size="small">
            {actions}
          </Space>
        )
      },
    }
  ];

  useEffect(() => {
    (async function () {
      let { data: resp } = await apis.getActivityService().filter({});
      if (resp.activityTypes?.length) {
        setTypeOptions(getEachOptions(resp.activityTypes))
      }
    })()
  }, [])

  useEffect(() => {
    if (statusObj.id) {
      let actionLabel: string = '[动作]';
      (async function () {
        try {
          let resp: any = null;
          if (statusObj.status === constants.activity.STATE_CODE.OFFLINE) {
            actionLabel = '下线';
            resp = await apis.getActivityService().unpublish({ activityId: statusObj.id });
          } else if (statusObj.status === constants.activity.STATE_CODE.ONLINE) {
            actionLabel = '上线'
            resp = await apis.getActivityService().publish({ activityId: statusObj.id });
          }
          if (resp.success) {
            message.success(actionLabel + '成功');
            fetchList(searchObj);
          } else {
            message.error(resp.message)
          }
        } catch (e) {
          message.error(actionLabel + '失败');
        }
      })();
    }
  }, [statusObj])


  const [form] = Form.useForm();

  useEffect(() => {
    setStatusOptions([{ label: '不限状态', value: -1 }].concat(getAtivityStateOptions()));
  }, []);

  useEffect(() => {
    form.resetFields();
    const searchConds: any = {};
    Object.keys(searchObj).map(key => {
      if (!(key === 'dateRange' || searchObj[key] === undefined || searchObj[key] === '')) {
        searchConds[key] = searchObj[key];
      }
    })
    fetchList(searchConds)
  }, [searchObj]);

  useEffect(() => {
    if (activities.data) {
      const activityRows = activities.data.list;
      setTotalCount(activities.data.total);
      if (activityRows) {
        activityRows.map((item: any) => {
          item.key = item.activityId;
        });
      }
      setActivityRows(activityRows);
    }
  }, [activities]);

  const downTip = (activityId: any) => {
    (async function () {
      try {
        let resp: any = null;
        resp = await apis.getActivityService().downTips({ activityId: activityId });
        if (resp.success) {
          tips.current = resp.data?.tips || '确认下线活动吗？'
          curId.current = activityId;
          setDownVisible(true);
        } else {
          throw new Error('Failed')
        }
      } catch (e) {
        message.error('下线失败');
      }
    })();
  }

  const hideModal = () => {
    setDownVisible(false);
  }

  const onOk = () => {
    notifyStatusChange({ id: curId.current, status: constants.activity.STATE_CODE.OFFLINE });
    setDownVisible(false);
  }

  return (
    <div className="activity-list">
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
                <Input maxLength={140} placeholder="请输入活动名称" />
                {/* <InputNumber priceMode /> */}
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('活动类型')} name="activityType" >
                <Select placeholder={$t('不限类型')} options={typeOptions} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('状态')} name="activityStatus">
                <Select placeholder={$t('不限状态')} options={statusOptions} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label={$t('活动期间')} name="dateRange">
                <RangePicker
                  picker="date"
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm:ss"
                  showTime
                  allowEmpty={[true, true]}
                  value={[moment(searchObj.activityStartTime, 'YYYY-MM-DD HH:mm:ss'), moment(searchObj.activityEndTime, 'YYYY-MM-DD HH:mm:ss')]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={32}>
            <Col span={6}>
              <Space size='xs'>
                <Button type="primary" htmlType="submit">{$t('portal_search')}</Button>
                <Button htmlType="reset" onClick={(it: any) => {
                  setSearchObj(initSearchObj);
                }}>{$t('portal_reset')}</Button>
                {checkMyPermission('ecs:ecsLego:themeCreate') && <Link to="/ecs/activity/edit">
                  <Button>新建活动</Button>
                </Link>}
                {checkMyPermission('ecs:ecsLego:activityCreate') && <Link to="/ecs/theme/edit">
                  <Button>新建主题</Button>
                </Link>}
              </Space>
            </Col>
          </Row>
        </div>
      </Form>

      <div className="table-top-wrap" >
        <Table
          scroll={{ x: '100%' }}
          rowKey='activityId'
          tableLayout="fixed"
          columns={defaultColumns}
          dataSource={activityRows}
          pagination={{
            style: {marginBottom: 0},
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
          }}
        />

        <Modal
          title="提示"
          visible={downVisible}
          onOk={onOk}
          onCancel={hideModal}
          okText="确认"
          cancelText="取消"
        >
          {tips.current}
        </Modal>

      </div>
    </div>
  )
}))
