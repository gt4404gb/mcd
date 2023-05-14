import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Tooltip, Tag } from '@aurum/pfe-ui';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
// @ts-ignore
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import StockDialog from './StockDialog';
import EditDialog from './EditDialog';
import * as helper from '@/apps/openapi/common/helper';

const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;
const filterColumns = ['addOperator', 'addTime', 'updateOperator', 'updateTime']
export default ({ searchObj, dataSource, onChangePartialSearchObj }: any) => {
  const [businessColumns, setBusinessColumn]: any = useState([]);
  const [actionColumns, setActionColumns]: any = useState([]);
  const [checkedColumns, setCheckedColumns]: any = useState([]);

  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [columns, setColumns]: any = useState([]);
  const [productStockDialogVisible, setProductStockDialogVisible]: any = useState(false);
  const [templateCode4Dialog, setTemplateCode4Dialog]: any = useState(null);
  const [merchantOptions, setMerchantOptions]: any = useState([]);
  const [editDialog, setEditDialog]: any = useState({
    visible: false,
    edit: false,
    templateCode: ''
  });

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.list;
      setTotalCount(dataSource.data.total);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  //获取供应商的列表源数据
  useEffect(() => {
    (async () => {
      setMerchantOptions(await helper.getMerchantOptions('merchantId'));
    })();
  }, []);

  useEffect(() => {
    let _businessColumns: any = transferAntdTableHeaderArray2Object([
      ['资源编号', 'templateCode'],
      ['资源名称', 'templateName'],
      ['供应商', 'merchantName'],
      ['使用场景', 'platform', (value: any) => <div>
        {value === 1 ? '电商平台' : '社群/会员活动'}
      </div>
        , {
          className: 'ws-max-width-300',
          ellipsis: { showTitle: false },
        }],
      ['资源简介', 'introduction', (value: any) => <Tooltip placement="topLeft" title={value}>
        {value}
      </Tooltip>
        , {
          className: 'ws-max-width-300',
          ellipsis: { showTitle: false },
        }],
      ['添加人', 'addOperator'],
      ['添加时间', 'addTime'],
      ['更新人', 'updateOperator'],
      ['更新时间', 'updateTime'],
    ]);

    const _actionColumns: any = [{
      title: $t('Action'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      fixed: 'right' as 'right',
      render: (_: any, record: any) => {
        const ActionView: any =
          <a onClick={() => {
            setEditDialog({
              visible: true,
              edit: false,
              templateCode: record.templateCode
            })
          }}>查看</a>
        const ActionEdit: any =
          <a onClick={() => {
            setEditDialog({
              visible: true,
              edit: true,
              templateCode: record.templateCode
            })
          }}>编辑</a>;

        let actions: any = [ActionView];
        if (checkMyPermission('btb:voucher:template:edit')) actions.push(ActionEdit);
        return <Space size="small">{actions}</Space>
      },
    }];

    setBusinessColumn(_businessColumns)
    setActionColumns(_actionColumns);
  }, [searchObj]);

  useEffect(() => {
    setColumns(businessColumns.concat(checkedColumns, actionColumns));
  }, [businessColumns, actionColumns, checkedColumns]);

  return (
    <div className="table-top-wrap" >
      <EditDialog
        visible={editDialog.visible}
        isEdit={editDialog.edit}
        templateCode={editDialog.templateCode}
        merchantOptions={merchantOptions}
        onClose={(refresh: any) => {
          setEditDialog({
            visible: false,
            edit: false,
            templateCode: ''
          })
          if (refresh) {
            onChangePartialSearchObj({ ...searchObj });
          }
        }} />

      <StockDialog visible={productStockDialogVisible} templateCode={templateCode4Dialog} onClose={() => {
        setProductStockDialogVisible(false);
        setTemplateCode4Dialog(null);
      }} />
      <div className="table-top">
        <Button type="primary" onClick={() => {
          setEditDialog({
            visible: true,
            edit: true,
            templateCode: ''
          })
        }}>{$t('portal_add')}</Button>
      </div>
      <Table
        rowKey="id"
        className="mcd-table"
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        columns={columns}
        dataSource={dataRows}
        expanded
        allFilterColumns={filterColumns}
        pagination={{
          pageSize: searchObj.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 50,
          showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
          current: searchObj.currentPage,
          total: totalCount,
          onChange: (currentPage: any, pageSize: any) => {
            onChangePartialSearchObj({
              currentPage,
              pageSize,
            });
          },
        }} />
    </div>
  )
}