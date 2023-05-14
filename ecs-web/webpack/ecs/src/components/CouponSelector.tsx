import React, { useEffect, useState } from 'react';
import { Table, Form, Row, Col, Button, Input, message, Modal, DatePicker, Space, Empty } from '@aurum/pfe-ui';
import moment from 'moment';
import * as apisEdit from '@/common/net/apis_edit';
export default ({ categoryId, spuId, visible, onClose, source, isNeedExtTypeEqual3, shopId }: any) => {
  const [couponNoChecked, setCouponNoChecked] = useState(0);
  const [toSelectedCoupons, setToSelectedCoupons] = useState([]);
  const [coupons, setCoupons]: any = useState([]);
  const [errMessage, setErrMessage] = useState('');
  const [searchObj, setSearchObj]: any = useState({
    cardCouponNo: '',
    name: '',
    activityName: '',
    putStartTime: '',
    putEndTime: '',
    pageNum: 1,
    pageSize: 8,
    dateRange: [],
    spuId: spuId,
    shopId: shopId
  });
  const [form] = Form.useForm();
  const { RangePicker }: any = DatePicker;
  async function fetchCoupons() {
    searchObj.categoryId = categoryId; // 28 是第三方付费会员， 30是兑换码里的付费会员 update by 20220413
    searchObj.spuId = spuId;
    searchObj.shopId = shopId;
    const resp = await apisEdit.getMerchantModule().coupons(searchObj);
    if (!resp.success || !resp.data) {
      setErrMessage(resp.message);
    } else {
      setErrMessage('');
    }
    let list = (categoryId === 28 || categoryId === 30) ? (resp.data?.crmList || []) : (resp.data?.couponList || [])
    setCoupons({ list: list, total: list.length })
  }

  useEffect(() => {
    if (visible) {
      form.resetFields();
      fetchCoupons();
    }
  }, [visible, searchObj])

  let columns: any = [
    {
      title: '权益卡编号',
      dataIndex: 'cardCouponNo',
      key: 'cardCouponNo',
      width: 180,
      ellipsis: true,
    },
    {
      title: '权益卡名称',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      ellipsis: true,
    },
    {
      title: '活动名称',
      dataIndex: 'activityName',
      key: 'activityName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '投放开始时间',
      dataIndex: 'putStartTime',
      key: 'putStartTime',
      width: 120,
      ellipsis: true,
    },
    {
      title: '投放结束时间',
      dataIndex: 'putEndTime',
      key: 'putEndTime',
      width: 120,
      ellipsis: true,
    }
  ]

  const crmClumns = [
    {
      title: '会籍名称',
      dataIndex: 'membershipName',
      key: 'membershipName',
      width: 100,
      ellipsis: true,
    },
    {
      title: '会籍描述',
      dataIndex: 'description',
      key: 'description',
      width: 120,
      ellipsis: true,
    },
    {
      title: '规格编码',
      dataIndex: 'membershipSpecCode',
      key: 'membershipSpecCode',
      width: 90
    },
    {
      title: '规格描述',
      dataIndex: 'membershipSpecDesc',
      key: 'membershipSpecDesc',
      width: 120
    },
    {
      title: '是否联名会员',
      dataIndex: 'specCategory',
      key: 'specCategory',
      width: 120,
      render: (text: any, field: any) => {
        return field.specCategory === 0? '普通会员':'联名会员'
      }
    },
    {
      title: '有效期类型',
      dataIndex: 'membershipSpecTypeDesc',
      key: 'membershipSpecTypeDesc',
      width: 100
    },
    {
      title: '天数',
      dataIndex: 'membershipSpecEffectDate',
      key: 'membershipSpecEffectDate',
      width: 80
    },
    {
      title: '有效开始日期',
      dataIndex: 'membershipSpecStartDate',
      key: 'membershipSpecStartDate',
      width: 100
    },
    {
      title: '有效结束日期',
      dataIndex: 'membershipSpecEndDate',
      key: 'membershipSpecEndDate',
      width: 100
    }
  ]

  if (categoryId === 28 || categoryId === 30) {
    columns = crmClumns
  }
  async function close(toSelectedCoupons: any) {
    if (toSelectedCoupons.length > 0) {
      let params = {
        categoryId,
        ccNo: (categoryId === 28 || categoryId === 30) ? toSelectedCoupons[0].membershipSpecCode : toSelectedCoupons[0].cardCouponNo
      }
      const resp = await apisEdit.getMerchantModule().couponsRelated(params);
      if (resp.code !== 200) {
        message.error(resp.message || '保存失败');
        return;
      }
      if (resp.success && resp.data) {
        setCouponNoChecked(0);
        setToSelectedCoupons(toSelectedCoupons);
        if (onClose) {
          onClose(toSelectedCoupons, source);
        }
      } else {
        message.error(resp.message);
        return;
      }
    } else {
      if (onClose) {
        onClose([], source);
      }
    }
  }
  return (
    <Modal width={900} visible={visible} onCancel={() => { close([]) }}
      bodyStyle={{ paddingTop: '0' }}
      title={shopId === 5 ? "选择卡券" : ((categoryId == 28|| categoryId == 30) ? '选择' : "选择权益卡")}
      footer={[
        <Button key="cancel" onClick={() => { close([]) }}>取消</Button>,
        <Button key="confirm" type="primary" onClick={() => { close(toSelectedCoupons) }} >确定</Button>,
      ]}
    >
      {isNeedExtTypeEqual3 && categoryId !== 28 && categoryId !== 30 && <div style={{ paddingTop: '10px', color: '#f00' }}>重新选择权益卡，需要重新编辑权益详情</div>}
      <div className="coupon-select-modal row">
        <Form layout="vertical"
          form={form}
          className="search-form"
          initialValues={searchObj}
          onFinish={(values: any) => {
            const narrowSearchObj: any = values;
            narrowSearchObj.currentPage = 1;
            narrowSearchObj.categoryId = categoryId;
            delete searchObj.dateRange;
            delete narrowSearchObj.dateRange;
            setSearchObj({ ...searchObj, ...narrowSearchObj });
          }}
          onValuesChange={(values: any) => {
          }}
        >
          {categoryId !== 28 && categoryId !== 30 && (<div className="search-area">
            <Row gutter={16}>
              <Col span={3}>
              <Form.Item label={shopId === 5 ? '卡券编号' : '权益卡编号'} name="cardCouponNo" >
                  <Input maxLength={150} placeholder="请输入权益卡编号" />
                </Form.Item>
              </Col>
              <Col span={3}>
              <Form.Item label={shopId === 5 ? '卡券名称' : '权益卡名称'} name="name" >
                  <Input maxLength={100} placeholder="请输入权益卡名称" />
                </Form.Item>
              </Col>
              <Col span={3}>
              <Form.Item label={$t('活动名称')} name="activityName" >
                  <Input maxLength={100} placeholder="请输入活动名称" />
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
              <Col span={12} style={{ textAlign: 'left' }}>
                <Space>
                <Button type="primary" htmlType="submit">{$t('Search')}</Button>
                <Button htmlType="reset" onClick={() => {
                  setSearchObj({
                    auditStatus: 3,
                    pageNo: 1,
                    pageSize: 8
                  });
                }}>{$t('Clear')}</Button>
                {errMessage && <span style={{ color: '#f00', fontSize: '14px' }}>{errMessage}</span>}
                </Space>
              </Col>
            </Row>
          </div>)}
        </Form>
        {coupons.list?.length > 0 && <Table
          rowKey={(categoryId == 28|| categoryId == 30) ? "membershipSpecCode" : "cardCouponNo"}
          className="coupons-selector"
          scroll={{ x: 1300 }}
          columns={columns}
          rowSelection={{
            type: 'radio',
            onChange: (selectedRowKeys: any, selectedRows: any) => {
              setToSelectedCoupons(selectedRows);
              setCouponNoChecked((categoryId == 28|| categoryId == 30)? selectedRows[0].membershipSpecCode : selectedRows[0].cardCouponNo);
            },
            selectedRowKeys: [couponNoChecked]
          }}
          dataSource={coupons.list}
          pagination={{
            pageSize: searchObj.pageSize,
            simple: true,
            hideOnSinglePage: false,
            total: coupons.total,
            current: searchObj.pageNo,
            onChange: (currentPage) => {
              setSearchObj({ ...searchObj, pageNo: currentPage });
            },
            position: ['bottomLeft']
          }}
           />}
           {!coupons.list || coupons.list.length == 0 &&
          <Empty />
        }
      </div>
    </Modal>
  )
}

