import React, { useState, useRef, useEffect, forwardRef } from 'react';
import {
    Spin, Form, Input, Select, Button, Row, Col, Upload, IconFont, Modal, Alert,
} from '@aurum/pfe-ui';
import {
    IconFile
} from '@aurum/icons';
import '@/style/demand-dashboard.less';
import { uploadDataFile, downloadFile, downloadFileJira } from '@/api/oap/commonApi';
import querystring from "query-string";
import { message } from 'antd';
import {
    getLabel,
    getDataBP,
    getProductManager,
    getDemandBUOptions,
    // createDemandItem,
    // getDetailById,
    getApplyDetailById,
    updateDemandFormData,
    modifyWorkflowStatus,
    // getWorkflowNodeInfo,
    getCurEnvNodeId,
} from '@/api/oap/demand_dashboard';
import { getWorkflowId } from '@/api/oap/apply_form';
import { APPLY_TYPE, APPLY_MAINDATA, APPLY_STATUS, APPLY_STATUS_LIST } from '@/constants';
import { optionFilterProp } from "@/utils/store/func";
import { McdWorkflow } from '@mcdboss/business-components';
import { saveAs } from 'file-saver';
import {OAP_VERSION} from '@/constants';

const userInfo = localStorage.getItem('USER_INFO');

