import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Popconfirm, Table, Button, Row, Col, Space } from '@aurum/pfe-ui';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import common from '@omc/common';
import moment from 'moment';
import constants from '@/apps/douyin/common/constants';
import StockDialog from './StockDialog';
import * as apis from '@/apps/douyin/common/apis';
import { Base64 } from 'js-base64';
import EndTimeDialog from './EndTimeDialog';
import helper from '../../common/helper';
import { SyncOutlined } from '@ant-design/icons';

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const { transferAntdTableHeaderArray2Object, getEntityColumnLabel } = common.helpers;

export default ({ searchObj, dataSource, onChangePartialSearchObj }: any) => {
  const [businessColumns, setBusinessColumn]: any = useState([]);
  const [actionColumns, setActionColumns]: any = useState([]);
  const [checkedColumns, setCheckedColumns]: any = useState([]);

  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [columns, setColumns]: any = useState([]);
  const [groupon4StockDialog, setGroupon4StockDialog]: any = useState(null);
  const [groupon4EndTimeDialog, setGroupon4EndTimeDialog]: any = useState(null);
  const [hasMore, setHasMore]: any = useState(true);
  const [refresh, setRefresh]: any = useState(false);

  useEffect(() => {
    if (dataSource.data) {
      const groupon: any = dataSource.data.data;
      setTotalCount(groupon.total);
      setHasMore(groupon.has_more);
      if (groupon.list.length > 0) {
        setDataRows([...dataRows, ...groupon.list]);
      }
    }
  }, [dataSource]);

  useEffect(() => {
    if (refresh) {
      setDataRows([]);
      onChangePartialSearchObj({
        currentPage: 1,
      });
      setRefresh(false);
    }
  }, [refresh]);

  useEffect(() => {
    let _businessColumns: any = transferAntdTableHeaderArray2Object([
      ['团购商品编号', 'actual_groupon_id', (value: any, record: any) => {
        return <Link to={`/openapi/douyin/groupon/detail/${Base64.encode(record.groupon_id)}`}>{value}</Link>
      }],
      ['团购商品名称', 'title'],
      ['团购价格', 'actual_amount', (value: any) => (value / 100).toFixed(2)],
      ['总库存', 'stock'],
      ['已售', 'sold_count'],
      ['售卖开始时间', 'start_time', (value: any) => moment(value * 1000).format(DATE_FORMAT)],
      ['售卖结束时间', 'end_time', (value: any) => moment(value * 1000).format(DATE_FORMAT)],
      ['状态', 'status', (value: any, record: any) => {
        return getEntityColumnLabel(constants.groupon.status, value)
      }],
    ]);

    const _actionColumns: any = [{
      title: $t('Action'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      fixed: 'right' as 'right',
      render: (_: any, record: any, index:any) => {
        const ActionOnline: any = <Popconfirm icon='' key="publish" onConfirm={() => {
          (async () => {
            const resp: any = await apis.getDouyinModule().olineGroupon(record.groupon_id);
            helper.handleMessage(resp, '操作完成', () => {
              // setRefresh(true);
              record.status = constants.groupon.status.ONLINE.value;
              setDataRows([...dataRows]);
            })
          })();
        }} title={`确认要上架吗？`} okText="确认" cancelText="取消" >
          <a key="action-publish" type="link" onClick={() => {
          }}>上架</a>
        </Popconfirm>;

        const ActionOffline: any = <Popconfirm icon='' key="unpublish" onConfirm={() => {
          (async () => {
            const resp: any = await apis.getDouyinModule().offlineGroupon(record.groupon_id);
            helper.handleMessage(resp, `成功下架`, () => {
              // setRefresh(true);
              record.status = constants.groupon.status.OFFLINE.value;
              setDataRows([...dataRows]);
            })
          })();
        }} title={`确认要下架吗？`} okText="确认" cancelText="取消" >
          <a key="action-unpublish" type="link" onClick={() => {
          }}>下架</a>
        </Popconfirm>;

        const ActionStockIncrease: any = <a key="action-stock-increase" type="link" onClick={() => {
          setGroupon4StockDialog(record);
        }}>加库存</a>
        const ActionChangeTime: any = <a key="action-change-time" type="link" onClick={() => {
          setGroupon4EndTimeDialog(record);
        }}>改时间</a>
        const ActionEdit: any = <Link key="action-edit" to={`/openapi/douyin/groupon/edit/${Base64.encode(record.groupon_id)}`} >
          <a type="link">编辑</a></Link>;

        let actions: any = [];
        if (record.status === constants.groupon.status.ONLINE.value) {
          if (checkMyPermission('openapi:douyin:groupon:changeStock')) actions.push(ActionStockIncrease);
          if (checkMyPermission('openapi:douyin:groupon:changeEndTime')) actions.push(ActionChangeTime);
          if (checkMyPermission('openapi:douyin:groupon:offline')) actions.push(ActionOffline);
        } else if (record.status === constants.groupon.status.AUDIT_REJECTED.value) {
          if (checkMyPermission('openapi:douyin:groupon:edit')) actions.push(ActionEdit);
        } else if (record.status === constants.groupon.status.OFFLINE.value) {
          if (checkMyPermission('openapi:douyin:groupon:edit')) actions.push(ActionEdit);
          if (checkMyPermission('openapi:douyin:groupon:online')) actions.push(ActionOnline);
        }
        return <Space size="small" key={`douyinGroupon${index}`} >{actions}</Space>
      },
    }];

    setBusinessColumn(_businessColumns)
    setActionColumns(_actionColumns);
  }, [dataRows]);

  useEffect(() => {
    setColumns(businessColumns.concat(checkedColumns, actionColumns));
  }, [businessColumns, actionColumns, checkedColumns]);

  return (
    <div className="table-top-wrap" >
      <StockDialog groupon={groupon4StockDialog} onClose={(entity: any) => {
        setGroupon4StockDialog(null);
        if (entity) {
          const { groupon_id, stock }: any = entity;
          dataRows.forEach((item: any) => {
            if (item.groupon_id === groupon_id) {
              item.stock = stock;
            }
          });
        }
        setDataRows([...dataRows]);
      }} />
      <EndTimeDialog groupon={groupon4EndTimeDialog} onClose={(entity: any) => {
        setGroupon4EndTimeDialog(null);
        if (entity) {
          const { groupon_id, end_time }: any = entity;
          dataRows.forEach((item: any) => {
            if (item.groupon_id === groupon_id) {
              item.end_time = end_time;
            }
          });
        }
        setDataRows([...dataRows]);
      }} />
      <div className="table-top">
        {(checkMyPermission('openapi:douyin:groupon:add')) &&
          <Link to={`/openapi/douyin/groupon/edit`}><Button type="primary">{$t('portal_add')}</Button>
          </Link>}
      </div>
      <Table
        rowKey="actual_groupon_id"
        className="mcd-table"
        scroll={{ x: '100%' }}
        columns={columns}
        dataSource={dataRows}
        pagination={false} />
      <Row className="actions">
        <Col span={12} style={{ direction: 'rtl' }}>
          <Space size='xs'>
            <Button
              onClick={() => {
                setDataRows([]);
                setRefresh(true)
              }}>刷新</Button>
            {hasMore && <Button type="primary"
              onClick={() => {
                onChangePartialSearchObj({
                  currentPage: searchObj.currentPage + 1,
                })
              }}>更多</Button>}
          </Space>
        </Col>
      </Row>
    </div>
  )
}