import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
import moment from 'moment';
import { Form, Input, Button, Row, Col, message, DatePicker, Modal, Checkbox, Radio, InputNumber, IconFont, Upload } from '@aurum/pfe-ui';
import * as apis from '@/common/net/apis_activity';
import * as activityActions from '@/redux/actions/activityActions';
import BackgroundImagesList from '@/components/theme/edit/BackgroundImagesList';
import CoverImgList from '@/components/theme/edit/CoverImgList';
import TagSelector from '@/components/TagSelector';
import PenImagesList from '@/components/theme/edit/PenImageList';
import LetterList from '@/components/theme/edit/LetterList';
import '@/assets/styles/activity/theme.less';
import PictureWall from '../boss-widgets/src/picture-wall/PictureWall';
// @ts-ignore
import AurumImageField from '@/components/aurumImageField/ImageField';
// @ts-ignore
import { sanitizeToInteger } from '@/common/helper';
import Editor from '@/components/Editor';
const { RangePicker }: any = DatePicker

const initialThemeDetail = {
  themeInfo: { //商品详情-基本信息
    //20211216 更新主题
    giftWordList: [''], //预设赠言：适用:主题
    enGiftWordList: [],//英文：预设赠言：适用:主题
    itemImgList: [], //可选素材：适用:主题
    enItemImgList: [], //英文：可选素材：适用:主题
    customBaseImgList: [], //自定义底图：适用:主题
    enCustomBaseImgList: [], //英文自定义底图：适用:主题
    shareWordList: [''], //赠送分享文案 适用:主题
    enShareWordList: [],//英文版:赠送分享文案 适用:主题
    rewardWordList: [''], //回赠分享文案 适用:主题
    enRewardWordList: [], //英文版:回赠分享文案 适用:主题
    userScene: '',//使用场景 1麦有礼 2点餐亲情送，目前单选，必选没有默认值
    customBase: 0, //0自定义底图不使用预设封面,1自定义底图使用预设封面
    enRewardImg: '',//英文版:回赠分享卡片
    enShareImg: '',//英文版:赠送分享卡片
    giftNotifyFlag: 1, //0不支持赠送通知分享,1支持赠送通知分享
    rewardFlag: 0, //0不支持回赠分享,1支持回赠分享
    rewardImg: '',//回赠分享卡片
    shareImg: '',//赠送分享卡片
    transSecond: '',//中转页时常单位秒
    transferImg: '', //中转页图片
    enTransferImg: '',//英文版:中转页图片
    transferFlag: 0, //0不支持中转页,1支持中转页
    //.......
    backgroundImgList: [],//背景图，支持多个
    enBackgroundImgList: [],//英文背景图
    // 麦麦商城新增
    envelops: [],
    enEnvelops: [],
    penImgList: [],
    enPenImgList: [],
  },
  extProperties: {
    coverFlag: 0,//0不需要预设封面,1需要预设封面
    customCover: 0,//0不需要自定义封面,1可以自定义封面
  },
  beginTime: null, //活动开始时间
  endTime: null, //活动结束时间
  activityId: '',//公共参数-活动id，新增时为空,主题活动类型activityType为3
  activityType: 3, //公共参数-活动类型 1:拍卖 3:主题
  name: '', // 活动名称
  nameEn: '',// 活动名称英文
  ruleText: '', //规则描述-适用:拍卖、主题
  ruleTextEn: '',//规则描述-适用:拍卖、主题
  dateRange: [],
  backgroundImgList: [],//背景图，支持多个
  enBackgroundImgList: [],//英文背景图
  penImgList: [], //钢笔图，多个
  enPenImgList: [], //钢笔图，多个
  coverImgList: [],//封面，支持多个
  enCoverImgList: [],//英文封面，
  sortNo: 1 //排序字段
}
const mapStateToProps = (state: any) => {
  return {
    executeAction: state.activity.executeAction,
    currentStep: state.activity.currentStep,
    rewardDependedFields: state.activity.rewardDependedFields,
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  resetExecuteAction: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_EXECUTE_ACTION,
    payload
  }),
  updateActivityRewardDependedFields: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_REWARD_DEPENDED_FIELDS_UPDATE,
    payload
  })
});
// @ts-ignore
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ STEP, currentStep, onActionCompleted, executeAction, rewardDependedFields, resetExecuteAction, updateActivityRewardDependedFields, history }: any) => {
  const { activityId, isShow }: any = useParams();
  const [themeDetail, setThemeDetail]: any = useState(JSON.parse(JSON.stringify(initialThemeDetail)));
  const [isNew, setIsNew]: any = useState(false);
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const [canOnlyView, setCanOnlyView] = useState(false);
  const [canEdit, setCanEdit]: any = useState(true);
  const [coverFlag, setCoverFlag] = useState(true);
  const [customCover, setCustomCover] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [crowdVisible, setCrowdVisible] = useState(false);
  const [crowdInfo, setCrowdInfo]: any = useState([]);
  const [themeType, setThemeType]: any = useState()
  useEffect(() => {
    return () => {
      setThemeDetail({ ...initialThemeDetail });
    }
  }, []);

  useEffect(() => {
    if (isShow === 'isShow') {
      setCanOnlyView(true);
    } else {
      setCanOnlyView(false);
    }
  }, [rewardDependedFields.state]);

  useEffect(() => {
    if (activityId) {
      setCanEdit(false);
      (async () => {
        const { data: basicInfo } = await apis.getActivityService().step1Detail({ activityId })
        if (basicInfo) {
          let toUpdatedActivityDetail: any = {};
          toUpdatedActivityDetail = { ...basicInfo };
          // if (basicInfo.themeInfo) {
          //   toUpdatedActivityDetail.themeInfo = { ...basicInfo.themeInfo };
          // }
          if (basicInfo.beginTime && basicInfo.endTime) {
            const dateFormat = 'YYYY-MM-DD HH:mm:ss';
            toUpdatedActivityDetail.dateRange = [moment(basicInfo.beginTime, dateFormat), moment(basicInfo.endTime, dateFormat)];
          }
          let basicImagesArr: any = []
          if (basicInfo?.themeInfo?.backgroundImgList.length) {
            basicInfo.themeInfo.backgroundImgList?.forEach((item: any) => {
              basicImagesArr.push({
                obj: item
              })
            });
          }
          let basicImagesArr_2: any = []
          if (basicInfo?.themeInfo?.penImgList?.length) {
            basicInfo?.themeInfo?.penImgList?.forEach((item: any) => {
              basicImagesArr_2.push({
                obj: item
              })
            });
          }
          toUpdatedActivityDetail.themeInfo.giftNotifyFlag = 1;

          //人员标签
          if (basicInfo.crmTagList?.length > 0) {
            setCrowdInfo(basicInfo.crmTagList)
          } else {
            setCrowdInfo([])
          }

          toUpdatedActivityDetail.backgroundImgList = basicImagesArr;
          toUpdatedActivityDetail.penImgList = basicImagesArr_2;
          let basicImagesArr2: any = []
          if (basicInfo?.themeInfo?.coverImgList.length) {
            basicInfo.themeInfo.coverImgList?.forEach((item: any) => {
              basicImagesArr2.push({
                obj: item
              })
            });
          }
          toUpdatedActivityDetail.coverImgList = basicImagesArr2;

          let basicImagesArr3: any = []
          if (basicInfo?.themeInfo?.enBackgroundImgList.length) {
            basicInfo.themeInfo.enBackgroundImgList?.forEach((item: any) => {
              basicImagesArr3.push({
                obj: item
              })
            });
          }
          toUpdatedActivityDetail.enBackgroundImgList = basicImagesArr3;

          let basicImagesArr5: any = []
          if (basicInfo?.themeInfo?.enPenImgList?.length) {
            basicInfo?.themeInfo?.enPenImgList?.forEach((item: any) => {
              basicImagesArr5.push({
                obj: item
              })
            });
          }
          toUpdatedActivityDetail.enPenImgList = basicImagesArr5;

          let basicImagesArr4: any = []
          if (basicInfo?.themeInfo?.enCoverImgList.length) {
            basicInfo.themeInfo.enCoverImgList?.forEach((item: any) => {
              basicImagesArr4.push({
                obj: item
              })
            });
          }
          toUpdatedActivityDetail.enCoverImgList = basicImagesArr4;
          if (basicInfo.themeInfo) {
            setCustomCover(!!(basicInfo.themeInfo?.customCover === 1))
            setThemeType(basicInfo?.themeInfo?.userScene || '1')
          }
          setThemeDetail(toUpdatedActivityDetail);
        } else {
          setIsNew(true);
        }
      })();
    } else {
      setIsNew(true);
    }
  }, [activityId]);

  useEffect(() => {
    const themeDetailInfo: any = themeDetail;
    if (themeDetailInfo.activityId) {
      if (themeDetailInfo.endTime) {
        updateActivityRewardDependedFields({
          endTime: themeDetailInfo.endTime,
          state: themeDetailInfo.status,
          activityType: themeDetailInfo.activityType,
          activityId: themeDetailInfo.activityId
        });
      }
    }
    form.resetFields(Object.keys(themeDetail));
  }, [themeDetail]);

  useEffect(() => {
    if (executeAction && currentStep === STEP) {
      const activityType = form.getFieldValue('activityType');
      resetExecuteAction(false);
      if (!canOnlyView) {
        if (isNew) {
          if (!activityType) {
            form.submit();
          } else {
            setIsModalVisible(true)
          }
        } else {
          form.submit();
        }
      } else {
        onActionCompleted({
          isSaved: true,
          activityId: activityId,
          canOnlyView: canOnlyView
        });
      }
    }
  }, [executeAction])

  const updataMerchantDetail = (themeDetail: any) => {
    setThemeDetail({ ...themeDetail });
  }

  const customCoverChange = (e: { target: { checked: boolean } }) => {
    setCustomCover(e.target.checked)
  }

  const onChangeUserScene = (e: any) => {
    //先禁掉，对业务没影响，影响一些默认隐藏的字段属性，比如瀑布流图片组件的类型判断
    // let _userScene = e.target.value;
    // if (_userScene === '2' && themeDetail.themeInfo.transferFlag === 0) { //当亲情送主题时，主题中转页需要选择是“支持”
    //   let themeInfo = form.getFieldsValue(themeDetail).themeInfo;
    //   themeInfo.transferFlag = 1;
    //   form.setFieldsValue({
    //     themeInfo: themeInfo
    //   });
    //   themeDetail.themeInfo = themeInfo;
    //   setThemeDetail({ ...themeDetail });
    // }
    setThemeType(e.target.value)
  }

  const handleOk = () => {
    setIsModalVisible(false)
    form.submit();
  }

  const openTagSelector = () => {
    setCrowdVisible(true)
  }

  const closeTag = (index: any) => {
    let arr = JSON.parse(JSON.stringify(crowdInfo));
    arr.splice(index, 1)
    setCrowdInfo(arr)
  }

  return (
    <div className={currentStep === STEP ? 'theme-info' : 'hide'}>
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
        initialValues={themeDetail}
        scrollToFirstError={true}
        form={form}
        onFinishFailed={(values) => {
          onActionCompleted(false);
        }}
        onValuesChange={(changeValues: any, values: any) => {
          const keysToUpdateActivityDetail: any = ['transferFlag', 'customBase', 'rewardFlag', 'userScene'];
          keysToUpdateActivityDetail.map((key: string) => {
            if (changeValues?.themeInfo?.[key] !== undefined) {
              if (key === 'rewardFlag') {
                values.themeInfo.rewardWordList = [''];
                values.themeInfo.rewardImg = '';
                values.themeInfo.enRewardWordList = [];
                values.themeInfo.enRewardImg = '';
              }
              if (key === 'transferFlag') {
                values.themeInfo.transferImg = '';
                values.themeInfo.transSecond = '';
                values.themeInfo.enTransferImg = '';
              }
              if (key === 'customBase') {
                values.themeInfo.customBaseImgList = [];
                values.themeInfo.enCustomBaseImgList = [];
              }
              if(key == 'userScene') {
                values.themeInfo.envelops = [];
                values.themeInfo.enEnvelops = [];
              }
              if(key === 'userScene' && changeValues?.themeInfo?.userScene == '4') {
                values.themeInfo.penImgList = [];
                values.themeInfo.enPenImgList = [];
                values.penImgList = [];
                values.enPenImgList = [];
              }
              setThemeDetail({ ...values });
            }
          })
        }}
        onFinish={(values) => {
          if (!values.coverImgList?.length && themeType !== '4' && themeType !== '1') {
            message.error('请上传预设封面图')
            return
          }
          // 麦麦商城主题提交验证
          if(themeType == '4') {
            if(!values?.backgroundImgList?.length) {
              message.error('请上传中文版主题背景图')
              return
            }
            if(!values?.penImgList?.length) {
              message.error('请上传中文版钢笔图')
              return
            }
            if(!values?.themeInfo?.envelops){
              message.error('请至少添加一套主题信纸信息')
              return
            }
          }

          if(themeType == '1') {
            if(!values?.backgroundImgList?.length) {
              message.error('请上传中文版信封图')
              return
            }
            if(!values?.themeInfo?.envelops || values?.themeInfo?.envelops?.length < 1){
              message.error('请至少添加1套卡面和赠言信息')
              return
            }
          }

          (async function () {
            if (values.dateRange) {
              if (values.dateRange[0]) values.beginTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
              if (values.dateRange[1]) values.endTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
            }
            //submitParams.
            values.themeInfo.coverFlag = coverFlag ? 1 : 0;
            values.themeInfo.customCover = customCover ? 1 : 0;

            //人员标签
            values.crmTagList = crowdInfo;

            let _images: any = [], toUpdatedActivityDetail: any = {};
            toUpdatedActivityDetail = values;
            if (values.backgroundImgList?.length) {
              values.backgroundImgList.forEach((item: any, index: any) => {
                item.obj.seq = index + 1
                _images.push(item.obj)
              })
            }
            toUpdatedActivityDetail.backgroundImgList = values.backgroundImgList;
            toUpdatedActivityDetail.themeInfo.backgroundImgList = _images;

            let _imagesEn: any = [];
            if (values.enBackgroundImgList?.length) {
              values.enBackgroundImgList.forEach((item: any, index: any) => {
                item.obj.seq = index + 1
                _imagesEn.push(item.obj)
              })
            }
            toUpdatedActivityDetail.enBackgroundImgList = values.enBackgroundImgList;
            toUpdatedActivityDetail.themeInfo.enBackgroundImgList = _imagesEn;

            if(themeType == '4') {
              // 设置钢笔图
              let _images2: any = []
              if (values.penImgList?.length) {
                values.penImgList.forEach((item: any, index: any) => {
                  item.obj.seq = index + 1
                  _images2.push(item.obj)
                })
              }
              toUpdatedActivityDetail.themeInfo.penImgList = _images2;

              let _imagesEn2: any = [];
              if (values.enPenImgList?.length) {
                values.enPenImgList.forEach((item: any, index: any) => {
                  item.obj.seq = index + 1
                  _imagesEn2.push(item.obj)
                })
              }
              toUpdatedActivityDetail.themeInfo.enPenImgList = _imagesEn2;

              // 设置信封数据
              toUpdatedActivityDetail.themeInfo.envelops = values?.themeInfo?.envelops;
              toUpdatedActivityDetail.themeInfo.enEnvelops = values?.themeInfo?.enEnvelops;
            }


            let _images1: any = [];
            if (values.coverImgList?.length) {
              values.coverImgList.forEach((item: any, index: any) => {
                item.obj.seq = index + 1
                _images1.push(item.obj)
              })
            }
            toUpdatedActivityDetail.coverImgList = values.coverImgList;
            toUpdatedActivityDetail.themeInfo.coverImgList = _images1;

            let _imagesEn1: any = [];
            if (values?.enCoverImgList?.length) {
              values.enCoverImgList.forEach((item: any, index: any) => {
                item.obj.seq = index + 1
                _imagesEn1.push(item.obj)
              })
            }
            toUpdatedActivityDetail.enCoverImgList = values.enCoverImgList;
            toUpdatedActivityDetail.themeInfo.enCoverImgList = _imagesEn1;
            setThemeDetail(toUpdatedActivityDetail)
            const resp = await apis.getActivityService().createStep1(toUpdatedActivityDetail);
            if (!resp.success) {
              onActionCompleted(false);
              message.error(resp.message);
            } else {
              setIsNew(false);
              let _userScene = toUpdatedActivityDetail.themeInfo.userScene;
              if (_userScene === '2' || _userScene === '3' || _userScene === '4') {
                history.push('/ecs/activities');
              } else {
                let obj = { ...toUpdatedActivityDetail };
                if (values.dateRange) {
                  obj.dateRange = values.dateRange;
                }
                setThemeDetail(obj);
                onActionCompleted({
                  isSaved: true,
                  activityId: resp.data
                });
                message.success('主题信息保存成功');
              }
            }
          })();
        }}
      >
        <Row>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header">新建主题</div></Col></Row>
            <Row className="form-block">
              <Col span={12}>
                <Form.Item style={{ display: 'none' }} hidden={true} name='activityId'>
                  <Input />
                </Form.Item>
                <Form.Item name={['themeInfo', 'userScene']} label={$t('主题露出')} rules={[{ required: true, message: '请选择当前主题属于哪类业务' }]}>
                  <Radio.Group onChange={onChangeUserScene} disabled={!canEdit}>
                    <Radio value={'1'} disabled={canOnlyView}>
                      麦有礼主题列表
                    </Radio>
                    <Radio value={'2'} disabled={canOnlyView}>
                      点餐业务(不需要关联产品)
                    </Radio>
                    <Radio value={'3'} disabled={canOnlyView}>
                      红包业务(不需要关联产品)
                    </Radio>
                    <Radio value={'4'} disabled={canOnlyView}>
                      麦麦商城主题(不需要关联产品)
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={32} className="form-block">
              <Col className="gutter-row" span={6}>
                <Form.Item label={$t('主题时间')} name='dateRange'
                  rules={[{ required: true }]}
                >
                  <RangePicker
                    style={{ width: '100%' }}
                    disabled={canOnlyView}
                    picker="date"
                    showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                    disabledDate={(current: any) => {
                      return current && current < moment().startOf('day');
                    }}
                  />
                </Form.Item>
              </Col>
              <Col className="gutter-row" span={6} hidden={themeType == '4'}>
                <Form.Item label={$t('排序字段')} name='sortNo'
                  rules={[{ required: true }]}>
                  <InputNumber disabled={canOnlyView} style={{ width: '100%' }} placeholder="限正整数" min={1} maxLength={6}
                    formatter={(value: any) => sanitizeToInteger(value)}
                    parser={value => sanitizeToInteger(value) || ''}
                  />
                </Form.Item>
              </Col>
              {themeDetail.themeInfo.userScene === '1' && <Col className="gutter-row" span={6}>
                <Form.Item label={$t('限定人群标签')} style={{ position: 'relative' }}>
                  {!canOnlyView && <a style={{ marginBottom: '8px', display: 'block', position: 'absolute', left: '90px', top: '-26px' }} onClick={openTagSelector}>点击选择限定会员标签</a>}
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
              </Col>}
            </Row>
            <Row gutter={32} className="form-block">
              <Col span={6}>
                <div className="panel-item">
                  <div className="lange">中文版</div>
                  <Form.Item label={$t('主题名称')} name='name' extra='用于对客呈现，建议字数控制在9字以内'
                    rules={[{ type: 'string', required: true }]}
                  >
                    <Input maxLength={9} disabled={canOnlyView} />
                  </Form.Item>
                  <Form.Item style={{ display: 'none' }} hidden={true} name={'activityType'} >
                    <Input />
                  </Form.Item>
                  <Form.Item label={$t(themeType == '1' ? '信纸' : '主题背景图')} required={themeType == '4' || themeType == '1'}>
                    <BackgroundImagesList
                      maxLength={1}
                      form={form}
                      disabled={canOnlyView}
                      basicImages={themeDetail.backgroundImgList}
                      field="backgroundImgList"
                      refreshMerchantDetail={(data: any) => {
                        let _themeDetail = form.getFieldsValue(themeDetail);
                        _themeDetail.backgroundImgList = data;
                        //updataMerchantDetail(_themeDetail);
                      }}
                    />
                  </Form.Item>
                  {themeType == '4' && <Form.Item label={$t('钢笔')} required={true}>
                    <PenImagesList
                        maxLength={1}
                        form={form}
                        disabled={canOnlyView}
                        basicImages={themeDetail?.themeInfo?.penImgList}
                        field="penImgList"
                        refreshMerchantDetail={(data: any) => {
                          let _themeDetail = form.getFieldsValue(themeDetail);
                          _themeDetail.penImgList = data;
                          //updataMerchantDetail(_themeDetail);
                        }}
                      />
                  </Form.Item>}
                  {themeType == '4' && <Form.Item label={$t('主题信纸、封面和赠言（为保证前台效果，请至少添加5套，赠言限制22字）')} required={true}>
                    <LetterList 
                      form={form}
                      field={['themeInfo', 'envelops']}
                      style="envelops"
                      disabled={canOnlyView}
                    />
                  </Form.Item>}
                  {themeType == '1' && <Form.Item label={$t('卡面和赠言（为保证前台效果，请至少添加4套，赠言限制27字）')} required={true}>
                    <LetterList 
                      form={form}
                      field={['themeInfo', 'envelops']}
                      style="cardFaces"
                      disabled={canOnlyView}
                    />
                  </Form.Item>}
                  {themeType !== '4' && themeType !== '1' && <Form.Item label={$t('封面图')}>
                    <Form.Item extra='勾选后对客用户可查看并选择预设的封面图'>
                      <Checkbox checked={coverFlag} disabled={true}>
                        预设封面图
                      </Checkbox>
                    </Form.Item>
                    <CoverImgList
                      maxLength={50}
                      form={form}
                      disabled={canOnlyView}
                      basicImages={themeDetail.coverImgList}
                      field="coverImgList"
                      refreshMerchantDetail={(data: any) => {
                        let _themeDetail = form.getFieldsValue(themeDetail);
                        _themeDetail.coverImgList = data;
                        //updataMerchantDetail(_themeDetail);
                      }}
                    />
                    <Form.Item extra='勾选自定义封面图则说明支持对客自定义封面'>
                      <Checkbox checked={customCover} disabled={canOnlyView} onChange={customCoverChange}>
                        自定义封面图
                      </Checkbox>
                    </Form.Item>

                    {customCover && <Form.Item label='自定义底图' name={['themeInfo', 'customBase']}>
                      <Radio.Group disabled={canOnlyView}>
                        <Radio value={0}>不使用预设封面图</Radio>
                        <Radio value={1}>使用预设封面图</Radio>
                      </Radio.Group>
                    </Form.Item>}
                    {customCover && themeDetail.themeInfo.customBase === 0 &&
                      <>
                        <Form.Item label='自定义底图' className="composite-required-field"></Form.Item>
                        <Form.Item name={['themeInfo', 'customBaseImgList']} noStyle rules={[{ required: true, message: '请上传自定义封面' }]}>
                          <PictureWall maxLength={20} disabled={canOnlyView} />
                        </Form.Item>
                      </>}
                    {customCover &&
                      <><Form.Item label='自定义素材' className="composite-required-field"></Form.Item>
                        <Form.Item name={['themeInfo', 'itemImgList']} rules={[{ required: true, message: '请上传自定义素材' }]}>
                          <PictureWall maxLength={20} disabled={canOnlyView} />
                        </Form.Item>
                      </>}
                  </Form.Item>}

                  {themeType !== '4' && themeType !== '1' && <Form.Item label="预设赠言" extra="文案需有较强吸引力，当维护多条文案时，每次分享会随机展示某一条" className="composite-required-field" >
                    <Form.List name={['themeInfo', 'giftWordList']}>
                      {(fields, { add, remove }) => (
                        <>
                          <Button onClick={() => add()} icon={<IconFont type="icon-tianjia" />} disabled={canOnlyView}>添加</Button>
                          {fields.map((field: any) => {
                            return <div className="repost-msg-row" key={field.key} >
                              <Form.Item name={[field.name, 'content']} rules={[{ required: true, message: '请输入文案' }]} >
                                <Input maxLength={50} disabled={canOnlyView} />
                              </Form.Item>
                              {(fields.length > 1 && !canOnlyView) ? (
                                <IconFont type="icon-qingchu1" className="dynamic-delete-button" onClick={() => remove(field.name)} />
                              ) : null}
                            </div>
                          })}
                        </>
                      )}
                    </Form.List>
                  </Form.Item>}
                  {themeType !== '4' && themeType !== '1' && <Form.Item name={['themeInfo', 'giftNotifyFlag']} label={$t('赠送通知分享')}>
                    <Radio.Group>
                      <Radio value={1} disabled={true}>
                        支持
                      </Radio>
                      <Radio value={0} disabled={true}>
                        不支持
                      </Radio>
                    </Radio.Group>
                  </Form.Item>}
                  <Form.Item label="分享文案" extra="文案需有较强吸引力，当维护多条文案时，每次分享会随机展示某一条" rules={[{ required: true }]} className="composite-required-field">
                    <Form.List name={['themeInfo', 'shareWordList']}>
                      {(fields, { add, remove }) => (
                        <>
                          <Button type="dashed" onClick={() => add()} icon={<IconFont type="icon-tianjia" />} disabled={canOnlyView}>添加</Button>
                          {fields.map((field: any) => {
                            return <div className="repost-msg-row" key={field.key} >
                              <Form.Item name={[field.name, 'content']} rules={[{ required: true, message: '请输入文案' }]} >
                                <Input maxLength={50} disabled={canOnlyView} />
                              </Form.Item>
                              {(fields.length > 1 && !canOnlyView) ? (
                                <IconFont type="icon-qingchu1" className="dynamic-delete-button" onClick={() => remove(field.name)} />
                              ) : null}
                            </div>
                          })}
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                  {themeType !== '4' && <Form.Item label={themeType == '1' ? '商品详情页分享图' : "分享图"} name={['themeInfo', 'shareImg']} rules={[{ required: true, message: '请上传分享图' }]}>
                    <AurumImageField disabled={canOnlyView} />
                  </Form.Item>}

                  {themeType !== '4' && themeType !== '1' && <Form.Item name={['themeInfo', 'rewardFlag']} label={$t('赠送回执分享')}>
                    <Radio.Group disabled={canOnlyView}>
                      <Radio value={1}>
                        支持
                      </Radio>
                      <Radio value={0}>
                        不支持
                      </Radio>
                    </Radio.Group>
                  </Form.Item>}
                  {themeType !== '1' && themeDetail.themeInfo.rewardFlag === 1 &&
                    <>
                      <Form.Item label="分享文案" extra="文案需有较强吸引力，当维护多条文案时，每次分享会随机展示某一条" rules={[{ required: true }]} className="composite-required-field">
                        <Form.List name={['themeInfo', 'rewardWordList']}>
                          {(fields, { add, remove }) => (
                            <>
                              <Button type="dashed" onClick={() => add()} icon={<IconFont type="icon-tianjia" />} disabled={canOnlyView}>添加</Button>
                              {fields.map(field => {
                                return <div className="repost-msg-row" key={field.key} >
                                  <Form.Item name={[field.name, 'content']} rules={[{ required: true, message: '请输入文案' }]} >
                                    <Input maxLength={50} disabled={canOnlyView} />
                                  </Form.Item>
                                  {(fields.length > 1 && !canOnlyView) ? (
                                    <IconFont type="icon-qingchu1" className="dynamic-delete-button" onClick={() => remove(field.name)} />
                                  ) : null}
                                </div>
                              })}
                            </>
                          )}
                        </Form.List>
                      </Form.Item>
                      <Form.Item label="分享图" name={['themeInfo', 'rewardImg']} rules={[{ required: true, message: '请上传分享图' }]}>
                        <AurumImageField disabled={canOnlyView} />
                      </Form.Item>
                    </>}
                    {themeType !== '4' && themeType !== '1' && <Form.Item className="theme-transfer" label={$t('主题中转页')} style={{ marginBottom: 0 }}>
                    <Form.Item name={['themeInfo', 'transferFlag']}>
                      <Radio.Group disabled={canOnlyView}>
                        <Radio value={1}>支持</Radio>
                        <Radio value={0}>不支持</Radio>
                      </Radio.Group>
                    </Form.Item>
                    {themeDetail.themeInfo.transferFlag === 1 &&
                      <>
                        <Form.Item name={['themeInfo', 'transferImg']} rules={[{ required: true, message: '请上传中转页图片' }]}>
                          <AurumImageField disabled={canOnlyView} />
                        </Form.Item>
                        <Form.Item name={['themeInfo', 'transSecond']} extra='中转页时长(秒)' rules={[{ required: true, message: '请输入中转页时长(秒)' }]}>
                          <InputNumber placeholder="请填写正整数" min={1} max={300} maxLength={3}
                            disabled={canOnlyView}
                            formatter={(value: any) => sanitizeToInteger(value)}
                            parser={value => sanitizeToInteger(value) || ''}
                          />
                        </Form.Item>
                      </>
                    }
                  </Form.Item>}
                  {themeType !== '4' && themeType !== '1' && <Form.Item label={$t('规则描述')} name='ruleText'>
                    <Editor detail={themeDetail.ruleText} placeholder="请填写规则描述" disabled={canOnlyView} />
                  </Form.Item>}
                </div>
              </Col>
              <Col span={6}>
                <div className="panel-item">
                  <div className="lange">英文版</div>
                  <Form.Item label={$t('主题名称')} name={'nameEn'} extra='用于对客呈现，建议字数控制在18字符以内' >
                    <Input maxLength={18} disabled={canOnlyView} />
                  </Form.Item>
                  <Form.Item label={$t(themeType == '1' ? '信纸' : '主题背景图')}>
                    <BackgroundImagesList
                      maxLength={1}
                      style="en"
                      form={form}
                      disabled={canOnlyView}
                      basicImages={themeDetail.enBackgroundImgList}
                      field="enBackgroundImgList"
                      refreshMerchantDetail={(data: any) => {
                        let _themeDetail = form.getFieldsValue(themeDetail);
                        _themeDetail.enBackgroundImgList = data;
                        //updataMerchantDetail(_themeDetail);
                      }}
                    />
                  </Form.Item>
                  {themeType == '4' && <Form.Item label={$t('钢笔')}>
                    <PenImagesList
                        maxLength={1}
                        style="en"
                        form={form}
                        disabled={canOnlyView}
                        basicImages={themeDetail.themeInfo?.enPenImgList}
                        field="enPenImgList"
                        refreshMerchantDetail={(data: any) => {
                          let _themeDetail = form.getFieldsValue(themeDetail);
                          _themeDetail.enPenImgList = data;
                          //updataMerchantDetail(_themeDetail);
                        }}
                      />
                  </Form.Item>}
                  {themeType == '4' && <Form.Item label={$t('主题信纸、封面和赠言（赠言限制22字）')}>
                    <LetterList 
                      form={form}
                      // field="enEnvelops"
                      field={['themeInfo', 'enEnvelops']}
                      style="enEnvelops"
                      disabled={canOnlyView}
                    />
                  </Form.Item>}
                  {themeType == '1' && <Form.Item label={$t('卡面和赠言')}>
                    <LetterList 
                      form={form}
                      field={['themeInfo', 'enEnvelops']}
                      style="enCardFaces"
                      disabled={canOnlyView}
                    />
                  </Form.Item>}
                  {themeType !== '4' && themeType !== '1' && <Form.Item label={$t('封面图')}>
                    <Form.Item extra='勾选后对客用户可查看并选择预设的封面图'>
                      <Checkbox checked={coverFlag} disabled={true}>
                        预设封面图
                      </Checkbox>
                    </Form.Item>
                    <CoverImgList
                      maxLength={50}
                      style="en"
                      form={form}
                      disabled={canOnlyView}
                      basicImages={themeDetail.enCoverImgList}
                      field="enCoverImgList"
                      refreshMerchantDetail={(data: any) => {
                        let _themeDetail = form.getFieldsValue(themeDetail);
                        _themeDetail.enCoverImgList = data;
                        //updataMerchantDetail(_themeDetail);
                      }}
                    />
                    <Form.Item extra='勾选自定义封面图则说明支持对客自定义封面'>
                      <Checkbox checked={customCover} disabled={true}>
                        自定义封面图
                      </Checkbox>
                    </Form.Item>
                    {customCover && <Form.Item label='自定义底图' name={['themeInfo', 'customBase']}>
                      <Radio.Group disabled>
                        <Radio value={0}>不使用预设封面图</Radio>
                        <Radio value={1}>使用预设封面图</Radio>
                      </Radio.Group>
                    </Form.Item>}
                    {customCover && themeDetail.themeInfo.customBase === 0 &&
                      <><Form.Item label='自定义底图'></Form.Item>
                        <Form.Item noStyle name={['themeInfo', 'enCustomBaseImgList']}>
                          <PictureWall maxLength={20} disabled={canOnlyView} />
                        </Form.Item>
                      </>}
                    {customCover &&
                      <>
                        <Form.Item label='自定义素材'></Form.Item>
                        <Form.Item name={['themeInfo', 'enItemImgList']}>
                          <PictureWall maxLength={20} disabled={canOnlyView} />
                        </Form.Item>
                      </>}
                  </Form.Item>}

                  {themeType !== '4' && themeType !== '1' && <Form.Item label="预设赠言" extra="文案需有较强吸引力，当维护多条文案时，每次分享会随机展示某一条">
                    <Form.List name={['themeInfo', 'enGiftWordList']}>
                      {(fields, { add, remove }) => (
                        <>
                          <Button type="dashed" onClick={() => add()} icon={<IconFont type="icon-tianjia" />} disabled={canOnlyView}>添加</Button>
                          {fields.map(field => {
                            return <div className="repost-msg-row" key={field.key} >
                              <Form.Item name={[field.name, 'content']} rules={[{ required: true, message: '请输入文案' }]} >
                                <Input maxLength={50} disabled={canOnlyView} />
                              </Form.Item>
                              {(fields.length > 0 && !canOnlyView) ? (
                                <IconFont type="icon-qingchu1" className="dynamic-delete-button" onClick={() => remove(field.name)} />
                              ) : null}
                            </div>
                          })}
                        </>
                      )}
                    </Form.List>
                  </Form.Item>}
                  {themeType !== '4' && themeType !== '1' && <Form.Item name={['themeInfo', 'giftNotifyFlag']} label={$t('赠送通知分享')}>
                    <Radio.Group disabled={canOnlyView}>
                      <Radio value={1} disabled={true}>
                        支持
                      </Radio>
                      <Radio value={0} disabled={true}>
                        不支持
                      </Radio>
                    </Radio.Group>
                  </Form.Item>}
                  <Form.Item label="分享文案" extra="文案需有较强吸引力，当维护多条文案时，每次分享会随机展示某一条">
                    <Form.List name={['themeInfo', 'enShareWordList']}>
                      {(fields, { add, remove }) => (
                        <>
                          <Button type="dashed" onClick={() => add()} icon={<IconFont type="icon-tianjia" />} disabled={canOnlyView}>添加</Button>
                          {fields.map(field => {
                            return <div className="repost-msg-row" key={field.key} >
                              <Form.Item name={[field.name, 'content']} rules={[{ required: true, message: '请输入文案' }]} >
                                <Input maxLength={50} disabled={canOnlyView} />
                              </Form.Item>
                              {(fields.length > 0 && !canOnlyView) ? (
                                <IconFont type="icon-qingchu1" className="dynamic-delete-button" onClick={() => remove(field.name)} />
                              ) : null}
                            </div>
                          })}
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                  {themeType !== '4' && <Form.Item label={themeType == '1' ? '商品详情页分享图' : "分享图"} name={['themeInfo', 'enShareImg']}>
                    <AurumImageField disabled={canOnlyView} />
                  </Form.Item>}

                  {themeType !== '4' && themeType !== '1' && <Form.Item name={['themeInfo', 'rewardFlag']} label={$t('赠送回执分享')}>
                    <Radio.Group>
                      <Radio value={1} disabled={true}>
                        支持
                      </Radio>
                      <Radio value={0} disabled={true}>
                        不支持
                      </Radio>
                    </Radio.Group>
                  </Form.Item>}
                  {themeType !== '1' && themeDetail.themeInfo.rewardFlag === 1 &&
                    <>
                      <Form.Item label="分享文案" extra="文案需有较强吸引力，当维护多条文案时，每次分享会随机展示某一条">
                        <Form.List name={['themeInfo', 'enRewardWordList']}>
                          {(fields, { add, remove }) => (
                            <>
                              <Button type="dashed" onClick={() => add()} icon={<IconFont type="icon-tianjia" />} disabled={canOnlyView}>添加</Button>
                              {fields.map(field => {
                                return <div className="repost-msg-row" key={field.key} >
                                  <Form.Item name={[field.name, 'content']} rules={[{ required: true, message: '请输入文案' }]} >
                                    <Input maxLength={50} disabled={canOnlyView} />
                                  </Form.Item>
                                  {(fields.length > 0 && !canOnlyView) ? (
                                    <IconFont type="icon-qingchu1" className="dynamic-delete-button" onClick={() => remove(field.name)} />
                                  ) : null}
                                </div>
                              })}
                            </>
                          )}
                        </Form.List>
                      </Form.Item>
                      <Form.Item label="分享图" name={['themeInfo', 'enRewardImg']}>
                        <AurumImageField disabled={canOnlyView} />
                      </Form.Item>
                    </>}
                    {themeType !== '4' && themeType !== '1' && <Form.Item className="theme-transfer" label={$t('主题中转页')} style={{ marginBottom: 0 }}>
                    <Form.Item name={['themeInfo', 'transferFlag']}>
                      <Radio.Group>
                        <Radio value={1} disabled={true}>支持</Radio>
                        <Radio value={0} disabled={true}>不支持</Radio>
                      </Radio.Group>
                    </Form.Item>
                    {themeDetail.themeInfo.transferFlag === 1 &&
                      <>
                        <Form.Item noStyle name={['themeInfo', 'enTransferImg']}>
                          <AurumImageField disabled={canOnlyView} />
                        </Form.Item>
                        <Form.Item name={['themeInfo', 'transSecond']} extra='中转页时长(秒)'>
                          <InputNumber placeholder="请填写正整数" min={1} max={300} maxLength={3}
                            disabled={true}
                            formatter={(value: any) => sanitizeToInteger(value)}
                            parser={value => sanitizeToInteger(value) || ''}
                          />
                        </Form.Item>
                      </>
                    }

                  </Form.Item>}
                  {themeType !== '4' && themeType !== '1' && <Form.Item label={$t('规则描述')} name='ruleTextEn'>
                    <Editor detail={themeDetail.ruleTextEn} placeholder="请填写规则描述" disabled={canOnlyView} />
                  </Form.Item>}
                </div>
              </Col>
            </Row>

          </Col>
        </Row>
      </Form>

      <Modal title='确认活动类型为主题吗？' visible={isModalVisible} onOk={handleOk} onCancel={() => { setIsModalVisible(false) }}>
        <div>您即将保存本页面信息，保存后不可更改活动类型。</div>
      </Modal>

    </div >
  )
}));