import React, { useEffect, useState } from 'react';
import * as apis from '@/apps/btb/common/apis';
import { useParams } from 'react-router-dom';
import GoodsList from '@/apps/btb/components/order/detail/GoodsList';
import Basic from '@/apps/btb/components/order/detail/Basic';
import PriceAmendLogs from '@/apps/btb/components/order/detail/PriceAmendLogs';
import CouponInfo from '@/apps/btb/components/order/detail/CouponInfo';
import Invoice from '@/apps/btb/components/order/detail/Invoice';
import PaymentLogs from '@/apps/btb/components/order/detail/PaymentLogs';
import ThirdPartyOrderInfo from '../../components/order/detail/ThirdPartyOrderInfo';
import Comments from '../../components/order/detail/Comments';
import './styles/Detail.less'

export default ({ }: any) => {
  const { orderId }: any = useParams()
  const [detail, setDetail]: any = useState({
    records: [],
    changeRecords: [],
    goods: [],
    orderInvoice: [],
    logRecords: []
  });
  const [couponStats, setCouponStats]: any = useState({});
  const fetchOrderDetail: any = async () => {
    if (!orderId) return;
    const statsResp: any = await apis.getBOSModule().getCouponStats({ orderId });
    setCouponStats(statsResp.data);
    const resp: any = await apis.getBOSModule().detail({ orderId });
    resp.data.records = resp.data.records || [];
    resp.data.changeRecords = resp.data.changeRecords || [];
    resp.data.logRecords = resp.data.logRecords || [];
    resp.data.orderInvoice = resp.data.orderInvoice ? [resp.data.orderInvoice] : [];
    setDetail(resp.data);
  }
  useEffect(() => {
    fetchOrderDetail(orderId);
  }, []);
  return (
    <div className="btb-order-detail-container">
      <Basic order={detail} onOrderCanceled={(isCanceled: any) => {
        if (isCanceled) fetchOrderDetail(orderId);
      }} />
      <GoodsList order={detail} list={detail.goods} />
      <PriceAmendLogs order={detail} list={detail.changeRecords} onPriceAmend={() => {
        fetchOrderDetail(orderId);
      }} />
      <CouponInfo order={detail} data={couponStats} />
      <Invoice order={detail} list={detail?.orderInvoice} />
      <PaymentLogs order={detail} list={detail?.records} onPaymentChange={() => {
        fetchOrderDetail(orderId);
      }} />
      <ThirdPartyOrderInfo order={detail} />
      <Comments order={detail} onCommentAdded={() => {
        fetchOrderDetail(orderId);
      }} />
    </div>
  )
}
