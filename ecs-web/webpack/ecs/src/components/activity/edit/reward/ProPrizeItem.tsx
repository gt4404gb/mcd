import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Form, Button, InputNumber, Table, message, Modal, IconFont } from '@aurum/pfe-ui';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import * as apis from '@/common/net/apis_activity';

const type = 'DraggableBodyRow';

export default ({ field, canOnlyView, activityReward, activityId, onRemovePro, onReorderList, SetRefresh }: any) => {
  const [downVisible, setDownVisible]: any = useState(false);
  let curId: any = useRef('');
  let tips: any = useRef('');
  let prizeFieldKey: any = useRef('');

  //预解绑
  const providePro = (code: any, key: any) => {
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
      try {
        const result = await apis.getActivityService().spuUnbind(params)
        if (result.success) {
          //onRemovePro(prizeFieldKey.current);  解绑都走接口调用
          SetRefresh();
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
      collect: (monitor:any) => ({
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

  const moveRow = useCallback(
    (dragIndex:any, hoverIndex:any) => {
      let spuList = activityReward.spuList;
      const dragRow = spuList[dragIndex];
      let curSpuList = update(spuList, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRow],
        ],
      })
      onReorderList(curSpuList);
    },
    [activityReward.spuList],
  );

  return (
    <div>
      <DndProvider backend={HTML5Backend}>
        <Table
          className="prize-items"
          pagination={false}
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          style={{ textAlign: 'center' }}
          columns={[
            // {
            //   title: '拖动排序',
            //   dataIndex: 'sort',
            //   width: 80,
            //   className: 'drag-visible',
            //   render: () => <IconFont type="icon-mulu" style={{ cursor: 'grab', color: '#999' }} />,
            // },   暂不支持拖动
            {
              title: $t('spuId'),
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
              title: $t('活动排序'),
              dataIndex: 'sortNo',
              key: 'sortNo',
              width: 80,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.sortNo !== -1 ? activityReward.spuList[index]?.sortNo : '-'}</span>
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
              title: $t('预热时间'),
              dataIndex: 'warmUpTime',
              key: 'warmUpTime',
              width: 150,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.warmUpTime || '无'}</span>
              ),
            },
            {
              title: $t('商品类目'),
              dataIndex: 'catName',
              key: 'catName',
              width: 100,
              render: (text: any, prizeField: any, index: any) => (
                <span>{activityReward.spuList[index]?.catName}</span>
              ),
            },
            {
              title: $t('售卖城市'),
              dataIndex: 'cities',
              key: 'cities',
              width: 100,
              render: (text: any, prizeField: any, index: any) => {
                return <div className="tdCities">{activityReward.spuList[index]?.cities}</div>
              }
            },
            {
              title: $t('售卖渠道'),
              dataIndex: 'channels',
              key: 'channels',
              width: 80,
              render: (text: any, prizeField: any, index: any) => {
                return activityReward.spuList[index]?.channels?.toString()
              },
            },
            {
              title: $t('Action'),
              dataIndex: 'action',
              key: 'action',
              width: 100,
              fixed: 'right' as 'right',
              align: "center",
              render: (text: any, prizeField: any, index: any) => {
                let curSpuList = activityReward.spuList[index];
                if (curSpuList?.spuId) {
                  //绑定的商品
                  if (curSpuList?.operationList?.length) {
                    return curSpuList?.operationList?.map((i: any) => {
                      if (i.code !== 'edit') {
                        return <a key={`proPrizeItem${index}`} type="link" onClick={() => { providePro(i.code, index) }}>{i.desc}</a>
                      }
                    })
                  }
                }
              }
            }
          ]}
          dataSource={activityReward.spuList}
          components={components}
          /* @ts-ignore */
          onRow={(record, index) => ({
            index,
            moveRow,
          })}
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