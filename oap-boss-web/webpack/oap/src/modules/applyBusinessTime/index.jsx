import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Button, Spin, Modal, message, Alert, Empty } from "@aurum/pfe-ui";
import { McdWorkflow } from '@mcdboss/business-components';
import { getWorkflowId, getApplyOwner } from '@/api/oap/apply_form';
import { optionFilterProp } from "@/utils/store/func";
import querystring from "query-string";
import "moment/locale/zh-cn";
import ApplyView from './components/ApplyView'
import { } from "@/api/oap/registration_report";
import { IconExclamationCircle } from '@aurum/icons';
import {
    changeStatus,
    updateReportById,
    reportRange,
    againApply,
    getMainId,
    applyAuth
} from "@/api/oap/registration_report";
import { APPLY_STATUS, APPLY_STATUS_LIST, APPLY_TYPE } from '@/constants';
import {OAP_VERSION} from '@/constants';

const ApplyBusinessTime = forwardRef((props, ref) => {
    // 存储workflowId 工作类型id
    const [workflowId, setWorkflowId] = useState()
    // 加载中
    const [isLoading, setLoading] = useState(true)
    // 存储详情数据
    const [fieldInfo, setFieldInfo] = useState({});
    // 接受子组件ref的useImperativeHandle返回
    const ApplyFormDomRef = useRef()
    // 获取主表ID
    const [processId, setProcessId] = useState();
    // 创建还是审核判断
    const [disabled, setDisabled] = useState(true);
    // 判断requestID是否存在
    const [requestId, setRequestId] = useState(false);
    // 审批状态
    const [editAbleArr, setEditAble] = useState([APPLY_STATUS.stateless, APPLY_STATUS.back, APPLY_STATUS.withdrawn]);
    // 提示框是否显示
    const [visible, setVisible] = useState(false);
    // 当关键字段被修改弹出提示框
    const [alertMsg, setAlertMsg] = useState(<>
        <div>code:</div>
        <div>errMsg:</div>
    </>)
    // requsetId不存在显示状态异常处理
    const [errorState, setErrorState] = useState(false)
    // 限制初次渲染
    const [firstRender, setFirstRender] = useState(false)
    const [emptyTips, setEmptyTips] = useState();
    // 路由信息
    // const idValue = querystring.parse(props.location.search)
    let config = {
        title: '报告权限审批流程',
        eid: '', // 当前用户的eid
        systemName: 'NoB',
        buttonText: {
            'submit': !disabled ? '提交申请' : '通过',
        },
    }, userInfoLocal = {}
    const userInfo = localStorage.getItem('USER_INFO');
    if (userInfo) {
        config = { ...config, eid: JSON.parse(userInfo)?.employeeNumber }
        userInfoLocal = JSON.parse(userInfo);
    }
    useEffect(() => {
        init()
    }, [])

    useEffect(() => {
        if (firstRender) {
            refresh()
        }
    }, [disabled])

    // 检测状态进行二次刷新
    const refresh = async () => {
        try {
            setLoading(true)
            if (requestId) {
                const { mainId } = querystring.parse(props.location.search)
                let res = await Promise.all([getMainId(mainId), reportRange()])
                let reportChineseName = res[1].data.filter((item) => item.module === res[0].data.report.reportRangeModule)
                setFieldInfo({ ...res[0].data, reportChineseName: reportChineseName[0].name })
            }
            setLoading(false)
        } catch (err) {
            message.error("网络异常，请稍后重试")
            setLoading(false)
        }
    }

    const init = async () => {
        try {
            setLoading(true);
            // 获取报告id
            const idValue = querystring.parse(props.location.search)
            console.log('idValue = ', idValue);
            // 判断有无申请报告ID
            // if (idValue.mainId) {
            if (Object.prototype.hasOwnProperty.call(idValue, 'mainId')) {
                let id = idValue.mainId
                let res = await Promise.all([getWorkflowId('3_2'), getMainId(id), reportRange()])
                let reportChineseName = res[2].data.filter((item) => item.module === res[1].data.report.reportRangeModule);
                console.log('xxxxxx = ', res[1].data);
                let applyInfo_ = [];
                if (res[1].data.applyAuthMain) {
                    applyInfo_ = res[1].data.applyInfo;
                } else {
                    applyInfo_ = [{
                        type: APPLY_TYPE.report,
                        id: res[1].data.report?.id,
                    }]
                }
                setFieldInfo({ ...res[1].data, reportChineseName: reportChineseName[0].name, applyInfo: applyInfo_ })
                // 获取申请主表ID
                setProcessId(res[1].data.id)
                console.log('init', res[1].data)
                if ((res[1].data.requestId ?? '') !== '') {
                    setRequestId(res[1].data.requestId)
                    handleDiabled(res[1].data?.applyStatus, '' + res[1].data?.applyEmployeeNumber)
                    console.log('ssssssssssssss')
                    //setDisabled(false) // 改为审核状态，禁止修改
                } else {
                    setDisabled(false) //0306
                }
                // 获取流程
                setWorkflowId(res[0].data.value)
                //setErrorState(!(res[1].data.requestId) && idValue.mainId ? true : false)
                // 防止第一次进入检测到disabled状态改变再次请求数据
                setFirstRender(true)
                setLoading(false)
            } else {
                let id = idValue.id
                // 获取WorkFlowId和数据详情 还有报告范围
                let res = await Promise.all([getWorkflowId('3_2'), updateReportById(id), reportRange()])
                console.log('xxxxxx = ', res[1].data);
                // 返回对应的报告范围对象
                let reportChineseName = res[2].data.filter((item) => item.module === res[1].data.reportRangeModule)
                let applyInfo_ = [];
                if (res[1].data.applyAuthMain) {
                    applyInfo_ = res[1].data.applyInfo;
                } else {
                    applyInfo_ = [{
                        type: APPLY_TYPE.report,
                        id: res[1].data?.id,
                    }]
                }
                setFieldInfo({ ...res[1].data, reportChineseName: reportChineseName[0].name, applyInfo: applyInfo_ })
                // 获取主表ID
                //setProcessId(res[1].data.id)  //0306
                console.log('init IDDD', res[1].data)
                setDisabled(false) //0306
                // 获取流程
                setWorkflowId(res[0].data.value)
                setLoading(false);
            }
        } catch (err) {
            setLoading(false);
            message.error("网络异常，请稍后重试")
        }
    }
    //获取审批人
    const _getApplyOwner = async (dataNext) => {
        try {
            // const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
            const resApplyOwner = await getApplyOwner({
                applyInfo: [...fieldInfo.applyInfo],
                businessCategoryId: fieldInfo.businessCategoryId,
                applyType: APPLY_TYPE.report
            })
            dataNext.mainData.push({ fieldName: 'ownerEmplNumber', fieldValue: resApplyOwner.data || '' })
            return true
        } catch (err) {
            console.log('err = ', err);
            message.warning(err.msg || '流程失败！');
            setLoading(false);
        }
    }
    const onAction = async ({ type, next, update }) => {
        setLoading(true);
        // id数据存储
        let dataNext = {}
        switch (type) {
            case 'submit':
                // 判断是不是流程发起人
                if (!disabled) {
                    ApplyFormDomRef.current.getForm()?.validateFields().then(async values => {
                        try {
                            let params = {};
                            // 判断是不是再次提交修改
                            if (editAbleArr.includes(Number(fieldInfo.applyStatus))) {
                                params = {
                                    ...values,
                                    id: fieldInfo.id
                                }
                                // 获取minID数据 
                                dataNext = formatMainData(true)//0306
                            } else {
                                // 获取minID数据 
                                dataNext = formatMainData(false)  //0306
                                params = {
                                    ...values,
                                    idJson: fieldInfo.id,
                                    applyType: 1
                                }
                            }
                            console.log('sbmit::::', requestId, processId)
                            //return;
                            // 调用方法获取申请主表id
                            if (!processId) {  ///?????requestId  !requestId && isInitApplyStatus
                                let resApplyId = await applyAuth(params)
                                // 判段有无获取到主表数据
                                if (resApplyId.data) {
                                    dataNext = {
                                        ...dataNext,
                                        url: {
                                            mobile: `https://${window.location.host}/data-h5/#/apply-report?id=${resApplyId.data}&${OAP_VERSION}`,
                                            pc: window.location.origin + `/oap/apply-business-time?mainId=${resApplyId.data}&${OAP_VERSION}`, // 填入真实流程地址
                                        },
                                    }
                                    dataNext.mainData.forEach(mainItem => {
                                        if (mainItem.fieldName == 'applyId') {
                                            mainItem.fieldValue = '' + resApplyId.data
                                        }
                                    })
                                }
                            }
                            //return;
                            await _getApplyOwner(dataNext);
                            // 进入流程中心
                            next(dataNext).then(resNxt => {
                                if (resNxt.success) {
                                    //主键id 即流程编号存在时，需要更新form数据
                                    if (processId) {
                                        console.log('updateApply')
                                        updateApply({ ...params }, () => {
                                            new Promise(async (resolve) => {
                                                await update();
                                                resolve()
                                            }).then(() => {
                                                setDisabled(true)
                                                setLoading(false)
                                                if (!requestId) goBack();
                                            })
                                        });
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
                        } catch (err) {
                            console.log(err);
                            setLoading(false);
                        }
                    }).catch(err => {
                        console.log(err);
                        setLoading(false);
                    })
                } else {
                    dataNext = formatMainData(true);  //0306
                    await _getApplyOwner(dataNext);
                    next(dataNext).then(res => {
                        if (res.success) {
                            update(); // 重新渲染工作流组件
                            setLoading(false);
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
                        console.log(err);
                    })
                }
                break;
            // 退回
            case 'back':
                dataNext = formatMainData();
                await _getApplyOwner(dataNext);
                next(dataNext).then((res) => {
                    if (res.success) {
                        reEditStatus(APPLY_STATUS.back, update);
                    } else {
                        res.code && message.error(res.code);
                    }
                }).catch(res => {
                    message.error(err?.msg || '流程中心接口错误');
                    setLoading(false)
                })
                break;
            // 撤回
            case 'withdraw':
                dataNext = formatMainData(true);  //0306
                Modal.confirm({
                    title: "撤回流程",
                    content: (<>是否撤回流程？<br />撤回后可重新发起</>),
                    cancelText: "取消",
                    okText: "撤回",
                    onOk: async () => {
                        await _getApplyOwner(dataNext);
                        next(dataNext).then((res) => {
                            if (res.success) {
                                reEditStatus(APPLY_STATUS.withdrawn, update);
                            } else {
                                setAlertMsg(<>
                                    <div>code: {res?.originalRes.code}</div>
                                    <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
                                </>)
                                setVisible(true)
                            }
                        }).catch(res => {
                            message.error(err?.msg || '流程中心接口错误');
                            setLoading(false)
                        })
                    },
                    onCancel: () => {
                        setLoading(false)
                    }
                })
                break;
        }
    }

    // 修改状态
    const updateApply = (params, callBack) => {
        againApply(params).then(async res => {
            // reEditStatus(APPLY_STATUS.applying, update);
            if (res.msg == 'success') {
                callBack && callBack();
                changeStatus({ id: processId, applyStatus: APPLY_STATUS.applying })
                message.success('申请修改成功');
            }
        }).catch(err => {
            err.msg && message.error(err.msg);
            setLoading(false)
        })
    }

    // 退回撤回流程
    const reEditStatus = async (backStatus, callback) => {
        setLoading(true);
        try {
            const res = await changeStatus({ id: processId, applyStatus: backStatus });
            if (res.msg == 'success') {
                message.success(optionFilterProp(APPLY_STATUS_LIST, 'value', backStatus)?.label + '成功');
                new Promise(async (resolve) => {
                    await callback && callback();
                    resolve()
                }).then(() => {
                    handleDiabled(backStatus, '' + fieldInfo.applyEmployeeNumber);
                    setLoading(false)
                })
            }
        } catch (errInfo) {
            setLoading(false)
        }
    }

    const handleDiabled = (applyStatus, applyEmployeeNumber) => {
        // 读取发布状态 判断是否可修改报告
        if (editAbleArr.includes(Number(applyStatus)) && isOriginator(applyEmployeeNumber)) {
            setDisabled(false) //0306
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

    const formatMainData = (special) => {
        let data = {}
        data = {
            url: {
                mobile: `https://${window.location.host}/data-h5/#/apply-report?id=${processId}&${OAP_VERSION}`,
                pc: window.location.origin + `/oap/apply-business-time?mainId=${processId}&${OAP_VERSION}`, // 填入真实流程地址
            },
            mainData: [
                { fieldName: 'employNumber', fieldValue: special ? fieldInfo.applyEmployeeNumber : userInfoLocal.employeeNumber }, //用户id
                { fieldName: 'applyId', fieldValue: processId }, //主表ID
                { fieldName: 'reportType', fieldValue: fieldInfo.reportType ? fieldInfo.reportType : '在线报告', },
                { fieldName: 'module', fieldValue: special ? fieldInfo.report.reportRange?.module : fieldInfo.reportRange?.module }, //报告范围英语
                { fieldName: 'reportRangeName', fieldValue: fieldInfo.reportChineseName },//报告范围名字
                { fieldName: 'businessCategoryId', fieldValue: special ? fieldInfo.report.businessCategoryId : fieldInfo.businessCategoryId },//业务ID
                { fieldName: 'businessCategoryName', fieldValue: special ? fieldInfo.report.businessCategory?.name : fieldInfo.businessCategory?.name },//业务域名字
                { fieldName: 'reportId', fieldValue: special ? fieldInfo.report?.reportCode : fieldInfo?.reportCode },//报告编号
                { fieldName: 'reportName', fieldValue: special ? fieldInfo.applyName : fieldInfo.reportName },//报告名称
            ],
            title: `${special ? fieldInfo.applyName : fieldInfo.reportName}`
        }
        return data;
    }

    const goBack = () => {
        props.history.go(-1)
    }

    const reversBack = () => {
        Modal.confirm({
            title: <div className='oap-aurum-modal-title'>
                <IconExclamationCircle className="oap-aurum-modal-title-icon" />
                <span>离开此页面？</span>
            </div>,
            content: "离开将丢失已编辑内容，请确认是否离开？",
            cancelText: "取消",
            okText: "确定",
            onOk: () => {
                goBack()
            },
            onCancel: () => {
                setLoading(false)
            }
        })
    }

    const renderWorkflow = () => {
        if ((workflowId ?? '') === '') {
            // workflowId不存在，请联系OAP开发人员
            return <Empty><div>{emptyTips}</div></Empty>
        } else if (!requestId) {
            return <McdWorkflow
                {...config}
                onAction={onAction}
                workflowId={workflowId}
                buttonVisible={{
                    'save': false,
                    'withdraw': false,
                    'back': false
                }}
                buttonDisabled={errorState ? true : false}
                footerRightSlot={<Button onClick={reversBack}>返回</Button>}
                className="oap-McdWorkflow">
                <ApplyView ref={ApplyFormDomRef} disabled={disabled} userInfoLocal={userInfoLocal} fieldInfo={fieldInfo}></ApplyView>
            </McdWorkflow>
        } else {
            return <McdWorkflow
                {...config}
                onAction={onAction}
                workflowId={workflowId}
                requestId={requestId}
                buttonVisible={{
                    'save': false,
                }}
                footerRightSlot={<Button onClick={!disabled ? reversBack : goBack}>返回</Button>}
                className="oap-McdWorkflow">
                <ApplyView ref={ApplyFormDomRef} disabled={disabled} userInfoLocal={userInfoLocal} fieldInfo={fieldInfo}></ApplyView>
            </McdWorkflow>
        }
    }

    return (
        <Spin spinning={isLoading} wrapperClassName="report-McdWorkflow-ml8">
            {errorState ? <Alert message="流程异常，请联系OAP管理员" type="error" /> : null}
            {visible ? (
                <Alert message="报告注册审批流程" description={alertMsg} type="error" closable />
            ) : null}
            {renderWorkflow()}
        </Spin>
    )
})
export default ApplyBusinessTime