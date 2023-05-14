import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, Input, message, Modal, InputNumber, Table, Select } from '@aurum/pfe-ui';
import { sanitizeToInteger } from '@/common/helper';
const maxNum = 5;

export default ({ canOnlyView, agreements, field }: any) => {
  const [skuNum, setSkuNum]: any = useState(0);

  useEffect(() => {
    setSkuNum(agreements?.length || 0)
  },[agreements])

  const del = (key: any) => {

  }

  return (
    <Row className="form-block">
      <Col span={12}>
        <Row className="gutter-row">
          <Col span={4}>
            协议名称
          </Col>
          <Col span={4}>
            协议地址
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.List name={field}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }: any, index: any) => (
                    <Row gutter={16} key={key} className='select-pro-wrap'>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          rules={[{ message: '请选择协议' }]}
                        >
                          <Input placeholder='请填写协议名称，限制30字符' />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'url']}
                        >
                          <Input placeholder='请填写 http/https 开头的网页地址' />
                        </Form.Item>
                      </Col>
                      <Col span={4} onClick={() => { 
                        remove(name) 
                        let num = JSON.parse(JSON.stringify(skuNum));
                        setSkuNum(num - 1);
                        }} >
                        <a style={{ marginTop: '7px', display:'block' }}>删除</a>
                      </Col>
                    </Row>
                  ))}
                  {skuNum < maxNum && <div style={{ marginBottom: '16px', marginLeft:'-18px' }}>
                    <Button type='link' onClick={() => {
                      let num = JSON.parse(JSON.stringify(skuNum));
                      setSkuNum(num + 1);
                      add()
                    }}>添加协议</Button>
                  </div>}
                </>
              )}
            </Form.List>
          </Col>
        </Row>
      </Col>
    </Row>
  )
}

