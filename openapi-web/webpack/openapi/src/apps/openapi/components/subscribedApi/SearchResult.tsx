import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Popconfirm, message } from '@aurum/pfe-ui';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import RecordEdit from './Edit';
import * as apis from '@/apps/openapi/common/apis'

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  let businessColumns: any = [
    {
      title: $t('订阅编号'),
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: $t('接口编号'),
      dataIndex: 'apiId',
      key: 'apiId',
      width: 190,
    },
    {
      title: $t('接口名称'),
      dataIndex: 'apiName',
      key: 'apiName',
      width: 200
    },
    {
      title: '接口分组',
      dataIndex: 'apiGroupName',
      key: 'apiGroupName',
      width: 120,
    },
    {
      title: '调用方式',
      dataIndex: 'method',
      key: 'method',
      width: 100,
    },
    {
      title: '应用编号',
      dataIndex: 'appId',
      key: 'appId',
      width: 150,
    },
    {
      title: '应用名称',
      dataIndex: 'appName',
      key: 'appName',
      width: 150,
    },
    {
      title: '商户编号',
      dataIndex: 'merchantId',
      key: 'merchantId',
      width: 150,
    },
    {
      title: '商户名称',
      dataIndex: 'merchantName',
      key: 'merchantName',
      width: 150,
    },
    {
      title: '验签',
      dataIndex: 'skipVerify',
      key: 'skipVerify',
      width: 80,
      render: (value: any) => value === 1 ? '否' : '是 '
    }
  ];

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    render: (text: any, record: any, index:any) => {
      return (
        <Space size="small" key={`subscribedApis${index}`}>
          {checkMyPermission('openapi:api:cancelSubscription') &&
            <Popconfirm icon='' key="delete" onConfirm={() => {
              (async () => {
                let resp: any = await apis.getApiSubscriptionModule().delete({ id: record.id });
                if (resp?.code === 'SUCCESS') {
                  message.success(`取消订阅成功`);
                  onChangeSearchConds({ ...searchConds })
                } else {
                  message.error(`取消订阅失败`);
                }
              })();
            }} title={`确认要取消订阅吗？`} okText="确认" cancelText="取消" >
              <a type="link">取消订阅</a>
            </Popconfirm>}
        </Space>
      )
    },
  }];

  const [columns, setColumns]: any = useState(businessColumns.concat(actionColumns));
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [editVisible, setEditVisible]: any = useState(false);
  const [singleRecord, setSingleRecord]: any = useState(null);

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.rows;
      setTotalCount(dataSource.data.totalCount);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  return (
    <div className="table-top-wrap" >
      <RecordEdit visible={editVisible} dataSource={singleRecord} onClose={(isSaved: boolean) => {
        setEditVisible(false);
        if (isSaved) {
          onChangeSearchConds({});
        }
      }} />
      <div className="table-top">
        {checkMyPermission('openapi:api:addSubscription') && <Button type="primary" onClick={() => {
          setEditVisible(true);
          setSingleRecord(null);
        }}>{$t('新增订阅')}</Button>}
      </div>
      <Table
        className="mcd-table"
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        columns={columns}
        dataSource={dataRows}
        pagination={{
          hideOnSinglePage: true,
          pageSize: searchConds.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 50,
          showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
          current: dataSource.currentPage || searchConds.currentPage,
          total: totalCount,
          onChange: (currentPage: any, pageSize: any) => {
            onChangeSearchConds({
              currentPage,
              pageSize,
            });
          },
        }} />
    </div>
  )
}