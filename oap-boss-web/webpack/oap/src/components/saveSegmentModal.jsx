import React, { useRef } from 'react';
import { Modal, Form, Select, Row, Col, Input } from '@aurum/pfe-ui';

const SaveTemplateModal = (props) => {
  const segmentForm = useRef();

  const handleCancel = () => {
    segmentForm.current.resetFields()
    props.onSaved({
      operation: 'cancel'
    })
  }

  const handleConfirm = async () => {
    segmentForm.current.validateFields().then(values => {
      segmentForm.current.resetFields()
      props.onSaved({
        operation: 'ok',
        formData: values
      })
    }).catch(err => {
      console.log(400, err)
    })
  }

  return <Modal
    title="保存为人群"
    visible={props.visible}
    cancelText="取消"
    okText="保存"
    confirmLoading={props.isLoading}
    onCancel={handleCancel}
    onOk={handleConfirm}>
    <div className="table-container">
      <Form
        ref={segmentForm}
        layout="vertical"
        size="middle">
        <div>
          <Row gutter={32}>
            <Col span={6}>
              <Form.Item label="人群ID">
                <Input placeholder="系统自动生成" disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="segName"
                label="人群名称"
                rules={[
                  {
                    validator: (rule, value, callback) => {
                      if ((value ?? '') !== '') {
                        if (value.replace(/\s+/g, "").length == 0) {
                          callback('您输入的全部是空格，请重新输入')
                        } else {
                          callback()
                        }
                      } else {
                        callback("请输入人群名称")
                      }
                    }
                  }
                ]}>
                <Input placeholder="最多输入30个字符" maxLength="30" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={32}>
            <Col span={12}>
              <Form.Item name="segDescription" label="人群描述">
                <Input.TextArea placeholder="最多输入60个字符" rows={3} maxLength="60" />
              </Form.Item>
            </Col>
            <Col span={12} style={{ marginBottom: '6px' }}>按MID统计，覆盖人数：{props.midNum}人</Col>
            <Col span={12}>提示：保存后的人群请在IMP-用户中心-人群圈选列表中查看</Col>
          </Row>
        </div>
      </Form>
    </div >
  </Modal >
}

export default SaveTemplateModal;