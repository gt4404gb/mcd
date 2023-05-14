import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Popconfirm, message, Tag } from '@aurum/pfe-ui';
import { Link } from 'react-router-dom';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
// @ts-ignore
import * as apis from '@/apps/openapi/common/apis'
import common from '@omc/common';
import constants from '@/apps/openapi/common/constants';
import RecordEdit from './Edit';

const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;
const filterColumns = ['createdUser', 'createdDate', 'updatedUser', 'updatedDate']

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  let businessColumns: any = transferAntdTableHeaderArray2Object([
    ['编号', 'id'],
    ['商户编号', 'merchantId'],
    ['商户名称', 'merchantName'],
    ['商户类型', 'merchantType', (value: any) => getEntityColumnLabel(constants.merchant.merchantType, value)],
    ['应用数量', 'appCount', (value: any, record: any) => {
      return (value > 0) ? <Link to={`/openapi/apps/${record.merchantId}`}><a>{value}</a></Link> : value;
    }],
    ['状态', 'isAvailable', (value: any, record: any) => {
      return <Tag color={getEntityColumnColor(constants.merchant.isAvaliable, value)} >
        {getEntityColumnLabel(constants.merchant.isAvaliable, value)}
      </Tag>
    }],
    ['审核状态', 'status', (value: any) => getEntityColumnLabel(constants.merchant.status, value)],
    ['备注', 'description', null, { className: 'ws-normal' }],
    ['创建人', 'createdUser'],
    ['创建时间', 'createdDate'],
    ['更新人', 'updatedUser'],
    ['更新时间', 'updatedDate']
  ]);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    render: (text: any, record: any, index:any) => {
      const actionLabel = record.isAvailable ? '关闭' : '开启';
      return <Space size="small" key={`openapiMerchants${index}`}>
        {checkMyPermission('openapi:api:merchant:edit') && <a key="edit" onClick={() => {
          setEditVisible(true);
          setSingleRecordId(record.id);
        }
        }>编辑</a>}
        {checkMyPermission('openapi:api:merchant:close') && <Popconfirm key="delete" onConfirm={() => {
          (async () => {
            let resp: any;
            if (record.isAvailable) {
              resp = await apis.getMerchantModule().disable({ id: record.id });
            } else {
              resp = await apis.getMerchantModule().open({ id: record.id });
            }

            if (resp?.code === 'SUCCESS') {
              message.success(resp.msg || `${actionLabel}成功`);
              onChangeSearchConds({ ...searchConds })
            } else {
              message.error(resp.msg || `${actionLabel}失败`);
            }
          })();
        }} title={`确认要${actionLabel}吗？`} okText="确认" cancelText="取消" >
          <a>{actionLabel}</a>
        </Popconfirm>}
      </Space>
    },
  }];

  const [columns, setColumns]: any = useState(businessColumns);
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [editVisible, setEditVisible]: any = useState(false);
  const [singleRecordId, setSingleRecordId]: any = useState(null);
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
      <RecordEdit visible={editVisible} recordId={singleRecordId} onClose={(isSaved: boolean) => {
        setEditVisible(false);
        setSingleRecordId(null);
        if (isSaved) {
          onChangeSearchConds({});
        }
      }} />
      <div className="table-top">
        {checkMyPermission('openapi:api:merchant:add') && <Button type="primary" onClick={() => {
          setEditVisible(true);
          setSingleRecordId(null);
        }}>{$t('portal_add')}</Button>}
      </div>
      <Table
        className="mcd-table"
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        columns={columns}
        dataSource={dataRows}
        expanded
        allFilterColumns={filterColumns}
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