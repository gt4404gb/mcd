import React, { PureComponent } from "react";
import { Empty, Spin } from "@aurum/pfe-ui";
import { getJupyterInfo } from "@/api/oap/jupyter_learning.js";

export default class Jupyter extends PureComponent {
  constructor() {
    super();
    this.state = {
      href: "",
      token: "",
      isLoading: true
    };
  }

  //
  componentDidMount() {
    getJupyterInfo().then(({ data }) => {
      console.log(data);
      if (data) {
        this.setState({
          href: data.jupyterUrl,
          token: data.jupyterToken
        });
      }
    }).finally(() => {
      this.setState({
        isLoading: false
      });
    });
  }

  render() {
    const { href, token, isLoading } = this.state;
    let result = <></>;
    if (!isLoading) {
      result = <div style={{margin: 'auto', height: '100%', position: 'relative',background: '#fff'}}> 
      <Empty style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
      }} imgName="general/forbidden-access" description="暂无Jupyter账号，请申请开通" /></div>;
      if (href && token) {
        const src = `${href}?token=${token}`;
        result = <iframe
          src={src}
          frameBorder="0" width="100%" height="100%"></iframe>;
      }
    }

    return (
      <Spin spinning={this.state.isLoading}>
        {result}
      </Spin>
    );
  }
}