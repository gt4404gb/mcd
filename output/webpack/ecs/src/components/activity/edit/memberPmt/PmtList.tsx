import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Form, Button, InputNumber, Table, message, Modal, IconFont } from '@aurum/pfe-ui';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import * as apis from '@/common/net/apis_activity';

const type = 'DraggableBodyRow';

export default ({ field, canOnlyView, activityReward, activityId, SetRefresh }: any) => {
  const [downVisible, setDownVisible]: any = useState(false);
  let curId: any = useRef('');
  let tips: any = useRef('');
  let prizeFieldKey: any = useRef('');

  //预解绑
  const providePre = (code: any, key: any) => {
    if (code === 'unbind') {
      (async () => {
        let params = {
          activId: activityId,
          confirmBefore: true,
          rewardId: activityReward.pmtList[key]?.rewardId
        }
        try {
          const result = await apis.getActivityService().rewardUnBind(params)
          if (result.success) {
            prizeFieldKey.current = key;
            tips.current = result.data?.confirmMsg || '确认解绑预付费券吗？'
            curId.current = activityId;
            setDownVisible(true);
          } else {
            message.error(result.message)
          }
        } catch { }
      })();
    }
  }

  const hideModal = () => {
    setDownVisible(false);
  }

  //解绑
  const onOk = () => {
    (async () => {
      let params = {
        activId: activityId,
        confirmBefore: false,
        rewardId: activityReward.pmtList[prizeFieldKey.current]?.rewardId
      }
      try {
        const result = await apis.getActivityService().rewardUnBind(params)
        if (result.success) {
          SetRefresh();
          message.success('解绑成功!')
        } else {
          throw new Error('解绑失败!')
        }
      } catch { }
    })();
    setDownVisible(false);
  }

  const DraggableBodyRow = ({ index, moveRow, className, style, ...restProps }: any) => {
    const ref = useRef();
    const [{ isOver, dropClassName }, drop] = useDrop({
      accept: type,
      collect: monitor => {
        const { index: dragIndex } = monitor.getItem() || {};
        if (dragIndex === index) {
          return {};
        }
        return {
          isOver: monitor.isOver(),
          dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
        };
      },
      drop: (item: any) => {
        moveRow(item.index, index);
      },
    });
    const [, drag] = useDrag({
      type,
      item: { index },
      collect: (monitor: any) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    drop(drag(ref));

    return (
      <tr
        ref={ref}
        className={`${className}${isOver ? dropClassName : ''}`}
        style={{ cursor: 'move', ...style }}
        {...restProps}
      />
    );
  };

  const components = {
    body: {
      row: DraggableBodyRow,
    },
  };

  return (
    <div>
      <DndProvider backend={HTML5Backend}>
        <Table
          className="prize-items"
          pagination={false}
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          style={{ textAlign: 'center' }}
          rowKey={(record: any) => record?.couponId}
          columns={[
            {
              title: $t('促销预付券编号'),
              dataIndex: 'couponId',
              key: 'couponId',
              width: 70,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.pmtList[index]?.couponId}</span>
              ),
            },
            {
              title: $t('促销预付券名称'),
              dataIndex: 'couponName',
              key: 'couponName',
              width: 100,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.pmtList[index]?.couponName}</span>
              ),
            },
            {
              title: $t('投放开始时间'),
              dataIndex: 'putStartTime',
              key: 'putStartTime',
              width: 150,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.pmtList[index]?.putStartTime}</span>
              ),
            },
            {
              title: $t('投放截止时间'),
              dataIndex: 'putEndTime',
              key: 'putEndTime',
              width: 150,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.pmtList[index]?.putEndTime}</span>
              ),
            },
            {
              title: $t('促销预付券金额'),
              dataIndex: 'couponPrice',
              key: 'couponPrice',
              width: 150,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.pmtList[index]?.couponPrice || 0.00}</span>
              ),
            },
            {
              title: $t('促销预付券库存'),
              dataIndex: 'couponStock',
              key: 'couponStock',
              width: 100,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.pmtList[index]?.couponStock}</span>
              ),
            },
            {
              title: $t('商品促销价'),
              dataIndex: 'pmtPrice',
              key: 'pmtPrice',
              width: 100,
              render: (text: any, prizeField: any, index: any) => {
                return <div className="tdCities">{activityReward.pmtList[index]?.pmtPrice}</div>
              }
            },
            {
              title: $t('单券立减金额'),
              dataIndex: 'offAboveAmount',
              key: 'offAboveAmount',
              width: 80,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.pmtList[index]?.offAboveAmount}</span>
              ),
            },
            {
              title: $t('Action'),
              dataIndex: 'action',
              key: 'action',
              width: 100,
              fixed: 'right',
              align: "center",
              render: (text: any, prizeField: any, index: any) => {
                let curSpuList = activityReward.pmtList[index];
                if (curSpuList?.couponId) {
                  //绑定的商品
                  if (curSpuList?.operationList?.length) {
                    return curSpuList?.operationList?.map((i: any) => {
                      if (i.code !== 'edit') {
                        return <Button disabled={canOnlyView} key={`proPrizeItem${index}`} type="link" onClick={() => { providePre(i.code, index) }}>{i.desc}</Button>
                      }
                    })
                  }
                }
              }
            }
          ]}
          dataSource={activityReward.pmtList}
          components={components}
        />
      </DndProvider>
      <Modal
        title="提示"
        visible={downVisible}
        onOk={onOk}
        onCancel={hideModal}
        okText="确认"
        cancelText="取消"
      >
        {tips.current}
      </Modal>
    </div>
  )
};