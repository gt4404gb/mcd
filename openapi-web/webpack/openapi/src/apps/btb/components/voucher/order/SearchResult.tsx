import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Space, Button, Popconfirm, message, Tag } from '@aurum/pfe-ui';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import * as apis from '@/apps/btb/common/apis'
import OrderDetailDialog from './OrderDetailDialog';

const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;
const filterColumns = ['addOperator', 'addTime']

export default ({ dataSource, searchObj, onChangePartialSearchObj }: any) => {
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [columns, setColumns]: any = useState([]);
  const [orderDetailDialogVisible, setOrderDetailDialogVisible]: any = useState(false);
  const [voucherOrder4Dialog, setVoucherOrder4Dialog]: any = useState(null);
  const [businessColumns, setBusinessColumn]: any = useState([]);
  const [actionColumns, setActionColumns]: any = useState([]);
  const [checkedColumns, setCheckedColumns]: any = useState([]);

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.list;
      setTotalCount(dataSource.data.total);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  useEffect(() => {
    let businessColumns: any = transferAntdTableHeaderArray2Object([
      ['交易号', 'orderId'],
      ['生成方式', 'codeType', (value: any) => getEntityColumnLabel(constants.btb.voucherCode.codeType, value)],
      ['发放方式', 'sendType', (value: any) => getEntityColumnLabel(constants.btb.voucherOrder.sendType, value)],
      ['商品名称', 'templateName'],
      ['分销商', 'merchantId', (merchantId: any, record: any) => `${merchantId} ${record.merchantName}`],
      ['数量', 'redeemNum'],
      ['生成时间', 'addTime'],
      ['状态', 'status', (value: any) => {
        return <Tag color={getEntityColumnColor(constants.btb.voucherOrder.status, value)} >
          {getEntityColumnLabel(constants.btb.voucherOrder.status, value)}</Tag>
      }],
      ['添加人', 'addOperator'],
    ]);

    const actionColumns: any = [{
      title: $t('Action'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      fixed: 'right' as 'right',
      render: (text: any, record: any, index:any) => {
        let actionView: any = null;
        if (checkMyPermission('btb:voucher:order:view')) {
          if (record.sendType === constants.btb.voucherOrder.sendType.MANUAL.value) {
            actionView = <Link to={`/openapi/btb/voucher/codes/${record.orderId}`}><a>查看</a></Link>
          } else {
            actionView = <a onClick={() => {
              setOrderDetailDialogVisible(true);
              setVoucherOrder4Dialog(record);
            }}>查看</a>
          }
        }
        return <Space size="small" key={`voucherOrders${index}`} >
          {actionView}
          {checkMyPermission('btb:voucher:order:cancel') && record.status === constants.btb.voucherOrder.status.COMPLETED.value && <Popconfirm key="cancel" onConfirm={() => {
            (async () => {
              const resp: any = await apis.getVoucherModule().orderCancel(record.id);
              message.destroy();
              if (resp.success) {
                onChangePartialSearchObj({ ...searchObj });
                message.success('成功作废')
              } else {
                message.error(resp.message || '作废失败')
              }
            })();
          }} title={`确认要作废吗？`} okText="确认" cancelText="取消" >
            <a type="link">作废</a>
          </Popconfirm>}
        </Space>
      },
    }];

    setBusinessColumn(businessColumns)
    setActionColumns(actionColumns);
  }, [searchObj]);

  useEffect(() => {
    setColumns(businessColumns.concat(checkedColumns, actionColumns));
  }, [businessColumns, actionColumns, checkedColumns]);

  return (
    <div className="table-top-wrap" >
      <OrderDetailDialog visible={orderDetailDialogVisible} voucherOrder={voucherOrder4Dialog} onClose={() => {
        setOrderDetailDialogVisible(false);
        setVoucherOrder4Dialog(null);
      }} />

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
          hideOnSinglePage: true,
          pageSize: searchObj.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
          current: dataSource.currentPage || searchObj.currentPage,
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