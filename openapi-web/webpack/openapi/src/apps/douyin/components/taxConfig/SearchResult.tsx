import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Popconfirm, message } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/douyin/common/apis'
import TaxConfigEditDialog from './TaxConfigEditDialog';

const { transferAntdTableHeaderArray2Object } = common.helpers;
export default ({ dataSource, searchObj, onChangePartialSearchObj }: any) => {
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [columns, setColumns]: any = useState([]);
  const [businessColumns, setBusinessColumn]: any = useState([]);
  const [actionColumns, setActionColumns]: any = useState([]);
  const [taxConfigObj4Dialog, setTaxConfigObj4Dialog]: any = useState(null);

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.data;
      setTotalCount(dataSource.data.total);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  useEffect(() => {
    let businessColumns: any = transferAntdTableHeaderArray2Object([
      ['商品编号', 'skuId'],
      ['商品名称', 'skuName'],
      ['税率', 'taxId'],
      ['备注', 'memo'],
    ]);

    const actionColumns: any = [{
      title: $t('Action'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      fixed: 'right' as 'right',
      render: (_: any, record: any, index:any) => {
        return <Space size="small"  key={`douyinTaxConfigs${index}`}>
          <a type="link" onClick={() => {
            setTaxConfigObj4Dialog(record);
          }}>编辑</a>
          <Popconfirm icon='' key="cancel" onConfirm={() => {
            (async () => {
              const resp: any = await apis.getJimiaoModule().taxConfigDelete(record.skuId);
              message.destroy();
              if (resp.success) {
                if (resp.data.success) {
                  onChangePartialSearchObj({ ...searchObj });
                  message.success('成功删除')
                } else {
                  message.error(resp.data.msg);
                }
              } else {
                message.error(resp.message || '删除失败')
              }
            })();
          }} title={`确认要删除吗？`} okText="确认" cancelText="取消" >
            <a type="link">删除</a>
          </Popconfirm>
        </Space>
      },
    }];

    setBusinessColumn(businessColumns)
    setActionColumns(actionColumns);
  }, [searchObj]);

  useEffect(() => {
    setColumns(businessColumns.concat(actionColumns));
  }, [businessColumns, actionColumns]);

  return (
    <div className="table-top-wrap" >
      <TaxConfigEditDialog visible={taxConfigObj4Dialog ? true : false} data={taxConfigObj4Dialog} onClose={(isSaved: boolean) => {
        setTaxConfigObj4Dialog(null);
        if (isSaved) onChangePartialSearchObj({ ...searchObj });
      }} />
      <div className="table-top">
        <Button type="primary" onClick={() => {
          setTaxConfigObj4Dialog({});
        }}>新增</Button>
      </div>
      <Table
        rowKey="skuId"
        className="mcd-table"
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        columns={columns}
        dataSource={dataRows}
        pagination={{
          hideOnSinglePage: true,
          pageSize: searchObj.pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 20,
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