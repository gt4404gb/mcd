import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col, Popconfirm, message, InputNumber } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis'
import MerchantSelectField from '@/apps/btb/components/libs/MerchantSelectField';
import VoucherTemplateSelectField from '@/apps/btb/components/libs/VoucherTemplateSelectField';
import './styles/OrderEdit.less'

export default ({ history }: any) => {
  const [entity, setEntity]: any = useState({});
  const [form] = Form.useForm();

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const save: any = async (formData: any) => {
    formData.amount = formData.amountYuan * 100;
    const resp: any = await apis.getVoucherModule().orderAdd(formData);
    if (resp?.success) {
      message.success('凭证订单创建成功');
      history.push('/openapi/btb/voucher/orders');
    } else {
      message.error(resp.message || '凭证订单创建失败');
    }
  }

  return (<div className="btb-voucher-order-edit">
    <div className="page-block">
      <div className="page-header"><h1>凭证订单</h1></div>
      <div className="page-body">
        <Form layout="vertical"
          form={form}
          className="edit-form"
          initialValues={entity}
          onFinish={(values: any) => {
            save(values);
          }}
          onValuesChange={(chgValues: any, values: any) => {
            if ('type' in chgValues) {
              setEntity(values);
            }
          }}
        >
          <Row gutter={20}>
            <Col span="12">
              <Form.Item hidden={true} name="id">
                <Input />
              </Form.Item>
              <Form.Item label={$t('凭证模板')} name="templateCode" rules={[{ required: true }]}>
                <VoucherTemplateSelectField />
              </Form.Item>
              <Form.Item label={$t('商户')} name="merchantId" rules={[{ required: true, message: '请选择商户名称' }]}>
                <MerchantSelectField allowClear />
              </Form.Item>
              <Form.Item label={$t('兑换码数量')} name="redeemNum" rules={[{ required: true }]}>
                <InputNumber className="redeem-num-input" min={1} max={1000000} maxLength={7} placeholder="请输入兑换码数量" />
              </Form.Item>
              <Form.Item label={$t('结算金额')} name="amountYuan" rules={[
                {
                  required: true,
                  type: 'number',
                  transform: (v: any) => {
                    return Number(v);
                  },
                  message: '请输入0～20000000.00之间的数字'
                },
                {
                  validator: async (_, value) => {
                    if (value < 0 || value > 20000000) {
                      throw new Error('请输入0～20000000.00之间的数字');
                    }
                  }
                }]}>
                <Input maxLength={11} placeholder="请输入结算金额" suffix="元" />
              </Form.Item>
              <Form.Item label={$t('第三方订单号')} name="outRequestNo">
                <Input maxLength={64} placeholder="请输入第三方订单号" />
              </Form.Item>
              <Form.Item label={$t('备注')} name="remark" >
                <Input.TextArea rows={5} maxLength={500} placeholder="请输入备注" />
              </Form.Item>
              <Form.Item>
                <Button key="save" type="primary" htmlType="submit">保存</Button>
                <Popconfirm key="cancel" onConfirm={() => {
                  history.push('/openapi/btb/voucher/orders');
                }} title={`取消后所有编辑的数据将丢失，确认要取消吗？`} okText="确认" cancelText="取消" >
                  <Button >取消</Button>
                </Popconfirm>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  </div >);
}