import moment from 'moment';
import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { withRouter, useParams } from 'react-router-dom';
/* @ts-ignore */
import _ from 'lodash';
import { Form, Input, Row, Col, message, Button } from '@aurum/pfe-ui';
import * as apis from '@/common/net/apis_activity';
import * as activityActions from '@/redux/actions/activityActions';
/* @ts-ignore */
import PrizeItem from './PrizeItem';
import ModalForm from './ModalForm';
/* @ts-ignore */
import ProList from './ProList';
import constants from '@/common/constants';
import '@/assets/styles/activity/prolist.less';

const defaultPrizeItem = {
  prizeType: 1, // 奖品类型：1、券
  couponId: '', // 券编号
  name: '', // 券名称
  tradeEndTime: null,
  receiveCount: 1, // 单用户奖励数量
  stockNum: 0, // 奖励上限
  amount: 0, // 单用户奖励数量 * 奖励上限,
  errorMsg: '',
};

const initialActivityReward: any = {
  activId: '', // 活动id不能为空
  spuList: []
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
// @ts-ignore
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(({ STEP, currentStep, onActionCompleted, rewardDependedFields, history, executeAction, resetExecuteAction, gotoNexStep, refreshPrizeLists }: any) => {
  const [activityReward, setActivityReward] = useState(JSON.parse(JSON.stringify(initialActivityReward)));
  const [canEdit, setCanEdit]: any = useState(true);
  const [canOnlyView, setCanOnlyView]: any = useState(false);
  const [form] = Form.useForm();
  const formEl: any = useRef(null);
  const { activityId, isShow }: any = useParams();
  const [visible, setVisible] = useState(false);
  const [refresh, setRefresh] = useState(false);
  let selectedRowsData = useRef([]);

  const rowSelection = (selectedRows: any) => {
    selectedRowsData.current = selectedRows;
    if (selectedRows.length > 0) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  };

  useEffect(() => {
    return () => {
      updateActivityReward({ ...initialActivityReward });
      gotoNexStep(-STEP);
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
          }
        } catch { }
        if (_activityReward) {
          updateActivityReward(_activityReward);
          let data = activityReward.spuList.filter((item: any) => {
            return !item.auctionStatus || item.auctionStatus < 2;
          })
          refreshPrizeLists(data);
        }
      })();
    }
  }, [activityId, refresh]);



  useEffect(() => {
    form.resetFields(Object.keys(activityReward));
  }, [activityReward]);


  useEffect(() => {
    if (executeAction && currentStep === STEP) {
      resetExecuteAction(false);
      if (!canOnlyView) {
        form.submit();
      } else {
        history.push('/ecs/activities');
      }
    }
  }, [executeAction])

  function onAddPrizeItem() {
    const prizeItem: any = { ...defaultPrizeItem };
    activityReward.spuList.push(prizeItem);
    updateActivityReward(activityReward);
  }

  function updateActivityReward(activityReward: any) {
    activityReward.spuList = [...activityReward.spuList];
    setActivityReward({ ...activityReward });
  }

  const sortPro = async() => {
    let list = activityReward.spuList, params: any = { activId: activityId, goodSortItemList: [] };
    list.forEach((element: any, index: any) => {
      params.goodSortItemList.push({ goodsId: element.id, sortNo: (index + 1) })
    });
    try {
      const result = await apis.getActivityService().activitySort(params)
      if (result.success) {
        message.success('更新排序成功')
        setRefresh(refresh => !refresh)
      } else {
        message.error(result.message)
      }
    } catch { }
    console.log('params',params)
  }

  return (
    <div className={currentStep === STEP ? 'edit-reward' : 'hide'}>
      <Form.Provider
        onFormFinish={(name, { values, forms }) => {
          if (name === 'userForm') {
            let spuIds: any = [], bindSpuIds: any = [], glbalSpuIds = [];
            selectedRowsData.current.forEach((item: any, index:any) => {
              spuIds.push(item.spuId)
            })

            activityReward.spuList.forEach((item: any) => {
              bindSpuIds.push(item.spuId)
            })

            glbalSpuIds = spuIds.filter((item: any) => bindSpuIds.indexOf(item) > -1)
            if (glbalSpuIds.length > 0) {
              message.error('有已绑定过的商品，不可重复绑定')
              return;
            }

            setVisible(false);
            (async function () {
              if (!canOnlyView) {
                let list: any = {};
                list.activId = activityId;
                list.spuList = selectedRowsData.current;
                const resp = await apis.getActivityService().createStep2(list);
                if (!resp.success) {
                  onActionCompleted(false);
                  message.error(resp.message);
                } else {
                  setRefresh(refresh => !refresh)
                  //onActionCompleted(true);
                  message.success('活动关联商品成功');
                  //history.push('/ecs/activities');
                }
              } else {
                history.push('/ecs/activities');
              }
            })();
          }
        }}
      >

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
            history.push('/ecs/activities');
          }}
          onValuesChange={(values: any) => {
            if (!values.spuList) return;
            activityReward.spuList = _.merge(activityReward.spuList, values.spuList);
            form.setFieldsValue({
              spuList: activityReward.spuList
            });
          }}
        >
          <Form.Item hidden={true} name="activityId" ><Input /></Form.Item>
          <Row>
            <Col span={12}>
              <Row><Col span={12}><div className="section-header">已关联的商品</div>
                {activityReward.spuList.length > 0 && <Button type="primary" onClick={sortPro} style={{margin:'0 0 12px 16px'}}>更新排序</Button>}
              </Col></Row>
              <Row className="form-block">
                <Col span={12}>
                  <Form.Item>
                    <PrizeItem
                      field='spuList'
                      canOnlyView={canOnlyView}
                      activityReward={activityReward}
                      activityId={activityId}
                      onAddPrizeItem={() => onAddPrizeItem()}
                      onRemoveCoupon={(key: any) => {
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
          {!canOnlyView && <Row>
            <Col span={12}>
              <Row><Col span={12}><div className="section-header section-header-line">关联商品</div></Col></Row>
            </Col>
          </Row>}
        </Form>
        {!canOnlyView && <ProList rowSelections={rowSelection} activityId={activityId} canOnlyView={canOnlyView} />}
        {visible && <ModalForm canOnlyView={canOnlyView} />}
      </Form.Provider>
    </div>
  )
}));