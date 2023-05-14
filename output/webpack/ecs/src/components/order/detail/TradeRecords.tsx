import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Modal,Steppers, Popover } from '@aurum/pfe-ui';
import * as orderApis from '@/common/net/apis_order';
const { Stepper } = Steppers;

export default (({ tradeRecordsInfo, orderCode }: any) => {
  const [tradeVisible, setTradeVisible] = useState(false);
  const [progress, setProgress] = useState([]);
  const [progressHtml, setProgressHtml] = useState([]);
  const currentStep = useRef(0);

  const tradeProgress = async (item: any) => {
    const { data: data } = await orderApis.getMerchantModule().refundProgress({ refundOrder: item.refundOrderId });
    setProgress(data);
    setTradeVisible(true);
  }

  useEffect(() => {
    if (!progress.length) return;
    let _html: any = progress.map((item: any, index: any) => {
      if(item.flag) {
        currentStep.current = index + 1;
      }
      return <Stepper title={item.step} key={index + 1} description={item.dateTime}></Stepper>
    })
    setProgressHtml(_html);
  }, [progress])

  const close = () => {
    setTradeVisible(false);
  }

  const colums = [
    {
      dataIndex: 'type',
      key: 'type',
      title: '类型'
    },
    {
      dataIndex: 'serialNo',
      key: 'serialNo',
      title: '交易流水号'
    },
    {
      dataIndex: 'payChannelDesc',
      key: 'payChannelDesc',
      title: '支付方式'
    },
    {
      dataIndex: 'payAmount',
      key: 'payAmount',
      title: '金额'
    },
    {
      dataIndex: 'payDisAmountDesc',
      key: 'payDisAmountDesc',
      title: '支付优惠'
    },
    {
      dataIndex: 'pmtDisAmountDesc',
      key: 'pmtDisAmountDesc',
      title: '活动优惠'
    },
    {
      dataIndex: 'status',
      key: 'status',
      title: '收退款状态',
      render: (d: any, item: any) => {
        if('REFUNDING,REFUNDED,FAILE'.includes(item.status) ) {
          return <a onClick={() => { tradeProgress(item) }}>{item.statusDesc}</a>
        } else {
          return <>{item.statusDesc}</>
        }
      }
    },
    {
      dataIndex: 'createdTime',
      key: 'createdTime',
      title: '申请日期'
    },
    {
      dataIndex: 'operation',
      key: 'operation',
      title: '操作人'
    },
    {
      dataIndex: 'refundReason',
      key: 'refundReason',
      title: '退款原因'
    }
  ]
  return (
    <div className="activity-list table-container">
      <div className="table-top-wrap" >
        <Table
          pagination={false}
          rowKey={record => record.serialNo}
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          columns={colums}
          dataSource={tradeRecordsInfo} />
      </div>

      <Modal width={800} visible={tradeVisible} onCancel={close}
        bodyStyle={{ paddingTop: '0' }}
        title="了解退款进度"
        footer={[
          <Button key="cancel" onClick={close}>取消</Button>,
          <Button key="confirm" type="primary" onClick={close} >确定</Button>,
        ]}
      >
        <div style={{ paddingTop: '20px' }}>
          <Steppers direction="vertical" current={currentStep.current}>
            {progressHtml}
          </Steppers>
        </div>
      </Modal>
    </div>
  )
})
