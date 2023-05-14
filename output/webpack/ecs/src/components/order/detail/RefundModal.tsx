import React, { useEffect, useState, useRef } from 'react';
import { Form, Button, Modal, Select, Popconfirm, message, Input } from '@aurum/pfe-ui';
import * as orderApis from '@/common/net/apis_order';
import { number } from 'prop-types';

const refundInfo: any = {
  refundReason: '',
  refundReasonDesc: ''
}

export default ({ refundResult, visible, onClose }: any) => {
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const [refundReasonMap, setRefundReasonMap] = useState([]);
  const [returnable, setReturnable] = useState(false);
  const [selectIns, setSelectedIns] = useState('');
  const refundReasonMapObj: any = useRef({});
  useEffect(() => {
    let _refundReasonMap = refundResult.refundReasonMap;
    refundReasonMapObj.current = _refundReasonMap;
    if (!_refundReasonMap) return;
    let keysArr = Object.keys(_refundReasonMap);
    let arr: any = [];
    keysArr.forEach((key: any) => {
      arr.push({ label: _refundReasonMap[key], value: key })
    })
    setRefundReasonMap(arr);
  }, [refundResult])

  useEffect(() => {
    if (!refundResult) return;
    setReturnable(refundResult.returnable)
  }, [refundResult])

  const onSubmit = async (returnable: any) => {
    if (returnable) {
      form.submit()
    }
  }

  const closeModal = () => {
    onClose && onClose();
  }

  const handleChange = (value: any) => {
    setSelectedIns(value);
  }

  const renderPanel = () => {
    return (
      <Form
        ref={formEl}
        layout="vertical"
        initialValues={refundInfo}
        form={form}
        onFinish={(values: any) => {
          closeModal();
          (async function () {
            let _refundReason = refundReasonMapObj.current[values.refundReason];
            if (values.refundReason == '12') {
              _refundReason = values.refundReasonDesc
            }
           const result: any = await orderApis.getMerchantModule().refundAction({ orderCode: refundResult.orderCode, refundReason: _refundReason });
           if (result.code !== 200) {
              message.error(result.message || '取消失败，请稍后重试！');
            } else {
              if (result.data?.flag) {
                message.success('取消成功');
                setTimeout(() => {
                  location.reload();
                }, 1000)
              }
            }
          })();
        }}
      >
        <div className="refund-modal row">
          <div className="refund_tit">退款金额：
          <span style={{marginRight:'10px'}}>{refundResult.refundPrice>0 && <span>{refundResult.refundPrice/100}元</span>}</span>
          {refundResult.refundPoints>0 && <span>{refundResult.refundPoints/100}积分</span>}
          </div>
          {refundResult?.lists?.map((item: any, index: any) => {
            return <div className="refund-result" key={index} dangerouslySetInnerHTML={{ __html: item.data.desc }}></div>
          })}
          {refundResult?.returnable &&
            <div className="refund_tit">
              <Form.Item className="composite-required-field" name="refundReason" label={$t('取消原因：')} rules={[{ required: true, message: '请选择取消原因' }]} style={{ marginRight: '10px' }}>
                <Select placeholder={$t('请选择取消原因')}
                  style={{ width: '100%' }}
                  onChange={handleChange}
                  options={refundReasonMap} />
              </Form.Item>
              {selectIns == '12' && <Form.Item name="refundReasonDesc" label={$t('其他原因：')} rules={[{ required: true, message: '请输入请选择取消原因' }]} >
                <Input />
              </Form.Item>}
            </div>
          }
        </div>
      </Form>
    )
  }

  return (
    returnable ?
      <Modal width={800} visible={visible} onCancel={() => { onClose() }}
        bodyStyle={{ paddingTop: '0' }}
        title="退款申请"
        footer={[
          <Button key="cancel" onClick={() => { onClose() }}>取消</Button>,
          <Popconfirm
            title="确认要整单取消吗？"
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
        title="退款申请"
        footer={null}
      >
        {renderPanel()}
      </Modal>
  )
}