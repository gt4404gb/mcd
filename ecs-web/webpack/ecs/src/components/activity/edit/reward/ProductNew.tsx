import moment from 'moment';
import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
/* @ts-ignore */
import _ from 'lodash';
import { Form, Input, Row, Col, message, Checkbox, Table, InputNumber, Button } from '@aurum/pfe-ui';
import * as apis from '@/common/net/apis_activity';
import * as activityActions from '@/redux/actions/activityActions';
/* @ts-ignore */
import ProPrizeItem from './ProPrizeItem';
/* @ts-ignore */
import RewardPrizeItem from './RewardPrizeItem';
/* @ts-ignore */
import ProListNew from './ProListNew';
import constants from '@/common/constants';
import '@/assets/styles/activity/prolist.less';

const initialActivityReward: any = {
  activId: '', // 活动id不能为空
  spuList: [],
  rewardSpuList: []  //赠品
};

const mapStateToProps = (state: any) => {
  return {
    executeAction: state.activity.executeAction,
    currentStep: state.activity.currentStep,
    rewardDependedFields: state.activity.rewardDependedFields,
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  refreshPrizeLists: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_PRIZE_LISTS,
    payload
  }),
  resetExecuteAction: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_EXECUTE_ACTION,
    payload
  }),
  gotoNexStep: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_NEXT_STEP,
    payload
  }),
});
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ currentStep, onActionCompleted, rewardDependedFields, history, executeAction, resetExecuteAction, gotoNexStep, refreshPrizeLists }: any) => {
  const [activityReward, setActivityReward] = useState(JSON.parse(JSON.stringify(initialActivityReward)));
  const [canOnlyView, setCanOnlyView]: any = useState(false);
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const { activityId, isShow }: any = useParams();
  const [refresh, setRefresh] = useState(false);
  const [rewordRefresh, setRewordRefresh] = useState(false);
  const [showProList, setShowProList] = useState({
    scene: 3,
    visible: false
  });

  useEffect(() => {
    return () => {
      updateActivityReward({ ...initialActivityReward });
      gotoNexStep(-1);
    }
  }, []);

  useEffect(() => {
    if (isShow === 'isShow' || rewardDependedFields.state === constants.activity.STATE_CODE.READY_ONLINE || rewardDependedFields.state === constants.activity.STATE_CODE.OVER) {
      setCanOnlyView(true);
    } else {
      setCanOnlyView(false);
    }
  }, [rewardDependedFields.state]);

  useEffect(() => {
    if (activityId) {
      (async () => {
        let _activityReward: any = activityReward;
        try {
          const { data: rewardObj } = await apis.getActivityService().rewardList({ activId: activityId })
          if (rewardObj?.bindGoodsList?.length) {
            rewardObj.bindGoodsList.forEach((item: any) => {
              if (item.operationList?.length) {
                let result = item.operationList.findIndex((v: any) => {
                  return v.code == 'edit';
                })
                if (result < 0) {
                  item.notEdit = true;
                }
              } else {
                item.notEdit = true;
              }
            })
            _activityReward.rewardSpuList = rewardObj.bindGoodsList;
          } else {
            _activityReward.rewardSpuList = [];
          }
        } catch { }
        if (_activityReward) {
          updateActivityReward(_activityReward);
          let data = activityReward.rewardSpuList.filter((item: any) => {
            return !item.auctionStatus || item.auctionStatus < 2;
          })
        }
      })();
    }
  }, [activityId, rewordRefresh]);


  useEffect(() => {
    if (activityId) {
      (async () => {
        let _activityReward: any = activityReward;
        try {
          const { data: rewardObj } = await apis.getActivityService().bindList({ activId: activityId })
          if (rewardObj?.bindGoodsList?.length) {
            rewardObj.bindGoodsList.forEach((item: any) => {
              if (item.operationList?.length) {
                let result = item.operationList.findIndex((v: any) => {
                  return v.code == 'edit';
                })
                if (result < 0) {
                  item.notEdit = true;
                }
              } else {
                item.notEdit = true;
              }
            })
            _activityReward.spuList = rewardObj.bindGoodsList;
          } else {
            _activityReward.spuList = [];
          }
        } catch { }
        if (_activityReward) {
          updateActivityReward(_activityReward);
          let data = activityReward.spuList.filter((item: any) => {
            return !item.auctionStatus || item.auctionStatus < 2;
          })
          //refreshPrizeLists(data);
        }
      })();
    }
  }, [activityId, refresh]);

  useEffect(() => {
    form.resetFields(Object.keys(activityReward));
  }, [activityReward]);


  useEffect(() => {
    if (executeAction && currentStep === 1) {
      resetExecuteAction(false);
      form.submit();
    }
  }, [executeAction])

  function updateActivityReward(activityReward: any) {
    activityReward.spuList = [...activityReward.spuList];
    activityReward.rewardSpuList = [...activityReward.rewardSpuList];
    setActivityReward({ ...activityReward });
  }

  const showList = (scene: any) => {
    setShowProList({
      scene: scene,
      visible: true
    })
  }

  const RefreshRewardList = () => {
    setRewordRefresh(rewordRefresh => !rewordRefresh);
  }
  const SetRefresh = () => {
    setRefresh(refresh => !refresh);
  }


  return (
    <div className={currentStep === 1 ? 'edit-reward' : 'hide'}>
      <Form
        layout="vertical"
        ref={formEl}
        name="basicForm"
        initialValues={activityReward}
        scrollToFirstError={true}
        form={form}
        onFinishFailed={(values) => {
          onActionCompleted(false);
        }}
        onFinish={(values) => {
          if (!activityReward.spuList || !activityReward.spuList.length) {
            message.error('请关联至少一个商品！');
            return;
          }
          if (!activityReward.rewardSpuList || !activityReward.rewardSpuList.length) {
            message.error('请关联至少一个赠品！');
            return;
          }

          history.push('/ecs/activities');
        }}
      >
        <Form.Item hidden={true} name="activityId" ><Input /></Form.Item>
        <Row>
          <Col span={12}>
            <Row><Col span={12}><div className="section-header section-header-line">活动信息</div></Col></Row>
            <Row className="form-block">
              <Col className='acc-mess'>
                <div className='acc-tit'><b></b>活动赠品<span className='acc-tip'>最多添加5个赠品</span></div>
                <Button onClick={() => { showList(4) }} type="primary" size={'small'} className='acc-btn'>选择赠品</Button>
              </Col>
              <Col span={12}>
                <Form.Item>
                  <RewardPrizeItem
                    /* @ts-ignore */
                    field='rewardSpuList'
                    canOnlyView={canOnlyView}
                    activityReward={activityReward}
                    activityId={activityId}
                    RefreshRewardList={RefreshRewardList}
                    onRemoveReward={(key: any) => {
                      activityReward.rewardSpuList = activityReward.rewardSpuList.filter((item: any, iterKey: number) => {
                        return iterKey !== key;
                      });
                      updateActivityReward(activityReward);
                      let data = activityReward.rewardSpuList?.filter((item: any) => {
                        return !item.auctionStatus || item.auctionStatus < 2;
                      })
                      refreshPrizeLists(data);
                    }}
                    onReorderList={(list: any) => {
                      activityReward.rewardSpuList = list;
                      updateActivityReward(activityReward);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row className="form-block">
              <Col className='acc-mess'>
                <div className='acc-tit'><b></b>活动商品<span className='acc-tip'>购买以下商品将赠送赠品</span></div>
                <Button onClick={() => { showList(3) }} type="primary" size={'small'} className='acc-btn'>选择商品</Button>
              </Col>

              <Col span={12}>
                <Form.Item>
                   <ProPrizeItem
                    field='spuList'
                    canOnlyView={canOnlyView}
                    activityReward={activityReward}
                    activityId={activityId}
                    SetRefresh={SetRefresh}
                    onRemovePro={(key: any) => {
                      activityReward.spuList = activityReward.spuList.filter((item: any, iterKey: number) => {
                        return iterKey !== key;
                      });
                      updateActivityReward(activityReward);
                      let data = activityReward.spuList?.filter((item: any) => {
                        return !item.auctionStatus || item.auctionStatus < 2;
                      })
                      refreshPrizeLists(data);
                    }}
                    onReorderList={(list: any) => {
                      activityReward.spuList = list;
                      updateActivityReward(activityReward);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
      <ProListNew
        activityReward={activityReward}
        SetRefresh={SetRefresh}
        activityId={activityId}
        scene={showProList.scene}
        RefreshRewardList={RefreshRewardList}
        showVisible={showProList.visible}
        onClose={() => {
          setShowProList({
            scene: 3,
            visible: false
          })
        }}
      />
    </div>
  )
}));