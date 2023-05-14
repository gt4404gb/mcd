import React, { useEffect, useState } from 'react';
import { Form, Modal } from '@aurum/pfe-ui';
import * as apis from '@/apps/douyin/common/apis';
import './styles/StockDialog.less';
import helper from '../../common/helper';
import StockInput from './StockInput';

export default ({ groupon = null, onClose }: any) => {
  const [entity, setEntity]: any = useState({});
  const [loading, setLoading]: any = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (groupon) setEntity({ ...groupon });
  }, [groupon]);

  useEffect(() => {
    form.resetFields();
  }, [entity]);

  return (<div className="stock-container">
    <Modal width={550}
      className="stock-dialog"
      maskClosable={false}
      confirmLoading={loading}
      visible={groupon ? true : false}
      onOk={() => {
        form.submit();
      }}
      onCancel={() => {
        setLoading(false);
        if (onClose) onClose();
      }}
      title={`改库存`}
    >

      <Form layout="horizontal"
        form={form}
        labelAlign="right"
        labelCol={{ span: 4, offset: 2 }}
        className="sto-form"
        initialValues={entity}
        onFinish={(values: any) => {
          (async () => {
            setLoading(true);
            entity.stock = values.stock;
            const resp: any = await apis.getDouyinModule().saveGrouponWithoutVerify({
              groupon_id: entity.groupon_id,
              stock: entity.stock
            });
            setLoading(false);
            helper.handleMessage(resp, '修改库存成功', () => {
              onClose(entity);
            });
          })();
        }}
      >
        <Form.Item label={$t('总库存')} name="stock" rules={[{ required: true }]}>
          <StockInput />
        </Form.Item>
        <Form.Item label={$t('已售卖')} >
          {entity.sold_count}（含已退订单）
        </Form.Item>
      </Form>
    </Modal>
  </div>);
}