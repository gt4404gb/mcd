import React, { useEffect, useState } from 'react';
import { Form, Modal, Input, message, Radio, Button, Select } from '@aurum/pfe-ui';
import * as apis from '@/apps/btb/common/apis';
import './styles/StockDialog.less';
import { string } from 'prop-types';
const { TextArea } = Input;
const { Option } = Select;

export default ({
  visible = false,
  isEdit = false,
  templateCode = '',
  merchantOptions = [],
  onClose,
}: any) => {
  const [entity, setEntity]: any = useState({
    templateCode: '',
    templateName: '',
    merchantId: '',
    merchantName: '',
    introduction: '',
    platform: 0,
    merchantObj: {}
  });

  const [form] = Form.useForm();

  useEffect(() => {
    fetchDetail(templateCode);
    return () => {
      setEntity({});
    };
  }, [templateCode]);

  useEffect(() => {
    if (visible && !templateCode) {
      form.resetFields();
    }
  }, [visible]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const fetchDetail: any = async (templateCode: any) => {
    if (!templateCode) {
      setEntity({
        templateCode: '',
        templateName: '',
        merchantId: '',
        merchantName: '',
        introduction: '',
        platform: 0,
        merchantObj: {
          value: '',
          label: ''
        }
      });
      return;
    }

    const { data: detail }: any = await apis.getVoucherModule().templateDetail(templateCode);
    detail.templateCode = templateCode;
    if (isEdit && detail.merchantId) {
      detail.merchantObj = {
        value: detail.merchantId,
        label: detail.merchantName,
        key: detail.merchantId
      }
    }
    setEntity(detail);
  };

  const closeDialog = (refresh = false) => {
    onClose(refresh);
  }

  const save: any = async (formData: any) => {
    if ((formData?.platform != 1) && (formData?.platform != 2)) {
      message.error('请选择使用场景');
      return;
    }
    if (templateCode) formData.templateCode = templateCode;
    formData.merchantId = formData.merchantObj?.value;
    formData.merchantName = formData.merchantObj?.label;
    const resp: any = await apis.getVoucherModule().templateSave(formData);
    if (resp?.success) {
      message.success('资源模板保存成功');
      closeDialog(true);
    } else {
      message.error(resp.message || '资源模板保存失败');
    }
  };

  return (
    <div className="stock-container">
      <Modal width={550}
        className="stock-dialog"
        maskClosable={false}
        visible={visible}
        onCancel={() => {
          closeDialog();
        }}
        footer={!isEdit ? [
          <Button
            key="back"
            onClick={() => {
              closeDialog();
            }}
          >
            关闭
          </Button>,
        ] : [
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              form.submit();
            }}
          >
            保存
          </Button>,
          <Button
            key="back"
            onClick={() => {
              closeDialog();
            }}
          >
            关闭
          </Button>,
        ]}
        title={`资源管理`}
      >
        {!isEdit && <Form
          form={form}
          labelAlign="right"
          layout="vertical"
          className="sto-form"
          initialValues={entity}
        >
          <Form.Item label={$t('资源编号')} name='templateCode'>
            {entity.templateCode}
          </Form.Item>
          <Form.Item label={$t('资源名称')} name='templateName'>
            {entity.templateName}
          </Form.Item>
          <Form.Item label={$t('供应商')} name="merchantName">
            {entity.merchantName}
          </Form.Item>
          <Form.Item name="platform" label={<span>使用场景</span>}>
            {entity.platform === 1 ? '电商平台' : '社群/会员活动'}
          </Form.Item>
          <Form.Item label={$t('备注')} name="introduction">
            {entity.introduction}
          </Form.Item>
        </Form>}

        {isEdit && <Form
          form={form}
          labelAlign="right"
          layout="vertical"
          className="sto-form"
          initialValues={entity}
          onFinish={(values: any) => {
            save(values);
          }}
        >
          <Form.Item label={$t('资源编号')} name='templateCode'>
            <Input maxLength={30} disabled />
          </Form.Item>
          <Form.Item label={$t('资源名称')} name='templateName'>
            <Input maxLength={30} placeholder="请输入资源名称" />
          </Form.Item>
          <Form.Item label={$t('供应商')} name="merchantObj">
            <Select
              showSearch
              options={merchantOptions}
              labelInValue={true}
              placeholder="请选择商户名称"
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="platform" label={<span>使用场景</span>} rules={[{ required: true, message: '请选择使用场景' }]}>
            <Radio.Group>
              <Radio value={1}>电商平台</Radio>
              <Radio value={2}>社群/会员活动</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label={$t('备注')} name="introduction">
            <TextArea />
          </Form.Item>
        </Form>}
      </Modal>
    </div>
  );
}