import React, { useEffect, useState } from 'react';
import { Form, Modal, Button, message } from '@aurum/pfe-ui';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './styles/OrderDetailDialog.less';

export default ({ visible = false, voucherOrder = {}, onClose }: any) => {
  const [entity, setEntity]: any = useState({});
  const [clipboardText, setClipboardText]: any = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    setEntity(voucherOrder || {});
  }, [voucherOrder])

  useEffect(() => {
    const clipboardText: string = `
订单号：${entity?.orderId}
外系统订单号：${entity?.outRequestNo}
凭证名称${entity?.templateName}
分销商：${entity?.merchantName}
数量：${entity?.redeemNum}
下载地址：${entity?.downloadUrl}
解压密码：${entity?.decompressPassword}
`;
    setClipboardText(clipboardText);
    form.resetFields();
  }, [entity]);

  return (<div className="order-detail-container">
    <Modal width={550}
      className="order-detail-dialog"
      maskClosable={false}
      visible={visible}
      onCancel={() => {
        if (onClose) onClose();
      }}
      title={`订单详情`}
      footer={[
        <CopyToClipboard key="cpoy-paste" text={clipboardText} onCopy={() => { message.success('订单信息复制成功'); }}>
          <Button type="primary">复制</Button>
        </CopyToClipboard>

      ]}
    >

      <Form layout="horizontal"
        form={form}
        labelAlign="right"
        labelCol={{ span: 4, offset: 2 }}
        className="sto-form"
        initialValues={entity}
      >
        <Form.Item label={$t('凭证订单号')} >{entity.orderId}</Form.Item>
        <Form.Item label={$t('外系统订单号')} >{entity.outRequestNo}</Form.Item>
        <Form.Item label={$t('凭证名称')} >{entity.templateName}</Form.Item>
        <Form.Item label={$t('分销商')} >{entity.merchantName}</Form.Item>
        <Form.Item label={$t('数量')} >{entity.redeemNum}</Form.Item>
        <Form.Item label={$t('下载地址')} >{entity.downloadUrl}</Form.Item>
        <Form.Item label={$t('解压密码')} >{entity.decompressPassword}</Form.Item>
      </Form>
    </Modal>
  </div>);
}