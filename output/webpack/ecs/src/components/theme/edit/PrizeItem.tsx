import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Form, Button, InputNumber, Table, message, Modal, IconFont, Tooltip } from '@aurum/pfe-ui';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import * as apis from '@/common/net/apis_activity';

const type = 'DraggableBodyRow';

export default ({ field, canOnlyView, activityReward, activityId, onRemoveCoupon, onReorderList }: any) => {
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
          onRemoveCoupon(prizeFieldKey.current);
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
      collect: monitor => ({
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
    (dragIndex, hoverIndex) => {
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
      <Form.Item className="composite-required-field " style={{marginBottom:'0'}} rules={[{ required: true }]}>
        <Form.List name={field}>
          {(prizeFields: any, { add, remove }) => {
            return <>
              <>
                <DndProvider backend={HTML5Backend}>
                  <Table
                    className="prize-items"
                    pagination={false}
                    scroll={{ x: '100%' }}
                    tableLayout="fixed"
                    style={{ textAlign: 'center' }}
                    columns={[
                      {
                        title: '拖动排序',
                        dataIndex: 'sort',
                        width: 80,
                        className: 'drag-visible',
                        render: () => <IconFont type="icon-mulu" style={{ cursor: 'grab', color: '#999' }} />,
                      },
                      {
                        title: $t('商品ID'),
                        dataIndex: 'receiveCount',
                        key: 'receiveCount',
                        width: 70,
                        render: (text: any, prizeField: any) => (
                          <span>{activityReward?.spuList[prizeField.key]?.spuId}</span>
                        ),
                      },
                      {
                        title: $t('商品名称'),
                        dataIndex: 'name',
                        key: 'name',
                        width: 100,
                        ellipsis: true,
                        render: (text: any, prizeField: any) => (
                          <Tooltip title={activityReward?.spuList[prizeField.key]?.name}>
                            <span>{activityReward?.spuList[prizeField.key]?.name}</span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: $t('起价'),
                        dataIndex: 'startPrice',
                        key: 'startPrice',
                        width: 80,
                        render: (text: any, prizeField: any) => {
                          return activityReward?.spuList[prizeField.key]?.notEdit ? <span>{activityReward?.spuList[prizeField.key]?.startPrice || '/'}</span> : <Form.Item colon={false} name={[prizeField.name, 'startPrice']} rules={[{ required: true, message: '请填写起拍价' }]}>
                            <InputNumber disabled={canOnlyView} min={0} />
                          </Form.Item>
                        }
                      },
                      {
                        title: $t('活动排序'),
                        dataIndex: 'sortNo',
                        key: 'sortNo',
                        width: 80,
                        render: (text: any, prizeField: any) => (
                          <span>{activityReward?.spuList[prizeField.key]?.sortNo !== -1 ? activityReward?.spuList[prizeField.key]?.sortNo : '-'}</span>
                        ),
                      },
                      {
                        title: $t('上架时间'),
                        dataIndex: 'upTime',
                        key: 'upTime',
                        width: 150,
                        ellipsis: true,
                        render: (text: any, prizeField: any) => (
                          <Tooltip title={activityReward?.spuList[prizeField.key]?.upTime}>
                            <span>{activityReward?.spuList[prizeField.key]?.upTime}</span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: $t('下架时间'),
                        dataIndex: 'downTime',
                        key: 'downTime',
                        width: 150,
                        ellipsis: true,
                        render: (text: any, prizeField: any) => (
                          <Tooltip title={activityReward?.spuList[prizeField.key]?.downTime}>
                            <span>{activityReward?.spuList[prizeField.key]?.downTime}</span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: $t('预热时间'),
                        dataIndex: 'warmUpTime',
                        key: 'warmUpTime',
                        width: 150,
                        render: (text: any, prizeField: any) => (
                          <span>{activityReward?.spuList[prizeField.key]?.warmUpTime || '/'}</span>
                        ),
                      },
                      {
                        title: $t('商品类目'),
                        dataIndex: 'catName',
                        key: 'catName',
                        width: 100,
                        render: (text: any, prizeField: any) => (
                          <span>{activityReward?.spuList[prizeField.key]?.catName}</span>
                        ),
                      },
                      {
                        title: $t('售卖城市'),
                        dataIndex: 'cities',
                        key: 'cities',
                        width: 100,
                        ellipsis: true,
                        render: (text: any, prizeField: any) => {
                          return <Tooltip title={activityReward?.spuList[prizeField.key]?.cities}>
                            <div className="tdCities">{activityReward?.spuList[prizeField.key]?.cities}</div>
                          </Tooltip>
                        }
                      },
                      {
                        title: $t('售卖渠道'),
                        dataIndex: 'channels',
                        key: 'channels',
                        width: 120,
                        ellipsis: true,
                        render: (text: any, prizeField: any) => {
                          return <Tooltip title={activityReward?.spuList[prizeField.key]?.channels?.toString()}>
                            <span className="tdCities">{activityReward?.spuList[prizeField.key]?.channels?.toString()}</span>
                          </Tooltip>
                        },
                      },
                      {
                        title: $t('活动状态'),
                        dataIndex: 'activityStatusDesc',
                        key: 'activityStatusDesc',
                        width: 80,
                        render: (text: any, prizeField: any) => {
                          return activityReward?.spuList[prizeField.key]?.activityStatusDesc || '/'
                        },
                      },
                      {
                        title: $t('商品状态'),
                        dataIndex: 'auctionStatusDesc',
                        key: 'auctionStatusDesc',
                        width: 80,
                        render: (text: any, prizeField: any) => {
                          return activityReward?.spuList[prizeField.key]?.auctionStatusDesc || '/'
                        },
                      },
                      {
                        title: $t('Action'),
                        dataIndex: 'action',
                        key: 'action',
                        width: 100,
                        fixed: 'right' as 'right',
                        align: "center",
                        render: (text: any, prizeField: any) => {
                          let curSpuList = activityReward?.spuList[prizeField.key];
                          if (curSpuList?.id) {
                            //绑定的商品
                            if (curSpuList?.operationList?.length) {
                              return curSpuList?.operationList?.map((i: any) => {
                                if (i.code !== 'edit') {
                                  return <Button type="link" size='small' key={i.code} onClick={() => { providePro(i.code, prizeField.key) }}>{i.desc}</Button>
                                }
                              })
                            }
                          } else {
                            return (
                              <div>
                                <Button type="link" size='small' onClick={() => { onRemoveCoupon(prizeField.key) }}>移除 </Button>
                              </div>
                            )
                          }
                        }
                      }
                    ]}
                    dataSource={prizeFields}
                    components={components}
                    /* @ts-ignore */
                    onRow={(record, index) => ({
                      index,
                      moveRow,
                    })}
                  />
                </DndProvider>
              </>
            </>
          }}
        </Form.List>
      </Form.Item>
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