import React from 'react';
import {
  Row, Col, Tooltip
} from '@aurum/pfe-ui';
import { IconQuestionCircle } from '@aurum/icons';
import SalesRadar from './SalesRadar';
const SubjectDomain = (props,ref) => {
  const {infoSource} = props;
  const crateComponent = () => {
    let ele = [];
    for(let i=0,l=infoSource.detailInfos.length;i<l;i++) {
      ele.push(<SalesRadar detailInfos={infoSource.detailInfos[i]}   key={i} />);
    }
    return ele;
  }
  return <div className='subject-domain bg-fff'>
    {/* <h3 className='group-top-topic'>{infoSource?.title}</h3>
    <i className='left-icon'></i> */}
    <div className='common-demand-title-h4'>
      <div className='demand-title-item'>{infoSource?.title}</div>
      <i className='left-icon'></i>
    </div>
    <div className='subject-domain-head-title'>
      <Row>
        <Col span={3}>
          <div className='head-item'>
            <span className='title'>公共表</span>
            <span className='count'>{infoSource?.curSubPublicCount}</span>
          </div>
        </Col>
        <Col span={3}>
          <div className='head-item'>
            <span className='title'>已完成</span>
            <span className='count'>{infoSource?.curSubFinishedCount}</span>
          </div>
        </Col>
        <Col span={3}>
          <div className='head-item'>
            <span className='title'>数据量</span>
            <span className='count'>{infoSource?.curSubRowQuantity}</span>
          </div>
        </Col>
        <Col span={3}>
          <div className='head-item'>
            <span className='title'>总平均分</span>
            <span className='count'>{infoSource?.curSubTotalAvgScore}</span>
            <Tooltip placement="top" title='总分100分'><IconQuestionCircle className='question-icon'/></Tooltip>
          </div>
        </Col>
      </Row>
    </div>
    <div className='sales-body-content'>
      {crateComponent()}
    </div>
  </div>
}

export default SubjectDomain;