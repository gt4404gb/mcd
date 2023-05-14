import React from 'react';
import { IconMessageB } from '@aurum/icons';
import { message, Popover, Modal } from '@aurum/pfe-ui';
import { cancelAutoNotice, getMessageInfos } from '@/api/oap/self_analysis.js';

export default class autoNotice extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isClick: false,
      clicked: false
    }
  }

  //取消自动提示
  cancelAutoPrompt = async () => {
    try {
      let res = await cancelAutoNotice({ modelId: this.props.modelId })
      res.msg == 'success' && message.success('新通知将不再自动提示');
      this.props.openChange && this.props.openChange(false, false);
    } catch (errInfo) {
      errInfo.msg && message.error(errInfo.msg);
    }
  }

  handleOpenChange = (newOpen) => {
    console.log('onOpenChange')
    //this.props.openChange && this.props.openChange(newOpen, this.props.noticeData?.auto);
  }

  handleShow = () => {
    console.log('handleShow')
    if (this.state.isClick) return
    this.setState({ isClick: true })
    getMessageInfos({ modelId: this.props.modelId }).then(res => {
      this.props.openChange && this.props.openChange(false, this.props.noticeData?.auto);
      Modal.info({
        width: 600,
        className: 'oap-autonotice-modal',
        title: res.data.title,
        content: <div dangerouslySetInnerHTML={{ __html: res.data.content }}></div>,
        onOk: () => {
          this.setState({ isClick: false })
        }
      })
    }).catch(errInfo => {
      errInfo.msg && message.error(errInfo.msg);
    })
  }

  render () {
    const { noticeData } = this.props;
    return <>
      {noticeData.visible ? <Popover
        placement="right"
        trigger="click"
        color="#000"
        content={<>
          <div className="notice-content">有新的通知，点击图标查看</div>
          {noticeData?.auto && <div className="notice-content-btn">
            <span onClick={this.cancelAutoPrompt}>不再提示</span>
          </div>}
        </>}
        getPopupContainer={trigger => trigger.parentNode}
        duration={5}
        open={noticeData.defaultOpen}
        onOpenChange={this.handleOpenChange}
        overlayInnerStyle={{ width: '180px' }}>
        <IconMessageB onClick={this.handleShow} />
      </Popover> : null}
    </>
  }
}