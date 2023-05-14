import React, { useEffect, useState, useRef } from 'react'
import { Form, Button, Table, message, Modal } from '@aurum/pfe-ui';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import * as apis from '@/common/net/apis_activity';

const type = 'DraggableBodyRow';

export default ({ field, canOnlyView, activityReward, activityId, SetRefresh, SetPmtRefresh }: any) => {
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
          goodsId: activityReward.spuList[key]?.id
        }
        try {
          const result = await apis.getActivityService().spuUnbind(params)
          if (result.success) {
            prizeFieldKey.current = key;
            tips.current = result.data?.confirmMsg || '确认解绑商品吗？'
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
        goodsId: activityReward.spuList[prizeFieldKey.current]?.id
      }
      let params_2 = {
        activId: activityId,
        confirmBefore: false,
        // 目前只能绑定一个促销预付券，所以这样写没问题
        rewardId: activityReward.pmtList[0]?.rewardId
      }
      try {
        const result = await apis.getActivityService().spuUnbind(params)
        let result_2 = { success: true, hasUnbind: false }
        if (activityReward.pmtList?.length > 0) {
          result_2 = await apis.getActivityService().rewardUnBind(params_2)
          result_2. hasUnbind = true
        }
        if (result.success && result_2.success) {
          SetRefresh();
          if (result_2.hasUnbind) {
            SetPmtRefresh();
          }
          message.success('解绑成功!')
        } else {
          message.error('解绑失败!')
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
          rowKey={(record: any) => record?.spuId}
          columns={[
            {
              title: $t('商品编号'),
              dataIndex: 'spuId',
              key: 'spuId',
              width: 70,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.spuId}</span>
              ),
            },
            {
              title: $t('商品名称'),
              dataIndex: 'name',
              key: 'name',
              width: 100,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.name}</span>
              ),
            },
            {
              title: $t('上架时间'),
              dataIndex: 'upTime',
              key: 'upTime',
              width: 150,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.upTime}</span>
              ),
            },
            {
              title: $t('下架时间'),
              dataIndex: 'downTime',
              key: 'downTime',
              width: 150,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.downTime}</span>
              ),
            },
            {
              title: $t('原预付券号'),
              dataIndex: 'couponId',
              key: 'couponId',
              width: 150,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.couponId || '无'}</span>
              ),
            },
            {
              title: $t('原预付券名称'),
              dataIndex: 'couponName',
              key: 'couponName',
              width: 100,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.couponName}</span>
              ),
            },
            {
              title: $t('原预付券金额'),
              dataIndex: 'couponPrice',
              key: 'couponPrice',
              width: 100,
              render: (text: any, prizeField: any, index: any) => {
                return <div className="tdCities">{activityReward.spuList[index]?.couponPrice}</div>
              }
            },
            {
              title: $t('原预付券库存'),
              dataIndex: 'couponStock',
              key: 'couponStock',
              width: 80,
              render: (text: any, prizeField: any, index: any) => {
                return activityReward.spuList[index]?.couponStock?.toString()
              },
            },
            {
              title: $t('原商品售卖价'),
              dataIndex: 'price',
              key: 'price',
              width: 80,
              render: (text: any, prizeField: any, index: any) => {
                return activityReward.spuList[index]?.price?.toString()
              },
            },
            {
              title: $t('原商品库存'),
              dataIndex: 'stock',
              key: 'stock',
              width: 80,
              render: (text: any, prizeField: any, index: any) => {
                return activityReward.spuList[index]?.stock?.toString()
              },
            },
            {
              title: $t('Action'),
              dataIndex: 'action',
              key: 'action',
              width: 100,
              fixed: 'right',
              align: "center",
              render: (text: any, prizeField: any, index: any) => {
                let curSpuList = activityReward.spuList[index];
                if (curSpuList?.spuId) {
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
          dataSource={activityReward.spuList}
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
        {`${tips.current} 解绑商品的同时会解绑已选择的预付券`}
      </Modal>
    </div>
  )
};