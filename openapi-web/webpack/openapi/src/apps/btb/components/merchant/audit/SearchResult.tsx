import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Tag } from '@aurum/pfe-ui';
import RecordEdit from './Edit';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';

const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;

const filterColumns = ['createTime', 'updateUser', 'updateTime']

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  const businessColumns: any = transferAntdTableHeaderArray2Object([
    ['编号', 'id'],
    ['姓名', 'name'],
    ['手机号', 'phone'],
    ['企业名称', 'companyName'],
    ['合作类型', 'cooperationType', (value: any) => {
      return getEntityColumnLabel(constants.btb.merchantAudit.cooperationType, value.split(',').map((v: any) => parseInt(v)));
    }],
    ['合作意向', 'cooperationIntention', null, { className: 'ws-normal' }],
    ['企业名称', 'companyName'],
    ['审核状态', 'approvalStatus', (value: any) => <Tag color={getEntityColumnColor(constants.btb.merchantAudit.approvalStatus, value)} >{getEntityColumnLabel(constants.btb.merchantAudit.approvalStatus, value)}</Tag>],
    ['审核结果类型', 'refuseType', (value: any) => getEntityColumnLabel(constants.btb.merchantAudit.refuseType, value)],
    ['审核说明', 'approvalDesc'],
    ['创建时间', 'createTime'],
    ['更新人', 'updateUser'],
    ['更新时间', 'updateTime']
  ]);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    renderAction: (record: any, fileds: any) => {
      const actions: any = [{
        name: '审核',
        components: (<a key="audit" type="link" onClick={() => {
          setEditVisible(true);
          setSingleRecord(fileds);
        }
        }>审核</a>),
      }];
      if (fileds.approvalStatus !== constants.btb.merchantAudit.approvalStatus.PENDING.value) {
        return [];
      } else {
        return actions
      }
    }
  }];

  const [columns, setColumns]: any = useState(businessColumns);
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [editVisible, setEditVisible]: any = useState(false);
  const [singleRecord, setSingleRecord]: any = useState(null);
  useEffect(() => {
    if (checkMyPermission('btb:merchant:audit')) {
      setColumns(businessColumns.concat(actionColumns));
    } else {
      setColumns(businessColumns)
    }
  }, [])

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.rows;
      setTotalCount(dataSource.data.totalCount);
      setDataRows(dataRows);
    }
  }, [dataSource]);

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