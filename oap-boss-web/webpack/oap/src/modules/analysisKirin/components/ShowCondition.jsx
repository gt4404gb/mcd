import React from 'react';
// import {Row, Col,Tooltip, Popover} from '@mcd/portal-components';
import { Row, Col, Popover } from '@aurum/pfe-ui';
import { uuid } from '@/utils/store/func';

export default class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      conditionList: [],
      title: '--',
      iconType: 'kylin_filters',
    }
  }
  componentWillReceiveProps(nextProps) {
    let {title, showList} = nextProps;
    this.setState({
      title: title,
      conditionList: showList,
    })
  }
  componentDidMount() {
    // console.log('props = ', this.props);
  }
  renderShowName = (item) => {
    let ele = null;
    switch(item.operator) {
      case 'IN': ele = (<span
        style={{
          marginRight: "6px",
        }}
      >
        {item.filter_members_name?.join(",") || item.filter_members?.join(",")}
      </span>); break;
      case 'NOT_IN': ele = (<span
        style={{
          marginRight: "6px",
        }}
      >
        {item.filter_members_name?.join(",") || item.filter_members?.join(",")}
      </span>); break;
      case 'BETWEEN': ele = (<span
        style={{
          marginRight: "6px",
        }}
      >
        {`${item.value.split('--').shift()} AND ${item.second_value.split('--').shift()}`}
      </span>); break;
      default: ele = (<span
        style={{
          marginRight: "6px",
        }}
      >
        {item.value.split('--').shift()}
      </span>); break;
    }
    return ele;
  }
  render () {
    return this.state.conditionList.length > 0 ? (
      <div className="oap-analysis-showDragContion" style={{borderBottom: '0.5px solid #ddd'}}>
      {this.state.conditionList.map(
        (filterCondition, filterConditionIdx) => {
          return (
            <Row key={uuid()} className="oap-showDragContion-box">
              <Col
                flex="38px"
                style={{
                  color: "#1890ff",
                  height: "35px",
                  lineHeight: "35px",
                }}
              >
                {filterConditionIdx == 0
                  ? this.state.title
                  : filterCondition.logicalOperator || "AND"}
              </Col>
              <Col flex="16px">
                <img
                  src={require("@/locales/images/filter.png")}
                  alt="icon"
                  width={16}
                />
              </Col>
              <Col
                flex="auto"
                className="oap-showDragCondition-content"
              >
                <span className="fontB">
                  {filterCondition?.show_name}
                </span>
                <Popover
                  placement="topRight"
                  trigger="click"
                  content={
                    <i className="oap-showDragCondition-popover">
                      {filterCondition.filter_values
                        ? filterCondition.filter_values.map(
                          (filterItem, index) => {
                            return (
                              <p key={uuid()}>
                                <span
                                  style={{
                                    fontWeight: "bold",
                                    marginRight: "6px",
                                  }}
                                >
                                  {/* {index > 0 ? filterItem?.logicalOperator: null} */}
                                  {index > 0 ? 'OR': null}
                                </span>
                                <span
                                  style={{ marginRight: "6px" }}
                                >
                                  {filterItem?.operator}
                                </span>
                                {
                                [
                                  "Select",
                                  "SelectMulti",
                                ].includes(
                                  filterCondition.show_data_type
                                ) && (
                                  // <span
                                  //   style={{
                                  //     marginRight: "6px",
                                  //   }}
                                  // >
                                  //   {filterItem.filter_members_name?.join(",") || filterItem.filter_members?.join(",")}
                                  // </span>
                                  this.renderShowName(filterItem)
                                )
                                }
                              </p>
                            );
                          }
                        )
                        : null}
                    </i>
                  }
                  overlayClassName="oap-analysis-popover"
                >
                  <i>
                    {filterCondition.filter_values
                      ? filterCondition.filter_values.map(
                        (filterItem, index) => {
                          return (
                            <p key={uuid()}>
                              <span className="fontB">
                                {/* {index > 0 ? filterItem?.logicalOperator: null} */}
                                {index > 0 ? 'OR': null}
                              </span>
                              <span>
                                {filterItem?.operator}
                              </span>
                              {[
                                "Select",
                                "SelectMulti",
                              ].includes(
                                filterCondition.show_data_type
                              ) && (
                                // <span>
                                //   {filterItem.filter_members_name?.join(",") || filterItem.filter_members?.join(",")}
                                // </span>
                                this.renderShowName(filterItem)
                              )}
                            </p>
                          );
                        }
                      )
                      : null}
                  </i>
                </Popover>
              </Col>
            </Row>
          );
        }
      )}
    </div>) : <></>
  }
}