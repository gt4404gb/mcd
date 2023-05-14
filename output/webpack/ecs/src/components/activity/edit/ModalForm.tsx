import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button, Input, message, Modal, InputNumber } from '@aurum/pfe-ui';
import { sanitizeToInteger } from '@/common/helper';
export default ({ canOnlyView }: any) => {

  const [form] = Form.useForm();

  useEffect(() => {
    if (!canOnlyView) {
      form.resetFields();
    }
  }, [canOnlyView])

  const onOk = () => {
    form.submit();
  };

  return (
      <Form form={form} layout="vertical" name="userForm">
        <Row>
          <Col span={12}>
            <div className="edit-area">
              <Row className="form-block" gutter={30} align="middle" justify="start">
                <Col span={2}>
                  <Form.Item label={$t('起拍价(积分)')} name="startPrice" rules={[{ required: true }]}>
                    <InputNumber placeholder="限正整数" min={1} maxLength={7}
                      formatter={(value: any) => sanitizeToInteger(value)}
                      parser={value => sanitizeToInteger(value) || ''}
                    />
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <Form.Item label={$t('加价幅度(积分)')} name="priceStep" rules={[{ required: true }]}>
                    <InputNumber placeholder="限正整数" min={1} maxLength={7}
                      formatter={(value: any) => sanitizeToInteger(value)}
                      parser={value => sanitizeToInteger(value) || ''}
                    />
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <Form.Item label={$t('竞拍数量')} name="count" rules={[{ required: true }]}>
                    <InputNumber placeholder="限正整数" min={1} maxLength={7}
                      formatter={(value: any) => sanitizeToInteger(value)}
                      parser={value => sanitizeToInteger(value) || ''}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={12}>
                  <Button type="primary" onClick={onOk}>关联</Button>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Form>
  )
}

