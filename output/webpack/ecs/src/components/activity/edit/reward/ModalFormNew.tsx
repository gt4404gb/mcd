import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, Input, message, Modal, InputNumber, Table, Space } from '@aurum/pfe-ui';
import { sanitizeToInteger } from '@/common/helper';

const initRoot = {
  list: []
}
export default ({ canOnlyView, selectedRows, delSelectedRows }: any) => {

  const [rootDetail, setRootDetail]: any = useState(JSON.parse(JSON.stringify(initRoot)));

  const [form] = Form.useForm();

  useEffect(() => {
    if(selectedRows.length > 0) {
      selectedRows.map((item:any) => {
        item.count = 1
      })
    }
    setRootDetail({ list: selectedRows })
  }, [selectedRows])

  useEffect(() => {
    form.resetFields();
  }, [rootDetail]);

  // useEffect(() => {
  //   if (!canOnlyView) {
  //     form.resetFields();
  //     setRootDetail({ list: [] })
  //   }
  // }, [canOnlyView])

  const del = ((spuId:any) => {
    delSelectedRows(spuId)
  })

  return (
    <Form form={form} layout="vertical" name="modalFoemNew" initialValues={rootDetail} className='modal-form-new'>
      <Row>
        <Col>
          <div className='select-pro-wrap'>
            <div className='dd1'>商品ID</div>
            <div className='dd2'>商品名称</div>
            <div className='dd3'>单次赠送数</div>
            <div className='dd4'>操作</div>
          </div>

        </Col>
        <Col span={12}>
          <Form.List name="list">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className='select-pro-wrap'>
                    <div className='dd1'>{rootDetail.list[index]?.spuId}</div>
                    <div className='dd2'>{rootDetail.list[index]?.name}</div>
                    <div className='dd3'><Form.Item
                      {...restField}
                      name={[name, 'count']}
                    >
                      <Input size='small' />
                    </Form.Item>
                    </div>
                    <div className='dd4' onClick={() => {del(rootDetail.list[index]?.spuId)}} >
                      <a>删除</a>
                    </div>
                  </div>
                ))}
              </>
            )}
          </Form.List>
          {/* <Form.List name='list'>
            {(fields: any, { add, remove }) => {
              console.log('fields', fields)
              return <>
                {fields.length > 0 &&
                  <>
                    <Table
                    className="prize-items"
                    pagination={false}
                    scroll={{ x: '100%' }}
                    tableLayout="fixed"
                    style={{ textAlign: 'center' }}
                    columns={columns}
                    dataSource={fields}
                  />
                  </>
                }
              </>
            }}
          </Form.List> */}

        </Col>
      </Row>
    </Form>
  )
}

