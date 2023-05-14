import React, { useEffect, useState } from 'react';
import { Input, Button, Modal, Table, Tooltip, Select, IconFont, Row, Col } from '@aurum/pfe-ui';
import * as apisEdit from '@/common/net/apis_edit';


export default function Attribute({
  setCrowdCallback,
  crowdInfo,
  crowdListVisible,
}: any) {
  const [selectedList, setSelectedList] = useState({})
  const [crowdName, setCrowdName] = useState('');
  const [crowdCode, setCrowdCode] = useState('');
  const [crowdId, setCrowdId] = useState([]);
  const [valueType, setValueType]: any = useState(0);
  const [crowdVisible, setCrowdVisible] = useState(false);
  const [dataSourse, setDataSourse]: any = useState({
    pageNo: 1,
    pageSize: 10,
    total: 1,
    content: [{
      count: 0,
      createdDate: '',
      updatedDate: '',
      createdUser: '',
      id: '',
      crowdCode: '',
      crowdName: '',
      synchType: '',
    }]
  })
  const initData = selectedList
  
  let params: any = {
    pageNo: 1,
    pageSize: 10,
    crowdCode: '',
    crowdName: '',
    valueType: 0
  }
  const fetch = async (params: any) => {
    //const response = await apis.getPosterService().crowdList(params)
    const response = await apisEdit.getPosterService().crowdList(params)
    if (response?.data) {
      response.data?.content.map((index: any) => {
        switch (index.synchType) {
          case 0:
            index.synchTypeName = '人工导入'
            break;
          case 1:
            index.synchTypeName = '从大数据订阅'
            break;
          case 2:
            index.synchTypeName = '其他'
            break;
          default:
            break;
        }
      })
      setDataSourse(response.data)
    } else {
      setDataSourse({})
    }
  }

  useEffect(() => {
    setSelectedList(crowdInfo)
    const initId: any = [crowdInfo?.id]
    setCrowdId(initId)
  }, [crowdInfo])
  useEffect(() => { setCrowdVisible(crowdListVisible) }, [crowdListVisible])
  useEffect(() => { fetch(params) }, [])
  const reset = () => {
    setCrowdName('');
    setCrowdCode('');
  }
  const resetSearchData = () => {
    reset()
    fetch(params)
  }
  const handleOk = () => {
      reset()
      setCrowdVisible(false)
      setCrowdCallback(initData, false)
  }
  const handleCancel = () => {
    reset()
    setCrowdVisible(false)
    setCrowdCallback(crowdInfo, false)
    if (crowdInfo !== {}) {
      setCrowdId([])
    }
  }

  const searchCrowd: any = (page: number) => {
    let params: any = {
      pageNo: page,
      pageSize: 10,
      crowdCode: crowdCode,
      crowdName: crowdName,
      valueType: valueType
    };
    fetch(params);
  }
  const type = (
    <span>
      类型{' '}
      <Tooltip title="从大数据订阅的人群包，人群数据每天变化；人工导入的人群包，人群数据固定不变。">
        <IconFont type="icon-wenti" />
      </Tooltip>
    </span>
  );
  const labelType = (
    <span>
      标签/人群{' '}
      <Tooltip title="CRM系统处理时的分类，运营在使用时无需关注。">
      <IconFont type="icon-wenti" />
      </Tooltip>
    </span>
  );
  const columns: any = [
    {
      title: '人群包ID',
      dataIndex: 'crowdCode',
      key: 'crowdCode',
      width: 50,
      ellipsis: true,
    },
    {
      title: '人群包名称',
      dataIndex: 'crowdName',
      key: 'crowdName',
      width: 50,
      ellipsis: true,
    },
    {
      title: type,
      dataIndex: 'synchTypeName',
      key: 'synchTypeName',
      width: 50,
      ellipsis: true,

    },
    {
      title: labelType,
      key: 'type',
      dataIndex: 'type',
      width: 50,
      ellipsis: true,
      render: (text: any) => <div>{text === 1 ? '人群' : text === 2 ? '标签' : ''}</div>
    },
    {
      title: '创建人',
      dataIndex: 'createdUser',
      key: 'createdUser',
      width: 50,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 80,
      ellipsis: true,
    }
  ]
  const rowSelection: any = {
    hideSelectAll: true,
    type: 'checkbox',
    columnWidth: '20px',
    selectedRowKeys: crowdId,
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
      let arr:any = [];
      if(selectedRows.length > 0) {
        selectedRows.forEach((item:any) => {
          arr.push({
            crowdCode: item.crowdCode,
            crowdName: item.crowdName,
            type: item.type
          })
        })
      }
      setSelectedList(arr)
      setCrowdId(selectedRowKeys)

    }
  }
  return (
    <>
      <Modal
        title='选择人群包'
        visible={crowdVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={920}
        closable={false}
      >
        <div>
          <Row gutter={32} className="form-block">
            <Col className="gutter-row" span={4}>
              <div>
                <span>人群包ID</span>
                <Input value={crowdCode} onChange={(e) => { setCrowdCode(e.target.value) }} />
              </div>
            </Col>
            <Col className="gutter-row" span={4}>
              <div>
                <span>人群包名称</span>
                <Input value={crowdName} onChange={(e) => { setCrowdName(e.target.value) }} />
              </div>
            </Col>
            <Col className="gutter-row" span={4}>
              <div>
                <span>标签类型</span>
                <Select disabled defaultValue={0} style={{ width: '100%' }}>
                  <Select.Option value={0}>布尔型</Select.Option>
                </Select>
              </div>
            </Col>
          </Row>
        </div >
        <div style={{margin:'16px 0'}}>
          <Button type="primary" onClick={() => searchCrowd(1)} style={{ marginRight: '8px' }}>查询</Button>
          <Button type="ghost" onClick={() => { resetSearchData() }}>重置</Button>
        </div>
        <div>
          <Table
            scroll={{ x: 800 }}
            columns={columns}
            rowKey='id'
            rowSelection={rowSelection}
            dataSource={dataSourse?.content}
            pagination={{
              pageSize: dataSourse?.pageSize,
              hideOnSinglePage: false,
              total: dataSourse?.total,
              current: dataSourse?.pageNo,
              onChange: (page) => {
                searchCrowd(page)
              },
              position: ['bottomLeft']
            }}
          />
        </div>
      </Modal>
    </>
  )
}