import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Select, InputNumber, Tooltip, Popconfirm, Table, Divider, IconFont, Modal } from '@aurum/pfe-ui';
export default ({ expressList, field, onAddPrizeItem, rewardKey, onSelectNew, onRemove, value }: any) => {

  const [modelVisible, setModelVisible] = React.useState(false);
const getFirstName = (value:any) => {
  if(value == 1) {
    return '首件（个）'
  } else {
    return '首重（kg）'
  }
}

const getLastName = (value:any) => {
  if(value == 1) {
    return '续件（个）'
  } else {
    return '续重（kg）'
  }
}

const deleteItem = (item:any) => {
  setModelVisible(true)
}

const handleOk =() => {
  setModelVisible(false)
}

const handleCancel =() => {
  setModelVisible(false)
}



  return (
    <Form.Item className="composite-required-field prize-items-container" rules={[{ required: true }]} style={{ marginBottom: '20px' }}>
      <Form.List name={field}>
        {(fields: any, { add, remove }) => {
          console.log('fields', fields)
          return <>
            <Button onClick={() => {
              onAddPrizeItem()
            }} icon={<IconFont type="icon-tianjia" />}>添加</Button>
            {fields.length > 0 &&
              <div style={{marginTop:'8px'}}>
                <Table
                  className="prize-items"
                  pagination={{position : ['bottomLeft']}}
                  scroll={{ x: '100%' }}
                  tableLayout="fixed"
                  style={{ textAlign: 'center' }}
                  columns={[
                    {
                      title: $t('可配送区域'),
                      dataIndex: 'name',
                      key: 'name',
                      width: 300,
                      render: (text: any, prizeField: any, index: any) => (
                        <span className='area'>{expressList[index]?.name}</span>
                      )
                    },
                    {
                      title: getFirstName(value),
                      dataIndex: 'firstNum',
                      key: 'firstNum',
                      width: 100,
                      render: (text: any, prizeField: any) => (
                        <Form.Item colon={false} name={[prizeField.name, 'firstNum']} rules={[{ required: true, message: '请输入首件（个）' }]}>
                          <InputNumber size='small' placeholder="请输入首件（个）" />
                        </Form.Item>
                      )
                    },
                    {
                      title: $t('运费（元）'),
                      dataIndex: 'charge',
                      key: 'charge',
                      width: 100,
                      render: (text: any, prizeField: any) => (
                        <Form.Item colon={false} name={[prizeField.name, 'charge']} rules={[{ required: true, message: '请输入运费（元）' }]}>
                          <InputNumber size='small' placeholder="请输入运费（元）" />
                        </Form.Item>
                      ),
                    },
                    {
                      title: getLastName(value),
                      dataIndex: 'nextNum',
                      key: 'nextNum',
                      width: 100,
                      render: (text: any, prizeField: any) => (
                        <Form.Item colon={false} name={[prizeField.name, 'nextNum']} rules={[{ required: true, message: '请输入续建（个）' }]}>
                          <InputNumber size='small' placeholder="请输入续建（个）" />
                        </Form.Item>
                      )
                    },
                    {
                      title: $t('续费（元）'),
                      dataIndex: 'nextCharge',
                      key: 'nextCharge',
                      width: 100,
                      render: (text: any, prizeField: any) => (
                        <Form.Item colon={false} name={[prizeField.name, 'nextCharge']} rules={[{ required: true, message: '请输入续件（元）' }]}>
                          <InputNumber size='small' placeholder="请输入续件（元）" />
                        </Form.Item>
                      )
                    },
                    {
                      title: $t('Action'),
                      dataIndex: 'action',
                      key: 'action',
                      width: 120,
                      align: "center",
                      render: (text: any, prizeField: any) => (
                        <div className="action-block">
                          <a onClick={() => {
                            onSelectNew(prizeField.key);
                          }}>修改</a>
                          <Divider type="vertical" />
                          <a onClick={() => { deleteItem(prizeField.key)}}>删除</a>
                        </div>
                      )
                    }
                  ]}
                  dataSource={fields}
                />
              </div>
            }
          </>
        }}
      </Form.List>

      <Modal
        width={520}
        title={'确认要删除吗？删除后可以点击添加按钮重新添加'}
        visible={modelVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
      </Modal>
    </Form.Item>
  )
};