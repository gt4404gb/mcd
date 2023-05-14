import React from 'react';
import { Row, Col, Popover } from '@aurum/pfe-ui';
import { uuid, optionFilterProp } from '@/utils/store/func';
import { RELATIVE_TIME_TYPE_LIST, RELATIVE_TIME_UNIT_LIST } from '@/constants';
import moment from 'moment';

function ShowDragContion (props) {
    const { conditionList } = props;
    let renderContentDom = '';
    return conditionList.length ? <div className="oap-analysis-showDragContion">
        {conditionList.map((item, index) => {
            renderContentDom = <>
                {item.filterValues ? item.filterValues.map(filterItem => {
                    let comparatorLabel = [], relativeTypeName = '', relativeValueName = '';
                    if (['Select', 'SelectMulti'].includes(item.showDataType)) {
                        comparatorLabel = filterItem?.comparator.reduce((total, cur) => {
                            let labelObj = item?.forShowList?.find(lsitItem => lsitItem?.value === cur)
                            //人群包、自定义维度
                            if (item?.isSegment || item?.isCustomDimension) {
                                if (labelObj == undefined) {
                                    labelObj = optionFilterProp(item?.forShowList, 'label', cur.split(')')[1])
                                }
                            }
                            if (labelObj) total.push(labelObj?.label)
                            return total
                        }, [])
                    }
                    return <p key={uuid()}>
                        <span style={{ fontWeight: 'bold', marginRight: '6px' }}>{filterItem?.logicalOperator}</span>
                        {filterItem.version ? <span style={{ fontWeight: 'bold', marginRight: '6px' }}>{filterItem.version}</span> : null}
                        <span style={{ marginRight: '6px' }}>{filterItem?.compareOperator}</span>
                        {['Date', 'DateUnlimited'].includes(item.showDataType) && <>
                            {((filterItem.timeType ?? '') == '' || filterItem?.timeType.toLowerCase() == 'absolute') && <>
                                <span style={{ marginRight: '6px' }}>绝对时间</span>
                                <span style={{ marginRight: '6px' }}>{filterItem?.compareOperator.toLowerCase() == 'between' ? filterItem?.comparator.map(comparatorItem => moment(Number(comparatorItem)).format('YYYY-MM-DD')).join('~') : moment(Number(filterItem?.comparator)).format('YYYY-MM-DD')}</span>
                            </>}
                            {((filterItem.timeType ?? '') !== '' && filterItem?.timeType.toLowerCase() == 'relative') && <>
                                <span style={{ marginRight: '6px' }}>相对时间</span>
                                {filterItem?.relativeInfo.map((relativeInfoItm, relativeInfoIdx) => {
                                    relativeTypeName = optionFilterProp(RELATIVE_TIME_TYPE_LIST, 'value', relativeInfoItm.relativeType)?.label || '';
                                    relativeValueName = optionFilterProp(RELATIVE_TIME_UNIT_LIST, 'value', relativeInfoItm.relativeValue)?.label || '';
                                    return <span key={relativeInfoIdx} style={{ marginRight: '6px' }}>
                                        {relativeInfoIdx > 0 ? <span style={{ marginRight: '6px' }}>至</span> : ''}{relativeTypeName}{filterItem?.comparator[relativeInfoIdx]}{relativeValueName}
                                    </span>
                                })}
                            </>}
                        </>}
                        {['Select', 'SelectMulti'].includes(item.showDataType) && <span style={{ marginRight: '6px' }}>{comparatorLabel.join(', ')}</span>}
                        {!['Select', 'SelectMulti', 'Date', 'DateUnlimited'].includes(item.showDataType) && <span style={{ marginRight: '6px' }}>{filterItem?.comparator.join(', ')}</span>}
                    </p>
                }) : <></>}
                {item.condition && item.condition.length ? <>
                    <span style={{ marginRight: '6px' }}>in</span>
                    <span>{item.condition.join(', ')}</span>
                </> : <></>}
            </>
            return <Row key={uuid()} className="oap-showDragContion-box">
                <Col flex="38px" style={{ color: '#1890ff', height: '35px', lineHeight: '35px', marginLeft: item.condition && item.condition.length ? ((item?.cascadeIndexChoosed * 20) + 'px') : '0' }}>
                    {index == 0 ? '' : (item.logicalOperator || 'AND')}
                </Col>
                <Col flex="16px">
                    <img src={require('@/locales/images/filter.png')} alt="icon" width={16} />
                </Col>
                <Col flex="auto" className="oap-showDragCondition-content">
                    <span className="fontB">{item?.showName}</span>
                    <Popover
                        placement="topRight"
                        trigger="click"
                        content={<i className="oap-showDragCondition-popover">
                            {renderContentDom}
                        </i>}
                        overlayClassName="oap-analysis-popover">
                        <i>{renderContentDom}</i>
                    </Popover>
                </Col>
            </Row>
        })}
    </div> : <></>
}

export default ShowDragContion;