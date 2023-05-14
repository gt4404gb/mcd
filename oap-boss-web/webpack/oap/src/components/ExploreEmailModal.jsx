import React, {
  useState,
  useRef,
  useEffect,
} from 'react';
import { Spin, Modal, Form, Input, message, Button } from '@aurum/pfe-ui';
import '@/style/explore-email.less';
import { reSendPswByEmail } from '@/api/oap/commonApi.js';

const ExploreEmailModal = (props) => {
  const { visibleEmailInfo } = props;
  const myForm = useRef();
  const [emailForm] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [downResponse, setDownResponse] = useState({});
  const [sqlQueryId, setSqlQueryId] = useState('');
  let timer = null;
  let resultTimer = useRef(null);
  const handleCancelExplore = () => {
    clearTimerFn();//组件销毁时，清空定时器
    clearInterval(resultTimer.current);
    setConfirmLoading(false)
    setShowProgress(false)
    setIsComplete(false)
    setDownResponse({})
    props.onExplored({
      operation: 'cancel',
      emailStr: '',
    })
  }
  // if (!props.visibleEmailInfo && !props.isLoading && visible) {
  //   setVisible(false);
  // }
  const handleConfirmExplore = async () => {
    if (!props.isStaff) {
      await emailForm.validateFields().then((values) => {
        let emailStr = `${values.email}`;
        setShowProgress(true)
        setIsComplete(false)
        if (props?.isKylin) {
          handleStartKylin(emailStr)
          return;
        } else if (props?.needCycle) {
          handleReadySqlSearch(emailStr);
        } else {
          handleProgress(emailStr)
        }
        return emailStr;
      }).catch((info) => {
        console.log('Validate Failed:', info);
        return ''
      })
    } else {
      setShowProgress(true)
      setIsComplete(false)
      if (props?.isKylin) {
        handleStartKylin('')
        return;
      } else if (props?.needCycle) {
        handleReadySqlSearch('');
      } else {
        handleProgress('')
      }
    }
  }

  // const componentWillUnmount = () => {
  //   console.log('组件销毁了！')
  // } 

  const handleProgress = (emailStr) => {
    setConfirmLoading(true)
    const downObj = { ...props.downLoadParams, email: emailStr }
    // 显示进度条。
    let process = (progressEvent) => {
      let complete = (progressEvent.loaded / progressEvent.total * 100 | 0);
    };
    props.downLoadApi(downObj, process, props?.downLoadUrl || '').then(res => {
      if (res.code == '00000') {
        setIsComplete(true)
        setConfirmLoading(false)
        setDownResponse(res.data)
      }
    }).catch(err => {
      message.error('下载失败');
      setConfirmLoading(false)
      setShowProgress(false)
    })
  }

  const handleStartKylin = (emailStr) => {
    setConfirmLoading(true)
    const downObj = { ...props.downLoadParams, email: emailStr }
    props.downLoadApi.start(downObj, props?.downLoadUrl || '').then(res => {
      if (res.code == '00000') {
        //downloadStatus = 2表示文件写入完成可以调用下载文件接口， 1表示文件写入中，继续轮询， 3表示下载失败
        if (res.data.downloadStatus == 2) {
          handleProgressKylin(res.data.id, emailStr)
        } else if (res.data.downloadStatus == 1) {
          setTimerFn(res.data.id, emailStr)
        } else {
          message.error('kylin下载生成文件失败');
        }
      }
    }).catch(err => {
      message.error('kylin下载生成文件失败');
      setConfirmLoading(false)
      setShowProgress(false)
    })
  }

  const handleProgressKylin = (id, emailStr) => {
    setConfirmLoading(true)
    const downObj = { id, email: emailStr }
    // 显示进度条。
    let process = (progressEvent) => {
      let complete = (progressEvent.loaded / progressEvent.total * 100 | 0);
    };
    props.downLoadApi.down(downObj, process).then(res => {
      if (res.code == '00000') {
        setIsComplete(true)
        setConfirmLoading(false)
        setDownResponse(res.data)
      }
    }).catch(err => {
      message.error('下载失败');
      setConfirmLoading(false)
      setShowProgress(false)
    })
  }

  const handleReadySqlSearch = async (emailStr) => {
    setConfirmLoading(true);
    const downObj = {...props.downLoadParams};
    let sqlId = await props.downLoadId(downObj, {});
    downObj['sqlQueryResultId'] = sqlId.data.id;
    sqlId?.data?.id && setSqlQueryId(sqlId.data.id)
    let firstReady = await props.cycleFun(downObj, {});
    if (firstReady.data == false) {
      let timer = () => {
        if (resultTimer.current) {
          clearInterval(resultTimer.current);
        }
        resultTimer.current = setInterval(async () => {
          let res = await props.cycleFun(downObj, {});
          if (res.data == true) {
            clearInterval(resultTimer.current);
            setIsComplete(true)
            setConfirmLoading(false)
            // let resSqlQuery = await props.downLoadApi({...downObj, email: emailStr});
            // if (resSqlQuery.code = '00000') {
            //   setIsComplete(true)
            //   setConfirmLoading(false)
            //   setDownResponse(resSqlQuery.data)
            // }
          }
        }, 5000)
      }
      timer();
    } else {
      setIsComplete(true)
      setConfirmLoading(false)
      // let resSqlQuery = await props.downLoadApi({...downObj, email: emailStr});
      // if (resSqlQuery.code = '00000') {
      //   setIsComplete(true)
      //   setConfirmLoading(false)
      //   setDownResponse(resSqlQuery.data)
      // }
    }
  }

  const setTimerFn = (id, emailStr) => {
    timer = setInterval(() => {
      handlePollKylin(id, emailStr)
    }, 4000)
  }

  const clearTimerFn = () => {
    clearInterval(timer)
  }

  const handlePollKylin = (id, emailStr) => {
    props.downLoadApi.poll({ id }).then(res => {
      if (res.code == '00000') {
        //downloadStatus = 2表示文件写入完成可以调用下载文件接口， 1表示文件写入中，继续轮询， 3表示下载失败
        if (res.data.downloadStatus == 2) {
          clearTimerFn();//组件销毁时，清空定时器
          handleProgressKylin(res.data.id, emailStr)
        } else if (res.data.downloadStatus == 3) {
          message.error('kylin下载生成文件失败');
        }
      }
    }).catch(err => {
      message.error(err?.errorInfo || 'kylin下载，查询后台文件写入状态失败');
      setConfirmLoading(false)
      setShowProgress(false)
    })
  }

  const handleManualDownload = async () => {
    if (props.needCycle) {
      const downObj = {...props.downLoadParams};
      let emailStr = emailForm.getFieldValue('email') || '';
      let resSqlQuery = await props.downLoadApi({...downObj, email: emailStr, sqlQueryResultId: sqlQueryId });
      if (resSqlQuery.code = '00000') {
        setDownResponse(resSqlQuery.data)
        props.onExplored({
          operation: 'ok',
          downResponse: resSqlQuery.data,
        })
      }
    } else {
      props.onExplored({
        operation: 'ok',
        downResponse
      })
    }
  }

  const reSend = async () => {
    let emailStr = '';
    if (!props.isStaff) {
      await emailForm.validateFields().then(values => {
        emailStr = `${values.email}`;
      }).catch((info) => { })
    }
    try {
      const res = await reSendPswByEmail({ email: emailStr })
      if (res.msg == "success") {
        message.success('邮件已成功发送，请查收');
      }
    } catch (err) {
      err.msg && message.error(err.msg);
    }
  }

  useEffect(() => {
    return () => {
      clearTimerFn();//组件销毁时，清空定时器
    }
  }, [])

  return (
    <Modal
      className="explore-email-modal"
      title="导出数据"
      width={436}
      visible={visibleEmailInfo}
      onCancel={handleCancelExplore}
      footer={[
        <Button key="ok" type="primary" loading={confirmLoading} onClick={handleConfirmExplore}>
          生成文件
        </Button>,
        <Button key="cancel" onClick={handleCancelExplore}>
          取消
        </Button>,
        (showProgress ? <div key="progress" className='explore_data_email_progress'>
          < p className="title">文件进度</p >
          <p className="text">{isComplete ? <>已完成，<a onClick={handleManualDownload}>点击下载</a>获取文件</> : '正在生成下载文件，请在完成后点击下载……'}</p>
        </div> : null)
      ]}>
      <Spin spinning={confirmLoading}>
        <div className='explore_data_email_description'>
          <div className='title_content'>
            <div className='title_item'>
              根据Data Governance要求，导出数据文件已<b>进行加密</b>，文件密码将通过邮件发送
              {props.isStaff ? <>至<b>当前账号邮箱</b>。</> : '，请指定cn.mcd.com邮箱进行接受。'}<br />
              密码有效期<b>24小时</b>，有效期内所有下载数据<b>均使用同一密码</b>。
            </div>
            <div className='title_item item_center'>（若邮件接收失败，点击<a onClick={reSend}>重新发送</a>）</div>
          </div>
          {props.isStaff ? null : <Form
            form={emailForm}
            ref={myForm}>
            <Form.Item
              name="email"
              label="麦当劳邮箱"
              rules={[
                {
                  required: true,
                  message: '请输入麦当劳邮箱',
                  validator: (rule, value, cb) => {
                    if ((value ?? '') !== '') {
                      if (value.replace(/\s+/g, "").length === 0) {
                        return Promise.reject('您输入的全部是空格，请重新输入');
                      } else {
                        return Promise.resolve();
                      }
                    } else {
                      // cb('请输入麦当劳邮箱')
                      return Promise.reject('请输入麦当劳邮箱')
                    }
                  }
                }
              ]}
            >
              <Input
                placeholder='请输入麦当劳邮箱'
                maxLength={30}
                allowClear
                addonAfter="@cn.mcd.com" />
            </Form.Item>
          </Form>
          }
        </div>
      </Spin>

    </Modal >
  )
}

export default ExploreEmailModal;