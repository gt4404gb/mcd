import React, { Component } from "react";
import { reportAiSSO, dashboardAiSSO } from "@/api/oap/commonApi";
import { message } from "@aurum/pfe-ui";

export default class reportDataDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            iframeUrl: "",
            urlParams: {
                finance: 'https://d-guanyuan.mcdonalds.cn/page/hb3a247eccc4f4a96b4faafa?ps=iframe2',
                cbi: 'https://d-guanyuan.mcdonalds.cn/page/oa34dfcb147e24c8b86db0e3?ps=iframe2',
                ccc: 'https://d-guanyuan.mcdonalds.cn/page/if4c73bce11c147a4b409ffd?ps=iframe2',
                'people-dashboard': 'https://d-guanyuan.mcdonalds.cn/digital-screen/w392544134c2a47e88011b64/cast?ps=iframe2',
                'hr-dashboard': 'https://d-guanyuan.mcdonalds.cn/page/g9e7683671e364a0da59ac2a?ps=iframe2',
                'hr-analytics': 'https://d-guanyuan.mcdonalds.cn/digital-screen/u55ea3237015e46b8944e501?ps=iframe2',
            }
        };
    }

    componentDidMount () {
        let pathname = this.props.pathname, requestApi = '', params = '';
        const { urlParams } = this.state;
        if (pathname == '/oap/forecast') {
            requestApi = reportAiSSO;
        } else {
            requestApi = dashboardAiSSO;
            params = urlParams[pathname.split('/')[2]];
        }
        this.getUrlToLogin(requestApi, params);
    }

    getUrlToLogin = (requestApi, params) => {
        try {
            requestApi(params).then((res) => {
                this.setState({
                    iframeUrl: res.data
                });
            }).catch((err) => {
                err.msg && message.error(err.msg);
            });
        } catch (errInfo) {
            message.error("请关闭重新进入页面")
        }
    };



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
