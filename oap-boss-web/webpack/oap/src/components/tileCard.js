import React from "react";
import { Empty, Card, Row, Col, Tooltip, Popconfirm } from "@aurum/pfe-ui";
import {
  IconFile,
  IconCollectionB,
  IconCollectionBFill
} from "@aurum/icons";
import report from "@/assets/imgs/report.png";
import littleIcon from "@/assets/imgs/littleIcon.png";
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
export default class ToggleScene extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: JSON.parse(localStorage.getItem('USER_INFO')),
    }
  }
  //展示详情
  showDetails = (type, item) => {
    this.props.tolinkToForm(type, item)
  };

  render() {
    const { dataSource, subscriCallBack} = this.props;
    return (
      <div
        className="oap-tilecard"
        style={{
          height: dataSource.length ? 'auto' : '100%',
          backgroundColor: dataSource.length ? "transparent" : "#fff",
        }}
      >
        {dataSource.length ? (
          <Row gutter={[12, 12]} className="report-tile-grid-no">
            {dataSource.map(item => {
              return (
                <Col
                  xs={6}
                  xm={6}
                  lg={6}
                  xl={4}
                  xxl={3}
                  key={item.id}
                >
                  <Card
                    title={
                      <div className="tile-card-header">
                        <div className="iconbox" onClick={() => this.showDetails('detail', item)}>
                          <IconFile />

                        </div>
                        <div>
                          {
                            item.isSubscribe ?
                              <Popconfirm
                                title="确定取消订阅吗？"
                                onConfirm={()=>{subscriCallBack(item, 0)}}
                                okText="确定"
                                cancelText="取消"
                              >
                                <div className="collect">
                                  <IconCollectionBFill style={{ color: '#ff6d36' }} className="collect-icon" />
                                  <span className="count">{item.subscribe}</span>
                                </div>
                                
                              </Popconfirm>
                              :
                              <div className="collect" onClick={()=>{subscriCallBack(item, 1)}}>
                                <IconCollectionB  className="collect-icon" />
                                <span className="count">{item.subscribe}</span>
                              </div>
                          }
                          
                        </div>
                        {item.applying ? (
                          <div className="iconbox">
                            <img src={littleIcon} />
                          </div>
                        ) : (
                          ""
                        )}
                      </div>
                    }
                    headStyle={{
                      borderBottom: 0,
                      minHeight: 0,
                      padding: 0
                    }}
                    bordered={false}
                    className="oap-tilecard-card"
                  >
                    <div className="oap-tilecard-cardbody">
                      <img
                        alt="文件"
                        src={item.iconUrl ? item.iconUrl : report}
                        className="file-img"
                        onClick={checkMyPermission('oap:report:sso') ? () => this.props.toReportDetails(item.id ,item.reportCode, item.reportName) : null}
                      />
                      <div className="title" onClick={checkMyPermission('oap:report:sso') ? () => this.props.toReportDetails(item.id ,item.reportCode, item.reportName) : null}>
                        <Tooltip title={item.reportCode + '.' + item.reportName}>
                          {item.reportCode}.{item.reportName}
                        </Tooltip>
                      </div>
                    </div>
                    <div className="oap-tilecard-cardfooter">
                      <div className="bussiness">{item.name}</div>
                      <div className="update">
                        <Tooltip placement="topLeft" title={item.updateFrequency + (item.updateTime ?? '')}>
                          {item.updateFrequency}{<span style={{ color: "#4880ff" }}>{item.updateTime}</span>}
                        </Tooltip>
                        
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Empty
            className="tile-card-Empty table-top-wrap"
            imageStyle={{ height: 184 }}
            description={
              <>
                <span className="oap-tilecard-empty">暂无报告</span>
                <br />
                <span className="oap-tilecard-fontGray">
                  {
                    this.state.userInfo.userType == '0' ?
                      <>
                        更多内容报告，请点击
                        <>
                          {
                            checkMyPermission('oap:report:sso') ?
                              <a onClick={this.props.toApplyReport}>此处</a>
                              :
                              <span>此处</span>
                          }
                        </>
                        申请
                      </> :
                      <>
                        更多报告内容，请联系MCD雇员协助申请
                      </>
                  }
                </span>
              </>
            }
          ></Empty>
        )}
      </div>
    );
  }
}
