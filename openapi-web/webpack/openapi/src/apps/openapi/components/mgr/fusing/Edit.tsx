import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Drawer, message, Radio, Select } from '@aurum/pfe-ui';
import * as apis from '@/apps/openapi/common/apis'
import * as helper from '@/apps/openapi/common/helper';

const enumLimitType: any = {
  SUBSCRIBED: 1,
  API: 2,
  // APP: 3,
}
export default ({ visible = false, record, onClose }: any) => {
  const [form] = Form.useForm();
  const [appOptions, setAppOptions]: any = useState([]);
  const [apiOptions, setApiOptions]: any = useState([]);
  const [entity, setEntity]: any = useState({
    limitType: enumLimitType.API, // 默认API
  });

  useEffect(() => {
    (async () => {
      if (entity?.limitType === enumLimitType.API) {
        setApiOptions(await helper.getApiOptions({ pageNo: 1, pageSize: 999 }));
      } else if (entity?.limitType === enumLimitType.SUBSCRIBED) {
        setAppOptions(await helper.getPublishedAppsOptions({}, 'appId'));
        if (entity?.appId) {
          setApiOptions(await helper.getSubscribedApiOptions({
            pageSize: 999,
            appId: entity.appId,
          }, 'apiId'));
        } else {
          setApiOptions([]);
        }
      }
    })();
  }, [entity?.limitType])

  useEffect(() => {
    (async () => {
      if (entity?.appId) {
        setApiOptions(await helper.getSubscribedApiOptions({
          pageSize: 999,
          appId: entity.appId,
        }, 'apiId'));
      } else {
        setApiOptions([]);
      }
    })();
  }, [entity?.appId]);

  useEffect(() => {
    if (record) {
      setEntity({ ...record });
    }
    return () => {
      setEntity({ limitType: enumLimitType.API });
    }
  }, [record]);

  useEffect(() => {
    if (entity) form.resetFields();
  }, [entity]);

  const save: any = async (formData: any) => {
    const resp: any = await apis.getCoreMgrModule().save(formData);
    if (resp.code === 'SUCCESS') {
      message.success('保存成功');
      onClose(true);
    } else {
      message.error(resp.msg || '保存失败');
    }
  }

  return (<div className="edit-container">
    <Drawer
      forceRender
      maskClosable={false}
      title="限流熔断配置"
      width={500}
      onClose={() => onClose(false)}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      footer={
        <div style={{ textAlign: 'right', }}>
          <Button style={{ marginRight: 8 }} onClick={() => { onClose(false); }}>取消</Button>
          <Button onClick={() => form.submit()} type="primary">保存</Button>
        </div>
      }
    >
      <Form layout="vertical"
        form={form}
        labelAlign="right"
        className="edit-form"
        initialValues={entity}
        onFinish={(values: any) => {
          save(values);
        }}
        onValuesChange={(chgValues: any, values: any) => {
          if ('limitType' in chgValues) {
            if (chgValues.limitType === enumLimitType.SUBSCRIBED) {
              setAppOptions([]);
              setApiOptions([]);
            }
            setEntity({ ...values, appId: null, apiId: null })
          } else if ('appId' in chgValues) {
            setEntity({ ...values, apiId: null })
          }
        }}
      >
        <Form.Item hidden={true} name="id" >
          <Input />
        </Form.Item>
        <Form.Item label={$t('限流类型')} name="limitType" rules={[{ required: true }]} >
          <Radio.Group options={[
            { value: enumLimitType.API, label: '接口' },
            { value: enumLimitType.SUBSCRIBED, label: '订阅' }
          ]}
            disabled={entity.id ? true : false}
          />
        </Form.Item>
        {entity.limitType === enumLimitType.SUBSCRIBED ? <>
          <Form.Item label={$t('应用')} name="appId" rules={[{ required: true }]} >
            <Select options={appOptions} placeholder="请选择应用" showSearch optionFilterProp="label" disabled={entity.id ? true : false} />
          </Form.Item>
          <Form.Item label={$t('订阅接口')} name="apiId" rules={[{ required: true }]} >
            <Select options={apiOptions} placeholder="请选择接口" showSearch optionFilterProp="label" disabled={entity.id ? true : false} />
          </Form.Item></>
          :
          <Form.Item label={$t('接口')} name="apiId" rules={[{ required: true }]} >
            <Select options={apiOptions} placeholder="请选择接口" showSearch optionFilterProp="label" disabled={entity.id ? true : false} />
          </Form.Item>
        }
        <Form.Item label={$t('令牌桶总量')} name="burstCapacity" rules={[
          {
            message: '请输入一个有效的数字',
            type: 'number',
            transform: (value: any) => Number(value)
          },
        ]} >
          <Input placeholder="请输入令牌桶总量" />
        </Form.Item>
        <Form.Item label={$t('令牌桶填充数')} name="replenishRate" rules={[
          {
            message: '请输入一个有效的数字',
            type: 'number',
            transform: (value: any) => Number(value)
          },
        ]} >
          <Input maxLength={6} placeholder="请输入令牌桶填充数" suffix="/s" />
        </Form.Item>
        <Form.Item label={$t('每日调用量')} name="quota" rules={[
          {
            message: '请输入一个有效的数字',
            type: 'number',
            transform: (value: any) => Number(value)
          },
        ]} >
          <Input maxLength={9} placeholder="请输入每日调用量" />
        </Form.Item>
        {entity.limitType === enumLimitType.API ? <>
          <Form.Item label={$t('熔断错误率')} name="circuitErrorPercent" rules={[
            {
              min: 0,
              max: 100,
              message: '请输入一个0到100之间的数字',
              type: 'number',
              transform: (value: any) => Number(value)
            },
          ]} >
            <Input placeholder="请输入熔断错误率" suffix="%" />
          </Form.Item>
          <Form.Item label={$t('超时时间')} name="timeoutMills" rules={[
            {
              message: '请输入一个有效的数字',
              type: 'number',
              transform: (value: any) => Number(value)
            },
          ]} >
            <Input maxLength={6} placeholder="请输入超时时间" suffix="ms" />
          </Form.Item></> :
          <>
            <Form.Item hidden={true} name="circuitErrorPercent" >
              <Input />
            </Form.Item>
            <Form.Item hidden={true} name="timeoutMills" >
              <Input />
            </Form.Item>
          </>
        }
      </Form>
    </Drawer>
  </div>);
}