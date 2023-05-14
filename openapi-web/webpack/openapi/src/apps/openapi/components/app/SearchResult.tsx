import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Popconfirm, message, Tabs, Tag } from '@aurum/pfe-ui';
import { Link } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import RecordEdit from './Edit';
import WIPRecordEdit from './WIPEdit';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common'
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis';
import config from '@/common/config/config';
import constants from '@/apps/openapi/common/constants';

const filterColumns = ['createdUser', 'createdDate', 'updatedUser', 'updatedDate']
const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  const appStatusEnum: any = constants.app.status;
  const tableHeaderColumnMatrix: any = [
    ['应用编号', 'appId'],
    ['应用名称', 'appName'],
    ['商户编号', 'merchantId'],
    ['商户名称', 'merchantName'],
    ['调用方式', 'paramKeyLabel'],
    ['订阅接口', 'subscriptionCount', (value: any, record: any) => {
      return (value > 0) ? <Link to={`/openapi/subscribed/apis/${record.appId}`}><a>{value}</a></Link> : value;
    }, 100],
    ['审核备注', 'verifyDescription', (value: any, record: any) => {
      if (!record.status === constants.app.status.PASSED) {
        return record.rejectDescription;
      }
      return value;
    }],
    ['状态', 'isAvailable', (value: any) => {
      return <Tag color={getEntityColumnColor(constants.app.isAvaliable, value)} >
        {getEntityColumnLabel(constants.app.isAvaliable, value)}
      </Tag>
    }],
    ['创建人', 'createdUser'],
    ['创建时间', 'createdDate'],
    ['更新人', 'updatedUser'],
    ['更新时间', 'updatedDate']
  ];

  let businessColumns: any = transferAntdTableHeaderArray2Object(tableHeaderColumnMatrix);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 220,
    fixed: 'right' as 'right',
    render: (_text: any, record: any, index:any) => {
      const actionLabel = record.isAvailable ? '关闭' : '开启';
      const clipboardText: string = `
商户: ${record.merchantName}
应用: ${record.appName}
--------
环境: ${config.ENV}
地址: ${config.OPENAPI_BASE_URL}
--------
MerchantId: ${record.merchantId}
AppId: ${record.appId} 
key: ${record.key}
调用方式: ${record.paramKey}
`
      // 调用方法: https://open.mcd.cn/docs/#OAuth
      return (<Space size="small" key={`openapiApps${index}`}>
        {(record.status === appStatusEnum.PENDING.value) && checkMyPermission('openapi:api:app:audit') && <a key="audit" onClick={() => {
          setEditVisible(true);
          setSingleRecordId(record.id);
          setIsAudit(true);
        }}>审核</a>}
        {(record.status === appStatusEnum.PASSED.value) && <>
          {checkMyPermission('openapi:api:app:edit') && <a key="edit" onClick={() => {
            setEditVisible(true);
            setSingleRecordId(record.id);
          }}>编辑</a>}
          {checkMyPermission('openapi:api:app:close') && <Popconfirm icon = '' key="open-close" onConfirm={() => {
            (async () => {
              let resp: any;
              if (record.isAvailable) {
                resp = await apis.getAppModule().disable({ id: record.id });
              } else {
                resp = await apis.getAppModule().open({ id: record.id });
              }

              if (resp?.code === 'SUCCESS') {
                message.success(resp.msg || `${actionLabel}成功`);
                onChangeSearchConds({ ...searchConds })
              } else {
                message.error(resp.msg || `${actionLabel}失败`);
              }
            })();
          }} title={`确认要${actionLabel}吗？`} okText="确认" cancelText="取消" >
            <a type="link">{actionLabel}</a>
          </Popconfirm>}
          {checkMyPermission('openapi:api:app:copy') && <CopyToClipboard text={clipboardText} onCopy={() => { message.success('商户信息复制成功'); }}>
            <a type="link">一键复制</a>
          </CopyToClipboard>}
          {checkMyPermission('openapi:api:app:ip:whitelist') && <a key="ip-white-list" type="link" onClick={() => {
            setWipEditVisible(true);
            setWipSingleRecordApp(record);
          }}>IP白名单</a>}
        </>}
      </Space>)
    },
  }];

  const [columns, setColumns]: any = useState(businessColumns);
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [editVisible, setEditVisible]: any = useState(false);
  const [singleRecordId, setSingleRecordId]: any = useState(null);
  const [wipEditVisible, setWipEditVisible]: any = useState(false);
  const [wipSingleRecordApp, setWipSingleRecordApp]: any = useState(null);
  const [isAudit, setIsAudit]: any = useState(false);
  const [isDuplicated, setIsDuplicated]: any = useState(false);
  const [rejectedCount, setRejectedCount]: any = useState(0);
  const [passedCount, setPassedCount]: any = useState(0);
  const [pendingCount, setPendingCount]: any = useState(0);
  const [appStatus, setAppStatus]: any = useState(appStatusEnum.PASSED.value);

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.rows;
      setTotalCount(dataSource.data.totalCount);
      setRejectedCount(dataSource.data.rejectCount);
      setPassedCount(dataSource.data.verifyCount);
      setPendingCount(dataSource.data.verifyPendingCount);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  useEffect(() => {
    setColumns(businessColumns.concat(actionColumns));
  }, [])

  const pagination: any = {
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
        status: appStatus,
      });
    },
  };
  const tableComp: any = <Table
    className="mcd-table"
    scroll={{ x: '100%' }}
    columns={columns}
    expanded
    allFilterColumns={filterColumns}
    dataSource={dataRows}
    pagination={pagination} />;

  return (
    <div className="table-top-wrap app-table-top-wrap" >
      <RecordEdit visible={editVisible} isAudit={isAudit} isDuplicated={isDuplicated} recordId={singleRecordId} onClose={(isSaved: boolean) => {
        setEditVisible(false);
        setIsDuplicated(false);
        setSingleRecordId(null);
        setIsAudit(false);
        if (isSaved) {
          onChangeSearchConds({});
        }
      }} />

      <WIPRecordEdit visible={wipEditVisible} app={wipSingleRecordApp} onClose={(isSaved: boolean) => {
        setWipEditVisible(false);
        setWipSingleRecordApp(null);
        if (isSaved) {
          onChangeSearchConds({});
        }
      }} />
      <div className="table-top">
        {checkMyPermission('openapi:api:app:add') && <Button type="primary" onClick={() => { setEditVisible(true); setSingleRecordId(null); }}>{$t('portal_add')}</Button>}
      </div>
      <Tabs defaultActiveKey={appStatus} onChange={(activeKey: any) => {
        onChangeSearchConds({
          currentPage: 1,
          pageSize: 10,
          status: parseInt(activeKey),
        });
        setAppStatus(parseInt(activeKey))
      }} >
        <Tabs.TabPane tab={`已审核(${passedCount})`} key={appStatusEnum.PASSED.value}>
          {tableComp}
        </Tabs.TabPane>
        <Tabs.TabPane tab={`待审核(${pendingCount})`} key={appStatusEnum.PENDING.value}>
          {tableComp}
        </Tabs.TabPane>
        <Tabs.TabPane tab={`已驳回(${rejectedCount})`} key={appStatusEnum.REJECTED.value}>
          {tableComp}
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}