import moment from 'moment';
import React, { useState, useEffect, useRef } from 'react'
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
/* @ts-ignore */
import _ from 'lodash';
import AuctionPro from '@/components/activity/edit/Product';
import RewardPro from '@/components/activity/edit/reward/ProductNew';
import MemberPmt from '@/components/activity/edit/memberPmt/index';

const mapStateToProps = (state: any) => {
  return {
    activityDetail: state.activity.activityDetail,
    currentStep: state.activity.currentStep,
  }
}
/* @ts-ignore */
export default connect(mapStateToProps)(withRouter(({ currentStep, activityDetail }: any) => {
  return (
    <div className={currentStep === 1 ? 'edit-reward' : 'hide'}>
        {currentStep ===1 && activityDetail.basicInfo?.activityType === 4 && <RewardPro />}
        {currentStep === 1 && activityDetail.basicInfo?.activityType === 1 && <AuctionPro />}
        {currentStep === 1 && activityDetail.basicInfo?.activityType === 5 && <MemberPmt />}
    </div>
  )
}));