import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table } from '@aurum/pfe-ui';
import '@/assets/styles/api/list.less'

export default (({ invoicesInfo }: any) => {
  const colums = [
    {
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      title: '发票金额'
    },
    {
      dataIndex: 'taxAmount',
      key: 'taxAmount',
      title: '税额'
    },
    {
      dataIndex: 'consigneeType',
      key: 'consigneeType',
      title: '抬头类型'
    },
    {
      dataIndex: 'title',
      key: 'title',
      title: '发票抬头'
    },
    {
      dataIndex: 'taxRegistrationNumber',
      key: 'taxRegistrationNumber',
      title: '税号'
    },
    {
      dataIndex: 'email',
      key: 'email',
      title: '邮箱'
    },
    {
      dataIndex: 'invoiceCode',
      key: 'invoiceCode',
      title: '发票代码'
    },
    {
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      title: '发票号码'
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: '发票状态',
      render:(d: any, item: any) => {
        return d=='已开票'?<a href={item.invoiceUrl} target='_blank'>查看发票</a>:<text>{d}</text>
      }
    }
  ]

  return (
    <div className="activity-list table-container">
      <div className="table-top-wrap" >
        <Table
          pagination={false}
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          columns={colums}
          dataSource={invoicesInfo} />
      </div>
    </div>
  )
})
