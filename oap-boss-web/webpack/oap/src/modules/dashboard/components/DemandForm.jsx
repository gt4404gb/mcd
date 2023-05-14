import React, { useState, useRef, useEffect, forwardRef } from 'react';
import {
    Spin, Form, Input, Select, Button, Row, Col, Upload, IconFont, Alert,Tooltip
} from '@aurum/pfe-ui';
import {
    IconFile
} from '@aurum/icons';
import '@/style/demand-dashboard.less';
import { uploadDataFile,downloadFile,downloadFileJira } from '@/api/oap/commonApi';
// import { uploadMainDataFile } from '@/api/oap/upload_main';
import { message } from 'antd';
import {
    getDemandBUOptions,
    createDemandItem,
    getDetailById,
    getDownloadTemplateList,
} from '@/api/oap/demand_dashboard';
import {
    getWorkflowId
} from '@/api/oap/apply_form';
import { APPLY_TYPE, APPLY_MAINDATA } from '@/constants';
import { McdWorkflow } from '@mcdboss/business-components';
import SvgICon from '@/components/SvgIcon';
import { saveAs } from 'file-saver';
import {OAP_VERSION} from '@/constants';

const userInfo = localStorage.getItem('USER_INFO');
const DemandForm = forwardRef((props, ref) => {
    const [loading, setLoading] = useState(false);
    const [buOptions, setButOptions] = useState([]);
    const demandFormRef = useRef();
    const [data, setData] = useState({});
    const [defaultFileList, setDefaultFileList] = useState([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [workflowId, setWorkflowId] = useState('');
    const [disabled, setDisabled] = useState(true);
    const [visible, setVisible] = useState(false);
    const [alertMsg, setAlertMsg] = useState(<>
        <div>code:</div>
        <div>errMsg:</div>
    </>)
    const getFlowId = () => {
        getWorkflowId(APPLY_TYPE.demandCode).then(res => {
            console.log('res = ', res);
            res && setWorkflowId(res.data.value);
        })
    }
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [downUrl, setDownUrl] = useState({});
    // let flowConfig = {
    //     title: `需求提交审批流程`,
    //     eid: '',
    //     systemName: 'NoB',
    //     buttonText: {
    //         'submit': '提交申请',
    //     }
    // }, userInfoLocal = {};
    const [flowConfig, setFlowConfig] = useState({
        title: `需求提交审批流程`,
        eid: '',
        systemName: 'NoB',
    })
    let userInfoLocal = JSON.parse(userInfo) || {};
    // const userInfo = localStorage.getItem('USER_INFO');
    // if (userInfo) {
    //     flowConfig = { ...flowConfig, eid: JSON.parse(userInfo)?.employeeNumber }
    //     // userInfoLocal = JSON.parse(userInfo);
    // }
    const downLoadDom = () => {
        let dom = null;
        if (defaultFileList && defaultFileList.length) {
            dom = defaultFileList.map(it => {
                return <Button type="link" onClick={() => downFileJira(it)} icon={<IconFile />}>{it.filename}</Button>
            })
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
            file.uploadResId = res.data.id;
            console.log('file = ', file);
            setDefaultFileList([...defaultFileList, file]);
        }).catch(() => {

        })
    }
    const handleUploadChange = ({ file, fileList, event }) => {
        if(file.size / 1024 / 1024 <= 5) {
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
                it.uploadResId && file_ids.push(it.uploadResId);
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
                err && message.warning(err.msg)
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
        console.log('跳转第一Tab');
        props.goFirst(props.selfId);
    }
    const downFileJira = (fileData) => {
        // const url = fileData.link;
        // const link = document.createElement('a');
        // link.style.display = 'none';
        // link.href = url;
        // let downName = fileData.fileName.replace(/"|'/g, '');
        // link.setAttribute('download', downName);
        // document.body.appendChild(link)
        // link.click();
        // document.body.removeChild(link);
        setLoading(true);
        downloadFileJira(fileData.id).then(res => {
            const blob = res.data.fileBlob;
            let downName = fileData.filename; // res.data.fileName.replace(/"/g, '');
            saveAs(blob, downName);
            message.success("文件下载成功！")
        }).catch(err => {
            message.error('下载失败');
        }).finally(() => {
            setLoading(false)
        })
    }
    const onAction = async ({ type, next, update }) => {
        console.log('flowConfig = ', flowConfig);
        if (type == 'submit') {
            demandFormRef.current.validateFields().then(() => {
                setSubmitLoading(true);
                setLoading(true);
                let formData = demandFormRef.current.getFieldsValue();
                console.log('formData = ', formData);
                let file_ids = [];
                defaultFileList.forEach(it => {
                    it.uploadResId && file_ids.push(it.uploadResId);
                });
                let payload = {
                    issueName: formData.issueName,
                    bu: formData.bu,
                    demandValue: formData.demandValue,
                    demandContent: formData.demandContent,
                    enclosures: [...file_ids],
                }
                setFlowConfig({
                    ...flowConfig,
                    title: `${formData.issueName}`
                })
                createDemandItem(payload).then(res => {
                    console.log('res = ', res);
                    console.log('process.env.NODE_ENV = ', process.env.NODE_ENV)
                    console.log('process.env.NODE_ENV = ', process.env)
                    let _preAuditor = process.env.NODE_ENV == 'production' ? '15209051' : '15365662';// 'cn-petelei' : 'cn-joyceli';
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
                            mobile: `https://${window.location.host}/data-h5/#/demand-apply?id=${res.data?.id}&${OAP_VERSION}`,
                            pc: window.location.origin + `/oap/demand/apply-form?id=${res.data.id}&${OAP_VERSION}`
                        },
                        mainData: f_list,
                        title: `${formData.issueName}`, // flowConfig.title,
                    }
                    console.log('obj = ', obj);
                    next(obj).then(resNxt => {
                        console.log('resNxt = ', resNxt);
                        if (resNxt.success) {
                            message.success('需求申请提交成功！');
                            onBack();
                        } else {
                            setAlertMsg(<>
                                <div>code: {resNxt?.originalRes.code}</div>
                                <div>msgType: {resNxt?.originalRes.reqFailMsg.msgType}</div>
                            </>)
                            setVisible(true)
                        }
                    }).catch(err => {
                        message.error(err?.msg || '流程中心接口错误');
                    }).finally(() => {
                        setSubmitLoading(false);
                        setLoading(false);
                    })
                }).catch((err) => {
                    err && message.warning(err.msg)
                }).finally(() => {
                    // setSubmitLoading(false);
                    // setLoading(false);
                })
            }).catch(() => {
                console.log('表单错误')
            })
        }
    }
    useEffect(() => {
        if (userInfo) {
            setFlowConfig({
                ...flowConfig,
                title: '我能改变吗',
                eid: JSON.parse(userInfo)?.employeeNumber
            })
        
            if (props.formStatus === 'edit' && props.issueKey) {
                getDetailById(props.issueKey).then(res => {
                    console.log('detail 888 = ', res.data);
                    let item = res.data;
                    let form_edit_data = {
                        ...item,
                        issueName: item.issueName,
                        bu: item.bu,
                        demandValue: item.demandValue,
                        demandContent: item.demandContent,
                        enclosures: item.enclosureFiles || [],
                    };
                    // item.enclosureFiles
                    setData(form_edit_data);
                    // setDefaultFileList(item.enclosureFiles || []);
                    setDefaultFileList(item.jiraAttachment || []);
                    // console.log(2323, demandFormRef)
                    // demandFormRef.current.setFieldsValue({
                    //     ...form_edit_data,
                    //     requester: item.requester,
                    // })
                })
            }
            getDemandBUOptions().then(res => {
                setButOptions([...res.data]);
            }).catch(() => {

            })
            getDownloadTemplateList().then(res => {
                console.log('下载的res = ', res);
                res.data[0] && setDownUrl(res.data[0])
            }).catch(() => {

            })
            getScrollTop();
            getFlowId();
        }
    }, []);
    //判断是否是流程发起人
    const isOriginator = (applyEmployeeNumber) => {
        let result = true;
        if (applyEmployeeNumber !== userInfoLocal?.employeeNumber) {
            result = false;
        }
        console.log('是不是本人 = ', result);
        return result;
    }
    const beforeUpload = (file) => {
        const isLt5M = file.size / 1024 / 1024 <= 5;
        if (!isLt5M) {
          message.error('文件大小不能超过 5MB！');
        }
        return isLt5M;
    };
    const onLinkToApply = () => {
        let pathname = "/oap/apply-auth", tabNameZh = '申请列表';
        sessionStorage.setItem('setDefaultApplyType', encodeURIComponent(JSON.stringify({
            applyType: 8,
        })))
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }
    const downTemplate = () => {
        // console.log('下载')
        // const url = downUrl.value;
        // const link = document.createElement('a');
        // link.style.display = 'none';
        // link.href = url;
        // let downName = downUrl.label.replace(/"|'/g, '');
        // link.setAttribute('download', downName);
        // document.body.appendChild(link)
        // link.click();
        // document.body.removeChild(link);
        downloadFile(downUrl.value).then(res => {
            const blob = res.data.fileBlob;
            let downName = res.data.fileName.replace(/"/g, '');
            saveAs(blob, downName);
            message.success("模板下载成功！")
        }).catch(err => {
            message.error('下载失败');
        }).finally(() => {
            setLoading(false)
        })

    }
    // const needSyncTitle = (e) => {
    //     console.log('e = ', e);
    //     setFlowConfig({
    //         ...flowConfig,
    //         title: `【需求申请】-- ${e.currentTarget.value}`
    //     })
    // }
    return (<Spin spinning={loading}>
        <div className='demand-dashboard-tab'>
            {visible ? (
                <Alert message='需求审批流程' description={alertMsg} type="error" closable />
            ) : null}
            <div className='common-demand-title-h4'>
                <div className='demand-title-item'>{props.formStatus == 'edit' ? '需求详情' : '创建需求'}</div>
                <i className='left-icon'></i>
            </div>
            {workflowId != '' ? <McdWorkflow
                workflowId={workflowId}
                {...flowConfig}
                onAction={onAction}
                buttonVisible={{ 'save': false, 'submit': props.formStatus === 'edit' ? false : true, 'back': false, 'withdraw': false }}
                buttonDisabled={buttonDisabled}
                footerRightSlot={<Button onClick={onBack}>返回</Button>}
                buttonText={{
                    'submit': isOriginator(data.employeeNumber) ? '提交申请' : '同意',
                }}
                className="oap-McdWorkflow"
            >
                <Form
                    name="demand-dashboard-form"
                    className='demand-dashboard-create-form'
                    ref={demandFormRef}
                    layout="vertical"
                    size="middle"
                    initialValues={data}
                >
                    <Row gutter={12}>
                        <Col span={4}>
                            <Form.Item name="issueName" label="需求名称" rules={[
                                {
                                    required: true,
                                    message: '请填写需求名称'
                                }
                            ]}>
                                <Input disabled={props.formStatus === 'edit'} placeholder='请输入名称' allowClear />
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
                                    disabled={props.formStatus === 'edit'}
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
                                <Input.TextArea disabled={props.formStatus === 'edit'} placeholder='请输入需求价值。例：预计为团队节省xx人天的，增加xx 曝光量/GC/Sales等，节省nn万成本，提升准确率...'></Input.TextArea>
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
                                <Input.TextArea disabled={props.formStatus === 'edit'} placeholder='请填写需求内容'></Input.TextArea>
                            </Form.Item>
                        </Col>
                        <Col span={4}></Col>
                        {props.formStatus === 'edit' ? <>
                            <Col span={4}>
                                <Form.Item name="labels" label="标签">
                                    <Input disabled={props.formStatus === 'edit'} allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name="requester" label="需求提出人">
                                    <Input disabled={props.formStatus === 'edit'} allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name="productManager" label="产品经理">
                                    <Input disabled={props.formStatus === 'edit'} allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name="dataBpName" label="Data BP">
                                    <Input disabled={props.formStatus === 'edit'} allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name="estimatedStartDate" label="预计开始日期">
                                    <Input disabled={props.formStatus === 'edit'} allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name="expectedLaunchDate" label="预计上线日期">
                                    <Input disabled={props.formStatus === 'edit'} allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name="estimatedWorkload" label="预计工作量（工作日）">
                                    <Input disabled={props.formStatus === 'edit'} allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={8}></Col>
                        </> : null}
                        <Col span={4}>
                            {
                                props.formStatus === 'edit' ? <Form.Item label='附件'>{downLoadDom()}</Form.Item> : <Form.Item
                                    name="enclosures"
                                    label="附件"
                                    valuePropName="file"
                                    getValueFromEvent={normFile}
                                >
                                    {
                                        <Upload
                                            name='file'
                                            multiple={false}
                                            uploadType='multipleFile'
                                            fileList={defaultFileList}
                                            hintText='限制文件格式上传，文件大小不能超过 5MB！'
                                            customRequest={beforeUploadCustom}
                                            onChange={handleUploadChange}
                                            beforeUpload={beforeUpload}
                                            iconRender={() => <IconFile style={{position: 'relative', top: -4}}/>}
                                        />
                                    }
                                </Form.Item>
                            }
                        </Col>
                        <Col span={4}>
                            <div style={{height: '100%',borderLeft: '1px solid #e1e1e1'}}>
                                <div style={{width: '50%',textAlign: 'center', position: 'relative', top: '50%', transform: 'translate(0, -50%)'}}>
                                    <div><SvgICon icon='excel_icon' className="w100_h100" /></div>
                                    <a href="#" onClick={downTemplate}>点击下载报告看板需求文档模板</a>
                                </div>
                            </div>
                        </Col>
                    </Row>
                    {/* <Row>
                        <Col>
                            {props.formStatus == 'edit'?null:<Button type='primary' htmlType='submit' loading={submitLoading} onClick={submitDemand}>提交</Button>}
                            <Button onClick={onBack} style={{marginLeft: 10}}>返回</Button>
                        </Col>
                    </Row> */}
                </Form>
                {/* <div>
                    已提交需求请点击xxx查看审批进度
                    <Button onClick={onLinkToApply} style={{ marginLeft: 10, cursor: 'pointer' }} type="link">需求历史申请记录</Button>
                </div> */}
                <Row>
                    <Col span={4}>
                        {/* <Alert
                            message="提示"
                            description={`已提交需求请点击 <a href="#"  onClick={onLinkToApply}>需求历史申请记录</a>查看审批进度`}
                            type="success"
                            showIcon
                        /> */}
                        <div style={{display: 'inline-block', height: '24px', lineHeight: '24px', fontSize: '14px'}}>
                            <SvgICon icon='aurum_warnning' className='custom_warning' />
                            {/* 已提交需求请点击<a href="#"  onClick={onLinkToApply}>需求历史申请记录</a>查看审批进度 */}
                            已提交需求请点击<Tooltip title="已申请待审批需求请点击查看"><a href="#"  onClick={onLinkToApply}>需求历史申请记录</a></Tooltip>查看审批进度
                        </div>
                        
                    </Col>
                </Row>
            </McdWorkflow> : null}
        </div>
    </Spin>)
})

export default DemandForm;