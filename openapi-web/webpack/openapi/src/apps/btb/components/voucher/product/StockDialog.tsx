import React, { useEffect, useState } from 'react';
import { Form, Modal, InputNumber, message } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis';
import './styles/StockDialog.less';

export default ({ visible = false, templateCode = {}, onClose }: any) => {
  const [entity, setEntity]: any = useState({});
  const [form] = Form.useForm();

  useEffect(() => {
    if (templateCode) {
      (async () => {
        const resp: any = await apis.getVoucherModule().templateStockQuery(templateCode);
        setEntity({ ...resp.data, templateCode });
      })();
    }
  }, [templateCode])

  return (<div className="stock-container">
    <Modal width={550}
      className="stock-dialog"
      maskClosable={false}
      visible={visible}
      onOk={() => {
        form.submit();
      }}
      onCancel={() => {
        if (onClose) onClose();
      }}
      title={`加库存`}
    >

      <Form layout="horizontal"
        form={form}
        labelAlign="right"
        labelCol={{ span: 4, offset: 2 }}
        className="sto-form"
        initialValues={entity}
        onFinish={(values: any) => {
          (async () => {
            const resp: any = await apis.getVoucherModule().templateStockIncrease(templateCode, values.stock);
            if (resp.success) {
              message.success(resp.message || '增加库存成功');
              if (onClose) onClose();
            } else {
              message.error(resp.message || '增加库存出错');
            }
          })();
        }}
      >
        <Form.Item label={$t('总库存')} >
          {entity.totalStock}
        </Form.Item>
        <Form.Item label={$t('订单数')} >
          {entity.orderNum}
        </Form.Item>
        <Form.Item label={$t('已使用库存')} >
          {entity.usedStock}
        </Form.Item>
        <Form.Item label={$t('剩余库存')} >
          {entity.leftStock}
        </Form.Item>
        <Form.Item label={$t('增加库存')} name="stock" rules={[{ required: true }]}>
          <InputNumber value={4} min={0} />
        </Form.Item>
      </Form>
    </Modal>
  </div>);
}