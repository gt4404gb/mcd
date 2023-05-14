import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux'
import { Table, Button, Modal, Input } from '@aurum/pfe-ui';
import * as orderApis from '@/common/net/apis_order';
import * as orderAction from '@/redux/actions/orderAction'
import { message } from 'antd';
const { TextArea } = Input;

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

export default connect(mapStateToProps, mapDispatchToProps) (({ visible, onClose, orderId, id, content, toRefreshRandom }: any) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(content)
  }, [content])

  useEffect(() => {
    if(!visible) {
      setValue('')
    }
  }, [visible])
  
  const handleOk = async () => {
    if (!value) {
      message.error('请添加备注')
      return;
    }
    if(id) {
      const { data: data } = await orderApis.getMerchantModule().updateOrderRemark({ id: id, content: value });
      if (data) {
        message.success('编辑成功')
        setTimeout(() => {
          onClose();
          toRefreshRandom(Math.random());
        }, 500)
      }
    } else {
      const { data: data } = await orderApis.getMerchantModule().addOrderRemark({ orderId: orderId, content: value });
      if (data) {
        message.success('添加成功')
        setTimeout(() => {
          onClose();
          toRefreshRandom(Math.random());
        }, 500)
      }
    }
    
  };

  const onChange = (e: any) => {
    setValue(e.target.value)
  };

  return (
    <Modal width={700} visible={visible}
      bodyStyle={{ paddingTop: '0' }}
      title="添加备注"
      onOk={handleOk}
      onCancel={() => { onClose() }}
    >
      <div className="remark-select-modal row">
        <TextArea showCount maxLength={300} value={value} onChange={onChange} />
      </div>
    </Modal>
  )
})