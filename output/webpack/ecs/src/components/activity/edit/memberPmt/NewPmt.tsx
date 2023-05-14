import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { Form, Space, Table, Row, Col, Input, Button, message, Modal, DatePicker } from '@aurum/pfe-ui';
import moment from 'moment';
import * as apis from '@/common/net/apis_activity';
import '@/assets/styles/activity/list.less';

const { RangePicker } = DatePicker;
const mapStateToProps = (state: any) => {
  return {
  }
}

const mapDispatchToProps = (dispatch: any) => ({

});

const initSearchObj: any = {
  activityName: '',
  cardCouponNo: '',
  name: '',
  dateRange: ''
}

export default connect(mapStateToProps, mapDispatchToProps)(({ activityReward, canOnlyView = false, showVisible, scene, onClose, SetRefresh, }: any) => {
  const { activityId }: any = useParams();
  const [activityRows, setActivityRows]: any = useState([]);
  const [selectedRowKeys1, setSelectedRowKeys1]: any = useState([]);
  const [selectedRows, setSelectedRows]: any = useState([]);
  const [searchObj, setSearchObj]: any = useState(initSearchObj);

  const [value, setValue]: any = useState([]);

  let defaultColumns: any = [
    {
      title: '预付券号',
      dataIndex: 'cardCouponNo',
      key: 'cardCouponNo',
    },
    {
      title: '预付券名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '活动名称',
      dataIndex: 'activityName',
      key: 'activityName',
    },
    {
      title: '投放开始时间',
      dataIndex: 'putStartTime',
      key: 'putStartTime'
    },
    {
      title: '投放截止时间',
      dataIndex: 'putEndTime',
      key: 'putEndTime'
    },
  ];
  const [form] = Form.useForm();

  useEffect(() => {
    searchList(searchObj)
  }, [showVisible])

  const rowSelection = {
    selectedRowKeys: selectedRowKeys1,
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      if (!canOnlyView) {
        setSelectedRowKeys1(selectedRowKeys)
        setSelectedRows(selectedRows);
        console.log('selectedRows', selectedRows)
      } else {
        message.error('当前活动状态不可编辑！')
      }
    }
  };

  const modifyCategoriesData = async (data: any) => {
    if (data && data.length > 0) {
      data.map((item: any) => {
        item.key = item.ruleId;
        item.value = item.ruleId;
        item.label = item.name;
        if (item.subCategories && item.subCategories.length > 0) {
          modifyCategoriesData(item.subCategories);
          item.children = item.subCategories
        }
      });
    }
  };

  const close = (arr: any) => {
    onClose();
  }

  const toBind = () => {
    if (!selectedRows.length) {
      message.error('请选择商品');
      return;
    }
    if (scene === 5) {
      if(activityReward?.pmtList?.length >= 1){
        message.error('最多只能绑定一张预付券')
        return
      }
      let spuIds: any = [], bindSpuIds: any = [], glbalSpuIds = [], paramsLists: any = [];
      selectedRows.forEach((item: any, index: any) => {
        spuIds.push(item.cardCouponNo);
        paramsLists.push({
          ...item,
          categoryId: item?.catId,
          categoryRuleId: item?.catRuleId,
          couponId: item?.cardCouponNo
        })
      })

      activityReward.pmtList.forEach((item: any) => {
        bindSpuIds.push(item.cardCouponNo)
      })
      glbalSpuIds = spuIds.filter((item: any) => bindSpuIds.indexOf(item) > -1)
      if (glbalSpuIds.length > 0) {
        message.error('有已绑定过的商品，不可重复绑定')
        return;
      }
      (async function () {
        if (!canOnlyView) {
          let list: any = {};
          list.activId = activityId;
          list.spuList = paramsLists;
          const resp = await apis.getActivityService().bindPmt(list);
          if (!resp.success) {
            message.error(resp.message);
          } else {
            SetRefresh()
            message.success('活动关联预付券成功');
            onClose();
          }
        }
      })();
    } else {
      form.submit();
    }
  }

  const toSearch = () => {
    let values = form.getFieldsValue();
    if (values?.dateRange && values?.dateRange?.length) {
      values.putStartTime = moment(values?.dateRange?.[0]).format('YYYY-MM-DD HH:mm:ss')
      values.putEndTime = moment(values?.dateRange?.[1]).format('YYYY-MM-DD HH:mm:ss')
      delete values?.dateRange
    }
    setSearchObj({ ...values })
    searchList(values)
  }

  const searchList = async (values: any) => {
    if (!activityId || !showVisible) return;
    const searchConds = { ...values };
    const { data: resultObj } = await apis.getActivityService().activPmtListSearch(searchConds);
    if (resultObj && resultObj.couponList) {
      resultObj.couponList = resultObj.couponList.map((item: any) => {
        item.key = item.cardCouponNo;
        return item;
      });
      setActivityRows(resultObj.couponList);
    }
  }

  return (
    <Modal width={900} open={showVisible} onCancel={() => { close([]) }}
      bodyStyle={{ paddingTop: '0' }}
      title={"选择预付券"}
      footer={[
        <Button key="cancel" onClick={() => { close([]) }}>取消</Button>,
        <Button key="confirm" type="primary" onClick={() => { toBind() }} >确定</Button>,
      ]}
    >
      <div className="activity-list">
        <Form.Provider>
          <Form layout="vertical"
            form={form}
            name="pmtListForm"
            className="search-form"
            onFinish={(values: any) => {
            }}
            onValuesChange={(values: any) => {
            }}
          >
            <div className="search-area">
              <Row gutter={16}>
                <Col span={3}>
                  <Form.Item label={$t('预付券编号')} name='cardCouponNo' rules={[{ type: 'string', required: false }]}>
                    <Input maxLength={140} placeholder="请输入预付券编号" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label={$t('预付券名称')} name="name" >
                    <Input maxLength={140} placeholder="请输入商品ID" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label={$t('活动名称')} name="activityName" >
                    <Input maxLength={140} placeholder="请输入商品名称" />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label={$t('投放时间')} name='dateRange'>
                    <RangePicker
                      picker="date"
                      showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item>
                    <Space>
                      <Button type="primary" onClick={toSearch}>{$t('portal_search')}</Button>
                      <Button htmlType="reset" onClick={(it: any) => {
                        setSearchObj({ ...initSearchObj });
                      }}>{$t('portal_reset')}</Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Form>
        </Form.Provider>
        <div>
          <Table
            rowSelection={{
              type: 'radio',
              ...rowSelection,
            }}
            scroll={{ x: '100%' }}
            tableLayout="fixed"
            columns={defaultColumns}
            dataSource={activityRows}
            pagination={{
              defaultPageSize: 10
            }}
          />
        </div>
      </div>
    </Modal>
  )
})
