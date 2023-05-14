import React, { Component } from "react";
import { toLogin, getReportSSOUrl } from "@/api/oap/companies_report";
import { message } from "@aurum/pfe-ui";
import querystring from "query-string";
export default class reportDataDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      iframeUrl: "",
      // iframeUrl:"https://boss.sit.mcd.com.cn/imp/home"
    };
    // props.cacheLifecycles.didRecover(this.getReportUrlToLogin);
  }
  componentWillReceiveProps (nextProps, prevProps) {
    this.getReportUrlToLogin(nextProps);
  }
  getReportUrlToLogin = (nextProps) => {
    try {
      const { id, reportUrl, builderTool } = querystring.parse(nextProps.location.search)
      console.log('getReportUrlToLogin', nextProps.location, querystring.parse(nextProps.location.search))
      if (id) {
        toLogin(id)
          .then((res) => {
            this.setState(
              {
                iframeUrl: res.data,
              });
          }).catch((err) => {
            err.msg && message.error(err.msg);
          });
      } else {
        let reportUrlParams = builderTool == 'Xbuilder' ? nextProps.location.search.split('?reportUrl=')[1] : reportUrl;
        getReportSSOUrl({
          builderTool,
          reportUrl: reportUrlParams
        }).then(res => {
          console.log(res);
          this.setState(
            {
              iframeUrl: res.data,
            });
        }).catch((err) => {
          err.msg && message.error(err.msg);
        });

      }
    } catch (errInfo) {
      message.error("请关闭重新进入页面")
    }
  };
  render () {
    let { iframeUrl } = this.state;
    console.log('iframeUrl = ', iframeUrl)
    return (
      <div>
        <div className="reportDataDetails">
          <iframe
            ref="iframe"
            src={iframeUrl}
            width="100%"
            height="100%"
            id="ifPtFrame"
            name="ptframe"
            frameBorder="0"
            scrolling="no"
            allowtransparency="true"
          />
        </div>
      </div>
    );
  }
}
