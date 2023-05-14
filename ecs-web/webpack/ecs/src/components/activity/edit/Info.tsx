import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import moment from 'moment';
import { withRouter, useParams } from 'react-router-dom';
import { Form, Input, DatePicker, Tooltip, Row, Col, message, Select, Modal, Radio, InputNumber, TreeSelect, IconFont, Checkbox, Space } from '@aurum/pfe-ui';
import { IconQuestionCircle } from '@aurum/icons';
import * as apis from '@/common/net/apis_activity';
import * as activityActions from '@/redux/actions/activityActions';
import constants from '@/common/constants';
import Editor from '@/components/Editor';
import TagSelector from '@/components/TagSelector';
// @ts-ignore
import { getAtivityTypeLabel, sanitizeToInteger, getEachOptions, modifyCategoriesData } from '@/common/helper';
const { RangePicker }: any = DatePicker;

const MIN_UNLIMITED_TIMES = 1;
const MAX_LIMITED_TIMES = 9999999;
const actityes = [{
  activityType: 1,
  tit: '拍卖',
  content: '设置维护拍卖的开始时间、结束时间，设定拍卖规则，用户按照拍卖规则进行竞拍。'
}, {
  activityType: 4,
  tit: '赠品',
  content: '买主商品赠送赠品，促进商品的成交转化'
},
{
  activityType: 5,
  tit: '小会员立减',
  content: '主题类派对立减促销活动'
},
]

const initialActivityDetail = {
  basicInfo: { //活动信息
    activityId: '',
    activityType: 1,//活动类型拍卖
    beginTime: null, //活动开始时间
    endTime: null, //活动结束时间
    categoryIds: [],
    mode: 1,//活动形式：1全款; 2保证金
    name: '', // 活动名称
    nameEn: '',// 活动名称英文
    payObjType: 1,//支付单位 1:积分;2:现金
    ruleText: '',//规则描述
    ruleTextEn: '',//规则英文描述
    userCount: -1,//拍卖活动参与用户数：-1不限制
    userTimes: -1,//单用户可参与次数：-1不限制
    userOfferTimes: -1,//单用户出价次数？？？
    rewardInfo: {
      conditionList: [],
      tags: [],
      enTags: [],
      totalStock: '',
      rewardMethod: 1
    },
    partyOffAboveInfo: {
      partyType: [1],
      tags: [],
      enTags: [],
    }
  },
  dateRange: []
};

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
  }),
  updataActivityDetail: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_DETAIL,
    payload
  }),
});

