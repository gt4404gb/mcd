import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Popconfirm, message } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';
import RecordEdit from './Edit';

const { transferAntdTableHeaderArray2Object } = common.helpers;
const filterColumns = ['createdUser', 'createdDate']


export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  const businessColumns: any = transferAntdTableHeaderArray2Object([
    ['黑名单起始IP', 'startIp'],
    ['黑名单截止IP', 'endIp'],
    ['创建人', 'createdUser'],
    ['创建时间', 'createdDate'],
  ]);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    render: (text: any, record: any, index:any) => {
      return <Space size="small" key={`mgrBlacklist${index}`}>
        {!record.isDeleted && <Popconfirm icon='' key="turnon-off" onConfirm={() => {
          (async () => {
            let resp: any = await apis.getCoreMgrModule().ipRemove(record.id);

            if (resp?.code === 'SUCCESS') {
              message.success(`成功删除`);
              onChangeSearchConds({ ...searchConds })
            } else {
              message.error(resp.msg || `删除失败`);
            }
          })();
        }} title={`确认要删除吗？`} okText="确认" cancelText="取消" >
          <a key="delete" type="link" onClick={() => { }}>删除</a>
        </Popconfirm>}
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
      <RecordEdit visible={editVisible} record={singleRecord} onClose={(isSaved: boolean) => {
        setEditVisible(false);
        setSingleRecord({ ...singleRecord });
        if (isSaved) onChangeSearchConds({});
      }} />
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