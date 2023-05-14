import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
import moment from 'moment';
import common from '@omc/common';
/* @ts-ignore */
import { Form, Input, Row, Col, DatePicker, message, Select, InputNumber, Button, Checkbox, Popconfirm, Radio, Space, TimePicker, IconFont } from '@aurum/pfe-ui';
import * as apisEdit from '@/common/net/apis_edit';
import * as merchantAction from '@/redux/actions/merchantAction';
import StockBasic from './StockBasic';
import PrescribedDetailFour from '@/components/merchant/edit/PrescribedDetailFour';
import CouponSelector from '@/components/CouponSelector';
import RightsInfo from '@/components/RightsInfo';
import Agreement from '@/components/merchant/edit/Agreement';
import { sanitizeToInteger, getPartyTime, getSecond, sanitizeToInteger0 } from '@/common/helper';
import constants from '@/common/constants';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
import type { Moment } from 'moment';
const { filterEmptyFields } = common.helpers;
const { RangePicker }: any = DatePicker;
const initialMerchantStockFour: any = {
  proInfo: {
    upDate: '', //商品上架时间
    downDate: '', //商品下架时间
    price: '',//SPU商品价格
    stock: '',//SPU库存
    costPrice: '',//SPU成本价
    linePrice: '',//SPU划线价
    ext: '',//关联的卡券编号|额外字段
    extName: '',
    skuId: '',
    warmUpDate: '', //预热开始时间
    autoRenew: 0, //是否自动续费 待修改
    renewFirstPrice: '',//自动续费,首次价格
    renewPrice: '',//自动续费,逐次价格
    planId: '',//自动续费模板id  20220413
    points: '', //SPU商品花费积分(积分特有)
    extTradePrice: '', //券核销价(积分特有)
    extOriginPrice: '', //券单买价(积分特有)
    weight: '', //实物商品-重量
    gift: 2,
    ageMin: '',
    ageMax: '',
    partyMax: '',//最大成团人数
    partyMin: '', //最少成团人数
    partyRange: '', //活动时间限制
    partyType: [],//（1：包场，2：拼团）
    importType: 1,
    excelUploaded: false, //false表示还没有上传文件
    codeHeader: '', //"码头"
    validityType: 1, //1固定有效期， 2固定天数")
    validityStartTime: '',
    validityEndTime: '',
    validityDays: '',
    priceStyle: 1,  //新增麦麦商城实物购买方式 20220424(只前端用)
    invByStore: 0,
    salePeriod: '', //时间段
    eventAdvanceDay: '', //主题活动提前预订天数0最早预订当天1最早预订明天以此类推
    redeemType: 0,//核销类型0按卡券配置核销时间1指定核销日期
    delayDay: 0
  },
  ext: '',
  extName: '',
  rightsInfoList: [],
  agreementList: [], //协议
  skuList: [],
  dateRange: [],
  warmUpDateMoment: '',
  timeRange: [],
  selectCrmObj: {}, //付费会员选择的规格20220413
  extSkuString: '',

  rewardList: [
    {
      sprice: '',//SPU商品价格
      stock: '',//SPU库存
      taxId: '', //SPU税率税点
      costPrice: '',//SPU成本价
      linePrice: '',//SPU划线价
      ext: '',//关联的卡券编号|额外字段
      extName: '',
      rightsInfoList: [],
      autoRenew: 0,
      planId: '',//自动续费模板id  20220413
      points: '', //SPU商品花费积分
      weight: '',
      gift: 2,
      importType: 1,
      isUploadFileState: false,
      selectCrmObj: {}, //付费会员选择的规格20220413
      extSkuString: '',
      priceStyle: 1,  //新增麦麦商城实物购买方式 20220424(只前端用)
      invByStore: 0
    }
  ],
  skuImageChecked: false,
  codeDateRange: []
};

