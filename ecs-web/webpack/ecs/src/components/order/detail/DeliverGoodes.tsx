import React, { useEffect, useState, useRef } from 'react';
import { Form, Button, Modal, Select, Popconfirm, Input, message } from '@aurum/pfe-ui';
import { connect } from 'react-redux'
import * as orderAction from '@/redux/actions/orderAction'
import * as orderApis from '@/common/net/apis_order';

const mapStateToProps = (state: any) => {
  return {
    refreshRandom: state.order.refreshRandom
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  toRefreshRandom: (payload: any) => dispatch({
    type: orderAction.ORDER_ORDER_REFRESH,
    payload
  })
});

export default connect(mapStateToProps, mapDispatchToProps) (({ refundResult, visible, onClose, orderId, toRefreshRandom }: any) => {
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const [selectIns, setSelectedIns] = useState('');
  const [courierNumber, setCourierNumber] = useState('');

  const onSubmit = async () => {
    form.submit()
  }

  const handleCourierCompany = (value: any) => {
    setSelectedIns(value);
  }

  const handleCourierNumber = (value: string) => {
    setCourierNumber(value)
  }

  const renderPanel = () => {
    return (
      <Form
        ref={formEl}
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 18 }}
        layout="horizontal"
        form={form}
        onFinish={() => {
          (async function () {
            onClose();
            const { data: data }: any = await orderApis.getMerchantModule().deliverDoods({ orderId, expressName: selectIns, expressNo: courierNumber });
            toRefreshRandom(Math.random());
            if (data !== 'SUCCESS') {
              message.error('快递信息设置失败，请稍后重试！');
            } else {
              message.success('快递信息设置成功');
            }
          })();
        }}
      >
        <div className="refund-modal row">
          <div className="refund_tit" key="1">
            <Form.Item className="composite-required-field" name="courierCompany" label={$t('快递公司名称：')} rules={[{ required: true, message: '请选择快递公司名称' }]} style={{ marginRight: '10px' }}>
              <Select placeholder={$t('请选择快递公司')}
                style={{ width: '100%' }}
                onChange={handleCourierCompany}
                options={refundResult} />
            </Form.Item>
          </div>
          <div className="refund_tit" key="2">
            <Form.Item className="composite-required-field" name="courierNumber" label={$t('快递单号：')} rules={[{ required: true, message: '请输入快递单号' }]} style={{ marginRight: '10px' }}>
              <Input placeholder={$t('请输入快递单号')}
                onChange={(V) => {
                  handleCourierNumber(V.target.value)
                }} />
            </Form.Item>
          </div>
        </div>
      </Form>
    )
  }

  return <Modal width={800} visible={visible} onCancel={() => { onClose() }}
    bodyStyle={{ paddingTop: '0' }}
    title="快递信息"
    footer={[
      <Button key="cancel" onClick={() => { onClose() }}>取消</Button>,
      <Popconfirm
        title="确认快递信息，并且发货？"
        onConfirm={() => { onSubmit() }}
        okText="确认"
        cancelText="取消"
        icon="" 
      >
        <Button key="confirm" type="primary">确定</Button>
      </Popconfirm>
    ]}
  >
    {renderPanel()}
  </Modal>
})