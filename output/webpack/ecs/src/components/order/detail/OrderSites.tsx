import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { withRouter, useParams } from 'react-router-dom';
import * as orderAction from '@/redux/actions/orderAction';
import * as orderApis from '@/common/net/apis_order';
import { Table, Button } from '@aurum/pfe-ui';
import '@/assets/styles/api/list.less'

const mapDispatchToProps = (dispatch: any) => ({
  toRefreshRandom: (payload: any) => dispatch({
    type: orderAction.ORDER_ORDER_REFRESH,
    payload
  })
});

export default connect(mapDispatchToProps)(withRouter(({ orderSites, toRefreshRandom }: any) => {
  const [loading, setLoading] = useState(false);
  const colums = [
    {
      dataIndex: 'site',
      key: 'site',
      title: '提供方'
    },
    {
      dataIndex: 'benefitName',
      key: 'benefitName',
      title: '名称'
    },
    {
      dataIndex: 'benefitIntro',
      key: 'benefitIntro',
      title: '简介'
    },
    {
      dataIndex: 'specCode',
      key: 'specCode',
      title: '规格/编号等'
    },
    {
      dataIndex: 'accountId',
      key: 'accountId',
      title: '发放手机号'
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: '发放状态',
      render: (d: any, item: any) => {
        return statusToMess(item.status)
      }
    },
    {
      dataIndex: 'action',
      key: 'action',
      title: '操作',
      render: (d: any, item: any) => {
        return (item.status === 9 || item.status === 1) ? <Button size='small' type='link' loading={loading} onClick={() => { tryAgain(item.id) }}> 重试</Button > : <text>/</text>
      }
    }
  ]

const statusToMess = (status: any) => {
  let mess = '';
  if (status === 0) {
    mess = '待发放'
  } else if (status === 1) {
    mess = '发放中'
  } else if (status === 2) {
    mess = '发放成功'
  } if (status === 9) {
    mess = '发放失败'
  }
  return mess;
}

const tryAgain = (id: any) => {
  setLoading(true);
  (async () => {
    const result: any = await orderApis.getMerchantModule().benefitRetry({ id: id })
    setLoading(false);
    if (result && result.data) {
      toRefreshRandom(Math.random());
    }
  })();
};

return (
  <div className="activity-li9t table-container">
    <div className="table-top-wrap" >
      <Table
        pagination={false}
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        columns={colums}
        dataSource={orderSites} />
    </div>
  </div>
)
}))
