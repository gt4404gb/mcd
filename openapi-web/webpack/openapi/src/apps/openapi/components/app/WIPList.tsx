import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Popconfirm, message } from '@aurum/pfe-ui';
import common from '@omc/common';
// @ts-ignore
import * as apis from '@/apps/openapi/common/apis';

const { transferAntdTableHeaderArray2Object } = common.helpers;
export default ({ dataSource, searchObj, onSearch }: any) => {
  let businessColumns: any = transferAntdTableHeaderArray2Object([
    ['起始IP', 'startIp'],
    ['结束IP', 'endIp'],
  ]);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    fixed: 'right' as 'right',
    render: (_text: any, record: any) => <Space size="small">
      {!record.isDeleted && <Popconfirm icon='' key="turnon-off" onConfirm={() => {
        (async () => {
          let resp: any = await apis.getCoreMgrModule().ipRemove(record.id);

          if (resp?.code === 'SUCCESS') {
            message.success(`成功删除`);
            onSearch({ ...searchObj });
          } else {
            message.error(resp.msg || `删除失败`);
          }
        })();
      }} title={`确认要删除吗？`} okText="确认" cancelText="取消" >
        <a key="delete" onClick={() => { }}>删除</a>
      </Popconfirm>}
    </Space>
  }];

  const [columns, setColumns]: any = useState(businessColumns.concat(actionColumns));
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);

  useEffect(() => {
    if (dataSource.rows) {
      const dataRows = dataSource.rows;
      setTotalCount(dataSource.totalCount);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  return (
    <div className="table-top-wrap" >
      <Table
        rowKey="id"
        className="mcd-table"
        scroll={{ x: '100%' }}
        columns={columns}
        dataSource={dataRows}
        pagination={{
          hideOnSinglePage: true,
          pageSize: searchObj.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: searchObj.pageSize,
          showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
          current: dataSource.currentPage,
          total: totalCount,
          onChange: (currentPage: any, pageSize: any) => {
            onSearch({
              currentPage,
              pageSize,
            });
          },
        }}
      />
    </div>
  )
}