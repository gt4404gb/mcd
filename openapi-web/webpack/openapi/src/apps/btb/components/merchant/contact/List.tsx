import React, { useState, useEffect } from 'react';
import { useParams, withRouter } from 'react-router-dom';
import { Table, Popconfirm, Space, Button, PageHeader, message } from '@aurum/pfe-ui';
import RecordEdit from './Edit';
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import * as apis from '@/apps/btb/common/apis';

const { transferAntdTableHeaderArray2Object, getEntityColumnLabel } = common.helpers;

export default withRouter(({ history }: any) => {
  const { merchantId }: any = useParams();

  const businessColumns: any = transferAntdTableHeaderArray2Object([
    ['合作类型', 'cooperationType', (value: any, record: any) => {
      return getEntityColumnLabel(constants.btb.merchantAudit.cooperationType, value)
    }],
    ['类型', 'type', (value: any, record: any) => {
      return getEntityColumnLabel(constants.btb.merchant.contactType, value)
    }],
    ['工号', 'userId'],
    ['姓名', 'username'],
    ['手机号', 'phone'],
    ['邮箱', 'mail'],
  ]);

  const actionColumns: any = [{
    title: $t('Action'),
    dataIndex: 'action',
    key: 'action',
    width: 120,
    fixed: 'right' as 'right',
    renderAction: (record: any, fileds: any) => [{
      name: '编辑',
      components: (<a type="link" onClick={() => {
        setContactDrawerVisible(true);
        setContact(fileds);
      }}>编辑</a>)
    }, {
      name: '删除',
      components: (
        <Popconfirm key="cancel" icon = '' onConfirm={() => {
          (async () => {
            const resp: any = await apis.getBMSModule().delContact({ id: fileds.id });
            message.destroy();
            if (resp?.success) {
              message.success('成功删除');
              updateContacts(merchantId);
            } else {
              message.error(resp.message || '删除失败');
            }

          })();
        }} title={`确认要删除吗？`} okText="确认" cancelText="取消" >
          <a type="link">删除</a>
        </Popconfirm>
      )
    }]
  }];


  const updateContacts: any = async (merchantId: any) => {
    if (!merchantId) return;
    const resp: any = await apis.getBMSModule().fetchContactList({ merchantId });
    if (resp) {
      resp.data?.forEach((item: any) => item.key = item.id);
      setDataRows(resp.data);
    }
  };

  const [contactDrawerVisible, setContactDrawerVisible]: any = useState(false);
  const [contact, setContact]: any = useState(null);
  const [dataRows, setDataRows]: any = useState([]);

  useEffect(() => {
    updateContacts(merchantId);
  }, [merchantId]);

  return (
    <div className="contact-list" >
      <PageHeader
        ghost={false}
        title="商户对接人"
      >
      </PageHeader>
      <Button key="1" type="primary" style={{marginBottom:'16px'}} onClick={() => {
            setContactDrawerVisible(true);
            setContact(null);
          }}>新增</Button>
      <RecordEdit visible={contactDrawerVisible} merchantId={merchantId} record={contact} onClose={(isSaved: boolean) => {
        setContactDrawerVisible(false);
        setContact(null);
        if (isSaved) {
          updateContacts(merchantId);
        }
      }} />

      <Table
        scroll={{ x: '100%' }}
        columns={businessColumns.concat(actionColumns)}
        dataSource={dataRows}
        pagination={false} />
    </div>
  )
});