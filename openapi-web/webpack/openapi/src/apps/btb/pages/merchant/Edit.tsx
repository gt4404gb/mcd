import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Input, Checkbox, Button, Row, Col, Radio, Popconfirm, message, Modal, Space } from '@aurum/pfe-ui';
// import { PictureWall } from '@omc/boss-widgets';
import PictureWall from '@/compoments/picture-wall/PictureWall';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import common from '@omc/common';
import constants from '@/apps/btb/common/constants';
import Contacts from '@/apps/btb/components/merchant/contact/List';
import * as apis from '@/apps/btb/common/apis';
import './styles/Edit.less';

const { getEntityColumnOptions } = common.helpers;
const cooperationTypeEum: any = constants.btb.merchantAudit.cooperationType;
const cancelTitle =<div><div>取消后所有编辑的数据将丢失，</div><div>确认要取消吗？</div></div>;

export default ({ history }: any) => {
  const [entity, setEntity]: any = useState({});
  const [merchantInfo, setMerchantInfo]: any = useState(null);
  const [clipboardText, setClipboardText]: any = useState(null);

  const [form] = Form.useForm();
  const { merchantId }: any = useParams();

  const fetchMerchant: any = async (merchantId: any) => {
    if (!merchantId) return;
    const { data: detail }: any = await apis.getBMSModule().getMerchant({ merchantId });
    if (typeof detail.cooperationType === 'string') {
      detail.cooperationType = detail.cooperationType?.replace(/\s+/, '').split(',') || [];
    }
    detail.cooperationType = detail.cooperationType || [];
    detail.cooperationType = detail.cooperationType?.map((type: any) => parseInt(type));

    if (typeof detail.merchantType === 'string') {
      detail.merchantType = detail.merchantType?.replace(/\s+/, '').split(',') || [];
    }
    detail.merchantType = detail.merchantType || [];
    detail.merchantType = detail.merchantType?.map((type: any) => parseInt(type));

    detail.merchantId = merchantId;
    detail.delFlag = 0;
    setEntity(detail);
  }

  useEffect(() => {
    fetchMerchant(merchantId);
    return () => {
      setEntity({});
    }
  }, [merchantId]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const save: any = async (formData: any) => {
    formData.cooperationType = formData.cooperationType.join(',');
    formData.merchantType = formData.merchantType.join(',');
    if (formData.merchantId) {
      const resp: any = await apis.getBMSModule().updateMerchant(formData);
      if (resp?.success) {
        message.success('商户更新成功');
      } else {
        message.error(resp.message || '商户更新失败');
      }
    } else {
      const resp: any = await apis.getBMSModule().addMerchant(formData);
      if (resp?.success) {
        message.success('商户新增成功');
        setMerchantInfo(resp.data);
        setClipboardText(`
商户: ${resp.data.merchantName}
账号: ${resp.data.merchantId}
密码: ${resp.data.password}
`);
      } else {
        message.error(resp.message || '商户新增失败');
      }
    }
  }

  return (<div className="btb-merchant-edit">
    <Modal width={400} className="merchant-modal" visible={merchantInfo ? true : false}
      onCancel={() => {
        setMerchantInfo(null);
        setClipboardText(null);
        history.push('/openapi/btb/merchants');
      }}
      footer={null}
      title="商户信息"
    >
      <Row>
        <Col span="24">
          <Form.Item label="商户">{merchantInfo?.merchantName}</Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span="24">
          <Form.Item label="账号">{merchantInfo?.merchantId}</Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span="24">
          <Form.Item label="密码">{merchantInfo?.password}</Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span="24">
          {/* <Button onClick={() => {
            setMerchantInfo(null);
            history.push('/openapi/btb/merchants');
          }}>关闭</Button> */}
          <CopyToClipboard text={clipboardText} onCopy={() => { message.success('商户信息复制成功'); }}>
            <Button type="primary">复制</Button>
          </CopyToClipboard>
        </Col>
      </Row>
    </Modal>
    <div className="basic-info-wrapper">
      <Form layout="vertical"
        form={form}
        className="edit-form"
        initialValues={entity}
        onFinish={(values: any) => {
          save(values);
        }}
        onValuesChange={(chgValues: any, values: any) => {
          if (chgValues.cooperationType !== undefined) {
            setEntity(values);
          }
        }}
      >
        <div className="basic-block">
          <div className="title">基本信息</div>
          <Row gutter={16}>
            <Col span="3">
              <Form.Item label={$t('商户编号')} name="merchantId" >
                <Input maxLength={100} placeholder="商户编号" disabled />
              </Form.Item>
            </Col>
            <Col span="3">
              <Form.Item label={$t('商户名称')} name="companyName" rules={[{ required: true }]}>
                <Input maxLength={100} placeholder="请输入企业名称" />
              </Form.Item>
            </Col>
            <Col span="3">
              <Form.Item label={$t('商户英文名称')} name="merchantNameEn" >
                <Input maxLength={200} placeholder="请输入商户英文名称" />
              </Form.Item>
            </Col>
            <Col span="3">
              <Form.Item label={$t('商户类型')} name="merchantType" rules={[{ required: true }]}>
                <Checkbox.Group options={getEntityColumnOptions(constants.btb.merchant.type)} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={32}>
            <Col span="3">
              <Form.Item label={$t('商户联系人')} name="name" rules={[{ required: true }]} >
                <Input maxLength={50} placeholder="商户联系人" />
              </Form.Item>
            </Col>
            <Col span="3">
              <Form.Item label={$t('联系手机')} name="phone" rules={[{ required: true }]} >
                <Input maxLength={11} placeholder="请输入联系手机" />
              </Form.Item>
            </Col>
            <Col span="3">
              <Form.Item label={$t('联系邮箱')} name="mail" rules={[{ type: 'email' }]} >
                <Input maxLength={50} placeholder="请输入联系邮箱" />
              </Form.Item>
            </Col>
            <Col span="3">
              <Form.Item label={$t('商户图片')} name="merchantPic"
                extra='图片仅支持jpg/jpeg/png格式，不超过3M'>
                <PictureWall
                  accept=".png,.jpg,.jpeg"
                  maxBytes={3 * 1024 * 1024}
                  allowedMimes={['png', 'jpg', 'jpeg']}
                  uploadType='singleFile'
                  listType=''
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label={$t('备注')} name="remark" >
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
        </div>
        <div className="cooperation-block">
          <div className="title">合作类型</div>
          <div className="sub-title">配置商户合作类型，将影响商户平台的功能</div>
          <Form.Item name="cooperationType" rules={[{ required: true, message: '请选择合作类型' }]} >
            <Checkbox.Group options={[
              { value: cooperationTypeEum.COUPON.value, label: cooperationTypeEum.COUPON.label },
              { value: cooperationTypeEum.CROP_MEAL.value, label: cooperationTypeEum.CROP_MEAL.label },
              { value: cooperationTypeEum.GROUP_MEAL.value, label: cooperationTypeEum.GROUP_MEAL.label },
              { value: cooperationTypeEum.API_BUDDY.value, label: cooperationTypeEum.API_BUDDY.label },
            ]} />
          </Form.Item>
        </div>
        {entity?.cooperationType?.indexOf(cooperationTypeEum.COUPON.value) > -1 &&
          <div className="cooperation-block">
            <div className="title">卡券</div>
            <Form.Item label="支付方式" name="payType" rules={[{ required: true, message: '请选择支付方式' }]} >
              <Radio.Group options={getEntityColumnOptions(constants.btb.order.payType)} />
            </Form.Item>
            <Form.Item label="开票方式" name="billType" rules={[{ required: true, message: '请选择开票方式' }]} >
              <Radio.Group options={getEntityColumnOptions(constants.btb.order.billType)} />
            </Form.Item>
            <Row gutter={32}>
              <Col span="3">
                <Form.Item label="渠道ChannelCode" name="channelCode">
                  <Input maxLength={50} placeholder="请填写渠道ChannelCode" />
                </Form.Item>
              </Col>
            </Row>

          </div>}
        <div className="actions">
          <Space size="xs">
            <Button type="primary" htmlType="submit">保存</Button>
            <Popconfirm key="cancel" icon='' onConfirm={() => {
              history.push('/openapi/btb/merchants');
            }}
            title={cancelTitle}
            okText="确认" cancelText="取消" >
              <Button >取消</Button>
            </Popconfirm>
          </Space>
        </div>
      </Form>
    </div>
    {merchantId && <div className="contact-info-wrapper">
      <Contacts />
    </div>}
  </div>);
}