const DemandForm = forwardRef((props, ref) => {
    let curEnv = process.env.NODE_ENV;
    console.log('curEnv = ', curEnv);
    const demandFormRef = useRef();
    const formForwardRef = useRef();
    // const [pageStatus, setPageStatus] = useState('disabled');
    const [loading, setLoading] = useState(false);
    const [buOptions, setButOptions] = useState([]);
    const [labelOptions, setLabelOptions] = useState([]);
    const [databpOptions, setDatabpOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [data, setData] = useState({});
    const [defaultFileList, setDefaultFileList] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [workflowId, setWorkflowId] = useState('');
    const [requestId, setRequestId] = useState('');
    const [disabled, setDisabled] = useState(true);
    const editAbleArr = [APPLY_STATUS.stateless, APPLY_STATUS.back, APPLY_STATUS.withdrawn];
    const [visible, setVisible] = useState(false);
    const [alertMsg, setAlertMsg] = useState(<>
        <div>code:</div>
        <div>errMsg:</div>
    </>)

    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [locationSearch, setLocationSearch] = useState({
        ...querystring.parse(props.location.search)
    })
    const [config, setConfig] = useState({
        title: `需求提交审批流程`,
        eid: '',
        systemName: 'NoB',
    })
    // const [userInfoLocal, setUserInfoLocal] = useState({});
    // let userInfoLocal = {};
    const [curNodeId, setCurNodeId] = useState('');
    const [nodeInfo, setNodeInfo] = useState({});
    const [flowStatus, setFlowStatus] = useState('start'); // 还有个是 end
    // let config = {
    //     title: `需求提交审批流程`,
    //     eid: '',
    //     systemName: 'NoB',
    // }, userInfoLocal = {};
    let userInfoLocal = JSON.parse(userInfo) || {};
    useEffect(() => {
        if (userInfo) {
            // config = { ...config, eid: JSON.parse(userInfo)?.employeeNumber }
            setConfig({
                ...config,
                eid: JSON.parse(userInfo)?.employeeNumber
            })
            // setUserInfoLocal({
            //     ...JSON.parse(userInfo)
            // })
            getCurEnvNodeId().then(res => {
                console.log('当前环境的nodeId = ', res);
                let obj = {};
                if (res && res.data) {
                    res.data.forEach(item => {
                        obj[item.value] = item.label;
                    })
                }
                console.log('obj = ', obj);
                setNodeInfo(obj);
            })
            getApplyDetailById(locationSearch.id).then(res => {
                console.log('detail 888 = ', res.data);
                let item = res.data.form;
                let file_list = [];
                if (item.issueKey) {
                    setFlowStatus('end'); // 表示该流程已上传到jira了
                    // file_list = [...item.jiraAttachment];
                    file_list = item.jiraAttachment.map(it => {
                        return {
                            ...it,
                            name: it.fileName
                        }
                    })
                } else {
                    // file_list = [...item.enclosureFiles];
                    file_list = item.enclosureFiles.map(it => {
                        return {
                            ...it,
                            name: it.fileName
                        }
                    })
                }
                let form_edit_data = {
                    issueName: item.issueName,
                    bu: item.bu,
                    demandValue: item.demandValue,
                    demandContent: item.demandContent,
                    enclosures: file_list, // item.enclosureFiles || [],
                    employeeNumber: res.data.employeeNumber,
                };
                setData(form_edit_data);
                setDefaultFileList(file_list || []);
                if (res.data.nodeId) {
                    setCurNodeId(res.data.nodeId)
                }
                if ((res.data.requestId ?? '') !== '') {
                    setRequestId(res.data.requestId);
                    handleDiabled(res.data.applyStatus, `${res.data.employeeNumber}`);
                } else {
                    //setButtonDisabled(true);
                    // setPageStatus(false);
                    setDisabled(false);
                }
                setLocationSearch({
                    ...locationSearch,
                    ...res.data,
                })
                getWorkflowId(APPLY_TYPE.demandCode).then(res => {
                    setWorkflowId(res.data.value);
                    // getWorkflowNodeInfo({
                    //     mainId: locationSearch.id,
                    //     workflowId: res.data.value,
                    // }).then(res2 => {
                    //     console.log('当前节点的info = ', res2);
                    //     if (res2.data.list && res2.data.list.length > 0) {
                    //         let nodeId = res2.data.list.shift().nodeId; 
                    //         console.log('nodeId。x.x = ', res2.data.list.shift());
                    //         console.log('nodeId = ', nodeId);
                    //         setCurNodeId(nodeId);
                    //     }
                    // }).catch((err) => {
                    //     console.log('出错了？')
                    // })
                })
            }).catch(err => {
                message.error(err.msg)
            })
            getDemandBUOptions().then(res => {
                setButOptions([...res.data]);
            }).catch(() => {
            })
            // getLabel().then(res => {
            //     setLabelOptions([...res.data]);
            // })
            getDataBP().then(res => {
                let list = [];
                res.data.forEach(it => {
                    list.push({
                        ...it,
                        value: it.adid,
                    })
                })
                setDatabpOptions(list);
            })
            getProductManager().then(res => {
                let list = [];
                res.data.forEach(it => {
                    list.push({
                        ...it,
                        value: it.adid,
                    })
                })
                setProductOptions(list);
            })
        }
    }, []);
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
        console.log('是不是本人 = ', result);
        return result;
    }
    const downLoadDom = () => {
        let dom = null;
        if (defaultFileList && defaultFileList.length) {
            if (flowStatus === 'end') {
                dom = defaultFileList.map(it => {
                    return <Button key={it.id} type="link" onClick={() => downFileJira(it)} icon={<IconFile />}>{it.filename}</Button>
                })
            } else {
                dom = defaultFileList.map(it => {
                    return <Button key={it.id} type="link" onClick={() => downFile(it)} icon={<IconFile />}>{it.fileName}</Button>
                })
            }
        }
        return dom;
    }
    const normFile = (e) => {
        console.log('Upload event:', e);
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };
    const beforeUploadCustom = (props) => {
        setLoading(true);
        console.log('prorps = ', props);
        let file = props.file;
        uploadDataFile('OAP_DEMAND', file).then(res => {
            setLoading(false);
            console.log('res = ', res);
            message.success("上传成功");
            file.id = res.data.id;
            console.log('file = ', file);
            setDefaultFileList([...defaultFileList, file]);
        }).catch(() => {

        })
    }
    const handleUploadChange = ({ file, fileList, event }) => {
        if (file.size / 1024 / 1024 <= 5) {
            if (file.status !== 'uploading') {
                console.log('fileList = ', fileList);
                setDefaultFileList([...fileList]);
            }
            let formData = demandFormRef.current.getFieldsValue();
            console.log('formData = ', formData);
        }
    }

    const submitDemand = () => {
        demandFormRef.current.validateFields().then(() => {
            setSubmitLoading(true);
            setLoading(true);
            let formData = demandFormRef.current.getFieldsValue();
            console.log('formData = ', formData);
            let file_ids = [];
            defaultFileList.forEach(it => {
                it.id && file_ids.push(it.id);
            });
            let payload = {
                issueName: formData.issueName,
                bu: formData.bu,
                demandValue: formData.demandValue,
                demandContent: formData.demandContent,
                enclosures: [...file_ids],
            }
            createDemandItem(payload).then(res => {
                message.success('需求提交成功！');
                onBack();
            }).catch((err) => {
                message.warning(err || err.msg)
            }).finally(() => {
                setSubmitLoading(false);
                setLoading(false);
            })
        })
    }
    const getScrollTop = () => {
        document.querySelector('.pfe-tabs-content-top').scrollTo(0, 0)
    }
    const onBack = () => {
        props.history.go(-1);
    }
    const downFile = (fileData) => {
        setLoading(true);
        downloadFile(fileData.id).then(res => {
            // const url = fileData.link;
            // const link = document.createElement('a');
            // link.style.display = 'none';
            // link.href = url;
            // let downName = fileData.fileName.replace(/"|'/g, '');
            // link.setAttribute('download', downName);
            // document.body.appendChild(link)
            // link.click();
            // document.body.removeChild(link);

            // const blob = new Blob([res.data.fileBlob], { type: 'application/octet-stream' })
            const blob = res.data.fileBlob;
            let downName = res.data.fileName.replace(/"/g, '');
            saveAs(blob, downName);
            message.success("文件下载成功！")
        }).catch(err => {
            message.error('下载失败');
        }).finally(() => {
            setLoading(false)
        })
    }
    const downFileJira = (fileData) => {
        setLoading(true);
        downloadFileJira(fileData.id).then(res => {
            const blob = res.data.fileBlob;;
            let downName = fileData.filename;
            saveAs(blob, downName);
            message.success("文件下载成功！")
        }).catch(err => {
            message.error('下载失败');
        }).finally(() => {
            setLoading(false)
        })
    }
    const reEditStatus = async (id, backStatus, callback) => {
        setLoading(true);
        const formData = demandFormRef.current.getFieldsValue(true);
        try {
            const res = await modifyWorkflowStatus(id, backStatus);
            if (res.msg == 'success') {
                message.success(optionFilterProp(APPLY_STATUS_LIST, 'value', backStatus)?.label + '成功');
                new Promise(async (resolve) => {
                    await callback && callback();
                    resolve()
                }).then(() => {
                    setLoading(false)
                })
            }
        } catch (errInfo) {
            console.log('reEditStatus 400', errInfo)
            setAlertMsg(<>
                <div>接口:/demand/apply/change/status</div>
                <div>code: {errInfo.code}</div>
                <div>msgType: {errInfo.msg}</div>
            </>)
            setVisible(true)
            setLoading(false)
        }
    }
    const formatMainData = () => {
        const formData = demandFormRef.current.getFieldsValue(true);
        let _preAuditor = process.env.NODE_ENV == 'production' ? '15209051' : '15365662';// 'cn-petelei': 'cn-joyceli';
        let payload = {
            employNumber: formData.employeeNumber,
            applyId: locationSearch.id,
            preAuditor: _preAuditor,
            transferAuditor: '',
            requestName: formData.issueName,
            businessFunction: formData.bu,
            requestValue: formData.demandValue,
            requestContent: formData.demandContent,
            jiraLink: '',
        };
        let f_list = [];
        Object.keys(payload).forEach(field => {
            field && f_list.push({
                fieldName: field,
                fieldValue: payload[field]
            })
        })
        let obj = {
            url: {
                mobile: `https://${window.location.host}/data-h5/#/demand-apply?id=${locationSearch?.id}&${OAP_VERSION}`,
                pc: window.location.origin + `/oap/demand/apply-form?id=${locationSearch.id}&${OAP_VERSION}`
            },
            mainData: f_list,
            title: `${formData.issueName}`,
        }
        return obj;
    }
    // const needSyncTitle = (e) => {
    //     console.log('e = ', e);
    //     setConfig({
    //         ...flowConfig,
    //         title: `【需求申请】-- ${e.currentTarget.value}`
    //     })
    // }
    const onAction = async ({ type, next, update }) => {
        console.log('workflowId = ', workflowId);
        let formData = demandFormRef.current.getFieldsValue();
        if (type == 'submit') { // 同意
            if (!disabled) {
                demandFormRef.current.validateFields().then(() => {
                    setSubmitLoading(true);
                    setLoading(true);
                    console.log('formData = ', formData);
                    let file_ids = [];
                    defaultFileList.forEach(it => {
                        it.id && file_ids.push(it.id);
                    });
                    let payload = {
                        issueName: formData.issueName,
                        bu: formData.bu,
                        demandValue: formData.demandValue,
                        demandContent: formData.demandContent,
                        enclosures: [...file_ids],
                    }
                    updateDemandFormData(locationSearch.id, payload).then(res => {
                        console.log('res = ', res);
                        let _preAuditor = process.env.NODE_ENV == 'production' ? '15209051' : '15365662'; // 'cn-petelei': 'cn-joyceli';
                        let payload = {
                            employNumber: res.data.applyEmployeeNumber,
                            applyId: res.data.id,
                            preAuditor: _preAuditor,
                            transferAuditor: '',
                            requestName: res.data.applyName,
                            businessFunction: formData.bu,
                            requestValue: res.data.applyReason,
                            requestContent: res.data.applyTarget,
                            jiraLink: '',
                        };
                        let f_list = [];
                        Object.keys(payload).forEach(field => {
                            field && f_list.push({
                                fieldName: field,
                                fieldValue: payload[field]
                            })
                        })
                        let obj = {
                            url: {
                                mobile: `https://${window.location.host}/data-h5/#/demand-apply?id=${locationSearch?.id}&${OAP_VERSION}`,
                                pc: window.location.origin + `/oap/demand/apply-form?id=${res.data.id}&${OAP_VERSION}`
                            },
                            mainData: f_list,
                            title: `${formData.issueName}`,
                        }
                        console.log('obj = ', obj);
                        next(obj).then(resNxt => {
                            console.log('resNxt = ', resNxt);
                            if (resNxt.success) {
                                new Promise(async (resolve) => {
                                    await update();
                                    message.success('需求申请提交成功！');
                                    resolve()
                                }).then(() => {
                                    setDisabled(true)
                                    setLoading(false)
                                    setDisabled(true)
                                    // setPageStatus(true)
                                    onBack();
                                })
                            } else {
                                setAlertMsg(<>
                                    <div>code: {resNxt?.originalRes.code}</div>
                                    <div>msgType: {resNxt?.originalRes.reqFailMsg.msgType}</div>
                                </>)
                                setVisible(true)
                                setLoading(false)
                            }
                        }).catch(err => {
                            message.error(err || err.msg || '流程中心接口错误');
                        }).finally(() => {
                            setSubmitLoading(false);
                            setLoading(false);
                        })
                    }).catch((err) => {
                        message.warning(err || err.msg)
                    }).finally(() => {
                        // setSubmitLoading(false);
                        // setLoading(false);
                    })
                }).catch(() => {
                    console.log('表单错误')
                })
            } else {
                let dataNext = formatMainData();
                // 715：申请人。716：部门经理。717：产品经理
                let addNum = nodeInfo[curNodeId]; // curEnv === 'development' ? 0: curEnv === 'production' ? 0: 16;
                if (addNum == `productManager`) {
                    Modal.confirm({
                        title: "同意流程",
                        content: (<Form
                            ref={formForwardRef}
                            labelCol={{ flex: '100px' }}
                        >
                            {/* <Form.Item name="labels" label="标签" rules={[
                                {
                                    required: true,
                                    message: '请填写标签名称'
                                }
                            ]}>
                                <Select
                                    mode="multiple"
                                    placeholder='请选择标签'
                                    allowClear
                                    options={labelOptions}
                                ></Select >
                            </Form.Item > */}
                            <Form.Item name="productManager" label="产品经理" rules={[
                                {
                                    required: true,
                                    message: '请选择产品经理'
                                }
                            ]}>
                                <Select
                                    showSearch
                                    placeholder='请选择产品经理'
                                    allowClear
                                    options={productOptions}
                                ></Select >
                            </Form.Item >
                            <Form.Item name="dataBpName" label="Data BP(抄送)" rules={[
                                {
                                    required: true,
                                    message: '请选择Data BP'
                                }
                            ]}>
                                <Select
                                    showSearch
                                    placeholder='请选择Data BP'
                                    allowClear
                                    options={databpOptions}
                                ></Select>
                            </Form.Item>
                        </Form >),
                        cancelText: "取消",
                        okText: "同意",
                        onOk: () => {
                            formForwardRef.current.validateFields().then(() => {
                                setLoading(true);
                                let file_ids = [];
                                defaultFileList.forEach(it => {
                                    it.id && file_ids.push(it.id);
                                });
                                let formDataDemand = demandFormRef.current.getFieldsValue();
                                let formDataForward = formForwardRef.current.getFieldsValue();
                                let payload = {
                                    issueName: formDataDemand.issueName,
                                    bu: formDataDemand.bu,
                                    demandValue: formDataDemand.demandValue,
                                    demandContent: formDataDemand.demandContent,
                                    enclosures: [...file_ids],
                                    // labels: formDataForward.labels,
                                    productManager: formDataForward.productManager,
                                    dataBpName: formDataForward.dataBpName,
                                }
                                updateDemandFormData(locationSearch.id, payload).then(res => {
                                    next(dataNext).then((res) => {
                                        if (res.success) {
                                            new Promise(async (resolve) => {
                                                await update();
                                                message.success('同意成功')
                                                resolve()
                                            }).then(() => {
                                                setLoading(false);
                                                onBack();
                                            })
                                        } else {
                                            setAlertMsg(<>
                                                <div>code: {res?.originalRes.code}</div>
                                                <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
                                            </>)
                                            setVisible(true)
                                        }
                                        setLoading(false)
                                    }).catch(err => {
                                        err.msg && message.error(err.msg || '流程中心接口错误');
                                        setLoading(false)
                                    })
                                }).catch((err) => {
                                    message.warning(err || err.msg)
                                }).finally(() => {
                                    // setSubmitLoading(false);
                                    // setLoading(false);
                                })
                            }).catch(() => {
                                console.log('formForwardRef表单错误')
                            })
                        },
                        onCancel: () => {
                            setLoading(false)
                        }
                    })
                } else {
                    setLoading(true);
                    let file_ids = [];
                    defaultFileList.forEach(it => {
                        it.id && file_ids.push(it.id);
                    });
                    let formDataDemand = demandFormRef.current.getFieldsValue();
                    let payload = {
                        issueName: formDataDemand.issueName,
                        bu: formDataDemand.bu,
                        demandValue: formDataDemand.demandValue,
                        demandContent: formDataDemand.demandContent,
                        enclosures: [...file_ids],
                        // labels: ['Others'],
                        productManager: '',
                        dataBpName: 'cn-joyceli',
                    }
                    updateDemandFormData(locationSearch.id, payload).then(res => {
                        next(dataNext).then((res) => {
                            if (res.success) {
                                new Promise(async (resolve) => {
                                    await update();
                                    message.success('同意成功')
                                    resolve()
                                }).then(() => {
                                    setLoading(false);
                                    onBack();
                                })
                            } else {
                                setAlertMsg(<>
                                    <div>code: {res?.originalRes.code}</div>
                                    <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
                                </>)
                                setVisible(true)
                            }
                            setLoading(false)
                        }).catch(err => {
                            err.msg && message.error(err.msg || '流程中心接口错误');
                            setLoading(false)
                        })
                    }).catch((err) => {
                        err && message.warning(err.msg)
                    }).finally(() => {
                        // setSubmitLoading(false);
                        // setLoading(false);
                    })
                }
            }

        } else if (type == 'back') { // 退回
            let dataNext = formatMainData();
            setLoading(true)
            next(dataNext).then((res) => {
                if (res.success) {
                    reEditStatus(locationSearch.id, APPLY_STATUS.back, update);
                    onBack();
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
                setLoading(false)
            })
        } else if (type == 'withdraw') { // 撤回
            let dataNext = formatMainData();
            Modal.confirm({
                title: "撤回流程",
                content: (<>是否撤回流程？<br />撤回后不可重新发起</>),
                cancelText: "取消",
                okText: "撤回",
                onOk: () => {
                    setLoading(true);
                    next(dataNext).then((res) => {
                        if (res.success) {
                            reEditStatus(locationSearch.id, APPLY_STATUS.withdrawn, update);
                        } else {
                            setAlertMsg(<>
                                <div>code: {res?.originalRes.code}</div>
                                <div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
                            </>)
                            setVisible(true)
                            setLoading(false)
                        }
                    }).catch(err => {
                        message.error(err.msg || '流程中心接口错误');
                        setLoading(false)
                    })
                },
                onCancel: () => {
                    setLoading(false)
                }
            })
        }
    }
    const beforeUpload = (file) => {
        const isLt5M = file.size / 1024 / 1024 <= 5;
        if (!isLt5M) {
            message.error('文件大小不能超过 5MB！');
        }
        return isLt5M;
    };
    return (<Spin spinning={loading}>
        <div className='demand-dashboard-tab' style={{ padding: '0px 0px 20px 0', background: '#fff' }}>
            {
                buttonDisabled && !requestId ? <Alert message="流程异常，请联系OAP管理员" type="error" /> : null

            }
            {
                visible ? (
                    <Alert message="需求看板审批流程" description={alertMsg} type="error" closable />
                ) : null
            }

            {(workflowId ?? '') !== '' ? <McdWorkflow
                workflowId={workflowId}
                {
                    ...config
                }
                requestId={requestId}
                onAction={onAction}
                buttonVisible={{
                    'save': false,
                    // 'submit': isOriginator(data.employeeNumber) ? (requestId ? false : true) : true,
                    'back': requestId ? true : false,
                    'withdraw': requestId ? true : false
                }}
                buttonDisabled={buttonDisabled}
                buttonText={{
                    'submit': isOriginator(data.employeeNumber) ? '提交申请' : '同意',
                }}
                footerRightSlot={<Button onClick={onBack}>返回</Button>}
                className="oap-McdWorkflow"
            >
                <div style={{ padding: '20px 16px 0 16px' }}>
                    <div className='common-demand-title-h4'>
                        <div className='demand-title-item'>申请信息</div>
                        <i className='left-icon'></i>
                    </div>
                </div>
                <Form
                    name="demand-dashboard-form"
                    className='demand-dashboard-edit-form'
                    ref={demandFormRef}
                    layout="vertical"
                    size="middle"
                    initialValues={data}
                >
                    <Row gutter={12}>
                        <Col span={4}>
                            <Form.Item name="issueName" label="申请名称" rules={[
                                {
                                    required: true,
                                    message: '请填写需求名称'
                                }
                            ]}>
                                <Input disabled={disabled} placeholder='请输入名称' allowClear />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <Form.Item name="bu" label="BU" rules={[
                                {
                                    required: true,
                                    message: '请选择BU'
                                }
                            ]}>
                                <Select
                                    disabled={disabled}
                                    placeholder='请选择BU'
                                    allowClear
                                    options={buOptions}
                                ></Select>
                            </Form.Item>
                        </Col>
                        <Col span={4}></Col>
                        <Col span={8}>
                            <Form.Item name="demandValue" label="需求价值" rules={[
                                {
                                    required: true,
                                    message: '请填写需求价值'
                                }
                            ]}>
                                <Input.TextArea disabled={disabled} placeholder='请输入需求价值。例：预计为团队节省xx人天的，增加xx 曝光量/GC/Sales等，节省nn万成本，提升准确率...'></Input.TextArea>
                            </Form.Item>
                        </Col>
                        <Col span={4}></Col>
                        <Col span={8}>
                            <Form.Item name="demandContent" label="需求内容" rules={[
                                {
                                    required: true,
                                    message: '请填写需求内容'
                                }
                            ]}>
                                <Input.TextArea disabled={disabled} placeholder='请填写需求内容'></Input.TextArea>
                            </Form.Item>
                        </Col>
                        <Col span={4}></Col>
                        <Col span={8}>
                            {
                                disabled ? <Form.Item label='附件'>{downLoadDom()}</Form.Item> : <Form.Item
                                    name="enclosures"
                                    label="附件"
                                    valuePropName="file"
                                    getValueFromEvent={normFile}
                                >
                                    {
                                        <Upload
                                            name='file'
                                            multiple={false}
                                            style={{ width: 400 }}
                                            uploadType='multipleFile'
                                            fileList={defaultFileList}
                                            hintText='限制文件格式上传，文件大小不能超过 5MB！'
                                            customRequest={beforeUploadCustom}
                                            onChange={handleUploadChange}
                                            beforeUpload={beforeUpload}
                                            iconRender={() => <IconFile style={{ position: 'relative', top: -4 }} />}
                                        />
                                    }
                                </Form.Item>
                            }
                        </Col>
                    </Row>
                </Form>
            </McdWorkflow> : null}
        </div>
    </Spin>)
});

export default DemandForm;