import React, { useEffect, useState } from 'react';
import { Table, Form, Row, Col, Button, Input, message, Modal, Space } from '@aurum/pfe-ui';
import * as apisEdit from '@/common/net/apis_edit';
import Editor from '@/components/Editor';

const initRightsInfosIn: any = {
  list: []
}

export default ({ categoryId, cardCouponNo, stock, canOnlyView, visible, onClose, source, originList }: any) => {
  const [rightsInfos, setRightsInfos]: any = useState(JSON.parse(JSON.stringify(initRightsInfosIn)));

  const [rightsForm] = Form.useForm();

  useEffect(() => {
    if (visible) {
      fetchRight();
    }
  }, [visible])

  async function close([]) {
    if (onClose) {
      onClose([], source);
    }
  }

  const fetchRight = async () => {
    let params = {
      categoryId,
      cardCouponNo
    }
    if (originList?.length > 0) {
      const toUpdatedActivityDetailRights: any = {
        list: []
      };
      toUpdatedActivityDetailRights.list = originList;
      setRightsInfos(toUpdatedActivityDetailRights)

    } else {
      const resp = await apisEdit.getMerchantModule().couponsDetail(params);
      if (resp.code !== 200) {
        message.error('权益详情请求失败');
        return;
      }
      if (resp.success && resp.data) {
        const toUpdatedActivityDetailRights: any = {
          list: []
        };
        toUpdatedActivityDetailRights.list = resp.data.rightsInfos;
        setRightsInfos(toUpdatedActivityDetailRights)

      } else {
        message.error(resp.message);
        return;
      }
    }
  }

  useEffect(() => {
    rightsForm.resetFields();
  }, [rightsInfos]);

  const onOk = () => {
    if(canOnlyView) {
      close([])
    } else {
      rightsForm.submit();
    }
  };

  return (
    <Modal width={1200} visible={visible} onOk={onOk} onCancel={() => { close([]) }}
      bodyStyle={{ paddingTop: '0' }}
      title="维护卡的权益"
    >
      <div className="coupon-select-modal rights-select-modal row">
        <Form layout="vertical"
          form={rightsForm}
          className="search-form"
          initialValues={rightsInfos}
          onFinishFailed={(values) => {
          }}
          onFinish={(values: any) => {
            onClose && onClose(values.list, source)
          }}
          onValuesChange={(values: any) => {
          }}
        >
          <Form.List name='list'>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div key={field.key} className="right-con">
                    <div className="right-name">
                      <Form.Item
                        className="specName"
                        name={[field.name, 'name']}
                        label={$t('权益名称')}
                      >
                        <Input disabled />
                      </Form.Item>
                      <Form.Item
                        className="specName"
                        name={[field.name, 'nameEn']}
                        label={$t('权益名称英文')}
                      >
                        <Input maxLength={32} disabled={canOnlyView} />
                      </Form.Item>
                    </div>
                    <div className="right-detail">
                      <Form.Item
                        className="specName"
                        name={[field.name, 'detail']}
                        label={$t('权益详情')}
                      >
                        <Editor disabled={canOnlyView} detail={rightsInfos.list && rightsInfos.list[index]?.detail || ''} menus={['bold']} height='200' placeholder='请填写权益详情' />
                      </Form.Item>
                      <Form.Item
                        className="specName"
                        name={[field.name, 'detailEn']}
                        label={$t('权益详情英文')}
                      >
                        <Editor disabled={canOnlyView} detail={rightsInfos.list && rightsInfos.list[index]?.detailEn || ''} menus={['bold']} height='200' placeholder='请填写权益详情' />
                      </Form.Item>
                    </div>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </div>
    </Modal>
  )
}

