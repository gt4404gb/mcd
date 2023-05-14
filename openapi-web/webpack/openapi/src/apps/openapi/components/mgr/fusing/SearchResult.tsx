import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Popconfirm, message } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';
import RecordEdit from './Edit';

const enumLimitType: any = {
  SUBSCRIBED: 1,
  API: 2,
};

const { transferAntdTableHeaderArray2Object } = common.helpers;

const filterColumns = ['createdUser', 'createdDate', 'updatedUser', 'updatedDate']

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  const businessColumns: any = transferAntdTableHeaderArray2Object([
    ['应用编号', 'appId'],
    ['应用名称', 'appName'],
    ['接口编号', 'apiId'],
    ['接口访问地址', 'url'],
    ['令牌桶总量', 'burstCapacity'],
    ['令牌桶填充数', 'replenishRate', (value: any) => `${value} / s`],
    ['每日调用量', 'quota'],
    ['限制类型', 'limitType', (value: any) => value === enumLimitType.API ? '接口' : '订阅'],
    ['熔断错误率', 'circuitErrorPercent', (value: any) => `${value}%`],
    ['超时时间', 'timeoutMills', (value: any) => `${value}ms`],
    ['配置状态', 'isAvailable', (value: any) => (value === 1 ? '生效中' : '已失效')],
    ['创建人', 'createdUser'],
    ['创建时间', 'createdDate'],
    ['更新人', 'updatedUser'],
    ['更新时间', 'updatedDate']
  ]);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 160,
    fixed: 'right' as 'right',
    render: (text: any, record: any, index:any) => {
      const actionLabel: any = record.isAvailable ? '使失效' : '使生效';
      return <Space size="small" key={`mgrFusing${index}`}>
        {!record.isDeleted && <Popconfirm icon='' key="turnon-on" onConfirm={() => {
          (async () => {
            let resp: any;
            if (record.isAvailable) {
              resp = await apis.getCoreMgrModule().disable(record.id);
            } else {
              resp = await apis.getCoreMgrModule().enable(record.id);
            }

            if (resp?.code === 'SUCCESS') {
              message.success(resp.msg || `${actionLabel}成功`);
              onChangeSearchConds({ ...searchConds })
            } else {
              message.error(resp.msg || `${actionLabel}失败`);
            }
          })();
        }} title={`确认要${actionLabel}吗？`} okText="确认" cancelText="取消" >
          <a type="link">{record.isAvailable ? '使失效' : '使生效'}</a>
        </Popconfirm>}

        {!record.isDeleted && <Popconfirm icon='' key="turnon-off" onConfirm={() => {
          (async () => {
            let resp: any = await apis.getCoreMgrModule().remove(record.id);

            if (resp?.code === 'SUCCESS') {
              message.success(resp.msg || `成功删除`);
              onChangeSearchConds({ ...searchConds })
            } else {
              message.error(resp.msg || `删除失败`);
            }
          })();
        }} title={`确认要删除吗？`} okText="确认" cancelText="取消" >
          <a key="delete" type="link" onClick={() => { }}>删除</a>
        </Popconfirm>}
        {!record.isDeleted && <a key="edit" type="link" onClick={() => {
          setEditVisible(true);
          setSingleRecord(record);
        }}>编辑</a>}
      </Space>
    },
  }];

  const [columns, setColumns]: any = useState(businessColumns);
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

  useEffect(() => {
    setColumns(businessColumns.concat(actionColumns));
  }, [])

  return (
    <div className="table-top-wrap" >
      {editVisible && <RecordEdit visible={editVisible} record={singleRecord} onClose={(isSaved: boolean) => {
        setEditVisible(false);
        setSingleRecord({ ...singleRecord });
        if (isSaved) onChangeSearchConds({});
      }} />}
      <div className="table-top">
        <Button type="primary" onClick={() => {
          setEditVisible(true);
          setSingleRecord(null);
        }}>{$t('portal_add')}</Button>
      </div>
      <Table
        rowKey="id"
        className="mcd-table"
        scroll={{ x: '100%' }}
        columns={columns}
        dataSource={dataRows}
        expanded
        allFilterColumns={filterColumns}
        pagination={{
          hideOnSinglePage: true,
          pageSize: searchConds.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 10,
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