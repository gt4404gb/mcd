import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, message } from '@aurum/pfe-ui';
import CouponShow from './CouponShow';
import LookCoupon from './LookCoupon';
import '@/assets/styles/order/detail.less';
import * as orderApis from '@/common/net/apis_order';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
export default (({ goods, searchObj, totalCount, setSearchObj, orderCode }: any) => {

  const [couponModalVisble, makeCouponModalVisble] = useState(false);
  const [lookCouponVisble, makeLookCouponVisble] = useState(false);
  const [couponItemArr, setCouponItemArr]: any = useState([]);
  const currOrderItemId = useRef('');
  const currCancelNum = useRef('');
  const colums = [
    {
      dataIndex: 'skuImage',
      key: 'skuImage',
      title: '商品',
      width: 300,
      render: (d: any, item: any, index: any) => {
        return <div className="pro-line">
          {item.skuImage && <img className="tableImg" src={item.skuImage} />}
          <div className="tableMess">
            <p>{item.spuName}</p>
            {item.goodsType === 1 && <p className="tableMess-zeng">赠品</p>}
          </div>
        </div>
      }
    },
    {
      dataIndex: 'skuName',
      key: 'skuName',
      title: '规格',
      width: 140,
      render: (d: any, item: any, index: any) => {
        return item.skuName ? item.skuName : '/'
      }
    },
    {
      dataIndex: 'price',
      key: 'price',
      width: 120,
      title: '单价/数量',
      render: (d: any, item: any, index: any) => {
        return <div className="cout-line">
          <div>{item.price}</div>
          <div>{item.count}件</div>
        </div>
      }
    },
    {
      dataIndex: 'categoryName',
      key: 'categoryName',
      title: '商品类目',
      width: 140,
    },
    {
      dataIndex: 'giftDesc',
      key: 'giftDesc',
      title: '是否支持赠送',
      width: 100,
    },
    {
      dataIndex: 'ccId',
      key: 'ccId',
      title: '关联卡/券',
      width: 200,
      render: (d: any, item: any, index: any) => {
        return item?.cc ? <p style={{ color: '#4880ff', cursor: 'pointer' }} onClick={() => { onShowNewCoupon(item) }}>{item.cc.name}</p> : null
      }
    },
    {
      dataIndex: 'goodsStatusDesc',
      key: 'goodsStatusDesc',
      title: '发放状态',
      width: 100,
    },
    {
      dataIndex: 'usedCount',
      key: 'usedCount',
      title: '使用情况',
      width: 100,
      render: (d: any, item: any, index: any) => {
        return item?.cc?.totalCount ? item.cc.usedCount + '/' + item.cc.totalCount : '/';
      }
    },
    {
      dataIndex: 'operation',
      key: 'operation',
      title: '订单操作',
      width: 100,
      render: (d: any, item: any, index: any) => {
        let arr = [];
        if(item?.operations?.length > 0){
          arr = item.operations.filter((subItem:any) => {return subItem.code === 'SYNC_COUPON_STATUS'});
        }
        return item?.operations?.map((i: any) => {
          let name = '';
          if (i.code === 'admin_send_coupon') {
            name = 'ecs:ecsLego:ordergood';
            return checkMyPermission(name) ? <a type="link" key={i.code} onClick={() => { providePro(i.code, item.orderItemId) }}>{i.name}</a> : <></>
          } else if (i.code === 'COUPON_VIEW') {
            name = 'ecs:ecsLego:ordercouponcode';
            return checkMyPermission(name) ? <a type="link" key={i.code} onClick={() => { onShowLookCoupon(i.code, item.orderItemId, arr.length) }}>{i.name}</a> : <></>
          }
          else {
            return <></>
          }
        })
      }
    }
  ]

  const onShowNewCoupon = (item: any) => {
    setCouponItemArr([item.cc]);
    makeCouponModalVisble(true);
  }

  const providePro = (code: any, orderItemId: any) => {
    if (code && code === 'admin_send_coupon') {
      (async () => {
        const { data: data }: any = await orderApis.getMerchantModule().orderGoodId({ orderGoodId: orderItemId })
        if (data === 'true') {
          message.success('发放成功')
        }
      })();
    }
  }

  //打开查看劵码弹框
  const onShowLookCoupon = (code: any, orderItemId: any, cancelNum:any) => {
    currOrderItemId.current = orderItemId;
    currCancelNum.current = cancelNum;
    makeLookCouponVisble(true);
  }


  return (
    <div className="activity-list table-container">
      <CouponShow
        couponItemArr={couponItemArr}
        visible={couponModalVisble} onClose={(selectedCoupons: any, source: any) => {
          makeCouponModalVisble(false);
        }}
      />
      <LookCoupon
        orderCode = {orderCode}
        orderItemId={currOrderItemId.current}
        cancelNum = {currCancelNum.current}
        visible={lookCouponVisble} 
        onClose={() => {
          makeLookCouponVisble(false);
        }}
      />

      <div className="table-top-wrap" >
        <Table
          pagination={false}
          rowKey={record => record.skuId}
          scroll={{ x: '100%' }}
          tableLayout="fixed"
          columns={colums}
          dataSource={goods} />
      </div>
    </div>
  )
})
