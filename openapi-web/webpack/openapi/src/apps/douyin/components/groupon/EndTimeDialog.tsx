import React, { useEffect, useState } from 'react';
import { Form, Modal, DatePicker } from '@aurum/pfe-ui';
import * as apis from '@/apps/douyin/common/apis';
import moment from 'moment';
import helper from '../../common/helper';

export default ({ groupon = null, onClose }: any) => {
  const [entity, setEntity]: any = useState({});
  const [loading, setLoading]: any = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (groupon) {
      groupon.end_moment = moment(groupon.end_time * 1000);
      setEntity({ ...groupon });
    }
  }, [groupon]);

  useEffect(() => {
    form.resetFields();
  }, [entity]);

  return (<div className="end-time-container">
    <Modal width={550}
      className="end-time-dialog"
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
      title={`改时间`}
    >

      <Form layout="horizontal"
        form={form}
        labelAlign="right"
        labelCol={{ span: 5, offset: 1 }}
        className="sto-form"
        initialValues={entity}
        onFinish={(values: any) => {
          (async () => {
            setLoading(true);
            const formData: any = {
              groupon_id: entity.groupon_id,
              end_time: parseInt(values.end_moment.format('X')),
            }
            const resp: any = await apis.getDouyinModule().saveGrouponWithoutVerify(formData);
            setLoading(false);
            helper.handleMessage(resp, '修改时间成功', () => {
              onClose(formData);
            });
          })();
        }}
      >
        <Form.Item label={$t('售卖截止时间')} name="end_moment" rules={[{ required: true }]}>
          <DatePicker
            format="YYYY-MM-DD HH:mm:ss"
            showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss') }}
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>);
}