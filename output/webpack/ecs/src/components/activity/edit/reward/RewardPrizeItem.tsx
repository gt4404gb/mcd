import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
/* @ts-ignore */
import { Form, Button, InputNumber, Table, message, Modal } from '@aurum/pfe-ui';
import * as apis from '@/common/net/apis_activity';
const mapStateToProps = (state: any) => {
  return {
    activityDetail: state.activity.activityDetail,
  }
}
export default connect(mapStateToProps)(withRouter(({ field, canOnlyView, activityReward, activityDetail, activityId, onRemoveReward, RefreshRewardList }: any) => {
  const [downVisible, setDownVisible]: any = useState(false);
  let curId: any = useRef('');
  let tips: any = useRef('');
  let prizeFieldKey: any = useRef('');

  const columns:any = [
    {
      title: $t('skuId'),
      dataIndex: 'skuId',
      key: 'skuId',
      width: 70,
      render: (text: any, prizeField: any, index: any) => (
        <span>{activityReward?.rewardSpuList[index]?.skuId}</span>
      ),
    },
    {
      title: $t('商品名称'),
      dataIndex: 'spuName',
      key: 'spuName',
      width: 70,
      render: (text: any, prizeField: any, index: any) => (
        <span>{activityReward?.rewardSpuList[index]?.spuName}</span>
      ),
    },
    {
      title: $t('赠品原价'),
      dataIndex: 'priceYuan',
      key: 'priceYuan',
      width: 100,
      render: (text: any, prizeField: any, index: any) => (
        <span>￥{activityReward?.rewardSpuList[index]?.priceYuan}</span>
      ),
    },
    {
      title: $t('单次赠送数量'),
      dataIndex: 'count',
      key: 'count',
      width: 100,
      render: (text: any, prizeField: any, index: any) => (
        <span>{activityReward?.rewardSpuList[index]?.count}</span>
      ),
    },
    {
      title: $t('赠品总套数'),
      dataIndex: 'totalStock',
      key: 'totalStock',
      width: 100,
      render: (text: any, record: any, index: any) => {
        const obj: any = {
          children: activityDetail.basicInfo?.rewardInfo?.totalStock,
          props: {},
        };
        // 如果上面有相同的数据，如商品ID 222, 则rowSpan = 0
        if (index == 0) {
          obj.props.rowSpan = activityReward?.rewardSpuList?.length
        } else {
          obj.props.rowSpan = 0;
        }
        return obj;
      }
    },
    {
      title: $t('占用库存'),
      dataIndex: 'occupyStock',
      key: 'occupyStock',
      width: 100,
      render: (text: any, prizeField: any, index: any) => (
        <span>{activityReward?.rewardSpuList[index]?.occupyStock}</span>
      ),
    },
    {
      title: $t('当前剩余库存'),
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (text: any, prizeField: any, index: any) => (
        <span>{activityReward?.rewardSpuList[index]?.stock}</span>
      ),
    },
    {
      title: $t('Action'),
      dataIndex: 'action',
      key: 'action',
      width: 100,
      fixed: 'right' as 'right',
      align: "center",
      render: (text: any, prizeField: any, index: any) => {
        let curSpuList = activityReward?.rewardSpuList[index];
        if (curSpuList?.skuId) {
          //绑定的商品
          if (curSpuList?.operationList?.length) {
            return curSpuList?.operationList?.map((i: any) => {
              if (i.code !== 'edit') {
                return <a type="link" key={`RewardPrizeItem${index}`} onClick={() => { providePro(i.code, index) }}>{i.desc}</a>
              }
            })
          }
        }
      }
    }
  ]

  //预解绑
  const providePro = (code: any, key: any) => {
    if (code === 'unbind') {
      (async () => {
        let params = {
          activId: activityId,
          confirmBefore: true,
          rewardId: activityReward?.rewardSpuList[key]?.rewardId
        }
        try {
          const result = await apis.getActivityService().rewardUnBind(params)
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
        rewardId: activityReward?.rewardSpuList[prizeFieldKey.current]?.rewardId
      }
      try {
        const result = await apis.getActivityService().rewardUnBind(params)
        if (result.success && result.data?.resultMsg === 'SUCCESS') {
          onRemoveReward(prizeFieldKey.current);
          RefreshRewardList();
        } else {
          throw new Error('解绑失败!')
        }
      } catch { }
    })();
    setDownVisible(false);
  }

  return (
    <div>
      <Table
        className="prize-items"
        /*@ts-ignore */
        pagination={{ position: ['none'] }}
        scroll={{ x: '100%' }}
        tableLayout="fixed"
        style={{ textAlign: 'center' }}
        columns={ columns }
        dataSource={activityReward?.rewardSpuList}
      />


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
}));