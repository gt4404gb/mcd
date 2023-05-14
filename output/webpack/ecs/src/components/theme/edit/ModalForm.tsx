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
              </Row>
              <Row>
                <Col span={12}>
                  <Button type="primary" onClick={onOk}>绑定</Button>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Form>
  )
}

