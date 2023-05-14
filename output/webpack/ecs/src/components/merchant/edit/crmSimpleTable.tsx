import React, { useEffect, useRef, useState } from 'react';
import { Table } from '@aurum/pfe-ui';
export default ((props: any) => {
    const { data, rowKey='membershipSpecCode', pagination = false} = props
    const [dataSource, setDataSource]: any = useState([]);

    const colums=[
        {
          title: '会籍名称',
          dataIndex: 'membershipName',
          key: 'membershipName',
          width: 100,
          ellipsis: true,
        },
        {
          title: '会籍描述',
          dataIndex: 'description',
          key: 'description',
          width: 120,
          ellipsis: true,
        },
        {
          title: '规格编码',
          dataIndex: 'membershipSpecCode',
          key: 'membershipSpecCode',
          width: 90
        },
        {
          title: '规格描述',
          dataIndex: 'membershipSpecDesc',
          key: 'membershipSpecDesc',
          width: 120
        },
        {
          title: '有效期类型',
          dataIndex: 'membershipSpecTypeDesc',
          key: 'membershipSpecTypeDesc',
          width: 100
        },
        {
          title: '天数',
          dataIndex: 'membershipSpecEffectDate',
          key: 'membershipSpecEffectDate',
          width: 80
        },
        {
          title: '有效开始日期',
          dataIndex: 'membershipSpecStartDate',
          key: 'membershipSpecStartDate',
          width: 100
        },
        {
          title: '有效结束日期',
          dataIndex: 'membershipSpecEndDate',
          key: 'membershipSpecEndDate',
          width: 100
        }
      ]
    
    useEffect(() => {
        if (data && Array.isArray(data)) {
            setDataSource(data)
        } else if(data && !Array.isArray(data)){
            setDataSource([data])
        }
         else {
            setDataSource([])
        }
    }, [data]);

    return (
        <div className="activity-list table-container">
            <div className="table-top-wrap" >
                <Table
                    pagination={pagination}
                    rowKey={rowKey}
                    scroll={{ x: '100%' }}
                    tableLayout="fixed"
                    columns={colums}
                    dataSource={dataSource}
                     />
            </div>
        </div>
    )
})
