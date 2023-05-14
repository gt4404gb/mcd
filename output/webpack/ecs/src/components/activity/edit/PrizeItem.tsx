import React, { useEffect, useState, useRef } from 'react'
import { Form, Button, InputNumber, Table, message, Modal, Tooltip } from '@aurum/pfe-ui';
import { sanitizeToInteger } from '@/common/helper';
import * as apis from '@/common/net/apis_activity';

export default ({ field, canOnlyView, activityReward, activityId, onRemoveCoupon }: any) => {
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

  return (
    <div>
      <Form.Item className="composite-required-field " rules={[{ required: true }]} style={{ marginBottom: '0' }}>
        <Form.List name={field}>
          {(prizeFields: any, { add, remove }) => {
            return <>
              <>
                <Table
                  className="prize-items"
                  pagination={false}
                  scroll={{ x: '100%' }}
                  tableLayout="fixed"
                  style={{ textAlign: 'center' }}
                  columns={[
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
                      title: $t('起拍价(积分)'),
                      dataIndex: 'startPrice',
                      key: 'startPrice',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return activityReward?.spuList[prizeField.key]?.notEdit ? <span>{activityReward?.spuList[prizeField.key]?.startPrice}</span> : <Form.Item colon={false} name={[prizeField.name, 'startPrice']} rules={[{ required: true, message: '请填写起拍价' }]}>
                          <InputNumber disabled={canOnlyView} min={0} />
                        </Form.Item>
                      }
                    },
                    {
                      title: $t('竞拍数量'),
                      dataIndex: 'count',
                      key: 'count',
                      width: 80,
                      render: (text: any, prizeField: any) => {
                        return activityReward?.spuList[prizeField.key]?.notEdit ? <span>{activityReward?.spuList[prizeField.key]?.count}</span> : <Form.Item colon={false} name={[prizeField.name, 'count']} rules={[{ required: true, message: '请填写竞拍数量' }]}>
                          <InputNumber disabled={canOnlyView} placeholder="限正整数" min={1} maxLength={7}
                            formatter={(value: any) => sanitizeToInteger(value)}
                            parser={value => sanitizeToInteger(value) || ''}
                          />
                        </Form.Item>
                      }
                    },
                    {
                      title: $t('加价幅度(积分)'),
                      dataIndex: 'priceStep',
                      key: 'priceStep',
                      width: 120,
                      render: (text: any, prizeField: any) => {
                        return activityReward?.spuList[prizeField.key]?.notEdit ? <span>{activityReward?.spuList[prizeField.key]?.priceStep}</span> : <Form.Item colon={false} name={[prizeField.name, 'priceStep']} rules={[{ required: true, message: '请填写加价幅度' }]}>
                          <InputNumber disabled={canOnlyView} min={0} />
                        </Form.Item>
                      },
                    },
                    {
                      title: $t('起拍（上架）时间'),
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
                      title: $t('截拍（下架）时间'),
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
                      ellipsis: true,
                      render: (text: any, prizeField: any) => {
                        return activityReward?.spuList[prizeField.key]?.warmUpTime ? <Tooltip title={activityReward?.spuList[prizeField.key]?.warmUpTime}>
                          <span>{activityReward?.spuList[prizeField.key]?.warmUpTime}</span>
                        </Tooltip> : '/'
                      },
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
                      width: 130,
                      ellipsis: true,
                      render: (text: any, prizeField: any) => {
                        return <Tooltip title={activityReward?.spuList[prizeField.key]?.channels?.toString()}>
                          <span>{activityReward?.spuList[prizeField.key]?.channels?.toString()}</span>
                        </Tooltip>
                      },
                    },
                    {
                      title: $t('活动状态'),
                      dataIndex: 'activityStatusDesc',
                      key: 'activityStatusDesc',
                      width: 80,
                      render: (text: any, prizeField: any) => {
                        return activityReward?.spuList[prizeField.key]?.activityStatusDesc
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
                                return <Button type="link" key={i.code} onClick={() => { providePro(i.code, prizeField.key) }}>{i.desc}</Button>
                              }
                            })
                          } else {
                            return (
                              <div>
                                {'/'}
                              </div>
                            )
                          }
                        } else {
                          return (
                            <div>
                              <Button type="link" onClick={() => { onRemoveCoupon(prizeField.key) }}>移除 </Button>
                            </div>
                          )
                        }
                      }
                    }
                  ]}
                  dataSource={prizeFields}
                />
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