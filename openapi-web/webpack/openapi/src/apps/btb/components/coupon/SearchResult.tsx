import React, { useState, useEffect } from 'react';
import { Table, Space, Tag, Pagination } from '@aurum/pfe-ui';
// @ts-ignore
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import History from './History';

const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;

export default ({ dataSource, searchConds, onChangeSearchConds, onChangeSize, toPageFirst }: any) => {
  const tableHeaderColumnMatrix: any = [
    ['订单号', 'orderId'],
    ['商品名称', 'couponName'],
    ['券码', 'couponCode'],
    ['券码状态', 'status', (value: any) => {
      return <Tag color={getEntityColumnColor(constants.btb.coupon.status, value)} >
        {getEntityColumnLabel(constants.btb.coupon.status, value)}</Tag>
    }],
    ['核销开始时间', 'startTime', (value: any) => value || '/'],
    ['核销结束时间', 'endTime', (value: any) => value || '/'],
    ['绑定手机', 'bindPhone', (value: any) => value || '/'],
    ['绑定用户', 'bindId', (value: any) => value || '/'],
    ['使用时间', 'tradeTime', (value: any) => value || '/'],
    ['使用门店', 'tradeStore', (value: any, record: any) => {
      if (!value && !record.tradeStoreName) return '/';
      return `${value || ''} ${record.tradeStoreName || ''}`
    }],
  ];

  let businessColumns: any = transferAntdTableHeaderArray2Object(tableHeaderColumnMatrix);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    render: (text: any, record: any, index: any) => {
      return <Space size="small" key={`btbCoupons${index}`}>
        <a onClick={() => {
          setHistoryDialogVisible(true);
          setCoupon(record);
        }}>使用明细</a>
      </Space>
    },
  }];

  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [historyDialogVisible, setHistoryDialogVisible]: any = useState(false);
  const [coupon, setCoupon]: any = useState(null);


  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.list;
      setTotalCount(dataSource.data.total);
      setDataRows(dataRows);
    } else {
      setDataRows([])
    }
  }, [dataSource]);

  return (
    <div className="table-top-wrap" >
      <History coupon={coupon} visible={historyDialogVisible} onClose={() => {
        setHistoryDialogVisible(false);
      }} />
      <Table
        className="mcd-table"
        scroll={{ x: '100%' }}
        rowKey='id'
        tableLayout="fixed"
        columns={businessColumns.concat(actionColumns)}
        dataSource={dataRows}
        // @ts-ignore
        pagination={{ position: ['none'] }} />
      <div className='diy-pagination'>
        <Pagination defaultCurrent={1}
          showSizeChanger total={99999999}
          onChange={
            (currentPage: any, pageSize: any) => {
              onChangeSearchConds({
                currentPage,
                pageSize
              });
            }
          }
          onShowSizeChange={(currentPage: any, pageSize: any) => {
            onChangeSize({
              pageSize
            });
          }}
        />
      </div>
    </div>
  )
}