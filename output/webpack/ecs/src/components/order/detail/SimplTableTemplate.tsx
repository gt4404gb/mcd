import React, { useEffect, useRef, useState } from 'react';
import { Table } from '@aurum/pfe-ui';
export default ((props: any) => {
    const { data, colums, rowKey, pagination = false} = props
    const [dataSource, setDataSource]: any = useState([]);
    
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
