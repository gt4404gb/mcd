import React, { useEffect, useState, useRef } from 'react';
import { Form, Button, Modal, Select, Popconfirm, message, Input } from '@aurum/pfe-ui';
import * as orderApis from '@/common/net/apis_order';
import { number } from 'prop-types';

const refundInfo: any = {
  refundReason: '',
  refundReasonDesc: ''
}

export default ({ renewResult, visible, onClose, orderCode }: any) => {
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const [returnable, setReturnable] = useState(false);

  useEffect(() => {
    if (!renewResult) return;
    setReturnable(renewResult.flag)
  }, [renewResult])

  const onSubmit = async (returnable: any) => {
    if (returnable) {
      form.submit()
    }
  }

  const closeModal = () => {
    onClose && onClose();
  }

  const renderPanel = () => {
    return (
      <Form
        ref={formEl}
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 18 }}
        layout="horizontal"
        initialValues={refundInfo}
        form={form}
        onFinish={(values: any) => {
          closeModal();
          (async function () {
            const result: any = await orderApis.getMerchantModule().terminateOrder({ orderCode: orderCode});
            if (result.code !== 200) {
              message.error(result.message || '取消失败，请稍后重试！');
            } else {
                message.success(result.data || '取消成功!');
                setTimeout(() => {
                    location.reload();
                },1000)  
            }
          })();
        }}
      >
        <div className="refund-modal row">
          {renewResult?.flag?
            <div className="renew_tit">
                <div className="renew_item">
                    <span>商品名称：</span> 
                    <div className="renew_right">
                        {renewResult.name}
                    </div>
                </div>
                <div className="renew_item">
                    <span>说明：</span> 
                    <div className="renew_right">
                        {renewResult.note}
                    </div>
                </div>

                <div className="renew_item mt10">
                    是否确认关闭自动续费服务?
                </div>
            </div>:
            <div>{renewResult.note}</div>
          }
        </div>
      </Form>
    )
  }

  return (
    returnable ?
      <Modal width={800} visible={visible} onCancel={() => { onClose() }}
        bodyStyle={{ paddingTop: '0' }}
        title="关闭自动续费"
        footer={[
          <Button key="cancel" onClick={() => { onClose() }}>取消</Button>,
          <Popconfirm
            title="确认关闭自动续费？"
            onConfirm={() => { onSubmit(returnable) }}
            okText="确认"
            cancelText="取消"
            icon="" 
          >
            <Button key="confirm" type="primary">确定</Button>
          </Popconfirm>
        ]}
      >
        {renderPanel()}

      </Modal> :
      <Modal width={800} visible={visible} onCancel={() => { onClose() }}
        bodyStyle={{ paddingTop: '0' }}
        title="关闭自动续费"
        footer={null}
      >
        {renderPanel()}
      </Modal>
  )
}