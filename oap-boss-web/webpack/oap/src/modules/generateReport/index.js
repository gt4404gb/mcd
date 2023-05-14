import React, { Component } from "react";
import { guandataSso } from "@/api/oap/companies_report"; //接口文件
import {message} from "antd";
export default class index extends Component {
  constructor(props) {
    super(props);
    this.state = {
      iframeUrl: "",
    };
  }
  componentDidMount() {
    this.loginGuandata();
  }
  loginGuandata = () => {
    guandataSso()
      .then((res) => {
        this.setState(
          {
            iframeUrl: res.data,
          },
          () => {
            console.log("iframeUrl", this.state.iframeUrl);
          }
        );
      })
      .catch((err) => {
        err.msg && message.error(err.msg);
      });
  };
  render() {
    let { iframeUrl } = this.state;
    return (
      <div className="reportDataDetails">
        <div>
          <iframe
            ref="iframe"
            src={iframeUrl}
            width="100%"
            height="630px"
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
