import React, { useState, useEffect } from 'react';
import { Table, Space, Button } from '@aurum/pfe-ui';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import RecordEdit from './Edit';

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  let businessColumns: any = [
    {
      title: $t('序号'),
      dataIndex: 'seqNo',
      key: 'seqNo',
      width: 80,
    },
    {
      title: $t('分组名称'),
      dataIndex: 'groupName',
      key: 'groupName',
      width: 190,
    },
    {
      title: $t('备注'),
      dataIndex: 'description',
      key: 'description',
      width: 200
    },
    {
      title: $t('对客展示'),
      dataIndex: 'showMerchant',
      key: 'showMerchant',
      width: 100,
      render: (value: any) => {
        return value === 1 ? '展示' : '不展示';
      }
    },
  ];

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    render: (_: any, record: any, index:any) => {
      return (
        <Space size="small" key={`apiCategories${index}`}>
          {checkMyPermission('openapi:api:group:edit') && <a key="edit" type="link" onClick={() => {
            setEditVisible(true);
            setSingleRecord({ ...record, apiGroupName: record.groupName });
          }}>编辑</a>}
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
        {checkMyPermission('openapi:api:group:add') && <Button type="primary" onClick={() => {
          setEditVisible(true);
          setSingleRecord(null);
        }}>{$t('portal_add')}</Button>}
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