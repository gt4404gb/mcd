import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { Table, Popconfirm, Space, Button, message, InputNumber } from '@aurum/pfe-ui';
import common from '@omc/common';
import { EquityCardSelector } from '@omc/boss-widgets';
import './styles/EquityCards.less';

const { transferAntdTableHeaderArray2Object } = common.helpers;

export default withRouter(({ canEdit, list = [], onChange }: any) => {
  const [equityCardsVisible, setEquityCardsVisible]: any = useState(false);
  const [dataRows, setDataRows]: any = useState([]);
  // const canEdit: boolean = (state !== constants.btb.voucherTemplate.state.ONLINE.value) ? true : false;
  const refreshDataRows: any = (rows: any) => {
    setDataRows([...rows]);
    if (typeof onChange === 'function') onChange(rows);
  }

  const businessColumns: any = transferAntdTableHeaderArray2Object([
    ['类型', 'resourceType', (value: any) => value === 1 ? '优惠券' : '权益卡'],
    ['权益卡编号', 'resourceId'],
    ['权益卡名称', 'resourceName'],
    ['兑换数量', 'resourceNum', (value: any, record: any) => {
      if (canEdit) {
        return <InputNumber min={1} value={record.resourceNum} max={99} maxLength={2} onChange={(val: any) => {
          record.resourceNum = val;
          refreshDataRows(dataRows);
        }} />
      } else {
        return value;
      }
    }],
  ]);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    render: (_: any, record: any) => {
      return <Space size="small">
        {canEdit && <Popconfirm key="cancel" onConfirm={() => {
          (async () => {
            message.destroy();
            refreshDataRows(dataRows.filter((it: any) => it.resourceId !== record.resourceId));
          })();
        }} title={`确认要删除吗？`} okText="确认" cancelText="取消" >
          <Button type="link">删除</Button>
        </Popconfirm>}
      </Space>
    },
  }];

  useEffect(() => {
    setDataRows(list.filter((it: any) => { return true }));
  }, [list]);

  const onEquityCardSelected = (selectedEquityCards: any, source: any) => {
    setEquityCardsVisible(false);
    if (selectedEquityCards.length === 0) return;
    const { cardId, title }: any = selectedEquityCards[0];
    const isContainedId: any = dataRows.some((it: any) => it.resourceId === cardId);
    if (!isContainedId) {
      dataRows.push({
        resourceType: 2,
        resourceId: cardId,
        resourceName: title,
        resourceNum: 1,
      })
    }
    refreshDataRows(dataRows);
  };

  return (
    <div className="voucher-equity-cards" >
      <EquityCardSelector visible={equityCardsVisible} onClose={onEquityCardSelected} />
      {dataRows.length < 1 && canEdit && <Button className="action-add" type="primary" onClick={() => {
        setEquityCardsVisible(true);
      }}>新增</Button>}

      <Table
        rowKey="resourceId"
        className="mcd-table"
        scroll={{ x: '100%' }}
        columns={canEdit ? businessColumns.concat(actionColumns) : businessColumns}
        dataSource={dataRows}
        pagination={false} />
    </div>
  )
});