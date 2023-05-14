import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Spin, Button, Modal, Form, message, Input, Alert, Row, Col, Empty } from '@aurum/pfe-ui';
import { McdWorkflow } from '@mcdboss/business-components';
import { queryApplyRequestDetail, saveApplyStatus, saveApplyRequest, queryApplyRequestInit } from '@/api/oap/data_map.js';
import { getWorkflowId, getApplyOwner } from '@/api/oap/apply_form';
import querystring from "query-string";
import { optionFilterProp } from "@/utils/store/func";
import { APPLY_STATUS, APPLY_STATUS_LIST, APPLY_TYPE } from '@/constants';
import {OAP_VERSION} from '@/constants';

const sheetDirectoryForm = forwardRef((props, ref) => {
  const ApplyFormDomRef = useRef();
  const [isLoading, setLoading] = useState(true);
  const [editAbleArr, setEditAble] = useState([APPLY_STATUS.stateless, APPLY_STATUS.back, APPLY_STATUS.withdrawn]);
  const [fieldInfo, setFieldInfo] = useState({});
  const [requestId, setRequestId] = useState();
  const [disabled, setDisabled] = useState(true);
  const [tableId, setTableId] = useState();
  const [adid, setAdid] = useState();
  const [workflowId, setWorkflowId] = useState();
  const [visible, setVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState(<>
    <div>code:</div>
    <div>errMsg:</div>
  </>)
  const [emptyTips, setEmptyTips] = useState();
  const [buttonDisabled, setButtonDisabled] = useState(false);
  let config = {
    //workflowId: '79', // 工作流类型id
    title: '申请数据表权限',
    eid: '', // 当前用户的eid
    systemName: 'NOB',
    buttonText: {
      'submit': !disabled ? '提交申请' : '同意',
    },
  }, userInfoLocal = {};
  const userInfo = localStorage.getItem('USER_INFO');
  if (userInfo) {
    config = { ...config, eid: JSON.parse(userInfo)?.employeeNumber }
    userInfoLocal = JSON.parse(userInfo);
  }

  useEffect(() => {
    const { tableId, adid } = querystring.parse(props.location.search);
    if (tableId) {
      setTableId(tableId);
      setAdid(adid);
      const pathname = props.location.pathname.split('/')
      const pathType = pathname[pathname.length - 1];
      if (pathType == 'create') {
        _initCreate(tableId, adid);
      } else {
        _init(tableId, adid);
      }
    }
  }, [])

  const onAction = async ({ type, next, update }) => {
    console.log('type:', type)
    const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
    const dataNext = {
      url: {
        mobile: `https://${window.location.host}/data-h5/#/sheet?tableId=${tableId}&adid=${adid}&${OAP_VERSION}`,
        pc: window.location.origin + `/oap/sheet-directory/form?tableId=${tableId}&adid=${adid}&${OAP_VERSION}`, // 填入真实流程地址
      },
      mainData: [
        { "fieldName": "subject", "fieldValue": formData?.applySubjectName },
        { "fieldName": "employNumber", "fieldValue": formData?.applyEmployeeNumber },
        { "fieldName": "tableName", "fieldValue": formData?.applyTable },
        { "fieldName": "applyId", "fieldValue": formData?.mainId },
        { "fieldName": "bussinessCategory", "fieldValue": fieldInfo?.businessCategoryId },
        { "fieldName": "bussinessCategoryName", "fieldValue": fieldInfo?.businessCategoryName }
      ]
    }
    switch (type) {
      // 保存
      case 'submit':
        //如果是流程发起人
        if (!disabled) {
          console.log('submit 发起人')
          ApplyFormDomRef.current.getForm()?.validateFields().then(async (values) => {
            try {
              //先保存生成主键ID，后创建流程
              if (!formData.mainId) {
                setLoading(true)
                const resApplyId = await saveApplyRequest({ ...fieldInfo, ...formData });//保存申请信息  18781712595427328
                if (resApplyId.data) {
                  dataNext.mainData.forEach(mainItem => {
                    if (mainItem.fieldName == 'applyId') {
                      mainItem.fieldValue = '' + resApplyId.data
                    }
                  })
                }
              }
              await _getApplyOwner(dataNext);  //获取审批人
              //return
              next(dataNext).then(resNxt => {
                if (resNxt.success) {  //148533
                  //主键ID 即流程编号存在时，需要更新form数据
                  if (formData.mainId) {
                    updateApply({ ...formData }, () => {
                      //先update页面，再关闭loading 
                      new Promise(async (resolve) => {
                        await update();
                        resolve()
                      }).then(() => {
                        setDisabled(true)
                        setLoading(false)
                        if (!requestId) goBack();
                      })
                    })
                  } else {
                    message.success("提交申请成功");
                    goBack()
                  }
                } else {
                  setAlertMsg(<>
                    <div>code: {resNxt?.originalRes.code}</div>
                    <div>msgType: {resNxt?.originalRes.reqFailMsg.msgType}</div>
                  </>)
                  setVisible(true)
                  setLoading(false)
                }
              }).catch(err => {
                message.error(err?.msg || '流程中心接口错误');
                setLoading(false);
              })
            } catch (errInfo) {
              errInfo.msg && message.error(errInfo.msg);
              setLoading(false)
            }
          }).catch(err => {
            console.log('表单校验失败')
          })
        } else {
          console.log('submit 非发起人')
          await _getApplyOwner(dataNext);  //获取审批人
          setLoading(true);
          next(dataNext).then(res => {
            if (res.success) {
              new Promise(async (resolve) => {
                await update();
                resolve()
              }).then(() => {
                setLoading(false);
              })
            } else {
              setAlertMsg(<>
                <div>code: {res?.originalRes.code}</div>
                <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
              </>)
              setVisible(true)
              setLoading(false)
            }
          }).catch(err => {
            message.error(err?.msg || '流程中心接口错误');
            setLoading(false);
          })
        }
        break;
      // 回退
      case 'back':
        setLoading(true)
        next(dataNext).then((res) => {
          if (res.success) {
            reEditStatus(APPLY_STATUS.back, update);
          } else {
            setAlertMsg(<>
              <div>code: {res?.originalRes.code}</div>
              <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
            </>)
            setVisible(true)
            setLoading(false)
          }
        }).catch(err => {
          message.error(err || err?.msg || '流程中心接口错误');
          setLoading(false)
        })
        break;
      case 'withdraw':
        Modal.confirm({
          title: "撤回流程",
          content: (<>是否撤回流程？<br />撤回后可重新发起</>),
          cancelText: "取消",
          okText: "撤回",
          onOk: () => {
            setLoading(true)
            next(dataNext).then((res) => {
              if (res.success) {
                reEditStatus(APPLY_STATUS.withdrawn, update);
              } else {
                setAlertMsg(<>
                  <div>code: {res?.originalRes.code}</div>
                  <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
                </>)
                setVisible(true)
                setLoading(false)
              }
            }).catch(err => {
              message.error(err || err?.msg || '流程中心接口错误');
              setLoading(false)
            })
          },
          onCancel: () => {
            setLoading(false)
          }
        })
        break;
    }
  };

  const _init = async (tableId, adid) => {
    setLoading(true);
    try {
      const res = await Promise.all([getWorkflowId(1), queryApplyRequestDetail({ tableId, adid })]);
      if (res[1] && res[1].data) {
        setFieldInfo(res[1]?.data || {})
        if ((res[1].data?.requestId ?? '') !== '') {
          console.log('2323', res[1])
          setRequestId(res[1].data?.requestId)
          handleDiabled(res[1].data?.applyStatus, '' + res[1].data?.applyEmployeeNumber);
        } else {
          //setButtonDisabled(true)
          setDisabled(false)
        }
      }
      if (res[0].data) {
        setWorkflowId(res[0].data?.value)
      }
      setLoading(false)
    } catch (errInfo) {
      console.log('_init', errInfo)
      setEmptyTips(errInfo && errInfo.msg)
      setLoading(false)
    }
  }

  const _initCreate = async (tableId, adid) => {
    setLoading(true);
    try {
      const res = await Promise.all([getWorkflowId(1), queryApplyRequestInit({ tableId, adid })]);
      if (res[1] && res[1].data) {
        setFieldInfo(res[1]?.data || {})
        setDisabled(false)
      }
      if (res[0].data) {
        setWorkflowId(res[0].data?.value)
      }
      setLoading(false)
    } catch (errInfo) {
      setLoading(false)
    }
  }

  //获取审批人
  const _getApplyOwner = async (dataNext) => {
    try {
      const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
      const resApplyOwner = await getApplyOwner({
        applyInfo: [{ id: formData?.applyTableId, type: APPLY_TYPE.data }],
        businessCategoryId: formData?.businessCategoryId,
        applyType: APPLY_TYPE.data
      })
      if (resApplyOwner.data) dataNext.mainData.push({ fieldName: 'ownerEmplNumber', fieldValue: resApplyOwner.data })
    } catch (err) {
      console.log('err = ', err);
      message.warning(err.msg || '流程失败！');
      setLoading(false);
    }
  }

  const reEditStatus = async (backStatus, callback) => {
    setLoading(true);
    const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
    try {
      const res = await saveApplyStatus({ tableId, adid, backStatus });
      if (res.msg == 'success') {
        message.success(optionFilterProp(APPLY_STATUS_LIST, 'value', backStatus)?.label + '成功');
        new Promise(async (resolve) => {
          await callback && callback();
          resolve()
        }).then(() => {
          handleDiabled(backStatus, '' + formData.applyEmployeeNumber);
          setLoading(false);
        })
      }
    } catch (errInfo) {
      setAlertMsg(<>
        <div>接口:/table/apply/back</div>
        <div>code: {errInfo.code}</div>
        <div>msgType: {errInfo.msg}</div>
      </>)
      setVisible(true)
      setLoading(false)
    }
  }

  const handleDiabled = (applyStatus, applyEmployeeNumber) => {
    if (editAbleArr.includes(Number(applyStatus)) && isOriginator(applyEmployeeNumber)) {
      setDisabled(false)
    }
  }

  //判断是否是流程发起人
  const isOriginator = (applyEmployeeNumber) => {
    let result = true;
    if (applyEmployeeNumber !== userInfoLocal?.employeeNumber) {
      result = false;
    }
    return result;
  }

  const updateApply = async (params, callBack) => {
    saveApplyRequest({
      ...fieldInfo,
      ...params
    }).then(res => {
      if (res.msg == 'success') {
        message.success('申请成功');
        callBack && callBack()
      }
    }).catch(err => {
      message.error(err?.msg || '更新数据目录form表单接口报错');
      setLoading(false);
    })
  }

  const goBack = () => {
    props.history.go(-1)
  }

  const renderWorkflow = () => {
    if ((workflowId ?? '') === '') {
      return <Empty ><div>{emptyTips}</div></Empty>
    } else if (!requestId) {
      return <McdWorkflow
        workflowId={workflowId}
        {...config}
        onAction={onAction}
        buttonVisible={{ 'save': false, 'back': false, 'withdraw': false }}
        buttonDisabled={buttonDisabled}
        footerRightSlot={<Button onClick={goBack}>返回</Button>}
        className="oap-McdWorkflow">
        <ApplyFormDom ref={ApplyFormDomRef} fieldInfo={fieldInfo} disabled={disabled} />
      </McdWorkflow>
    } else {
      return <McdWorkflow
        workflowId={workflowId}
        {...config}
        requestId={requestId}
        onAction={onAction}
        buttonVisible={{ 'save': false }}
        footerRightSlot={<Button onClick={goBack}>返回</Button>}
        className="oap-McdWorkflow">
        <ApplyFormDom ref={ApplyFormDomRef} fieldInfo={fieldInfo} disabled={disabled} requestId={requestId} />
      </McdWorkflow>
    }
  }

  return <Spin spinning={isLoading}>
    {buttonDisabled && !requestId ? <Alert message="流程异常，请联系OAP管理员" type="error" /> : null}
    {visible ? (
      <Alert message="数据目录审批流程" description={alertMsg} type="error" closable />
    ) : null}
    {renderWorkflow()}
  </Spin>
})

const ApplyFormDom = forwardRef((props, ref) => {
  const { fieldInfo, disabled, requestId } = props;
  const [formApply] = Form.useForm();
  const formApplyRef = useRef();
  // 暴露组件的方法
  useImperativeHandle(ref, () => ({
    getForm: () => {
      return formApply
    }
  }))

  useEffect(() => {
    console.log('useEffect child', disabled)
  }, [disabled])

  return <div style={{ background: '#fff', padding: '0 16px' }}>
    <div className='oap-mcd-workflow-box-title'>申请信息</div>
    <Form
      form={formApply}
      ref={formApplyRef}
      initialValues={fieldInfo}
      labelCol={{ flex: '86px' }}
      className='oap-form-labelBold'>
      {requestId && <Row><Col span={12}>
        <Form.Item label="流程编号" style={{ marginBottom: '0' }}>
          <span className="ant-form-text">{fieldInfo?.mainId}</span>
        </Form.Item>
      </Col></Row>}
      <Row>
        <Col span={12}>
          <Form.Item label="申请账号" style={{ marginBottom: '0' }}>
            <span className="ant-form-text">{fieldInfo?.applyAdid}</span>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Form.Item label="数据主题" style={{ marginBottom: '0' }}>
            <span className="ant-form-text">{fieldInfo?.applySubjectName}</span>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Form.Item label="申请表名" style={{ marginBottom: '6px' }}>
            <span className="ant-form-text">{fieldInfo?.applyTable}</span>
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Form.Item label="申请用途" name="applyReason" rules={[{ required: true, message: '请输入申请用途' }]}>
            <Input.TextArea rows={4} placeholder="请输入申请用途" maxLength={500} showCount disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <Col span={12}>
          <Form.Item label="业务目标" name="applyTarget" rules={[{ required: true, message: '请输入可达成的业务目标' }]}>
            <Input.TextArea rows={4} placeholder="请输入可达成的业务目标" maxLength={500} showCount disabled={disabled} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </div>
})

export default sheetDirectoryForm;