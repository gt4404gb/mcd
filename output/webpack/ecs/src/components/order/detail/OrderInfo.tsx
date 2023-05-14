import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams, Link } from 'react-router-dom';
import { Form, Input, Button, Row, Col, message, Table, Space } from '@aurum/pfe-ui';
import * as orderApis from '@/common/net/apis_order';
import ProTable from './ProTable';
import GiftTable from './GiftTable';
import InvoiceTable from './InvoiceTable';
import TradeRecords from './TradeRecords';
import PointDetail from './PointDetail';
import '@/assets/styles/order/detail.less'
import RefundModal from './RefundModal';
import RenewModal from './RenewModal';
import DeliverGoodes from './DeliverGoodes'
import SimplTableTemplate from './SimplTableTemplate';
import OrderSites from './OrderSites';
import Remark from './Remark';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';


export default withRouter((({ history, orderDetail }: any) => {
  const { orderCode }: any = useParams();
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const rewardImageStyleRef: any = useRef();
  const [orderBase, setOrderBase]: any = useState({});
  const [goods, setGoods]: any = useState([]);
  const [remarkLists, setRemarkLists]: any = useState([]);
  const [priceInfo, setPriceInfo]: any = useState({});
  const [invoicesInfo, setInvoicesInfo]: any = useState([]);
  const [tradeRecordsInfo, setTradeRecordsInfo]: any = useState([]);
  const [operations, setOperations]: any = useState([]);
  const [giftRecords, setGiftRecords]: any = useState({});
  const [auctionRecord, setAuctionRecord]: any = useState({});
  const [orderActivities, setOrderActivities]: any = useState([]);

  const [refundModalVisble, makeRefundModalVisble] = useState(false);
  const [refundResult, setRefundResult] = useState({});
  const [refundShow, makeRefundShow] = useState(true); //是否为取消状态
  const [refundModalVisbleDeliver, makeRefundModalVisbleDeliver] = useState(false);//是否展示发货弹层
  const [refundResultDeliver, setRefundResultDeliver] = useState({});
  const [renewVisble, makeRenewVisble] = useState(false);
  const [renewResult, setRenewResult] = useState({});
  const [remarkShow, setRemarkShow] = useState({
    visible: false,
    id: '',
    content: ''
  });

  const [shopId, setShopId] = useState(1);
  const [physicalGoods, setPhysicalGoods] = useState(true);

  useEffect(() => {
    if (!orderDetail) return;
    if (orderDetail) {
      setPhysicalGoods(!!(orderDetail.address));
      if (orderDetail.orderBase) {
        setOrderBase(orderDetail.orderBase);
      }
      if (orderDetail.goods?.length) {
        setGoods(orderDetail.goods);
      }
      if (orderDetail.orderRemarks?.length) {
        setRemarkLists(orderDetail.orderRemarks)
      }
      if (orderDetail.price) {
        setPriceInfo(orderDetail.price);
      }
      if (orderDetail.giftRecords) {
        setGiftRecords(orderDetail.giftRecords);
      }
      //拍卖信息
      if (orderDetail.auctionRecord?.bidCreatedTime) {
        setAuctionRecord(orderDetail.auctionRecord);
      }

      if(orderDetail?.orderActivities) {
        setOrderActivities(orderDetail?.orderActivities)
      }

      //发票
      if ((orderDetail.shopId !== 2 || orderDetail.shopId !== 3) && orderDetail.invoices?.length) {
        setInvoicesInfo(orderDetail.invoices);
      }
      //收退款记录 && 积分变动明细，共用一个字段
      if (orderDetail.tradeRecords?.length) {
        setTradeRecordsInfo(orderDetail.tradeRecords)
      }
      //操作按钮
      if (orderDetail.operations?.length) {
        setOperations(orderDetail.operations)
      }
      if (orderDetail.shopId && orderDetail.shopId > 0) {
        setShopId(orderDetail.shopId);
      }
    }
  }, [orderDetail])

  const refundOrder = async (code: any) => {
    let result: any;
    switch (code) {
      case 'admin_delivery':
        const arr = orderDetail.expressNames.map((v: string) => ({
          label: v,
          value: v
        }));
        setRefundResultDeliver(arr);
        makeRefundModalVisbleDeliver(true);
        break;
      case 'admin_cancel':
        result = await orderApis.getMerchantModule().orderRfund({ orderCode: orderCode });
        if (!result.success) {
          message.error(result.message);
          return;
        }
        setRefundResult(result.data);
        makeRefundModalVisble(true)
        break;
      case 'admin_cancel_auto_renew':
        result = await orderApis.getMerchantModule().terminateOrderApply({ orderCode: orderCode }); //订单解约申请
        if (!result.success) {
          message.error(result.message);
          return;
        }
        makeRenewVisble(true);
        setRenewResult(result.data);
        break;
    }
  }
  const isShowBorderTop = physicalGoods ? 'section-header clear-border-top' : 'section-header';

  const openRemark = () => {
    setRemarkShow({
      visible: true,
      id: '',
      content: ''
    })
  }

  return (
    <div className="order-info" ref={rewardImageStyleRef} >
      <Form
        ref={formEl}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"

        scrollToFirstError={true}
        form={form}
      >
        <Row className='part party-detail'>
          <Col span={12}>
            <Row className="form-block order-mess">
              <Col span={3}><div className="label">订单编号</div><div>{orderBase.orderId}</div></Col>
              <Col span={3}><div className="label">下单手机号</div><div>{orderBase.phoneNo}</div></Col>
              <Col span={3}><div className="label">会员昵称</div><div>{orderBase.userName}</div></Col>
              <Col span={3}><div className="label">会员ID</div><div>{orderBase.userId}</div></Col>
            </Row>
            <Row className="form-block order-mess">
              <Col span={3}><div className="label">下单时间</div><div>{orderBase.createdTime}</div></Col>
              <Col span={3}><div className="label">订单渠道</div><div>{orderBase.orderChannelDesc}</div></Col>
              <Col span={3}><div className="label">支付方式</div><div>{orderBase.payChannelDesc}</div></Col>
              <Col span={3}><div >订单实付金额</div><div>{orderBase.payAmount}</div></Col>
            </Row>
            <Row className="form-block order-mess">
              <Col span={3}><div >取消原因</div><div>{orderBase.cancelReason}</div></Col>
              {orderBase.autoRenew && orderBase.autoRenew == 1 && <Col span={3}><div>是否为自动续费订单</div><div>是</div></Col>}
              {orderBase.autoRenew && orderBase.autoRenew == 1 && <Col span={3}><div>是否为续费首单</div><div>{orderBase.autoRenewFirst}</div></Col>}
              {orderBase.contractStatusDesc && <Col span={3}><div>签约状态</div><div>{orderBase.contractStatusDesc}</div></Col>}
            </Row>
          </Col>
        </Row>
        {remarkLists && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">订单备注</div><Button type='primary' onClick={openRemark} style={{ margin: '0 0 12px 0' }}>添加</Button></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <Table
                  // @ts-ignore
                  pagination={{ position: ['none'] }}
                  rowKey='id'
                  scroll={{ x: '100%' }}
                  tableLayout="fixed"
                  columns={[
                    {
                      dataIndex: 'type',
                      key: 'type',
                      title: '类型/来源',
                      render: (d: any, item: any) => {
                        if (item.type === 0) {
                          return <>内部备注</>
                        } else if (item.type === 1) {
                          return <>顾客备注 </>
                        } else {
                          return <>系统备注 </>
                        }
                      }

                    },
                    {
                      dataIndex: 'content',
                      key: 'content',
                      title: '备注内容',
                      width: 400,
                      render: (d: any, item: any) => {
                        return <div style={{ maxHeight: '80px', overflowY: 'scroll' }}>{item.content}</div>
                      }
                    },
                    {
                      dataIndex: 'operator',
                      key: 'operator',
                      title: '添加人'
                    },
                    {
                      dataIndex: 'createdTime',
                      key: 'createdTime',
                      title: '添加时间'
                    },
                    {
                      dataIndex: 'action',
                      key: 'action',
                      title: '操作',
                      render: (text: any, field: any, index: any) => (
                        <Space size="small">
                          <a key="edit" onClick={() => {
                            setRemarkShow({
                              visible: true,
                              id: field.id,
                              content: field.content
                            });
                          }}>编辑</a>
                          <a key="del" onClick={async () => {
                            const { data: data } = await orderApis.getMerchantModule().delOrderRemark({ id: field.id });
                            if (data) {
                              message.success('删除成功');
                              let list = [...remarkLists];
                              list.splice(index, 1)
                              setRemarkLists(list);
                            } else {
                              message.error('删除失败');
                            }

                          }}>{$t('删除')}</a>

                        </Space>
                      )
                    }
                  ]}
                  dataSource={remarkLists}
                />
              </Col>
            </Row>
          </Col>
        </Row>}
        <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">商品信息</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <ProTable
                  goods={goods}
                  orderCode={orderCode}
                />
              </Col>
            </Row>
          </Col>
        </Row>
        {orderDetail?.shopId === 5 && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header noborder">活动信息</div></Col></Row>
            <Row className="form-block" style={{ marginBottom: '20px' }}>
              <Col span={3}>
                <Table
                  columns={[
                    {
                      title: $t('活动编号'),
                      dataIndex: 'activityId',
                      key: 'activityId',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return prizeField.activityId
                      }
                    },
                    {
                      title: $t('活动名称'),
                      dataIndex: 'activityName',
                      key: 'activityName',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return prizeField.activityName
                      }
                    },
                    {
                      title: $t('操作'),
                      dataIndex: 'bidSuccessTime',
                      key: 'bidSuccessTime',
                      width: 100,
                      render: (text: any, prizeField: any) => <Link to={prizeField?.bossUrl}>查看活动详情</Link>,
                    }
                  ]}
                  dataSource={orderActivities}
                  pagination={false}
                >
                </Table>
              </Col>
            </Row>
          </Col>
        </Row>}
        {orderDetail?.orderSites && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">联名会员</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <OrderSites
                  /* @ts-ignore */
                  orderSites={orderDetail?.orderSites}
                  orderCode={orderCode}
                />
              </Col>
            </Row>
          </Col>
        </Row>}
        {(shopId === 5 && orderDetail.partyInfo?.selectDeliveryTime) && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className={isShowBorderTop}>预选信息</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <SimplTableTemplate
                  data={{ ...orderDetail.partyInfo.deliveryAddress, ...orderDetail.partyInfo.selectDeliveryTime }}
                  rowKey='categoryId'
                  colums={[
                    {
                      dataIndex: 'date',
                      key: 'date',
                      title: '预选送达日期'
                    },
                    {
                      dataIndex: 'startTime',
                      key: 'startTime',
                      title: '开始时间'
                    },
                    {
                      dataIndex: 'endTime',
                      key: 'endTime',
                      title: '结束时间'
                    },
                    {
                      dataIndex: 'name',
                      key: 'name',
                      title: '联系人'
                    },
                    {
                      dataIndex: 'phone',
                      key: 'phone',
                      title: '联系电话'
                    },
                    {
                      dataIndex: 'address',
                      key: 'address',
                      title: '预选送达地址'
                    }
                  ]}
                />
              </Col>
            </Row>
          </Col>
        </Row>}
        {giftRecords && giftRecords.giftType > 0 && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header noborder">赠送信息</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <GiftTable giftRecords={giftRecords} />
              </Col>
            </Row>
          </Col>
        </Row>}
        {auctionRecord && auctionRecord.bidCreatedTime && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header noborder">拍卖信息</div></Col></Row>
            <Row className="form-block" style={{ marginBottom: '20px' }}>
              <Col span={12}>
                <Table
                  columns={[
                    {
                      title: $t('活动名称'),
                      dataIndex: 'activityName',
                      key: 'activityName',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return auctionRecord.activityName
                      }
                    },
                    {
                      title: $t('活动ID'),
                      dataIndex: 'activityId',
                      key: 'activityId',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return auctionRecord.activityId
                      }
                    },
                    {
                      title: $t('出价日期'),
                      dataIndex: 'bidCreatedTime',
                      key: 'bidCreatedTime',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return auctionRecord.bidCreatedTime
                      }
                    },
                    {
                      title: $t('出价总次数'),
                      dataIndex: 'bidTotalCount',
                      key: 'bidTotalCount',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return auctionRecord.bidTotalCount
                      }
                    },
                    {
                      title: $t('出价值'),
                      dataIndex: 'bidAmountDesc',
                      key: 'bidAmountDesc',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return auctionRecord.bidAmountDesc
                      }
                    },
                    {
                      title: $t('竞拍成功时间'),
                      dataIndex: 'bidSuccessTime',
                      key: 'bidSuccessTime',
                      width: 100,
                      render: (text: any, prizeField: any) => {
                        return auctionRecord.bidSuccessTime
                      }
                    }
                  ]}
                  dataSource={[auctionRecord]}
                  pagination={false}
                >
                </Table>
              </Col>
            </Row>
          </Col>
        </Row>}
        <Row className='part part-price'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header noborder">订单价格信息</div></Col></Row>
            <Row className="form-block price-mess">
              {priceInfo.totalAmount && <Col span={3}><div className="label">商品总价</div><div>{(orderDetail.shopId !== 2 && orderDetail.shopId !== 3) && <span>¥</span>} {priceInfo.totalAmount}</div></Col>}
              {priceInfo.deliveryPrice && <Col span={3}><div className="label">运费</div><div>{(orderDetail.shopId !== 2 && orderDetail.shopId !== 3) && <span>¥</span>} {priceInfo.deliveryPrice}</div></Col>}
              {priceInfo.discountAmount && <Col span={3}><div className="label">优惠</div><div>-{(orderDetail.shopId !== 2 && orderDetail.shopId !== 3) && <span>¥</span>} {priceInfo.discountAmount}</div></Col>}
              {priceInfo.payDisAmt && <Col span={3}><div className="label">支付优惠</div><div>{(orderDetail.shopId !== 2 && orderDetail.shopId !== 3) && <span>¥</span>} {priceInfo.payDisAmt}</div></Col>}
              {priceInfo.archCardAomunt && <Col span={3}><div className="label">麦钱包支付</div><div>{(orderDetail.shopId !== 2 && orderDetail.shopId !== 3) && <span>¥</span>} {priceInfo.archCardAomunt}</div></Col>}
              {priceInfo.realTotalAmount && <Col span={3}><div className="label">实付金额</div><div>{(orderDetail.shopId !== 2 && orderDetail.shopId !== 3) && <span>¥</span>} {priceInfo.realTotalAmount}</div></Col>}
              {priceInfo?.pmtDisAmt && <Col span={3}><div className="label">活动优惠</div><div>{orderDetail.shopId === 5 && <span>¥</span>} {priceInfo.pmtDisAmt}</div></Col>}
            </Row>
          </Col>
        </Row>
        {orderDetail?.thirdCodesMess?.length > 0 && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">兑换码信息</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <SimplTableTemplate
                  pagination={true}
                  data={orderDetail?.thirdCodesMess}
                  rowKey='key'
                  colums={[
                    {
                      dataIndex: 'thirdCode',
                      key: 'thirdCode',
                      title: '兑换码'
                    },
                    {
                      dataIndex: 'thirdPartner',
                      key: 'thirdPartner',
                      title: '合作方'
                    },
                    {
                      dataIndex: 'thirdAddress',
                      key: 'thirdAddress',
                      title: '兑换地址'
                    },
                    {
                      dataIndex: 'thirdDeclare',
                      key: 'thirdDeclare',
                      title: '兑换说明'
                    },
                    {
                      dataIndex: 'thirdEndTime',
                      key: 'thirdEndTime',
                      title: '兑换截止时间'
                    }
                  ]}
                />
              </Col>
            </Row>
          </Col>
        </Row>}
        {physicalGoods && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">收货人信息</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <SimplTableTemplate
                  data={orderDetail?.address}
                  rowKey='name'
                  colums={[
                    {
                      dataIndex: 'name',
                      key: 'name',
                      title: '收货人'
                    },
                    {
                      dataIndex: 'phone',
                      key: 'phone',
                      title: '联系电话'
                    },
                    {
                      dataIndex: 'provinceName',
                      key: 'provinceName',
                      title: '省份'
                    },
                    {
                      dataIndex: 'cityName',
                      key: 'cityName',
                      title: '城市'
                    },
                    {
                      dataIndex: 'districtName',
                      key: 'districtName',
                      title: '区'
                    },
                    {
                      dataIndex: 'streetAddress',
                      key: 'streetAddress',
                      title: '街道'
                    },
                    {
                      dataIndex: 'address',
                      key: 'address',
                      title: '收货地址'
                    }
                  ]}
                />
              </Col>
            </Row>
          </Col>
        </Row>}
        {orderDetail?.logistics && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">快递信息</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <SimplTableTemplate
                  data={orderDetail?.logistics}
                  rowKey='name'
                  colums={[
                    {
                      dataIndex: 'wayBill',
                      key: 'wayBill',
                      title: '快递公司'
                    },
                    {
                      dataIndex: 'waySite',
                      key: 'waySite',
                      title: '快递单号'
                    },
                    {
                      dataIndex: 'logisticsStatus',
                      key: 'logisticsStatus',
                      title: '状态',
                      render: (d: any, item: any) => {
                        return item.logisticsStatus == '0' ? '配送中' : '配送完成'
                      }
                    },
                    {
                      dataIndex: 'goodName',
                      key: 'goodName',
                      title: '商品'
                    }
                  ]}
                />
              </Col>
            </Row>
          </Col>
        </Row>}
        {(shopId === 5 && orderDetail.partyInfo?.memberList?.length) && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className={isShowBorderTop}>儿童信息</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <div className='baby_view'>
                  {
                    orderDetail.partyInfo.memberList.map((item: any) => (
                      <div className='baby_view_item'>
                        <span className='baby_view_item_1'>{item.name}</span>
                        <span className='baby_view_item_2'>{item.age}</span>
                      </div>
                    ))
                  }
                </div>
              </Col>
            </Row>
          </Col>
        </Row>}
        {(shopId !== 2 && shopId !== 3) && invoicesInfo.length > 0 && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className={isShowBorderTop}>发票信息</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <InvoiceTable invoicesInfo={invoicesInfo} />
              </Col>
            </Row>
          </Col>
        </Row>}
        {(shopId === 2 || shopId === 3) && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className={isShowBorderTop}>{shopId === 2 ? '积分变动明细' : '积点变动明细'}</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <PointDetail tradeRecordsInfo={tradeRecordsInfo} orderCode={orderCode} shopId={shopId} />
              </Col>
            </Row>
          </Col>
        </Row>}
        {(shopId !== 2 && shopId !== 3) && <Row className='part'>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header noborder">收退款记录</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <TradeRecords tradeRecordsInfo={tradeRecordsInfo} orderCode={orderCode} />
              </Col>
            </Row>
          </Col>
        </Row>}
        {
          (shopId === 5) && <Row className='part'>
            <Col span={12}>
              <Row><Col span={12}><div className="section-header noborder">备注</div></Col></Row>
              <Row className="form-block">
                <Col span={12}>
                  <div style={{ padding: '10px 20px' }}>
                    {orderDetail?.partyInfo?.remark ? orderDetail.partyInfo.remark : '暂无备注'}
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        }
        {operations.length > 0 && <Row className='part part-operations'>
          <div className='part-operations-fixed'>
            <Col span={12}>
              <Row>
                <Col span={12}>
                  <div className="section-operations">
                    {operations.length > 0 && operations.map((item: any, index: any) => {
                      let name = '';
                      if (item.code === 'admin_cancel') {
                        name = 'ecs:ecsLego:ordercancel'
                      } else if (item.code === 'admin_cancel_auto_renew') {
                        name = 'ecs:ecsLego:terminateorder'
                      }
                      else if (item.code === 'admin_delivery') {
                        name = 'ecs:ecsLego:admindelivery'
                      }
                      return <div className="section-operation" key={item.code}>
                        <Button disabled={!checkMyPermission(name)} type={index == 0 ? 'primary' : 'default'} onClick={() => { refundOrder(item.code) }}>{item.name}</Button>
                      </div>
                    })}
                  </div>
                </Col>
              </Row>
            </Col>
          </div>
        </Row>}
      </Form>
      {refundShow && <RefundModal
        refundResult={refundResult}
        visible={refundModalVisble}
        onClose={() => {
          makeRefundModalVisble(false);
        }}
        onChangeShow={() => {
          makeRefundShow(false);
        }}
      />}

      <Remark
        visible={remarkShow.visible}
        content={remarkShow.content}
        id={remarkShow.id}
        orderId={orderBase.orderId}
        onClose={() => {
          setRemarkShow({
            visible: false,
            id: '',
            content: ''
          });
        }}
      />

      <RenewModal
        renewResult={renewResult}
        visible={renewVisble}
        orderCode={orderCode}
        onClose={() => {
          makeRenewVisble(false);
        }}
      />

      <DeliverGoodes
        key={Math.random()}
        orderId={history.location.pathname.split('/')[4]}
        refundResult={refundResultDeliver}
        visible={refundModalVisbleDeliver}
        onClose={() => {
          makeRefundModalVisbleDeliver(false);
        }}
      />
    </div >
  )
}));