export default connect(mapStateToProps, mapDispatchToProps)((({ STEP, currentStep, onActionCompleted, executeAction, rewardDependedFields, resetExecuteAction, updateActivityRewardDependedFields, updataActivityDetail }: any) => {
  const { activityId, isShow }: any = useParams();

  const [activityDetail, setActivityDetail]: any = useState(JSON.parse(JSON.stringify(initialActivityDetail)));
  const [canEdit, setCanEdit]: any = useState(true);
  const [isNew, setIsNew]: any = useState(false);
  const [canOnlyView, setCanOnlyView]: any = useState(false);
  const [typeItemOptions, setTypeItemOptions]: any = useState([]);
  const [payOptions, setPayOptions]: any = useState([]); //拍卖支付方式
  const [auctionOptions, setAuctionOptions]: any = useState([]); //拍卖方式
  const [form] = Form.useForm();
  const formEl: any = useRef(null);

  const [dates, setDates]: any = useState([]);
  const [hackValue, setHackValue]: any = useState();
  const [value, setValue] = useState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cardId, setCardId] = useState(1)
  const [crowdVisible, setCrowdVisible] = useState(false);
  const [crowdInfo, setCrowdInfo]: any = useState([]);

  const disabledDate = (current: any) => {
    if (!dates || dates.length === 0) {
      return current && current < moment().startOf('day');
    }
    const tooLate = dates[0] && current.diff(dates[0], 'days') > 32;
    const tooEarly = dates[1] && dates[1].diff(current, 'days') > 32;
    return tooEarly || tooLate;
  };

  const onOpenChange = (open: any) => {
    if (open) {
      setHackValue([]);
      setDates([]);
    } else {
      setHackValue(undefined);
    }
  };

  useEffect(() => {
    (async () => {
      let { data: resultObj } = await apis.getActivityService().filter({});
      if (resultObj.activityPayTypes?.length) {
        setPayOptions(getEachOptions(resultObj.activityPayTypes))
      }
      if (resultObj.activityAuctionTypes?.length) {
        setAuctionOptions(getEachOptions(resultObj.activityAuctionTypes))
      }
      if (resultObj.categories?.length) {
        modifyCategoriesData(resultObj.categories);
        setTypeItemOptions(resultObj.categories);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      setActivityDetail(JSON.parse(JSON.stringify(initialActivityDetail)));
      updataActivityDetail(JSON.parse(JSON.stringify(initialActivityDetail)))
    }
  }, []);

  useEffect(() => {
    if (rewardDependedFields.state === constants.activity.STATE_CODE.READY_ONLINE  //待上线
      || rewardDependedFields.state === constants.activity.STATE_CODE.ONLINE || rewardDependedFields.state === constants.activity.STATE_CODE.OFFLINE
    ) {
      setCanEdit(false);
    } else {
      setCanEdit(true);
    }
    if (isShow === 'isShow' || rewardDependedFields.state === constants.activity.STATE_CODE.OVER) {
      setCanOnlyView(true);
    } else {
      setCanOnlyView(false);
    }
  }, [rewardDependedFields.state]);

  useEffect(() => {
    if (activityId) {
      (async () => {
        const { data: basicInfo } = await apis.getActivityService().step1Detail({ activityId })
        if (basicInfo) {
          basicInfo.categoryIds = '虚拟商品';
          const toUpdatedActivityDetail: any = {
            basicInfo
          };

          //活动标签
          if (basicInfo.rewardInfo?.tags) {
            basicInfo.rewardInfo.tags = basicInfo.rewardInfo.tags.join('');
          }
          // 赠品增加英文标签
          if (basicInfo.rewardInfo?.enTags?.length) {
            basicInfo.rewardInfo.enTags = basicInfo.rewardInfo.enTags.join('');
          }
          // 立减活动增加中英文标签
          if (basicInfo.partyOffAboveInfo?.tags) {
            basicInfo.partyOffAboveInfo.tags = basicInfo.partyOffAboveInfo.tags.join('');
          }
          // 赠品增加英文标签
          if (basicInfo.partyOffAboveInfo?.enTags?.length) {
            basicInfo.partyOffAboveInfo.enTags = basicInfo.partyOffAboveInfo.enTags.join('');
          }
          //人员标签
          if (basicInfo.crmTagList?.length > 0) {
            setCrowdInfo(basicInfo.crmTagList)
          } else {
            setCrowdInfo([])
          }

          if (basicInfo.beginTime && basicInfo.endTime) {
            const dateFormat = 'YYYY-MM-DD HH:mm:ss';
            toUpdatedActivityDetail.dateRange = [moment(basicInfo.beginTime, dateFormat), moment(basicInfo.endTime, dateFormat)];
          }
          setActivityDetail(toUpdatedActivityDetail);
          updataActivityDetail(toUpdatedActivityDetail)
        } else {
          setIsNew(true);
        }
      })();
    } else {
      setIsNew(true);
    }
  }, [activityId]);

  useEffect(() => {
    const activityInfo: any = activityDetail.basicInfo;
    if (activityInfo.activityId) {
      if (activityInfo.endTime) {
        updateActivityRewardDependedFields({
          endTime: activityInfo.endTime,
          state: activityInfo.status,
          activityType: activityInfo.activityType,
          activityId: activityInfo.activityId
        });
      }
      setCardId(activityInfo.activityType);
    }
    form.resetFields(Object.keys(activityDetail));
  }, [activityDetail.basicInfo]);

  useEffect(() => {
    if (executeAction && currentStep === STEP) {
      const activityType = cardId;
      resetExecuteAction(false);
      if (!canOnlyView) {
        if (isNew) {
          if (!activityType) {
            form.submit();
          } else {
            setIsModalVisible(true);
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

  const handleOk = () => {
    setIsModalVisible(false)
    form.submit();
  }

  const clickCard = (id: any) => {
    if (id === 999 || activityId) {
      return;
    }
    setCardId(id)
  }

  const openTagSelector = () => {
    setCrowdVisible(true)
  }

  const closeTag = (index: any) => {
    let arr = JSON.parse(JSON.stringify(crowdInfo));
    arr.splice(index, 1)
    setCrowdInfo(arr)
  }

  const isString = (str: any) => {
    return (typeof str == 'string') && str.constructor == String;
  }


  return (
    <div className={currentStep === STEP ? 'edit-info' : 'hide'}>
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
        initialValues={activityDetail}
        scrollToFirstError={true}
        form={form}
        onFinishFailed={(values) => {
          console.log('valuesFailed', values)
          onActionCompleted(false);
        }}
        onFinish={(values) => {
          (async function () {
            if (values.dateRange) {
              if (values.dateRange[0]) values.basicInfo.beginTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
              if (values.dateRange[1]) values.basicInfo.endTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
            }
            values.basicInfo.categoryIds = ["1"]
            values.basicInfo.activityType = cardId;

            if (values.basicInfo?.rewardInfo?.tags) {
              if (isString(values.basicInfo.rewardInfo.tags)) {
                values.basicInfo.rewardInfo.tags = values.basicInfo?.rewardInfo?.tags?.split(',');
              }
            } else {
              //values.basicInfo.rewardInfo.tags = []
            }
            // 赠品增加英文标签
            if (values.basicInfo?.rewardInfo?.enTags) {
              if (isString(values.basicInfo.rewardInfo.enTags)) {
                values.basicInfo.rewardInfo.enTags = values.basicInfo?.rewardInfo?.enTags?.split(',');
              }
            }
            // 立减活动增加中英文标签
            if (values.basicInfo?.partyOffAboveInfo?.tags) {
              if (isString(values.basicInfo.partyOffAboveInfo.tags)) {
                values.basicInfo.partyOffAboveInfo.tags = values.basicInfo?.partyOffAboveInfo?.tags?.split(',');
              }
            }
            if (values.basicInfo?.partyOffAboveInfo?.enTags) {
              if (isString(values.basicInfo.partyOffAboveInfo.enTags)) {
                values.basicInfo.partyOffAboveInfo.enTags = values.basicInfo?.partyOffAboveInfo?.enTags?.split(',');
              }
            }
            values.basicInfo.crmTagList = crowdInfo;
            const resp = await apis.getActivityService().createStep1(values.basicInfo);
            if (!resp.success) {
              onActionCompleted(false);
              message.error(resp.message);
            } else {
              setIsNew(false);
              activityDetail.basicInfo = values.basicInfo;
              if (values.dateRange) {
                activityDetail.dateRange = values.dateRange;
              }
              setActivityDetail({ ...activityDetail });
              updataActivityDetail({ ...activityDetail })
              onActionCompleted({
                isSaved: true,
                activityId: resp.data
              });
              message.success('活动信息保存成功');
            }
          })();
        }}
        onValuesChange={(value) => {
          const keysToUpdateActivityDetail: any = ['userTimes', 'userCount'];
          keysToUpdateActivityDetail.map((key: string) => {
            if (value?.basicInfo?.[key] !== undefined) {
              activityDetail.basicInfo[key] = value.basicInfo[key];
              setActivityDetail({ ...activityDetail });
            }
          })
        }}
      >
        <Row>
          <Col span={12}>
            <Row className="form-block" style={{ paddingTop: '16px' }}>
              <Col span={12}>
                <Form.Item style={{ display: 'none' }} hidden={true} name={['basicInfo', 'activityId']} >
                  <Input />
                </Form.Item>
                <Row gutter={32}>
                  {actityes.map((item, index) => {
                    return <Col key={index} className={cardId == item.activityType ? 'gutter-row style-wrap checked' : 'gutter-row style-wrap'} span={4}>
                      <div className="style-card" onClick={() => { clickCard(item.activityType) }}>
                        {item.tit && <p className="style-card-tit"> {item.tit}</p>}
                        {item.tit && item.content && <p className="style-card-con">{item.content}</p>}
                        {!item.tit && item.content && <p className="style-card-empty">敬请期待...</p>}
                        {cardId == item.activityType && <span className="style-card-arrow">
                          <IconFont type="icon-a-chenggongjiedian3x" style={{ fontSize: '30px', color: '#ffbc0d' }} />
                        </span>}
                      </div>
                    </Col>
                  })}
                </Row>
              </Col>
            </Row>
            <Row>
              <Col span={12}><div className="section-header">基础信息</div></Col>
            </Row>
            <Row className="form-block">
              <Col span={12}>
                <Row gutter={32}>
                  <Col span={4}>
                    <Form.Item label={$t('活动名称')} name={['basicInfo', 'name']} rules={[{ type: 'string', required: true }]} >
                      <Input maxLength={cardId === 5 ? 15 : cardId === 1 ? 5 : 20} placeholder={`请输入活动名称，限${cardId === 5 ? 15 : cardId === 1 ? 5 : 20}个字符`} disabled={canOnlyView} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label={$t('活动英文名称')} name={['basicInfo', 'nameEn']}>
                      <Input maxLength={cardId === 1 ? 10 : 50} placeholder={`请输入活动名称，限${cardId === 1 ? 10 : 50}个字符`} disabled={canOnlyView} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label={$t('活动时间')} name="dateRange" rules={[{ required: true }]} >
                      <RangePicker
                        value={hackValue || value}
                        style={{ width: '100%' }}
                        disabledDate={disabledDate}
                        disabled={canOnlyView || !canEdit}
                        onCalendarChange={(val: any) => setDates(val)}
                        onChange={(val: any) => setValue(val)}
                        onOpenChange={onOpenChange}
                        showTime={{ defaultValue: [moment('00:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss')] }}
                        picker="date"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                {(cardId === 4 || cardId === 5) && <Row>
                  <Col span={12}>
                    <Form.Item label={$t('内部简介(不对客)')} name={['basicInfo', 'innerIntroduction']}>
                      <Input.TextArea maxLength={255} placeholder="请输入内部简介，限255个字符" disabled={canOnlyView} />
                    </Form.Item>
                  </Col>
                </Row>}
                {cardId === 4 && <Row gutter={32}>
                  <Col span={6}>
                    <Form.Item label={$t('活动标签')} name={['basicInfo', 'rewardInfo', 'tags']} rules={[{ required: true }]} >
                      <Input maxLength={9} placeholder="请输入活动标签，限9个字符" disabled={canOnlyView} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label={$t('英文版活动标签')} name={['basicInfo', 'rewardInfo', 'enTags']} >
                      <Input maxLength={20} placeholder="请输入英文版活动标签，限20个字符" disabled={canOnlyView} />
                    </Form.Item>
                  </Col>
                </Row>}
                {cardId === 5 && <Row gutter={32}>
                  <Col span={6}>
                    <Form.Item label={$t('活动标签')} name={['basicInfo', 'partyOffAboveInfo', 'tags']} rules={[{ required: true }]} >
                      <Input maxLength={15} placeholder="请输入活动标签，限15个字符" disabled={canOnlyView} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label={$t('英文版活动标签')} name={['basicInfo', 'partyOffAboveInfo', 'enTags']} >
                      <Input maxLength={30} placeholder="请输入英文版活动标签，限30个字符" disabled={canOnlyView} />
                    </Form.Item>
                  </Col>
                </Row>}
                {cardId === 4 && <Row>
                  <Col span={12}>
                    <Form.Item label={$t('活动简介')} name={['basicInfo', 'introduction']} rules={[{ type: 'string', required: true }]} >
                      <Input.TextArea placeholder="请输入活动简介，限1000个字符" maxLength={1000} disabled={canOnlyView} />
                    </Form.Item>
                  </Col>
                </Row>}
                <Row>
                  <Col span={12}>
                    <Form.Item label={$t('活动规则')} name={['basicInfo', 'ruleText']} rules={[{ type: 'string', required: true }]} >
                      <Editor detail={activityDetail.basicInfo.ruleText} placeholder="请输入活动规则描述，建议不超过2000个字符" disabled={canOnlyView} menus={['bold']} height={200} />
                    </Form.Item>
                  </Col>
                </Row>
                {(cardId === 1 || cardId === 5) && <Row>
                  <Col span={12}>
                    <Form.Item label={$t('活动英文规则')} name={['basicInfo', 'ruleTextEn']}>
                      <Editor detail={activityDetail.basicInfo.ruleTextEn} placeholder="请输入活动规则描述，建议不超过5000个字符" disabled={canOnlyView} menus={['bold']} height={200} />
                    </Form.Item>
                  </Col>
                </Row>}
                {(cardId === 4 || cardId === 5) && <Row><Col className="gutter-row" span={12}>
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
                </Col></Row>}
              </Col>
            </Row>
          </Col>
          <Col></Col>
        </Row>
        {cardId === 1 && <Row><Col span={12}><div className="section-header">活动规则</div></Col></Row>}
        {cardId === 1 && <Row className="form-block">
          <Col span={12}>
            <Row gutter={32}>
              <Col span={4}>
                <Form.Item label={$t('拍卖支付方式')} name={['basicInfo', 'payObjType']} rules={[{ required: true }]} >
                  <Select placeholder={$t('请选择')} disabled={!canEdit || !isNew} options={payOptions} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label={$t('拍卖方式')} name={['basicInfo', 'mode']} rules={[{ required: true }]} >
                  <Select placeholder={$t('请选择')} disabled={!canEdit || !isNew} options={auctionOptions} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label={$t('拍卖商品的类目')} name={['basicInfo', 'categoryIds']} rules={[{ required: true }]} >
                  <TreeSelect
                    disabled={canOnlyView || !canEdit}
                    style={{ width: '100%' }}
                    dropdownStyle={{ maxHeight: 800, overflow: 'auto' }}
                    placeholder={$t('请选择')}
                    showSearch={false}
                    allowClear
                    treeCheckable={true}
                    showCheckedStrategy='SHOW_PARENT'
                    treeData={typeItemOptions} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={32}>
              <Col span={4}>
                <Form.Item className="composite-required-field" label={$t('活动参与用户数')} style={{ marginBottom: 0 }}>
                  <Input.Group compact>
                    <Form.Item name={['basicInfo', 'userCount']} rules={[{ required: true }]} >
                      <Radio.Group disabled={!canEdit}>
                        <Radio value={-1}>不限制</Radio>
                        <Radio value={MIN_UNLIMITED_TIMES} disabled>限制数量</Radio>
                      </Radio.Group>
                    </Form.Item>
                    {activityDetail.basicInfo.userCount === MIN_UNLIMITED_TIMES && <Form.Item name="maxTimesPerSender" rules={[{ type: 'number', required: true, message: '请输入有效的数字' }]} >
                      <InputNumber disabled={!canEdit} placeholder="请输入大于0的正整数" min={MIN_UNLIMITED_TIMES} max={MAX_LIMITED_TIMES} maxLength={7}
                        formatter={(value: any) => sanitizeToInteger(value)}
                        parser={value => sanitizeToInteger(value) || ''}
                      />
                    </Form.Item>}
                  </Input.Group>
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item className="composite-required-field" label={$t('单用户可参与次数')} style={{ marginBottom: 0 }}>
                  <Input.Group compact>
                    <Form.Item name={['basicInfo', 'userTimes']} rules={[{ required: true }]} >
                      <Radio.Group disabled={!canEdit}>
                        <Radio value={-1}>不限制</Radio>
                        <Radio value={MIN_UNLIMITED_TIMES} disabled>限制数量</Radio>
                      </Radio.Group>
                    </Form.Item>
                    {activityDetail.basicInfo.userTimes === MIN_UNLIMITED_TIMES && <Form.Item name="maxTimesPerSender" rules={[{ type: 'number', required: true, message: '请输入有效的数字' }]} >
                      <InputNumber disabled={!canEdit} placeholder="请输入大于0的正整数" min={MIN_UNLIMITED_TIMES} max={MAX_LIMITED_TIMES} maxLength={7}
                        formatter={(value: any) => sanitizeToInteger(value)}
                        parser={value => sanitizeToInteger(value) || ''}
                      />
                    </Form.Item>}
                  </Input.Group>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>}
        {cardId === 5 && <Row className="form-block">
          <Col span={12}>
            <Row gutter={32}>
              <Col span={4}>
                <Form.Item 
                  label={<>
                    {$t('促销方式')}
                    <Tooltip title='促销方式选择拼团时，主题类派对在创建商品-维护商品上架信息时选择的成团方式也要选择拼团。'>
                      <IconQuestionCircle />
                    </Tooltip>
                  </>} 
                  name={['basicInfo', 'partyOffAboveInfo', 'partyType']} rules={[{ required: true }]} >
                  <Checkbox.Group disabled={canOnlyView}>
                    <Checkbox value={2}>拼团促销</Checkbox>
                    <Checkbox value={1}>包场促销</Checkbox>
                  </Checkbox.Group>
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>}
        {cardId === 4 && <Row><Col span={12}><div className="section-header">活动信息</div></Col></Row>}
        {cardId === 4 && <Row className="form-block">
          <Col span={12}>
            <Row gutter={32}>
              <Col span={4}>
                <Form.Item name='' label={$t('赠品对象')}>
                  <Checkbox checked>购买人</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={32}>
              <Col span={4}>
                <Form.Item name={['basicInfo', 'rewardInfo', 'rewardMethod']} label={$t('赠品方式')}>
                  <Radio.Group disabled={!canEdit}>
                    <Radio value={1}>全部赠送</Radio>
                    <Radio value={2}>任选一项</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={32}>
              {/* <Col span={3}>
                <Form.Item className="composite-required-field" label={$t('优惠门槛')} style={{ marginBottom: 0 }}>
                  <Input.Group compact>
                    <Form.Item name={['basicInfo', 'rewardInfo', 'conditionList']} rules={[{ required: true }]} >
                      <Radio.Group disabled={!canEdit}>
                        <Radio value={1}>满*元减</Radio>
                        <Radio value={2}>满*件减</Radio>
                      </Radio.Group>
                    </Form.Item>
                    {true && <Form.Item name="maxTimesPerSender" rules={[{ type: 'number', required: true, message: '请输入有效的数字' }]} >
                      <InputNumber disabled={!canEdit} placeholder="请输入大于0的正整数" min={MIN_UNLIMITED_TIMES} max={MAX_LIMITED_TIMES} maxLength={7}
                        formatter={(value: any) => sanitizeToInteger(value)}
                        parser={value => sanitizeToInteger(value) || ''}
                      />
                    </Form.Item>}
                  </Input.Group>
                </Form.Item>
              </Col> */}
            </Row>
            <Row gutter={32}>
              <Col span={4}>
                <Space>
                  <Form.Item label={$t('赠品总套数')} name={['basicInfo', 'rewardInfo', 'totalStock']} rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={1} maxLength={10} placeholder="请输入赠品总套数" disabled={canOnlyView}
                      formatter={(value: any) => sanitizeToInteger(value)}
                      parser={(value: any) => sanitizeToInteger(value) || ''}
                    />
                  </Form.Item>
                  <div>当前可售{activityDetail.basicInfo.rewardInfo.stockLeft}</div>
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>}
      </Form>
      <Modal title={`确认活动类型为${cardId === 4 ? '“赠品”' : cardId === 5 ? '“小会员立减”' : '“拍卖”'}吗？`} visible={isModalVisible} onOk={handleOk} onCancel={() => { setIsModalVisible(false) }}>
        <div>您即将保存本页面信息，保存后不可更改活动类型。</div>
      </Modal>
    </div >
  )
}));