import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Modal, Steppers } from '@aurum/pfe-ui';
import * as orderApis from '@/common/net/apis_order';
const { Stepper } = Steppers;

export default (({ tradeRecordsInfo, orderCode, shopId }: any) => {
  const [tradeVisible, setTradeVisible] = useState(false);
  const [progress, setProgress] = useState([]);
  const [progressHtml, setProgressHtml] = useState([]);
  const currentStep = useRef(0);

  useEffect(() => {
    if (!progress.length) return;
    let _html: any = progress.map((item: any, index: any) => {
      if (item.flag) {
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
      dataIndex: 'createdTime',
      key: 'createdTime',
      title: '日期'
    },
    {
      dataIndex: 'type',
      key: 'type',
      title: '类型',
      render: (d: any, item: any) => {
        return <>麦当劳会员{shopId===2?'积分':'积点'} {item.type}</>
      }
    },
    {
      dataIndex: 'payAmount',
      key: 'payAmount',
      title: '金额'
    }
  ]
  return (
    <div className="activity-list table-container">
      <div className="table-top-wrap" >
        <Table
          pagination={false}
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
          <Steppers direction="vertical"  current={currentStep.current}>
            {progressHtml}
          </Steppers>
        </div>
      </Modal>
    </div>
  )
})
