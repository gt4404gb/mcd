import React, { Component } from "react";
import { message } from "@aurum/pfe-ui";

export default class DataQueryDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      iframeUrl: ""
    };
  }

  componentDidMount () {
    let baseInfo = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapDataQueryInfo'))) || {};
    this.setState({ iframeUrl: baseInfo?.ssoReportUrl || '' })
  }

  render () {
    return <div className="oap-container">
      <iframe
        ref="iframe"
        src={this.state.iframeUrl}
        width="100%"
        height="100%"
        id="ifPtFrame"
        name="ptframe"
        frameBorder="0"
        scrolling="no"
        allowtransparency="true" />
    </div>
  }
}
