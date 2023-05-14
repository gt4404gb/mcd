import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Tag, Popconfirm, message, Modal } from '@aurum/pfe-ui';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import * as apis from '@/apps/btb/common/apis'
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';

const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;

const filterColumns = ['createTime', 'updateUser', 'updateTime']

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  const businessColumns: any = transferAntdTableHeaderArray2Object([
    ['编号', 'id'],
    ['商户编号', 'merchantId'],
    ['商户名称', 'companyName'],
    ['联系人', 'name'],
    ['联系电话', 'phone'],
    ['状态', 'availableFlag', (value: any) => {
      return <Tag color={getEntityColumnColor(constants.btb.merchant.availableFlag, value)} >
        {getEntityColumnLabel(constants.btb.merchant.availableFlag, value)}
      </Tag>
    }],
    ['商户类型', 'merchantType', (value: any) => getEntityColumnLabel(constants.btb.merchant.type, parseInt(value))],
    ['备注', 'remark', null, { className: 'ws-normal ws-max-width-300' }],
    ['创建时间', 'createTime'],
    ['更新人', 'updateUser'],
    ['更新时间', 'updateTime']
  ]);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 160,
    fixed: 'right',
    renderAction: (fileds: any, record: any, index: any) => {
      const actionLabel = record.availableFlag ? '关闭' : '开启';
      const editLink = {
        name: '编辑',
        components: (<Link key={`mEditLink${index}`} to={`/openapi/btb/merchant/edit/${record.merchantId}`}>编辑</Link>)
      }

      const close = {
        name: actionLabel,
        components: (<Popconfirm icon="" key="close" onConfirm={() => {
          (async () => {
            const resp: any = await apis.getBMSModule().toggleMerchant({
              availableFlag: record.availableFlag ? 0 : 1,
              merchantId: record.merchantId
            });
            message.destroy();
            if (resp?.success) {
              message.success(`成功${actionLabel}`);
              onChangeSearchConds({ ...searchConds });
            } else {
              message.error(resp.message || `${actionLabel}失败`);
            }

          })();
        }} title={`确认要${actionLabel}吗？`} okText="确认" cancelText="取消" >
          <a type="link">{actionLabel}</a>
        </Popconfirm>)
      }

      const pwd = {
        name: '重置密码',
        components: (<Popconfirm key={`mPwd${index}`} placement="topRight" icon="" onConfirm={() => {
          (async () => {
            const resp: any = await apis.getBMSModule().resetMerchantPwd(record.merchantId);
            message.destroy();
            if (resp?.success) {
              // message.success('密码成功重置，并已发送至商户联系人手机');
              Modal.success({
                className: 'new-pwd-modal',
                title: `操作提示`,
                content: `新密码: ${resp.data.newPassword}`,
                width: 300,
                centered: true,
                okText: '确定',
              });
            } else {
              message.error(resp.message || '重置密码失败');
            }

          })();
        }} title={`确认要重置密码吗？`} okText="确认" cancelText="取消" >
          <a type="link">重置密码</a>
        </Popconfirm>)
      }


      const actions: any = [];
      actions.push(editLink);
      actions.push(close);
      checkMyPermission('btb:merchant:resetPassword') && actions.push(pwd)

      return (
        actions
      )

    }

  }];

  const [columns, setColumns]: any = useState(businessColumns);
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);

  useEffect(() => {
    if (checkMyPermission('btb:merchant:edit')) {
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
      <Table
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
            searchConds.currentPage = currentPage;
            searchConds.pageSize = pageSize;
            onChangeSearchConds({ ...searchConds });
          },
        }} />
    </div>
  )
}