import React, { useState, useEffect, useRef, useMemo } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
import { Form, Input, Button, Row, Col, message, Cascader, Radio, Upload, Space, InputNumber, Checkbox, Select, IconFont, Tag } from '@aurum/pfe-ui';
import * as apisEdit from '@/common/net/apis_edit';
import * as merchantAction from '@/redux/actions/merchantAction'
import ImagesList from '@/components/ImagesList';
import Editor from '@/components/Editor';
import TagSelector from '@/components/TagSelector';
import config from '@/common/config/config';
// @ts-ignore
import { ColorPickerField } from '@omc/boss-widgets';
// @ts-ignore
import AurumImageField from '@/components/aurumImageField/ImageField';
// @ts-ignore
import { checkMyPermission } from '@omc/boss-common/dist/utils/common';
import { imagesExtra, getThirdPartyName, getCascaderDataId } from '@/common/helper';
const CheckboxGroup = Checkbox.Group;

const initialMerchantDetail = {
  basicInfo: { //商品详情-基本信息
    categoryId: '', // 商品分类Id
    spuId: '',//SPU_ID
    spuName: '', // 商品名称
    spuNameEn: '',
    shortName: '',//商品短名称
    shortNameEn: '',//商品英文短名称
    selling: '', //卖点
    sellingEn: '',
    images: [],//商品主图
    imagesEn: [],
    verticalImg: '', //俯视图
    verticalImgEn: '',//俯视图-英文版 
    labelImg: '', //俯视图图标
    labelImgEn: '', //俯视图图标-英文版 
    wechatShareImg: '',
    wechatShareImgEn: '',
    shareMsg: '',//分享文案
    shareMsgEn: '', //分享文案-英文版 
    video: '',//商品视频
    videoImage: '',//视频主图
    videoImageEn: '',//视频英文主图
    detail: '', //商品详情
    detailEn: '',
    notesToBuy: '',//购买须知
    notesToBuyEn: '',
    shopId: '',
    sellingType: 0,
    listDisplay: 1,
    showPosition: '',
    showPositionArr: ['1'],
    partyPicType: '', //活动的头部颜色1：dark.2：light
    partyPicTypeEn: '',//活动的头部颜色1：dark.2：light
    partyPic: '', //活动的头部图片
    partyPicEn: '',
    partyRgb: '', //活动的头部颜色
    partyRgbEn: '',
    partyFood: '',
    partyGift: '', //活动的礼物信息
    partyFoodEn: '',
    partyGiftEn: '',
    usePartyRgb: -1,
    usePartyRgbEn: -1,
    thirdPartyCode: '',// 合作方编码
    thirdPartyName: '',//合作方名称
    thirdPartyUrl: '',//合作方兑换地址
    thirdPartyType: 1, // 合作方支持的产码方式
    thirdPartyIcon: '',
    thirdPartyNameEn: '',
    crmTagList: [], //会员标签
    partyBossAdd: 1,  //是否支持店长端新建场次 0不支持 1支持
    partyListImg: '',
    partyListImgEn: ''
  },
  basicImages: [],
  basicImagesEn: [],
  // whitePhones: [], //白名单
  cascaderData: [],
  isNeedExtType: false,//是否需要展示关联卡券
  isNeedExtTypeEqual3: false, //是否维护权益详情，只有卡才需要extType===3
  isThirdCode: false, // 是否是第三方兑换码(categoryId 24,30)
  isNotTasting: false // 不是品鉴会
}
const mapStateToProps = (state: any) => {
  return {
    executeAction: state.merchant.executeAction,
    currentStep: state.merchant.currentStep,
    thirdParties: state.merchant.thirdParties
    //categories: state.merchant.categories,
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  resetExecuteAction: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_EXECUTE_ACTION,
    payload
  }),
  // initCategories: (payload: any) => dispatch({
  //   type: merchantAction.SHOP_CATEGORIES,
  //   payload
  // }),
  initMerchantDetail: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_DETAIL,
    payload
  }),
  initShopId: (payload: any) => dispatch({
    type: merchantAction.SHOP_ID,
    payload
  }),
  initIsAuction: (payload: any) => dispatch({
    type: merchantAction.ISAUCTION,
    payload
  }),
  initReduxOnlyView: (payload: any) => dispatch({
    type: merchantAction.MERCHANT_ONLY_VIEW,
    payload
  })
});

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ history, STEP, currentStep, onActionCompleted, executeAction, resetExecuteAction, initMerchantDetail, initShopId, initIsAuction, initReduxOnlyView, thirdParties }: any) => {
  const { activityCode }: any = useParams();
  const { spuId, isShow }: any = useParams();
  const [merchantDetail, setMerchantDetail]: any = useState(JSON.parse(JSON.stringify(initialMerchantDetail)));
  const [canEdit, setCanEdit]: any = useState(true);
  const [isNew, setIsNew]: any = useState(false);
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const rewardImageStyleRef: any = useRef();
  const shopId: any = useRef();
  const [categories, setCategories] = useState([]);
  const [isFresh, setIsFresh] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoEnUrl, setVideoEnUrl] = useState('');
  const currSpuName = useRef('');
  const [canOnlyView, setCanOnlyView] = useState(false);
  const [partyPicShow, setPartyPicShow] = useState(false);
  const [partyPicShowEn, setPartyPicShowEn] = useState(false);
  const [partyRgbShow, setPartyRgbShow] = useState(false);
  const [partyRgbShowEn, setPartyRgbShowEn] = useState(false);
  const [crowdVisible, setCrowdVisible] = useState(false);
  const [crowdInfo, setCrowdInfo]: any = useState([]);
  const [showCrowdInfo, setShowCrowdInfo]: any = useState(false);
  const canClick = useRef(true);

  useEffect(() => {
    (async () => {
      const { data: resultObj } = await apisEdit.getMerchantModule().categories({ shopId: location.search?.split("?")[1] });
      if (resultObj) {
        shopId.current = resultObj.shopId;
        initShopId(resultObj.shopId);
        setCategories(resultObj.categories);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      setMerchantDetail(JSON.parse(JSON.stringify(initialMerchantDetail)));
      currSpuName.current = '';
      initReduxOnlyView(false);
    }
  }, []);

  useEffect(() => {
    if (spuId) {
      setCanEdit(false);
      (async () => {
        let { data: basicInfo } = await apisEdit.getMerchantModule().getCommodityBase({ spuId })
        if (basicInfo) {
          if (isShow === 'isShow' || basicInfo.status === 3 || basicInfo.status === 5 || !checkMyPermission('ecs:ecsLego:productedit')) {
            //WAREHOUSE(1, "仓库中"),SELLING(2, "已上架"),SELL_OUT(3, "已售罄"),OFF_THE_SHELF(4, "已下架"),5:预热中
            setCanOnlyView(true)
            initReduxOnlyView(true)
          } else {
            setCanOnlyView(false)
            initReduxOnlyView(false)
          }
          const toUpdatedActivityDetail: any = {
            basicInfo
          };
          if (basicInfo.categoryId && basicInfo.categoryDetail) {
            let categoryIdArr = basicInfo.categoryDetail.ruleId.split('>').map(Number);
            toUpdatedActivityDetail.cascaderData = categoryIdArr;
            let basicImagesArr: any = []
            if (basicInfo.images.length) {
              basicInfo.images?.forEach((item: any) => {
                basicImagesArr.push({
                  obj: item
                })
              });
            }
            toUpdatedActivityDetail.basicImages = basicImagesArr;
            let basicImagesArrEn: any = []
            if (basicInfo.imagesEn.length) {
              basicInfo.imagesEn?.forEach((item: any) => {
                basicImagesArrEn.push({
                  obj: item
                })
              });
            }
            toUpdatedActivityDetail.basicImagesEn = basicImagesArrEn;
            toUpdatedActivityDetail.isNeedExtType = !!basicInfo.categoryDetail.extType;
            toUpdatedActivityDetail.isNeedExtTypeEqual3 = (!!basicInfo?.categoryDetail?.extType && (basicInfo?.categoryDetail?.extType === 3 || basicInfo?.categoryDetail?.extType === 11)) ? true : false;
            toUpdatedActivityDetail.isThirdCode = (basicInfo.categoryId == 24 || basicInfo.categoryId == 30); //24:兑换码第三方; 30:兑换码O麦金会员
            toUpdatedActivityDetail.isNotTasting = basicInfo.categoryId !== 25 && basicInfo.categoryId !== 27 && basicInfo.categoryId !== 29;  //扩展MDS类似于品鉴会模板
          }
          if (basicInfo.video) {
            setVideoUrl(basicInfo.video);
          }
          if (basicInfo.videoEn) {
            setVideoEnUrl(basicInfo.videoEn);
          }
          if (basicInfo.showPosition.length > 0) {
            toUpdatedActivityDetail.basicInfo.showPositionArr = basicInfo.showPosition.split(',');
          } else {
            toUpdatedActivityDetail.basicInfo.showPositionArr = []
          }
          toUpdatedActivityDetail.basicInfo.partyPicType = basicInfo.partyPicType === 0 ? '' : basicInfo.partyPicType;
          toUpdatedActivityDetail.basicInfo.partyPicTypeEn = basicInfo.partyPicTypeEn === 0 ? '' : basicInfo.partyPicTypeEn;
          //小会员
          if (basicInfo.partyRgb) {
            basicInfo.usePartyRgb = 1;
            setPartyRgbShow(true)
          } else {
            basicInfo.usePartyRgb = -1;
          }
          if (basicInfo.partyRgbEn) {
            basicInfo.usePartyRgbEn = 1;
            setPartyRgbShowEn(true)
          } else {
            basicInfo.usePartyRgbEn = -1;
          }
          if (basicInfo.crmTagList?.length > 0) {
            setCrowdInfo(basicInfo.crmTagList)
          } else {
            setCrowdInfo([])
          }
          shopId.current = basicInfo.shopId || '';
          initShopId(basicInfo.shopId);
          initIsAuction(!!(basicInfo.sellingType == 2));
          setMerchantDetail(toUpdatedActivityDetail);
          setIsFresh(true);
          initMerchantDetail(toUpdatedActivityDetail);
        } else {
          history.push('/ecs/merchants');
        }
      })();
    } else {
      setIsNew(true);
    }
  }, [spuId]);

  const memoIsThirdCode = useMemo(() => {  //是否为第三方兑换码类型
    return () => getCascaderDataId(merchantDetail.cascaderData) === '24'
  }, [merchantDetail.cascaderData])

  const memoIsNotTasting = useMemo(() => {  //不是品鉴会或mds类型
    return () => (getCascaderDataId(merchantDetail.cascaderData) !== '25' && getCascaderDataId(merchantDetail.cascaderData) !== '27' && getCascaderDataId(merchantDetail.cascaderData) !== '29')
  }, [merchantDetail.cascaderData])

  useEffect(() => {
    form.resetFields(Object.keys(merchantDetail));
  }, [merchantDetail.basicInfo, isFresh]);

  useEffect(() => {
    if (executeAction && currentStep === STEP) {
      const activityType = form.getFieldValue(['basicInfo', 'activityType']);
      resetExecuteAction(false);
      if (!canOnlyView) {
        if (isNew) {
          if (!activityType) {
            form.submit();
          } else {
          }
        } else {
          form.submit();
        }
      } else {
        onActionCompleted({
          isSaved: true,
          activityCode: ''
        });
      }
    }
  }, [executeAction])

  // const onFocus = async (e: any) => {
  //   currSpuName.current = e.target.value;
  // }

  // const onBlur = async (e: any) => {
  //   if (e.target.value !== '' && e.target.value !== currSpuName.current) {
  //     let params = {
  //       spuName: e.target.value,
  //       shopId: shopId.current
  //     }
  //     const resp: any = await apisEdit.getMerchantModule().nameCheck(params);
  //     if (!resp.success) {
  //       message.error(resp.message);
  //       let basicInfo = form.getFieldsValue(merchantDetail).basicInfo;
  //       basicInfo.spuName = currSpuName.current;
  //       form.setFieldsValue({
  //         basicInfo: basicInfo
  //       });
  //       merchantDetail.basicInfo = basicInfo;
  //       setMerchantDetail({ ...merchantDetail });
  //     }
  //   }
  // }

  useEffect(() => {
    form.validateFields(['videoImage']);
    if (videoUrl == '') {
      form.setFields([{
        name: 'videoImage',
        errors: ['null'],
      }]);
    }
  }, [videoUrl]);

  const updataMerchantDetail = (merchantDetail: any) => {
    setMerchantDetail({ ...merchantDetail });
  }

  const openTagSelector = () => {
    if (canOnlyView) {
      return
    }
    setCrowdVisible(true)
  }

  const closeTag = (index: any) => {
    let arr = JSON.parse(JSON.stringify(crowdInfo));
    arr.splice(index, 1)
    setCrowdInfo(arr)
  }

  return (
    <div className={currentStep === STEP ? 'edit-info' : 'hide'} ref={rewardImageStyleRef} >
      <TagSelector
        setCrowdCallback={(crowdObj: any, visible: any) => {
          let arr = crowdInfo.concat(crowdObj), newArr: any = [], codesArr: any = [];
          if (crowdObj.length > 0) {
            arr.forEach((element: any) => {
              if (codesArr.indexOf(element.crowdCode) > -1) {
                return
              } else {
                codesArr.push(element.crowdCode);
                newArr.push(element)
              }
            });
            setCrowdInfo(newArr);
          }
          setCrowdVisible(visible);
        }}
        crowdInfo={crowdInfo}
        crowdListVisible={crowdVisible}
      />

      <Form
        layout="vertical"
        ref={formEl}
        initialValues={merchantDetail}
        scrollToFirstError={true}
        form={form}
        onFinishFailed={(values) => {
          console.log('values', values)
          onActionCompleted(false);
        }}
        onValuesChange={(value) => {
          const keysToUpdate: any = ['partyPic', 'partyPicEn', 'usePartyRgb', 'usePartyRgbEn', 'showPositionArr'];
          keysToUpdate.map((key: string) => {
            if (value?.basicInfo?.[key] !== undefined) {
              if (value?.basicInfo?.partyPic && value?.basicInfo?.partyPic !== '') {
                setPartyPicShow(true)
              } else {
                setPartyPicShow(false)
              }
              if (value?.basicInfo?.partyPicEn && value?.basicInfo?.partyPicEn !== '') {
                setPartyPicShowEn(true)
              } else {
                setPartyPicShowEn(false)
              }
              if (value?.basicInfo?.usePartyRgb) {
                if (value.basicInfo.usePartyRgb == 1) {
                  setPartyRgbShow(true)
                } else {
                  setPartyRgbShow(false)
                }
              }
              if (value?.basicInfo?.usePartyRgbEn) {
                if (value.basicInfo.usePartyRgbEn == 1) {
                  setPartyRgbShowEn(true)
                } else {
                  setPartyRgbShowEn(false)
                }
              }
            } else {
              const keysToUpdateActivityDetail: any = ['cascaderData'];
              keysToUpdateActivityDetail.map((key: string) => {
                if (value?.[key] !== undefined) {
                  merchantDetail[key] = value[key];
                  setMerchantDetail({ ...merchantDetail });
                }
              })
            }
          })
        }}
        onFinish={(values) => {
          if (!canClick.current) {
            return
          }
          canClick.current = false
          if (values.basicInfo.sellingType == 2 && values?.cascaderData?.length > 1 && (values.cascaderData[0] != 1 || values.cascaderData[1] != 4)) {
            message.error('拍卖商品目前只支持非预付优惠券，请修改！');
            canClick.current = true
            return
          }
          if (!values.basicImages.length) {
            message.error('请上传商品图！');
            canClick.current = true
            return
          }
          let _images: any = [];
          values.basicImages.forEach((item: any) => {
            _images.push(item.obj)
          })
          values.basicInfo.images = _images;

          let _imagesEn: any = [];
          if (values.basicImagesEn.length) {
            values.basicImagesEn.forEach((item: any) => {
              _imagesEn.push(item.obj)
            })
          }
          values.basicInfo.imagesEn = _imagesEn;

          values.basicInfo.showPosition = values.basicInfo.showPositionArr.join(',');

          values.basicInfo.crmTagList = crowdInfo;

          //小会员需要头部图片，背景色值和色系为同填或同不填
          if (shopId.current == 5) {
            let _basicInfo = values.basicInfo;
            if ((_basicInfo.partyPicType && _basicInfo.partyPic && _basicInfo.partyRgb) || (!_basicInfo.partyPicType && !_basicInfo.partyPic && !_basicInfo.partyRgb)) {
            } else {
              message.error('头部图片，背景色值和色系为同填或同不填,请修改！')
              canClick.current = true
              return;
            }
            if ((_basicInfo.partyPicTypeEn && _basicInfo.partyPicEn && _basicInfo.partyRgbEn) || (!_basicInfo.partyPicTypeEn && !_basicInfo.partyPicEn && !_basicInfo.partyRgbEn)) {
            } else {
              message.error('头部英文图片，背景色值和色系为同填或同不填,请修改！')
              canClick.current = true
              return;
            }
          }
          if (values.basicInfo.thirdPartyCode && thirdParties.length) {
            values.basicInfo.thirdPartyName = getThirdPartyName(thirdParties, values.basicInfo.thirdPartyCode, 'label')
            values.basicInfo.thirdPartyType = getThirdPartyName(thirdParties, values.basicInfo.thirdPartyCode, 'type')
            values.basicInfo.thirdPartyIcon = getThirdPartyName(thirdParties, values.basicInfo.thirdPartyCode, 'icon')
            values.basicInfo.thirdPartyNameEn = getThirdPartyName(thirdParties, values.basicInfo.thirdPartyCode, 'labelEn')
          }

          (async function () {
            values.basicInfo.categoryId = values.cascaderData[values.cascaderData.length - 1];
            values.basicInfo.shopId = shopId.current;
            values.basicInfo.video = videoUrl;
            values.basicInfo.videoEn = videoEnUrl;
            try {
              const resp: any = await apisEdit.getMerchantModule().saveCommodityBase(values.basicInfo);
              if (!resp.success) {
                onActionCompleted(false);
                message.error(resp.message);
                canClick.current = true
              } else {
                setIsNew(false);
                merchantDetail.basicInfo = values.basicInfo;
                initIsAuction(!!(values.basicInfo.sellingType == 2));
                setMerchantDetail({ ...merchantDetail });
                onActionCompleted({
                  isSaved: true,
                  ...resp.data
                });
                message.success('商品基本信息保存成功');
                canClick.current = true
              }

            } catch {
              canClick.current = true
            }
          })();
        }}
      >
        <Row><Col span={12}><div className="section-header">商品类目</div></Col></Row>
        <Row className="form-block">
          <Col span={12}>
            <Form.Item style={{ display: 'none' }} hidden={true} name={['basicInfo', 'spuId']} >
              <Input />
            </Form.Item>
            <Form.Item style={{ display: 'none' }} hidden={true} name={['basicInfo', 'shopId']} >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={32} className="form-block">
          <Col className="gutter-row" span={6}>
            <Form.Item label={$t('选择类目')} name='cascaderData' rules={[{ required: true }]}>
              <Cascader options={categories} placeholder="请选择类目" disabled={!canEdit} suffixIcon={<IconFont type="icon-xiangxia" />} />
            </Form.Item>
          </Col>
        </Row>
        <Row><Col span={12}><div className="section-header">商品基本信息</div></Col></Row>
        <Row gutter={32} className="form-block">
          <Col className={'gutter-row'} span={6}>
            <Form.Item name={['basicInfo', 'sellingType']} label={$t('商品的售卖类型')} rules={[{ required: true, message: '请选择是否是限时优惠商品' }]}>
              <Radio.Group>
                <Radio value={0} disabled={canOnlyView}>
                  正常商品
                </Radio>
                <Radio value={1} disabled={canOnlyView}>
                  秒杀商品
                </Radio>
                {shopId.current == '2' && (!merchantDetail.cascaderData.length || (merchantDetail.cascaderData?.length && merchantDetail.cascaderData[0] == 1 && merchantDetail.cascaderData[1] == 4)) && <Radio value={2} disabled={canOnlyView}>
                  拍卖商品
                </Radio>}
              </Radio.Group>
            </Form.Item>
          </Col>
          {(shopId.current == 5 || shopId.current == '5') && <Col className={'gutter-row'} span={6}>
            <Form.Item name={['basicInfo', 'partyBossAdd']} label={$t('是否支持店长端新建场次')} rules={[{ required: true, message: '请选择是否是否支持店长端新建场次' }]}>
              <Radio.Group>
                <Radio value={1} disabled={canOnlyView} checked>
                  支持
                </Radio>
                <Radio value={0} disabled={canOnlyView}>
                  不支持
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>}
          <Col className="gutter-row" span={6}>
            <Form.Item name={['basicInfo', 'showPositionArr']} label={$t('露出位置')}>
              <Checkbox.Group disabled={canOnlyView}>
                <Checkbox value='1'>
                  商城露出
                </Checkbox>
                <Checkbox value='2'>
                  点餐确认页
                </Checkbox>
                <Checkbox value='3'>
                  会员活动
                </Checkbox>
                <Checkbox value='4'>
                  积分好礼
                </Checkbox>
                {shopId.current == '1' && <Checkbox value='5'>
                  麦有礼
                </Checkbox>}
              </Checkbox.Group>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={32} className="form-block">
          <Col className="gutter-row" span={6}>
            <Form.Item label={$t('商品排序')} name={['basicInfo', 'sort']}>
              <InputNumber disabled={canOnlyView} min={0} max={9999999} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={6}>
            <Form.Item>
              <a style={{ marginBottom: '8px', display: 'block', color: canOnlyView ? '#ccc' : '' }} onClick={openTagSelector}>点击选择限定会员标签</a>
              <div className='crowdInfo'>
                {crowdInfo.map((element: any, index: any) => {
                  return (
                    <span>
                      {element.crowdName}
                      {!canOnlyView && <span><IconFont type="icon-guanbi" onClick={() => { closeTag(index) }} /></span>}
                    </span>)
                })}
              </div>
            </Form.Item>
          </Col>
        </Row>
        {shopId.current == '2' && (memoIsThirdCode() || merchantDetail.isThirdCode) && (<Row gutter={32} className="form-block">
          <Col className="gutter-row" span={6}>
            <Form.Item label={$t('合作方')} name={['basicInfo', 'thirdPartyCode']} rules={[{ required: true }]}>
              <Select allowClear disabled={canOnlyView} placeholder={$t('请选择合作方')} options={thirdParties} />
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={6}>
            <Form.Item label={$t('合作方兑换地址')} name={['basicInfo', 'thirdPartyUrl']} rules={[{ type: 'string', required: true }]} >
              <Input disabled={canOnlyView} />
            </Form.Item>
          </Col>
        </Row>)}
        <div className="panel">
          <div className="panel-item">
            <Col span={12}>
              <div className="lange">中文版</div>
              <Form.Item label={$t('商品名称')} name={['basicInfo', 'spuName']} rules={[{ type: 'string', required: true }]} >
                <Input maxLength={25} placeholder={'25字以内，避免加入标点符号和空格'} disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('商品短名称')} name={['basicInfo', 'shortName']} rules={[{ type: 'string', required: true }]} >
                <Input maxLength={9} placeholder={'9字以内，避免加入标点符号和空格'} disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('商品卖点')} name={['basicInfo', 'selling']}>
                <Input maxLength={65} placeholder="65字以内" disabled={canOnlyView} />
              </Form.Item>
              {(shopId.current == 5 || shopId.current == '5') && <Form.Item label={$t('派对横图')} name={['basicInfo', 'partyListImg']} rules={[{ required: true, message: '请上传派对横图' }]}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>}
              <Form.Item label={$t('商品图')} extra={imagesExtra(shopId.current)} className="tdrequired">
                <ImagesList
                  maxLength={shopId.current == 5 ? 1 : 20}
                  form={form}
                  disabled={canOnlyView}
                  basicImages={merchantDetail.basicImages}
                  field="basicImages"
                  refreshMerchantDetail={(data: any) => {
                    let _merchantDetail = form.getFieldsValue(merchantDetail);
                    _merchantDetail.basicImages = data;
                    updataMerchantDetail(_merchantDetail);
                  }}
                />
              </Form.Item>
              {shopId.current == 2 && !memoIsThirdCode() && !merchantDetail.isThirdCode && <Form.Item label={'俯视图'} name={['basicInfo', 'verticalImg']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>}
              {shopId.current == 2 && !memoIsThirdCode() && !merchantDetail.isThirdCode && <Form.Item label={'俯视图图标'} name={['basicInfo', 'labelImg']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>}
              <Form.Item label={$t('分享图')} name={['basicInfo', 'wechatShareImg']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('分享文案')} name={['basicInfo', 'shareMsg']}>
                <Input maxLength={22} placeholder="22字以内" disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('主图视频')} tooltip="建议视频突出商品核心卖点，时长9-30秒，建议尺寸：1035*621像素(若配置视频，需要同时配置一张视频主图)" >
                {!canOnlyView && <Upload  {...config.getUploadProps((imageObj: any) => {
                  form.setFieldsValue({
                    video: imageObj.imageUrl
                  });
                  setVideoUrl(imageObj.imageUrl);
                }, message, 'video', 'ecs')}>
                  <Button><IconFont type="icon-shangchuan" />{$t('Upload')}</Button>
                </Upload>}
                {videoUrl && <div className="videoInfo">
                  <video src={videoUrl} width="280" height="210" controls preload="auto" style={{ objectFit: 'fill' }}></video>
                  {!canOnlyView && <div className='close' onClick={() => {
                    form.setFieldsValue({
                      video: ''
                    });
                    setVideoUrl('')
                  }}><IconFont type="icon-qingchu1" /></div>}
                </div>}
              </Form.Item>
              <Form.Item label={$t('视频主图')} name={['basicInfo', 'videoImage']} rules={[
                {
                  required: !!videoUrl,
                }
              ]}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>
              {shopId.current == 5 && <Form.Item label={$t('头部图片')} extra='头部图片，背景色值和色系为同填或同不填' name={['basicInfo', 'partyPic']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>}


              {shopId.current == 5 && <div style={{ position: 'relative', zIndex: 600 }}><Form.Item label={$t('标题栏背景色值')} style={{ marginBottom: 0 }}>
                <Input.Group compact>
                  <Form.Item name={['basicInfo', 'usePartyRgb']}>
                    <Radio.Group disabled={canOnlyView}>
                      <Radio value={-1}>不设置</Radio>
                      <Radio value={1}>设置</Radio>
                    </Radio.Group>
                  </Form.Item>
                  {partyRgbShow && <Form.Item name={['basicInfo', 'partyRgb']} rules={[{ required: partyPicShow, message: '请选择标题栏背景色值' }]} >
                    <ColorPickerField disabled={canOnlyView} />
                  </Form.Item>}
                </Input.Group>
              </Form.Item>
              </div>}

              {shopId.current == 5 && <Form.Item label={$t('背景图色系')} name={['basicInfo', 'partyPicType']} rules={[{ required: partyPicShow, message: '请选择背景图色系' }]}>
                <Radio.Group>
                  <Radio value={1} disabled={canOnlyView}>
                    深色
                  </Radio>
                  <Radio value={2} disabled={canOnlyView}>
                    浅色
                  </Radio>
                  <Radio value={''} disabled={canOnlyView}>
                    不需要背景图色系
                  </Radio>
                </Radio.Group>
              </Form.Item>}
              <Form.Item label={shopId.current == 5 ? '详情介绍' : $t('商品详情')} name={['basicInfo', 'detail']} rules={[{ type: 'string', required: true }]}>
                <Editor detail={merchantDetail.basicInfo.detail} disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('购买须知')} name={['basicInfo', 'notesToBuy']} rules={[{ type: 'string', required: (memoIsNotTasting() || merchantDetail.isNotTasting) }]} >
                <Editor detail={merchantDetail.basicInfo.notesToBuy} placeholder="请填写购买须知" disabled={canOnlyView} menus={['bold']} />
              </Form.Item>
              {shopId.current == 5 && (memoIsNotTasting() || merchantDetail.isNotTasting) && <Form.Item label={$t('包含的餐食')} name={['basicInfo', 'partyFood']}>
                <Editor detail={merchantDetail.basicInfo.partyFood} placeholder="请填写活动包含的餐食" disabled={canOnlyView} />
              </Form.Item>}
              {shopId.current == 5 && (memoIsNotTasting() || merchantDetail.isNotTasting) && <Form.Item label={$t('包含的礼品')} name={['basicInfo', 'partyGift']}>
                <Editor detail={merchantDetail.basicInfo.partyGift} placeholder="活动包含的礼品" disabled={canOnlyView} />
              </Form.Item>}
            </Col>
          </div>
          <div className="panel-item">
            <Col span={12}>
              <div className="lange">英文版</div>
              <Form.Item label={$t('商品英文名称')} name={['basicInfo', 'spuNameEn']} rules={[{ type: 'string' }]} >
                <Input maxLength={50} placeholder={'50字以内，避免加入标点符号和空格'} disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('商品英文短名称')} name={['basicInfo', 'shortNameEn']}>
                <Input maxLength={18} placeholder={'18字以内，避免加入标点符号和空格'} disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('商品卖点英文')} name={['basicInfo', 'sellingEn']}>
                <Input maxLength={130} placeholder="130字符以内" disabled={canOnlyView} />
              </Form.Item>
              {(shopId.current == 5 || shopId.current == '5') && <Form.Item label={$t('派对横图英文版')} name={['basicInfo', 'partyListImgEn']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>}
              <Form.Item label={$t('商品图英文版')} extra={imagesExtra(shopId.current)}>
                <ImagesList
                  style="en"
                  form={form}
                  disabled={canOnlyView}
                  basicImages={merchantDetail.basicImagesEn}
                  field="basicImagesEn"
                  refreshMerchantDetail={(data: any) => {
                    let _merchantDetail = form.getFieldsValue(merchantDetail);
                    _merchantDetail.basicImagesEn = data;
                    updataMerchantDetail(_merchantDetail);
                  }}
                />
              </Form.Item>
              {shopId.current == 2 && !memoIsThirdCode() && !merchantDetail.isThirdCode && <Form.Item label={'俯视图'} name={['basicInfo', 'verticalImgEn']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>}
              {shopId.current == 2 && !memoIsThirdCode() && !merchantDetail.isThirdCode && <Form.Item label={'俯视图图标'} name={['basicInfo', 'labelImgEn']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>}
              <Form.Item label={$t('分享图英文版')} name={['basicInfo', 'wechatShareImgEn']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('分享文案')} name={['basicInfo', 'shareMsgEn']}>
                <Input maxLength={44} placeholder="44字以内" disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('主图视频英文版')} tooltip="建议视频突出商品核心卖点，时长9-30秒，建议尺寸：1035*621像素(若配置视频，需要同时配置一张视频主图)">
                {!canOnlyView && <Upload  {...config.getUploadProps((imageObj: any) => {
                  form.setFieldsValue({
                    videoEn: imageObj.imageUrl
                  });
                  setVideoEnUrl(imageObj.imageUrl);
                }, message, 'video', 'ecs')}>
                  <Button><IconFont type="icon-shangchuan" />{$t('Upload')}</Button>
                </Upload>}
                {videoEnUrl && <div className="videoInfo">
                  <video src={videoEnUrl} width="320" height="240" controls preload="auto" style={{ objectFit: 'fill' }}></video>
                  {!canOnlyView && <div className='close' onClick={() => {
                    form.setFieldsValue({
                      videoEn: ''
                    });
                    setVideoEnUrl('')
                  }}><IconFont type="icon-qingchu1" /></div>}
                </div>}
              </Form.Item>
              <Form.Item label={$t('视频主图英文版')} name={['basicInfo', 'videoImageEn']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>
              {shopId.current == 5 && <Form.Item label={$t('头部图片')} extra='头部图片，背景色值和色系为同填或同不填' name={['basicInfo', 'partyPicEn']}>
                <AurumImageField disabled={canOnlyView} />
              </Form.Item>}
              {shopId.current == 5 && <div style={{ position: 'relative', zIndex: 600 }}><Form.Item label={$t('标题栏背景色值')} style={{ marginBottom: 0 }}>
                <Input.Group compact>
                  <Form.Item name={['basicInfo', 'usePartyRgbEn']}>
                    <Radio.Group disabled={canOnlyView}>
                      <Radio value={-1}>不设置</Radio>
                      <Radio value={1}>设置</Radio>
                    </Radio.Group>
                  </Form.Item>
                  {partyRgbShowEn && <Form.Item name={['basicInfo', 'partyRgbEn']} rules={[{ required: partyPicShowEn, message: '请选择标题栏背景色值' }]} >
                    <ColorPickerField disabled={canOnlyView} />
                  </Form.Item>}
                </Input.Group>
              </Form.Item>
              </div>}

              {shopId.current == 5 && <Form.Item label={$t('背景图色系')} name={['basicInfo', 'partyPicTypeEn']} rules={[{ required: partyPicShowEn }]}>
                <Radio.Group>
                  <Radio value={1} disabled={canOnlyView}>
                    深色
                  </Radio>
                  <Radio value={2} disabled={canOnlyView}>
                    浅色
                  </Radio>
                  <Radio value={''} disabled={canOnlyView}>
                    不需要背景图色系
                  </Radio>
                </Radio.Group>
              </Form.Item>}
              <Form.Item label={shopId.current == 5 ? '详情介绍英文版' : $t('商品详情英文版')} name={['basicInfo', 'detailEn']} rules={[{ type: 'string' }]}>
                <Editor detail={merchantDetail.basicInfo.detailEn} disabled={canOnlyView} />
              </Form.Item>
              <Form.Item label={$t('购买须知英文版')} name={['basicInfo', 'notesToBuyEn']} rules={[{ type: 'string' }]} >
                <Editor detail={merchantDetail.basicInfo.notesToBuyEn} placeholder="请填写购买须知英文版" disabled={canOnlyView} menus={['bold']} />
              </Form.Item>
              {shopId.current == 5 && (memoIsNotTasting() || merchantDetail.isNotTasting) && <Form.Item label={$t('包含的餐食英文版')} name={['basicInfo', 'partyFoodEn']}>
                <Editor detail={merchantDetail.basicInfo.partyFoodEn} placeholder="请填写活动包含的餐食英文版" disabled={canOnlyView} />
              </Form.Item>}
              {shopId.current == 5 && (memoIsNotTasting() || merchantDetail.isNotTasting) && <Form.Item label={$t('包含的礼品英文版')} name={['basicInfo', 'partyGiftEn']}>
                <Editor detail={merchantDetail.basicInfo.partyGiftEn} placeholder="请填写活动包含的礼品英文版" disabled={canOnlyView} />
              </Form.Item>}
            </Col>
          </div>
        </div>
        <Row gutter={32} className="form-block">
          <Col style={{ paddingTop: '20px', paddingBottom: '40px' }}>
            <Space>
              {spuId && canOnlyView && <Button type="primary" onClick={() => onActionCompleted(true)}>{$t('下一步')}</Button>}
              {!canOnlyView && <Button type="primary" htmlType="submit" >{$t('下一步')}</Button>}
            </Space>
          </Col>
        </Row>
      </Form>
    </div >
  )
}));