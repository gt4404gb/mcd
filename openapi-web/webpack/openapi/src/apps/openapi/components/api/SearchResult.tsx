import React, { useState, useEffect } from 'react';
import { Tabs, Table, Space, Button, Popconfirm, message, Tag } from '@aurum/pfe-ui';
import common from '@omc/common';
import * as apis from '@/apps/openapi/common/apis'
import constants from '@/apps/openapi/common/constants';
import helper from '@/apps/openapi/common/helper';
import RecordEdit from './Edit';
import ApiDetail from './Detail';

const filterColumns = ['createdUser', 'createdDate', 'updatedUser', 'updatedDate']
const { transferAntdTableHeaderArray2Object, getEntityColumnColor, getEntityColumnLabel } = common.helpers;

export default ({ dataSource, searchConds, onChangeSearchConds }: any) => {
  const [approvedCount, setApprovedCount]: any = useState(0);
  const [inProgressCount, setInProgressCount]: any = useState(0);
  const [pendingCount, setPendingCount]: any = useState(0);
  const [apiStatus, setApiStatus]: any = useState(constants.api.status.APPROVED.value);

  let businessColumns: any = transferAntdTableHeaderArray2Object([
    ['编号', 'id'],
    ['序号', 'seqNo'],
    ['接口名称', 'apiName'],
    ['接口分组', 'apiGroupName'],
    ['调用方式', 'requestMethod'],
    ['访问路径', 'path'],
    ['转发路径', 'targetPath'],
    ['调用方式', 'requestMethod'],
    ['是否可用', 'isAvailable', (value: any, record: any) => {
      return <Tag color={getEntityColumnColor(constants.api.isAvaliable, value)} >
        {getEntityColumnLabel(constants.api.isAvaliable, value)}
      </Tag>
    }],
    ['审核状态', 'status', (value: any, record: any) => getEntityColumnLabel(constants.api.status, value)],
    ['备注', 'description', null, { className: 'ws-normal' }],
    ['文档', 'isPublish', (value: any) => {
      return getEntityColumnLabel(constants.api.isPublish, value);
    }],
    ['创建人', 'createdUser'],
    ['创建时间', 'createdDate'],
    ['更新人', 'updatedUser'],
    ['更新时间', 'updatedDate']
  ]);

  const onChangeApiStatus: any = (status: any) => {
    onChangeSearchConds({ ...searchConds, status })
    setApiStatus(status);
  };

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 200,
    fixed: 'right' as 'right',
    render: (text: any, record: any, index:any) => {
      const actionLabel = record.isAvailable ? '关闭' : '开启';
      const publishActionLabel = record.isPublish === 1 ? '下线文档' : '发布文档';
      return (
        <Space size="small" key={`openapiApis${index}`}>
          {record['buttons']?.map((opName: any) => {
            if (opName === 'check') {
              return <a key={opName} type="link" onClick={() => {
                setDetailVisible(true);
                setDetailRecordId(record.id);
              }}>查看</a>
            } else if (opName === 'verify') {
              return <a key={opName} type="link" onClick={() => {
                setDetailVisible(true);
                setIsAudit(true);
                setDetailRecordId(record.id);
              }}>审核</a>
            } else if (opName === 'edit') {
              return <a key={opName} type="link" onClick={() => {
                setEditVisible(true);
                setSingleRecordId(record.id);
              }}>编辑</a>
            } else if (opName === 'submit_verify') {
              return <Popconfirm icon='' key={opName} onConfirm={() => {
                (async () => {
                  let resp: any = await apis.getApiModule().auditSubmitVerify({ id: record.id });
                  if (resp?.code === 'SUCCESS') {
                    message.success(`审核申请成功提交`);
                    onChangeApiStatus(constants.api.status.IN_PROGRESS.value);
                  } else {
                    message.error(`审核申请提交失败`);
                  }
                })();
              }} title={`确认提交审核吗？`} okText="确认" cancelText="取消" >
                <a type="link">提交审核</a>
              </Popconfirm>
            } else if (opName === 'recall') {
              return <Popconfirm icon='' key={opName} onConfirm={() => {
                (async () => {
                  let resp: any = await apis.getApiModule().auditRecall({ id: record.id });
                  if (resp?.code === 'SUCCESS') {
                    message.success(`成功撤销审核申请`);
                    onChangeApiStatus(constants.api.status.PENDING.value);
                  } else {
                    message.error(`撤销审核申请失败`);
                  }
                })();
              }} title={`确认撤销审核吗？`} okText="确认" cancelText="取消" >
                <a type="link">撤销</a>
              </Popconfirm>
            } else if (opName === 'open') {
              return <Popconfirm icon='' key={opName} onConfirm={() => {
                (async () => {
                  let resp: any = await apis.getApiModule().open({ id: record.id });

                  if (resp?.code === 'SUCCESS') {
                    message.success(resp.msg || `${actionLabel}成功`);
                    onChangeSearchConds({ ...searchConds })
                  } else {
                    message.error(resp.msg || `${actionLabel}失败`);
                  }
                })();
              }} title={`确认要${actionLabel}吗？`} okText="确认" cancelText="取消" >
                <a type="link">{actionLabel}</a>
              </Popconfirm>
            } else if (opName === 'close') {
              return <Popconfirm icon='' key={opName} onConfirm={() => {
                (async () => {
                  let resp: any = await apis.getApiModule().disable({ id: record.id });
                  if (resp?.code === 'SUCCESS') {
                    message.success(resp.msg || `${actionLabel}成功`);
                    onChangeSearchConds({ ...searchConds })
                  } else {
                    message.error(resp.msg || `${actionLabel}失败`);
                  }
                })();
              }} title={`确认要${actionLabel}吗？`} okText="确认" cancelText="取消" >
                <a type="link">{actionLabel}</a>
              </Popconfirm>
            } else if (opName === 'publish' || opName === 'undercarriage') {
              return <Popconfirm icon='' key={opName} onConfirm={() => {
                (async () => {
                  const resp: any = await apis.getApiModule().publish({ id: record.id });
                  if (resp?.code === 'SUCCESS') {
                    message.success(`${publishActionLabel}成功`);
                    onChangeSearchConds({ ...searchConds })
                  } else {
                    message.error(`${publishActionLabel}失败`);
                  }
                })();
              }} title={`确认要${publishActionLabel}吗？`} okText="确认" cancelText="取消" >
                <a type="link">{publishActionLabel}</a>
              </Popconfirm>
            }
            return null;
          })}
        </Space>
      )
    },
  }];

  const [columns, setColumns]: any = useState(businessColumns);
  const [dataRows, setDataRows]: any = useState([]);
  const [totalCount, setTotalCount]: any = useState(0);
  const [editVisible, setEditVisible]: any = useState(false);
  const [singleRecordId, setSingleRecordId]: any = useState(null);

  const [detailVisible, setDetailVisible]: any = useState(false);
  const [detailRecordId, setDetailRecordId]: any = useState(null);
  const [isAudit, setIsAudit]: any = useState(false);

  useEffect(() => {
    if (dataSource.data) {
      const dataRows = dataSource.data.rows;
      setTotalCount(dataSource.data.totalCount);

      setPendingCount(dataSource.data.unSubmitCount);
      setInProgressCount(dataSource.data.unVerifyCount);
      setApprovedCount(dataSource.data.verifyCount);
      setDataRows(dataRows);
    }
  }, [dataSource]);

  useEffect(() => {
    setColumns(businessColumns.concat(actionColumns));
  }, [])

  const tableComp: any = <Table
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
      defaultPageSize: 50,
      showTotal: (total: any) => `${$t('Total')} ${total} ${$t('items')}`,
      current: dataSource.currentPage || searchConds.currentPage,
      total: totalCount,
      onChange: (currentPage: any, pageSize: any) => {
        onChangeSearchConds({
          currentPage,
          pageSize,
          status: apiStatus,
        });
      },
    }} />;

  return (
    <div className="table-top-wrap app-table-top-wrap" >
      <RecordEdit visible={editVisible} recordId={singleRecordId} onClose={(isSaved: boolean) => {
        setEditVisible(false);
        setSingleRecordId(null)
        if (isSaved) {
          onChangeApiStatus(constants.api.status.PENDING.value);
        }
      }} />
      <ApiDetail visible={detailVisible}
        isAudit={isAudit}
        recordId={detailRecordId} onClose={(status: any) => {
          setDetailVisible(false);
          setIsAudit(false);
          setDetailRecordId(null);
          if (typeof status === 'number') {
            onChangeApiStatus(status);
          }
        }} />
      <div className="table-top">
        <Button type="primary" onClick={() => {
          setEditVisible(true);
        }}>{$t('portal_add')}</Button>
      </div>
      <Tabs activeKey={`${apiStatus}`} onChange={(activeKey: any) => {
        onChangeSearchConds({
          currentPage: 1,
          pageSize: 10,
          status: parseInt(activeKey),
        });
        setApiStatus(parseInt(activeKey))
      }} >
        <Tabs.TabPane tab={`已审核(${approvedCount})`} key={`${constants.api.status.APPROVED.value}`}>
          {tableComp}
        </Tabs.TabPane>
        <Tabs.TabPane tab={`待审核(${inProgressCount})`} key={`${constants.api.status.IN_PROGRESS.value}`}>
          {tableComp}
        </Tabs.TabPane>
        <Tabs.TabPane tab={`待提交(${pendingCount})`} key={`${constants.api.status.PENDING.value}`}>
          {tableComp}
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}