import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux'
import { Row, Col, Steps, Button, Modal, Breadcrumb, Space } from '@aurum/pfe-ui';
import * as activityActions from '@/redux/actions/activityActions';
import ActivityEditThemeInfo from '@/components/theme/edit/ThemeInfo';
import ActivityEditThemePro from '@/components/theme/edit/Product';

import '@/assets/styles/activity/edit.less';
import constants from '@/common/constants';
const mapStateToProps = (state: any) => {
  return {
    currentStep: state.activity.currentStep,
    isTheme: state.activity.isTheme
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  executeAction: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_EXECUTE_ACTION,
    payload
  }),
  resetActivityRewardDependedFields: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_REWARD_DEPENDED_FIELDS_RESET,
    payload
  }),
  gotoNexStep: (payload: any) => {
    (document.querySelector('.container') as any).scrollTo({ top: 0 })
    dispatch({
      type: activityActions.ACTIVITY_NEXT_STEP,
      payload
    })
  },
  refreshPrizeLists: (payload: any) => dispatch({
    type: activityActions.ACTIVITY_PRIZE_LISTS,
    payload
  }),
});

var timer: any = false;
export default connect(mapStateToProps, mapDispatchToProps)((({ history, currentStep, gotoNexStep, executeAction, resetActivityRewardDependedFields, refreshPrizeLists }: any) => {
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  useEffect(() => {
    const onScrollAction = () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = setTimeout(() => {
        setIsMouseMoving(false)
      }, 500);
      setIsMouseMoving(true)
    }

    document.querySelector(".container")?.addEventListener('scroll', onScrollAction);
    return () => {
      document.querySelector(".container")?.removeEventListener('scroll', onScrollAction);
      gotoNexStep(-constants.activity.MAX_STEP);
      resetActivityRewardDependedFields();
      refreshPrizeLists([]);
    }
  }, []);

  return <>
    <Row>
      <Col span={12} className="breadcrumb" style={{ textAlign: 'left', marginBottom: '8px', marginTop: '-8px' }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <a href="/ecs/activities">活动管理</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>创建活动</Breadcrumb.Item>
        </Breadcrumb>
      </Col>
    </Row>
    <div id="activity-edit" className="activity-edit">
      <div className="inner-container" >
        <ActivityEditThemeInfo
          /* @ts-ignore */
          STEP={0}
          onActionCompleted={(result: any) => {
            if (result) {
              gotoNexStep(1);
              if (result.canOnlyView) {
                history.push('/ecs/theme/edit/' + result.activityId + '/isShow');
              } else {
                history.push('/ecs/theme/edit/' + result.activityId);
              }
            }
          }} />
        <ActivityEditThemePro
          /* @ts-ignore */
          STEP={1}
          onActionCompleted={(isSaved: boolean) => {
            if (isSaved) {
              gotoNexStep(1);
            }
          }} />
      </div>
      <Row>
        <Col span={12} style={{ textAlign: 'left', padding: '16px', paddingTop:'0' }}>
          <Space>
            {currentStep === constants.activity.MAX_STEP && <Button type="primary" htmlType="button" onClick={() => {
              executeAction(true);
            }}>{$t('完成')}
            </Button>}
            {currentStep > 0 && <Button htmlType="button" onClick={() => {
              gotoNexStep(-1)
            }}>{$t('上一步')}
            </Button>}
            {currentStep < constants.activity.MAX_STEP && <Button type="primary" htmlType="button" onClick={() => {
              executeAction(true);
            }}>{$t('下一步')}
            </Button>}
          </Space>
        </Col>
      </Row>
    </div>
  </>
}));