const mapStateToProps = (state: any) => {
  return {
    executeAction: state.merchant.executeAction,
    currentStep: state.merchant.currentStep,
    rewardDependedFields: state.merchant.rewardDependedFields,
    merchantDetail: state.merchant.merchantDetail,
    shopId: state.merchant.shopId,
    IsAuction: state.merchant.IsAuction,   //是否是拍卖商品
    isMaiyouli: state.merchant.merchantDetail?.basicInfo?.showPosition?.includes('5') ? true : false, //麦有礼为5
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  resetExecuteAction: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_EXECUTE_ACTION,
    payload
  }),
  gotoNexStep: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_NEXT_STEP,
    payload
  }),
});
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ history, STEP, currentStep, onActionCompleted, executeAction, resetExecuteAction, merchantDetail, shopId, gotoNexStep, IsAuction, isMaiyouli }: any) => {
  const [merchantStockFour, setMerchantStockFour]: any = useState(JSON.parse(JSON.stringify(initialMerchantStockFour)));
  const [canEditPrice, setCanEditPrice]: any = useState(true);
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const { spuId, isShow }: any = useParams();
  const [couponModalVisble, makeCouponModalVisble] = useState(false);
  const [rightModalVisble, makeRightModalVisble] = useState(false);
  const [source, setSource]: any = useState(null);
  const [taxOptions, setTaxOptions]: any = useState([]);
  const [originList, setOriginList] = useState([]);
  const [canOnlyView, setCanOnlyView] = useState(false);
  const [isExpenditure, setIsExpenditure] = useState('');
  const currentExt = useRef('');
  const [isMaterial, setIsMaterial]: any = useState(false); //是否是实物品类
  const [isShowGift, setShowGift]: any = useState(false); //是否显示赠送
  const [triggerTransferFlag, setTriggerTransferFlag]: any = useState(0); //兑换码生成方式
  const isCreated: any = useRef(true); //是否新增或编辑===操作类型，商品为第三方兑换码时传，1 新增商品时传1，3 编辑商品时传3
  const [codeHeaderValue, setCodeHeaderValue] = useState('');
  const [templateOptions, setTemplateOptions] = useState([]);
  const [expressSiteList, setExpressSiteList] = useState([]);
  const [expressCompanyList, setExpressCompanyList] = useState([]);
  const [warehouseCodeList, setWarehouseCodeList] = useState([]);
  const expressSiteListCurrent = useRef('');

  useEffect(() => {
    return () => {
      setMerchantStockFour({ ...initialMerchantStockFour });
      gotoNexStep(-STEP);
    }
  }, []);

  //税率税点来源
  useEffect(() => {
    (async () => {
      const { data: filterObj } = await apisEdit.getMerchantModule().rate();
      if (filterObj.taxList.length > 0) {
        const options: any = filterObj.taxList.map((item: any) => {
          return (
            <Select.Option key={item.taxId} value={item.taxId}>{item.desc}</Select.Option>
          );
        });
        setTaxOptions(options);
      }
    })()
    fetchList({ pageSize: 50, pageNo: 1, platform: 1, templateName: '' })
  }, []);


  //模板数据源
  const fetchList: any = async (searchObj: any) => {
    const resp: any = await apisEdit.getVoucherModule().templateQuery(filterEmptyFields(searchObj));
    if (resp && resp.data && resp.data.list) {
      let listArr = resp.data.list;
      listArr.map((item: any, index: any) => {
        if (item) {
          item.label = item.templateCode + item.templateName;
          item.value = item.templateCode;
        }
      })
      setTemplateOptions(listArr);
    } else {
      setTemplateOptions([]);
    }
  };

  useEffect(() => {
    if (spuId) {
      if (!merchantDetail.basicInfo.categoryId) return;
    }

  }, [spuId, merchantDetail.basicInfo.categoryId])

  useEffect(() => {
    // mock if (currentStep !== STEP) return;
    if (spuId) {
      //第四部详情接口
      (async () => {
        let _merchantStockFour: any = JSON.parse(JSON.stringify(merchantStockFour));
        try {
          const { data: proInfo }: any = await apisEdit.getMerchantModule().getStep4({ spuId: spuId })
          if (isShow === 'isShow' || proInfo?.status === 3 || proInfo?.status === 5 || !checkMyPermission('ecs:ecsLego:productedit')) {
            //WAREHOUSE(1, "仓库中"),SELLING(2, "已上架"),SELL_OUT(3, "已售罄"),OFF_THE_SHELF(4, "已下架"),
            setCanOnlyView(true)
          } else {
            setCanOnlyView(false)
          }
          if (proInfo.allowConfigDeliveryWay) { //实物商品
            setIsMaterial(true);
            expressSiteListCurrent.current = await getExpressConfig();
            if (!proInfo.expressSite) {
              proInfo.expressSite = expressSiteListCurrent.current;
              if (proInfo.expressSite === 'QIMEN') {
                proInfo.goodNo = proInfo.skuId;
              }
            }
          }
          if (proInfo.showGift) { //是否显示赠送
            setShowGift(true);
          }
          if (proInfo.codeHeader) {
            setCodeHeaderValue(proInfo.codeHeader)
          }
          const toUpdatedActivityDetail: any = {
            proInfo
          };
          //对时间做匹配
          if (proInfo.upDate && proInfo.downDate) {
            const dateFormat = 'YYYY-MM-DD HH:mm:ss';
            toUpdatedActivityDetail.dateRange = [moment(proInfo.upDate, dateFormat), moment(proInfo.downDate, dateFormat)];
            isCreated.current = false;
          } else {
            isCreated.current = true;
          }
          //对预热时间做匹配
          if (proInfo.warmUpDate) {
            const dateFormat = 'YYYY-MM-DD HH:mm:ss';
            toUpdatedActivityDetail.warmUpDateMoment = moment(proInfo.warmUpDate, dateFormat);
          }
          //对时间段做匹配
          if (proInfo.salePeriod) {
            const dateFormat = 'HH:mm:ss';
            let arr = proInfo.salePeriod.split(','), timeArr: any = [];
            arr.forEach((item: any) => {
              let subArr = item.split('-');
              let aa = moment(subArr[0], dateFormat);
              let aaa = moment(subArr[1], dateFormat);
              timeArr.push([moment(subArr[0], dateFormat), moment(subArr[1], dateFormat)])
            })
            toUpdatedActivityDetail.timeRange = timeArr
          }
          //对划线价为0的做适配
          if (proInfo.linePrice === 0) {
            proInfo.linePrice = '';
          }
          if (proInfo.ext) {
            toUpdatedActivityDetail.ext = proInfo.ext;
            toUpdatedActivityDetail.extName = proInfo.extName;
            if (proInfo.extSkuString) {
              toUpdatedActivityDetail.selectCrmObj = JSON.parse(proInfo.extSkuString)
              toUpdatedActivityDetail.extSkuString = proInfo.extSkuString
            }
          }
          //对兑换码做匹配
          if (proInfo.validityStartTime && proInfo.validityEndTime) {
            const dateFormat = 'YYYY-MM-DD HH:mm:ss';
            toUpdatedActivityDetail.codeDateRange = [moment(proInfo.validityStartTime, dateFormat), moment(proInfo.validityEndTime, dateFormat)];
          }

          //对产码类型做匹配
          if (proInfo.shopId === 10005 && merchantDetail.isThirdCode) {
            toUpdatedActivityDetail.proInfo.importType = 2
          }

          //对麦麦商城的购买方式做匹配
          if (proInfo.shopId === 1 && proInfo.points) {
            toUpdatedActivityDetail.proInfo.priceStyle = 2
          } else {
            toUpdatedActivityDetail.proInfo.priceStyle = 1
          }

          toUpdatedActivityDetail.rightsInfoList = proInfo.rightsInfoList || [];
          toUpdatedActivityDetail.skuList = [];
          if (proInfo.skuList?.length > 0) {
            proInfo.skuList.forEach((item: any) => {
              item.key = item.skuId;
              if (!item.expressSite) {
                item.expressSite = expressSiteListCurrent.current;
                if (item.expressSite === 'QIMEN') {
                  item.goodNo = item.skuId;
                }
              }
              if (item.linePrice === 0) {
                item.linePrice = '';
              }
              if (item.extSkuString) {
                item.selectCrmObj = JSON.parse(item.extSkuString)
                item.extName = item.selectCrmObj.membershipSpecDesc
              }
              if (proInfo.shopId === 1 && item.points) {
                item.priceStyle = 2
              } else {
                item.priceStyle = 1
              }
            })
            toUpdatedActivityDetail.skuList = proInfo.skuList;
            //有规格就不展示配置商品的价格和库存
            setCanEditPrice(false);
          } else {
            setCanEditPrice(true);
          }
          toUpdatedActivityDetail.agreementList = proInfo.agreementList;
          toUpdatedActivityDetail.limit = proInfo.limit;
          _merchantStockFour = toUpdatedActivityDetail;
          updataMerchantStockFour(_merchantStockFour);
          console.log('_merchantStockFour', _merchantStockFour)
        } catch {

        }
      })();
    }
  }, [currentStep]);

  const getExpressConfig = async () => {
    let expressCode = '';
    const { data: filterObj } = await apisEdit.getMerchantModule().expressConfig();
    if (filterObj.expressSiteList.length > 0) {
      let arr = filterObj.expressSiteList.filter((item: any) => {
        return item.defaultSelect
      })
      expressCode = arr ? arr[0].code : '';
      const options: any = filterObj.expressSiteList.map((item: any) => {
        return (
          <Select.Option key={item.code} value={item.code}>{item.name}</Select.Option>
        );
      });
      setExpressSiteList(options);
    }
    if (filterObj.expressCompanyList.length > 0) {
      const options: any = filterObj.expressCompanyList.map((item: any) => {
        return (
          <Select.Option key={item.code} value={item.code}>{item.name}</Select.Option>
        );
      });
      setExpressCompanyList(options);
    }

    if (filterObj.warehouseCodeList.length > 0) {
      const options: any = filterObj.warehouseCodeList.map((item: any) => {
        return (
          <Select.Option key={item.code} value={item.code}>{item.name}</Select.Option>
        );
      });
      setWarehouseCodeList(options);
    }

    return expressCode;
  }

  useEffect(() => {
    form.resetFields();
  }, [merchantStockFour]);

  useEffect(() => {
    if (executeAction && currentStep === STEP) {
      resetExecuteAction(false);
      if (canOnlyView) {
        history.push('/ecs/merchants');
      } else {
        form.submit();
      }
    }

  }, [executeAction])


  //关联权益编号
  const relate = () => {
    if (!merchantDetail.basicInfo.categoryId) {
      message.warning('请先选择关联商品的品类');
      return;
    }

    let _merchantStockFour = form.getFieldsValue(merchantStockFour);
    if (shopId != 5 && !_merchantStockFour.proInfo.stock) {
      message.warning('请先填写库存');
      return;
    }
    setSource({
      roleType: 'product',
      key: 0
    });
    makeCouponModalVisble(true);
  }

  //关联权益编号
  const relateRights = () => {
    let _merchantStockFour = form.getFieldsValue(merchantStockFour);
    if (!_merchantStockFour.ext) {
      message.warning(merchantDetail.basicInfo.categoryId === 28 ? '请先选择规格' : '请先关联卡券');
      return;
    }
    setSource({
      roleType: 'product',
      key: 0
    });

    setOriginList(_merchantStockFour.rightsInfoList);
    currentExt.current = _merchantStockFour.ext;
    makeRightModalVisble(true);
  }

  const updataMerchantStockFour = (merchantStockFour: any) => {
    setMerchantStockFour({ ...merchantStockFour });
  }

  const getParams = (values: any, currTimesArr = []) => {
    if (values.dateRange) {
      if (values.dateRange[0]) values.proInfo.upDate = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
      if (values.dateRange[1]) values.proInfo.downDate = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
    }
    if (currTimesArr.length) {
      let timeArr: any = [];
      currTimesArr.forEach((item: any) => {
        timeArr.push(item[0].format('HH:mm:ss') + '-' + item[1].format('HH:mm:ss'))
      })
      values.proInfo.salePeriod = timeArr.join(',')
    }

    //对兑换码做匹配  
    if (values.codeDateRange) {
      if (values.codeDateRange[0]) values.proInfo.validityStartTime = values.codeDateRange[0].format('YYYY-MM-DD HH:mm:ss');
      if (values.codeDateRange[1]) values.proInfo.validityEndTime = values.codeDateRange[1].format('YYYY-MM-DD HH:mm:ss');
    }

    if (values.warmUpDateMoment) {
      values.proInfo.warmUpDate = values.warmUpDateMoment.format('YYYY-MM-DD HH:mm:ss');
    }
    //是否自动续费
    if (values.autoRenew == 0) {
      values.proInfo.renewFirstPrice = '';
      values.proInfo.renewPrice = '';
      values.proInfo.planId = '';
    }
    //限制核销时间且选择按卡券核销时间
    if(values.proInfo?.redeemType === 0) {
      delete values.proInfo?.delayDay;
    }
    values.proInfo.spuId = spuId;
    values.proInfo.categoryId = merchantDetail.basicInfo.categoryId;
    values.proInfo.shopId = shopId;
    values.proInfo.ext = values.ext;
    values.proInfo.extName = values.extName;
    values.proInfo.extSkuString = merchantStockFour.extSkuString

    values.proInfo.rightsInfoList = values.rightsInfoList;
    values.proInfo.operationType = isCreated.current ? 1 : 3
    if (isMaiyouli) { //麦有礼
      values.proInfo.gift = 2;
    } else {
      if (!isShowGift || shopId === 5 || IsAuction || merchantDetail.isThirdCode) {
        values.proInfo.gift = 1;
      }
    }
    if (shopId === 10005 && merchantDetail.isThirdCode) {
      values.proInfo.codeHeader = codeHeaderValue
    }
    if (merchantDetail.basicInfo.categoryId === 27 || merchantDetail.basicInfo.categoryId === 29) {
      values.proInfo.partyType = [2]
    }

    const updatedeMerchantStockFour = values.proInfo;
    values.limit.type = 1;
    updatedeMerchantStockFour.limit = values.limit;
    if (values.skuList) {
      if (isMaiyouli) { //麦有礼
        values.skuList.forEach((item: any) => {
          item.gift = 2
        })
      } else {
        if (!isShowGift || shopId === 5 || IsAuction || merchantDetail.isThirdCode) {
          values.skuList.forEach((item: any) => {
            item.gift = 1
          })
        }
      }
      updatedeMerchantStockFour.skuList = values.skuList;
    }
    if (values.agreementList) {
      updatedeMerchantStockFour.agreementList = values.agreementList.filter((item: any) => {
        return item.name && item.url
      })
    }
    return updatedeMerchantStockFour;
  }

  //返回上一步需要保存用户草稿
  const toPrev = () => {
    if (canOnlyView || IsAuction) {
      //只看查看
      gotoNexStep(-1);
    } else {
      let values = form.getFieldsValue(merchantStockFour);
      let params = getParams(values);
      (async function () {
        const resp = await apisEdit.getMerchantModule().draftStep4(params);
        gotoNexStep(-1);
      })();
    }
  }
  //产品是否支持自动续费
  const autoRenew = (e: any) => {
    setIsExpenditure(e)
  }

  const onChangeCodeHeader = (e: any) => {
    const regexpLimitDecimals = /^[A-Za-z]/;
    let value = e.target.value
    if (value?.length <= 3 && regexpLimitDecimals.test(value)) {
      setCodeHeaderValue(value)
    } else if (value?.length === 0) {
      setCodeHeaderValue('')
    }
  }

  const onChangeTime = (time: any) => {
    if (time && time.length > 0) {
      let t0 = time[0].format('HH:mm:ss');
      let t1 = time[1].format('HH:mm:ss');
    }
    //setValue(time);
  };

  const range = (start: any, end: any) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result
  }

  const disabledRangeTime = (date: any, type: any) => {
    let _merchantStockFour = form.getFieldsValue(merchantStockFour);
    let _dateRange = _merchantStockFour.dateRange;
    let startHour = 0, startMin = 0, startSecond = 0, endHour = 0, endMin = 0, endSecond = 0;

    if (_dateRange) {
      if (_dateRange[0]) {
        startHour = Number(_dateRange[0].format('HH'));
        startMin = Number(_dateRange[0].format('mm'));
        startSecond = Number(_dateRange[0].format('ss'));
      }
      if (_dateRange[1]) {
        endHour = Number(_dateRange[1].format('HH'));
        endMin = Number(_dateRange[1].format('mm'));
        endSecond = Number(_dateRange[1].format('ss'));
      }
    }
    if (type === 'start') {
      return {
        disabledHours: () => range(0, 24).splice(0, startHour),
        disabledMinutes: () => range(0, 60).splice(0, startMin),
        disabledSeconds: () => range(0, 60).splice(0, startSecond)
      }
    } else {
      return {
        disabledHours: () => range(0, 24).splice((endHour + 1)),
        disabledMinutes: () => range(0, 60).splice((endMin + 1)),
        disabledSeconds: () => range(0, 60).splice((endSecond + 1))
      }
    }
  }


  return (
    <div className={currentStep === STEP ? 'edit-rule' : 'hide'}>
      <CouponSelector
        categoryId={merchantDetail.basicInfo.categoryId}
        spuId={merchantDetail.basicInfo.spuId}
        shopId={shopId}
        visible={couponModalVisble}
        isNeedExtTypeEqual3={merchantDetail.isNeedExtTypeEqual3}
        onClose={(selectedCoupons: any, source: any) => {
          if (selectedCoupons?.length > 0) {
            const selectedCoupon: any = selectedCoupons[0];
            let rewardItem: any;
            let rewardItemKey: number = 0;
            if (source.roleType === "product") {
              rewardItemKey = 0;
              let _merchantStockFour = form.getFieldsValue(merchantStockFour);
              if (selectedCoupon.cardCouponNo) {
                _merchantStockFour.ext = selectedCoupon.cardCouponNo
                _merchantStockFour.extName = selectedCoupon.name
                _merchantStockFour.rightsInfoList = []

                form.setFieldsValue({
                  ext: selectedCoupon.cardCouponNo,
                  extName: selectedCoupon.name,
                  rightsInfoList: []
                });
              } else {
                _merchantStockFour.ext = selectedCoupon.membershipSpecCode
                _merchantStockFour.extSkuString = JSON.stringify(selectedCoupon)
                _merchantStockFour.selectCrmObj = selectedCoupon
                _merchantStockFour.rightsInfoList = []
                form.setFieldsValue({
                  ext: selectedCoupon.membershipSpecCode,
                  extName: selectedCoupon.membershipSpecDesc,
                  extSkuString: JSON.stringify(selectedCoupon),
                  selectCrmObj: selectedCoupon,
                  rightsInfoList: []
                });
              }
              updataMerchantStockFour(_merchantStockFour);
            } else if (source.roleType === "skuList") {
              rewardItemKey = source.key;
              let _merchantStockFour = form.getFieldsValue(merchantStockFour);
              rewardItem = _merchantStockFour.skuList[rewardItemKey];
              if (selectedCoupon.cardCouponNo) {
                rewardItem.ext = selectedCoupon.cardCouponNo;
                rewardItem.extName = selectedCoupon.name;
              } else {
                rewardItem.ext = selectedCoupon.membershipSpecCode
                rewardItem.extName = selectedCoupon.membershipSpecDesc;
                rewardItem.extSkuString = JSON.stringify(selectedCoupon);
                rewardItem.selectCrmObj = selectedCoupon
              }
              rewardItem.rightsInfoList = [];
              form.setFieldsValue({
                skuList: _merchantStockFour.skuList,
              });
              updataMerchantStockFour(_merchantStockFour);
            }
          }
          makeCouponModalVisble(false);
        }}
        source={source}
      />
      <RightsInfo
        categoryId={merchantDetail.basicInfo.categoryId}
        cardCouponNo={currentExt.current}
        originList={originList}
        canOnlyView={canOnlyView}
        visible={rightModalVisble}
        onClose={(selectedRights: any, source: any) => {
          if (selectedRights.length > 0) {
            let rewardItem: any;
            let rewardItemKey: number = 0;
            let _merchantStockFour = form.getFieldsValue(merchantStockFour);
            if (source.roleType === "product") {
              rewardItemKey = 0;
              form.setFieldsValue({
                rightsInfoList: selectedRights
              });
            } else if (source.roleType === "skuList") {
              rewardItemKey = source.key;

              rewardItem = _merchantStockFour.skuList[rewardItemKey];
              rewardItem.rightsInfoList = selectedRights
              form.setFieldsValue({
                skuList: _merchantStockFour.skuList,
              });
            }
          }
          makeRightModalVisble(false);
        }}
        source={source}
      />
      <Form
        ref={formEl}
        layout="vertical"
        initialValues={merchantStockFour}
        form={form}
        onFinishFailed={(values) => {
          console.log('onFinishFailed', values)
          onActionCompleted(false);
        }}

        onValuesChange={(chgValues: any, values: any) => {
          if (chgValues.proInfo && (('validityType' in chgValues.proInfo) || ('priceStyle' in chgValues.proInfo) || ('redeemType' in chgValues.proInfo))) {
            setMerchantStockFour({ ...merchantStockFour, ...values })
          } else if (chgValues.proInfo && ('expressSite' in chgValues.proInfo)) {
            if (chgValues.proInfo.expressSite === 'QIMEN') {
              values.proInfo.goodNo = merchantStockFour.proInfo.skuId;
            } else {
              values.proInfo.goodNo = '';
            }
            setMerchantStockFour({ ...merchantStockFour, ...values })
          }
          else if ('dateRange' in chgValues) {
            if (!chgValues.dateRange) {
              values.timeRange = []
            }
            setMerchantStockFour({ ...merchantStockFour, ...values })
          } else if ('limit' in chgValues) {
            if (chgValues.limit.cycle == 0) {
              values.limit.limit = '';
            }
            setMerchantStockFour({ ...merchantStockFour, ...values })
          }
        }}
        onFinish={(values) => {
          if (values.proInfo.stock < values.proInfo.base) {
            //库存小于起售
            message.error('起售数量不能超出商品库存!')
            return;
          }
          if (shopId === 10005 && merchantDetail.isThirdCode && codeHeaderValue.length !== 3) {
            message.error('请填写正确的自定义码头!')
            return;
          }
          if (values.proInfo.warmUpDate) {
            if (moment(values.proInfo.warmUpDate).isAfter(values.proInfo.upDate)) {
              message.error('预热时间不能大于上架时间,请重新选择!')
              return;
            }
          }


          let currTimesArr = [];
          if (values.timeRange?.length > 0) {
            currTimesArr = values.timeRange.filter((item: any) => item)
            if (currTimesArr.length) {
              let _merchantStockFour = form.getFieldsValue(merchantStockFour);
              let dateRange: any = _merchantStockFour.dateRange;
              let startunix = 0, endunix = 0;
              if (dateRange[0]) {
                startunix = getSecond(dateRange[0]);
              }
              if (dateRange[1]) {
                endunix = getSecond(dateRange[1]);
              }
              currTimesArr.forEach((subItem: any) => {
                if ((startunix > getSecond(subItem[0])) || (endunix < getSecond(subItem[1]))) {
                  message.error('时间段需在上下架时间内，请重新选择！')
                  return;
                }
              })
            }
          }

          let params = getParams(values, currTimesArr);
          (async function () {
            const resp = await apisEdit.getMerchantModule().saveStep4(params);
            if (!resp.success) {
              onActionCompleted(false);
              message.error(resp.message);
            } else {
              onActionCompleted(true);
              message.success('商品提交成功');
              history.push('/ecs/merchants');
            }
          })();
        }}
      >
        <Row>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">价格库存{merchantDetail.basicInfo.flash === 1 && <span style={{ color: '#f00', fontSize: '14px', marginLeft: '20px' }}>当前是限时优惠商品,请维护划线价</span>}</div></Col></Row>
            <Row gutter={32} className="form-block">
              <Col className="gutter-row" span={6}>
                <Form.Item style={{ display: 'none' }} hidden={true} name={['proInfo', 'spuId']} >
                  <Input disabled={canOnlyView} />
                </Form.Item>
                <Form.Item style={{ display: 'none' }} hidden={true} name={['proInfo', 'allowInvByStore']}>
                  <Input disabled={canOnlyView} />
                </Form.Item>
                <Form.Item style={{ display: 'none' }} hidden={true} name={['proInfo', 'allowAdvanceRedeemType']}>
                  <Input disabled={canOnlyView} />
                </Form.Item>
                <Form.Item style={{ display: 'none' }} hidden={true} name={['proInfo', 'allowSalePeriod']}>
                  <Input disabled={canOnlyView} />
                </Form.Item>
                <Form.Item label={$t('商品上下架日期')} name='dateRange' rules={[{ required: true }]}>
                  <RangePicker
                    disabled={canOnlyView}
                    style={{ width: '100%' }}
                    picker="date"
                    showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                    disabledDate={(current: any) => {
                      return current && current < moment().startOf('day');
                    }}
                  />
                </Form.Item>
              </Col>
              <Col className="gutter-row" span={6}>
                {/*暂不支持麦有礼 */}
                <Form.Item label={$t('商品预热开始时间')} name='warmUpDateMoment'>
                  <DatePicker disabled={canOnlyView} style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm:ss" />
                </Form.Item>
              </Col>
            </Row>
            {merchantStockFour.proInfo.allowSalePeriod && <Row gutter={32} className="form-block">
              <Col className="gutter-row" span={12}>
                <Form.Item label={$t('商品上下架时间段')} className="time-range-con">
                  <Form.List name='timeRange'>
                    {(fields, { add, remove }) => (
                      <div className="time-range">
                        {fields.map((field, index) => (
                          <Col className="gutter-row" span={3} key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                            <Form.Item
                              {...field}
                              name={[field.name]}
                            >
                              <TimePicker.RangePicker disabledTime={disabledRangeTime} disabled={canOnlyView} />
                            </Form.Item>
                            {!canOnlyView && <IconFont type='icon-cuowutoumingceshi' onClick={() => remove(field.name)} />}
                          </Col>
                        ))}
                        {!canOnlyView && <Form.Item>
                          <a onClick={() => {
                            let _dateRange = form.getFieldsValue(merchantStockFour).dateRange;
                            let _timeRange = form.getFieldsValue(merchantStockFour).timeRange;
                            if (_dateRange && _dateRange.length) {
                              console.log('_timeRange', _timeRange?.length)
                              if (_timeRange?.length === 5) {
                                message.warning('最多可添加5个时间段')
                              } else {
                                add();
                              }
                            } else {
                              message.warning('请先选择商品上下架日期')
                            }
                          }
                          }>
                            新增
                          </a>
                        </Form.Item>}
                      </div>
                    )}
                  </Form.List>
                </Form.Item>
              </Col>
            </Row>}
            {merchantStockFour.skuList?.length > 0 && <Row gutter={32} className="form-block">
              <Col className="gutter-row" span={12}><Form.Item label="规格明细">
                <PrescribedDetailFour
                  shopId={shopId}
                  isMaiyouli={isMaiyouli}
                  skus={merchantStockFour.skuList}
                  field="skuList"
                  disabled={canOnlyView}
                  taxOptions={taxOptions}
                  isMaterial={isMaterial}
                  isShowGift={isShowGift}
                  IsAuction={IsAuction}
                  isCreated={isCreated.current}
                  categoryId={merchantDetail.basicInfo.categoryId}
                  spuId={merchantDetail.basicInfo.spuId}
                  allowInvByStore={merchantStockFour.proInfo.allowInvByStore}
                  templateOptions={templateOptions}
                  expressSiteList={expressSiteList}
                  expressCompanyList={expressCompanyList}
                  warehouseCodeList={warehouseCodeList}
                  onSelectNewCoupon={(key: any) => {
                    setSource({
                      roleType: 'skuList',
                      key
                    });
                    makeCouponModalVisble(true);
                  }}
                  onWriteRightInfo={(key: any) => {
                    let _merchantStockFour = form.getFieldsValue(merchantStockFour);
                    let rewardItem = _merchantStockFour.skuList[key];
                    if (!rewardItem.ext) {
                      message.error('请先关联卡券');
                      return;
                    }
                    setSource({
                      roleType: 'skuList',
                      key
                    });
                    currentExt.current = rewardItem.ext;
                    setOriginList(rewardItem.rightsInfoList);
                    makeRightModalVisble(true);
                  }}
                  changeSkuListExpenditure={(value: any, index: any) => {
                    let _merchantStockFour = form.getFieldsValue(merchantStockFour);
                    let rewardItem = _merchantStockFour.skuList[index];
                    rewardItem.autoRenew = value;
                    form.setFieldsValue({
                      skuList: _merchantStockFour.skuList,
                    });
                    updataMerchantStockFour(_merchantStockFour);
                  }}
                  changeSkuListImportType={(label: any, value: any, index: any) => {
                    let _merchantStockFour = form.getFieldsValue(merchantStockFour);
                    let rewardItem = _merchantStockFour.skuList[index];
                    rewardItem[label] = value;
                    if (label === 'priceStyle' && value === 1) {
                      rewardItem.points = 0
                    }
                    form.setFieldsValue({
                      skuList: _merchantStockFour.skuList,
                    });
                    console.log('_merchantStockFour', _merchantStockFour)
                    updataMerchantStockFour(_merchantStockFour);
                  }}
                  changeExpressSite={(value: any, index: any) => {
                    let _merchantStockFour = form.getFieldsValue(merchantStockFour);
                    let rewardItem = _merchantStockFour.skuList[index];
                    rewardItem.expressSite = value;
                    if (value === 'QIMEN') {
                      rewardItem.goodNo = rewardItem.skuId;
                    } else {
                      rewardItem.goodNo = '';
                      rewardItem.warehouseCode = '';
                      rewardItem.logisticsCode = '';
                    }
                    form.setFieldsValue({
                      skuList: _merchantStockFour.skuList,
                    });
                    updataMerchantStockFour(_merchantStockFour);
                  }}
                />
              </Form.Item>
              </Col>
            </Row>}
            {canEditPrice && <StockBasic
              merchantStockFour={merchantStockFour}
              taxOptions={taxOptions}
              isMaiyouli={isMaiyouli}
              canOnlyView={canOnlyView}
              isExpenditure={isExpenditure}
              relate={() => { relate() }}
              relateRights={() => { relateRights() }}
              isMaterial={isMaterial}
              isCreated={isCreated.current}
              spuId={merchantDetail.basicInfo.spuId}
              skuId={merchantStockFour.proInfo.skuId}
              categoryId={merchantDetail.basicInfo.categoryId}
              isShowGift={isShowGift}
              expressSiteList={expressSiteList}
              expressCompanyList={expressCompanyList}
              warehouseCodeList={warehouseCodeList}
              IsAuction={IsAuction}
              triggerTransferFlag={triggerTransferFlag}
              allowInvByStore={merchantStockFour.proInfo.allowInvByStore}
              templateOptions={templateOptions}
            />}
          </Col>
        </Row>
        {
          shopId == 10005 && merchantDetail.isThirdCode && <Row>
            <Col span={12}>
              <Row><Col span={12}><div className="section-header">兑换码属性</div></Col></Row>
              <Row gutter={32} className="form-block">
                <Col className="gutter-row" span={6}>
                  <Form.Item label={$t('自定义码头(限制3位大小写字母)')} className='require' rules={[{ required: true }]}>
                    <Input disabled={canOnlyView}
                      value={codeHeaderValue}
                      onChange={(e: any) => onChangeCodeHeader(e)}
                    />
                  </Form.Item>
                </Col>
                <Col className="gutter-row" span={6}>
                  <Form.Item label={$t('有效期')}>

                    <Row gutter={16}>
                      <Col className="gutter-row" span={6}>
                        <Form.Item name={['proInfo', 'validityType']} rules={[{ required: true, message: '请选择有效期' }]}>
                          <Radio.Group disabled={canOnlyView}>
                            <Radio value={1}>固定日期</Radio>
                            <Radio value={2}>固定天数</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                      <Col className="gutter-row" span={6}>
                        {merchantStockFour.proInfo?.validityType == 1 && <Form.Item label={$t('')} name='codeDateRange' rules={[{ required: true }]}>
                          <RangePicker
                            disabled={canOnlyView}
                            style={{ width: '100%' }}
                            picker="date"
                            showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                            disabledDate={(current: any) => {
                              return current && current < moment().startOf('day');
                            }}
                          />
                        </Form.Item>}
                        {merchantStockFour.proInfo?.validityType == 2 && <Form.Item name={['proInfo', 'validityDays']} rules={[{ type: 'number', required: true, message: '请输入有效的数字' }]} >
                          <InputNumber disabled={canOnlyView} style={{ width: '100%' }} placeholder="请填写有效天数" min={1} maxLength={10}
                            formatter={(value: any) => sanitizeToInteger(value)}
                            parser={value => sanitizeToInteger(value) || ''}
                          />
                        </Form.Item>}
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        }
        <Row>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">商品属性</div></Col></Row>
            <Row gutter={32} className="form-block">
              <Col className="gutter-row" span={3}>
                <Form.Item label={'限购周期'} name={['limit', 'cycle']}>
                  <Select disabled={canOnlyView} placeholder={$t('请选择限购周期')} options={constants.cycleObj} />
                </Form.Item>
              </Col>
              <Col className="gutter-row" span={3}>
                <Form.Item name={['limit', 'limit']} label={'累计限购'}>
                  <InputNumber min={1}
                    disabled={canOnlyView || (merchantStockFour.limit?.cycle == 0)}
                    placeholder="请填写最少起售数"
                    formatter={(value: any) => sanitizeToInteger(value)}
                    parser={value => sanitizeToInteger(value) || ''}
                  />
                </Form.Item>
              </Col>
              <Col className="gutter-row" span={3}>
                <Form.Item name={['proInfo', 'limitSingle']} label={'每次限购'}>
                  <InputNumber min={1} placeholder="请输入"
                    disabled={canOnlyView}
                    formatter={(value: any) => sanitizeToInteger(value)}
                    parser={value => sanitizeToInteger(value) || ''}
                  />
                </Form.Item>
              </Col>
              <Col className="gutter-row" span={3}>
                <Form.Item label={'每次至少购买'} name={['proInfo', 'base']}>
                  <InputNumber min={1}
                    disabled={canOnlyView}
                    formatter={(value: any) => sanitizeToInteger(value)}
                    parser={value => sanitizeToInteger(value) || ''}
                  />
                </Form.Item>
              </Col>
            </Row>

            {!IsAuction && shopId == 5 && <div>
              <Row gutter={32} className="form-block">
                {(merchantDetail.basicInfo.categoryId !== 27 && merchantDetail.basicInfo.categoryId !== 29) && <Col className="gutter-row" span={3}>
                  <Form.Item name={['proInfo', 'partyType']} label="成团方式" rules={[{ required: true, message: '请选择成团方式' }]}>
                    <Checkbox.Group disabled={canOnlyView}>
                      <Row>
                        <Col>
                          <Checkbox value={2} style={{ lineHeight: '32px' }} disabled={merchantDetail?.basicInfo?.categoryDetail?.ruleId === '1>6>20'}>
                            拼团
                          </Checkbox>
                        </Col>
                        {merchantDetail.basicInfo.categoryId !== 25 && <Col>
                          <Checkbox value={1} style={{ lineHeight: '32px' }}>
                            包场
                          </Checkbox>
                        </Col>}
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                </Col>
                }
                {merchantStockFour.proInfo.allowAdvanceRedeemType && <>
                  <Col className="gutter-row" span={3}>
                    <Form.Item label="限制核销时间" tooltip="可选按卡券配置的核销时间还是按预约的场次的日期限制">
                      <Input.Group compact>
                        <Form.Item name={['proInfo', 'redeemType']} >
                          <Radio.Group>
                            <Radio value={0}> 按卡券核销时间 </Radio>
                            <Radio value={1}> 按预约日期</Radio>
                          </Radio.Group>
                        </Form.Item>
                        <div style={{ display: merchantStockFour.proInfo.redeemType === 1 ? 'inline-flex' : 'none' }}>
                          <span style={{ marginRight: '3px', height:'36px', lineHeight: '36px'}}>加</span>
                          <Form.Item
                            name={['proInfo', 'delayDay']}
                          >
                            <InputNumber style={{ width: '70px' }} disabled={canOnlyView}
                              min={0} max={99}
                              formatter={(value: any) => sanitizeToInteger0(value)}
                              parser={value => sanitizeToInteger0(value) || ''} />
                          </Form.Item>
                          <span style={{ marginLeft: '3px', height:'36px', lineHeight: '36px' }}>天</span>
                        </div>
                      </Input.Group>
                    </Form.Item>
                  </Col>
                </>}
                {merchantStockFour.proInfo.allowAdvanceRedeemType && <Col className="gutter-row" span={3}>
                  <Form.Item name={['proInfo', 'eventAdvanceDay']} label="提前预定天数" tooltip="默认0当天场次可预定；1需提前一天可预定；其他类推。">
                    <InputNumber min="0"
                      formatter={(value: any) => sanitizeToInteger0(value)}
                      parser={value => sanitizeToInteger0(value) || ''}
                    />
                  </Form.Item>
                </Col>}
              </Row>
              {(merchantDetail.basicInfo.categoryId !== 27 && merchantDetail.basicInfo.categoryId !== 29) && merchantDetail.isNotTasting && <Row gutter={32} className="form-block">
                <Col className="gutter-row" span={6}>
                  <Form.Item
                    label='最小年龄'
                    name={['proInfo', 'ageMin']}
                    rules={[{ required: true, message: '请输入最小年龄' }]}

                  >
                    <InputNumber
                      placeholder="请输入最小年龄"
                      disabled={canOnlyView}
                      min={1} maxLength={5}
                      formatter={(value: any) => sanitizeToInteger(value)}
                      parser={value => sanitizeToInteger(value) || ''}
                    />
                  </Form.Item>
                </Col>
                <Col className="gutter-row" span={6}>
                  <Form.Item
                    label='最大年龄'
                    name={['proInfo', 'ageMax']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          /* @ts-ignore */
                          if (!value) {
                            return Promise.reject(new Error('请输入最大年龄'));
                          }
                          if (value && getFieldValue('proInfo').ageMin >= value) {
                            return Promise.reject(new Error('最大年龄不能小于或等于最小年龄!'));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}

                  >
                    <InputNumber
                      placeholder="请输入最大年龄"
                      disabled={canOnlyView}
                      min={2} maxLength={5}
                      formatter={(value: any) => sanitizeToInteger(value)}
                      parser={value => sanitizeToInteger(value) || ''}
                    />
                  </Form.Item>
                </Col>
              </Row>}

              {(merchantDetail.basicInfo.categoryId !== 27 && merchantDetail.basicInfo.categoryId !== 29) && <Row gutter={32} className="form-block">
                <Col className="gutter-row" span={6}>
                  <Form.Item label={$t('活动建议时长')} name={['proInfo', 'partyRange']} rules={[{ required: merchantDetail.basicInfo.categoryId !== 25, message: '请选择活动活动时长' }]}>
                    <Select allowClear options={getPartyTime()} disabled={canOnlyView} />
                  </Form.Item>
                </Col>
                <Col className="gutter-row" span={6}>
                  <Form.Item
                    label='最少成团人数'
                    name={['proInfo', 'partyMin']}
                    rules={[{ required: merchantDetail.basicInfo.categoryId !== 25, message: '请输入最少成团人数' }]}
                  >
                    <InputNumber
                      placeholder="请输入最少成团人数"
                      disabled={canOnlyView}
                      min={1} maxLength={5}
                      formatter={(value: any) => sanitizeToInteger(value)}
                      parser={value => sanitizeToInteger(value) || ''}
                    />
                  </Form.Item>
                </Col>
                <Col className="gutter-row" span={6}>
                  <Form.Item
                    label='最多成团人数'
                    name={['proInfo', 'partyMax']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          /* @ts-ignore */
                          if (!value) {
                            return Promise.reject(new Error('请输入最多成团人数'));
                          }
                          if (value && getFieldValue('proInfo').partyMin >= value) {
                            return Promise.reject(new Error('最多成团人数不能小于或等于最小成团人数'));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <InputNumber
                      placeholder="请输入最多人数"
                      disabled={canOnlyView}
                      min={2} maxLength={5}
                      formatter={(value: any) => sanitizeToInteger(value)}
                      parser={value => sanitizeToInteger(value) || ''}
                    />
                  </Form.Item>
                </Col>
              </Row>}
            </div>
            }
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">购买协议</div></Col></Row>
            <Row>
              <Col className="gutter-row" span={6}>
                <Agreement
                  agreements={merchantStockFour.agreementList}
                  field="agreementList"
                />
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="form-block">
          <Col style={{ paddingBottom: 40, display: 'flex', width: '100%' }}>
            {canOnlyView && <Button type="primary" onClick={() => {
              history.push('/ecs/merchants')
            }}>{$t('下一步')}</Button>}
            {!canOnlyView && spuId &&
              <Popconfirm
                title="确认要提交上架吗？提交成功后会在上架时间进行自动上架售卖"
                onConfirm={() => form.submit()}
                okText="确认"
                cancelText="取消"
                icon=""
              >
                <Button type="primary" htmlType="submit" >{$t('提交上架')}</Button>
              </Popconfirm>
            }
            <Button style={{ marginLeft: '8px' }} onClick={toPrev}>{$t('返回上一步')}</Button>
          </Col>
        </Row>
      </Form >
    </div >
  )
}));