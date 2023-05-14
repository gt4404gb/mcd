import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Button, Spin, Modal, message, Alert } from "@aurum/pfe-ui";
import { McdWorkflow } from '@mcdboss/business-components';
import { optionFilterProp } from "@/utils/store/func";
import querystring from "query-string";
import "moment/locale/zh-cn";
import {
	changeStatus,
	bindapplyAuthMain,
	reportRange,
	againApply,
	getWorkflowId,
	getMainId,
	applyAuth
} from "@/api/oap/registration_report";
import { getApplyOwner } from '@/api/oap/apply_form';
import { IconExclamationCircle } from '@aurum/icons';
import { APPLY_STATUS, APPLY_STATUS_LIST, APPLY_TYPE } from '@/constants';
import SupplierView from './components/SupplierView';
import { OAP_VERSION } from '@/constants';

const processDetailsForm = forwardRef((props, ref) => {
	const [locationSearch, setLocationSearch] = useState(() => {
		return querystring.parse(props.location.search);
	});
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
	const [editAbleArr, setEditAble] = useState([APPLY_STATUS.back, APPLY_STATUS.withdrawn]);
	// 提示框是否显示
	const [visible, setVisible] = useState(false);
	// 当关键字段被修改弹出提示框
	const [alertMsg, setAlertMsg] = useState(<>
		<div>code:</div>
		<div>errMsg:</div>
	</>)
	// requsetId不存在显示状态异常处理
	const [errorState, setErrorState] = useState(false)
	const [flowStatus, setFlowStatus] = useState('create');
	let config = {
		title: '报告权限审批流程1111',
		eid: '', // 当前用户的eid
		systemName: 'NoB',
		buttonText: {
			'submit': disabled ? '通过' : '提交申请',
		},
	}, userInfoLocal = {}
	const userInfo = localStorage.getItem('USER_INFO');
	if (userInfo) {
		config = { ...config, eid: JSON.parse(userInfo)?.employeeNumber }
		userInfoLocal = JSON.parse(userInfo);
	}
	useEffect(() => {
		init()
		console.log(locationSearch);
	}, [])

	const init = async () => {
		try {
			let res = await Promise.all([getWorkflowId('3_2'), reportRange()])
			if (locationSearch.type) {
				setFlowStatus('create');
				let reportChineseName = res[1].data.filter((item) => item.module === locationSearch.type)
				setFieldInfo({ reportChineseName: reportChineseName[0].name })
				setWorkflowId(res[0].data.value)
				setDisabled(false)
			} else {
				setFlowStatus('edit');
				let data = await getMainId(locationSearch.id)
				let reportChineseName = res[1].data.filter((item) => item.module === data.data.reportList[0].reportRangeModule)
				setFieldInfo({ ...filterData(data.data), reportChineseName: reportChineseName[0].name })
				setProcessId(data.data.id)
				// setErrorState(!locationSearch.type && !data.data.requestId ? true : false) //0306
				if ((data.data.requestId ?? '') !== '') {
					setRequestId(data.data.requestId)
					handleDiabled(data.data.applyStatus, '' + data.data.applyEmployeeNumber)
				} else {
					setDisabled(false)
				}
				setWorkflowId(res[0].data.value)
			}
			setLoading(false)
		} catch (err) {
			console.log(err);
			setLoading(false)
		}
	}

	// 传来的报告数据二次处理
	const filterData = params => {
		params.businessCategory = [params.reportList[0].businessCategory.name, params.businessCategoryId]
		params.applyNameId = params.applyInfo.map(item => item.id)
		params.applyInfo = params.reportList.map(item => item.reportCode).map((items, index) => items + '.' + params.applyName.split(',')[index])
		params.reportCodeList = params.reportList.map(item => item.reportCode)
		return params
	}
	//获取审批人
	const _getApplyOwner = async (dataNext) => {
		try {
			const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
			let infos = [];
			if (flowStatus === 'create') {
				formData.reportNameList[1] && formData.reportNameList[1].forEach(id => {
					if (id) {
						infos.push({
							id: id,
							type: APPLY_TYPE.report,
						})
					}
				})
			} else if (flowStatus === 'edit') {
				formData.reportList && formData.reportList.forEach(it => {
					if (it) {
						infos.push({
							id: it.id,
							type: APPLY_TYPE.report,
						})
					}
				})
			}

			const resApplyOwner = await getApplyOwner({
				// applyInfo: [
				// 	{ id: formData.id, type: APPLY_TYPE.report }
				// ],
				applyInfo: [...infos],
				businessCategoryId: formData.businessCategoryId,
				applyType: APPLY_TYPE.report
			})
			dataNext.mainData.push({ fieldName: 'ownerEmplNumber', fieldValue: resApplyOwner.data })
			return true
		} catch (err) {
			console.log('err = ', err);
			message.warning(err.msg || '流程失败！');
			setLoading(false);
		}
	}
	const onAction = async ({ type, update, next }) => {
		setLoading(true)
		let dataNext = {}
		switch (type) {
			case 'submit':
				if (!disabled) {
					ApplyFormDomRef.current.getForm()?.validateFields().then(async values => {
						console.log('values = ', values);
						try {
							let params = {
								applyType: 2,
								applyReason: values.applyReason,
								applyTarget: values.applyTarget,
							}
							dataNext = formatMainData()
							console.log('submit:', requestId, params)
							//return
							if (!processId) { //!requestId
								params.idJson = values.reportNameList[1].join(','),
									params.authAccount = JSON.stringify({
										employeeNumber: values.authAccounts[0].employeeNumber,
										adid: values.authAccounts[0]?.adid || '',
										eid: values.authAccounts[0]?.eid || '',
										chineseName: values.authAccounts[0]?.chineseName || '',
										email: values.authAccounts[0]?.email || ''
									})
								let resApplyId = await applyAuth(params);
								// 判段有无获取到主表数据
								if (resApplyId.data) {
									dataNext = {
										...dataNext,
										url: {
											mobile: `https://${window.location.host}/data-h5/#/supplier-apply-report?id=${resApplyId.data}&${OAP_VERSION}`,
											pc: window.location.origin + `/oap/supplier-application?id=${resApplyId.data}&${OAP_VERSION}`, // 填入真实流程地址
										},
										title: `${values.reportNameList[0].join(',')}`
									}
									dataNext.mainData.forEach(mainItem => {
										if (mainItem.fieldName == 'applyId') {
											mainItem.fieldValue = '' + resApplyId.data
										}
									})
									console.log('2 dataNext = ', dataNext);
								}
							}
							//return;
							await _getApplyOwner(dataNext);
							next(dataNext).then(res => {
								if (processId) {  //requestId
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
									setLoading(false);
								}
							}).catch(errInfo => {
								message.error(err?.msg || '流程中心接口错误');
								setLoading(false)
								console.log(errInfo);
							})
						} catch (err) {
							console.log(err);
							setLoading(false)
						}
					}).catch((err => {
						console.log(err);
						setLoading(false)
					}))
				} else {
					dataNext = formatMainData();
					// return
					setLoading(true);
					await _getApplyOwner(dataNext);
					next(dataNext).then(res => {
						if (res.success) {
							update(); // 重新渲染工作流组件
							message.success("提交申请成功");
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
				}).catch(err => {
					message.error(err || err?.msg || '流程中心接口错误');
					setLoading(false);
				})
				break;
			// 撤回
			case 'withdraw':
				dataNext = formatMainData();
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
						}).catch(err => {
							message.error(err || err?.msg || '流程中心接口错误');
							setLoading(false);
						})
					},
					onCancel: () => {
						setLoading(false)
					}
				})
				break;
		}
	}

	// 是否可修改判断
	const handleDiabled = (applyStatus, applyEmployeeNumber) => {
		// 读取发布状态 判断是否可修改报告
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

	// 修改
	const updateApply = (params, callBack) => {
		againApply({ ...params, id: processId }).then(async res => {
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

	// 退回撤回
	const reEditStatus = async (backStatus, callback) => {
		setLoading(true);
		try {
			const res = await changeStatus({ id: processId, applyStatus: backStatus });
			if (res.msg == 'success') {
				callback && callback();
				message.success(optionFilterProp(APPLY_STATUS_LIST, 'value', backStatus)?.label + '成功');
				handleDiabled(backStatus, fieldInfo.applyEmployeeNumber)
				setLoading(false)
			}
		} catch (errInfo) {
			setLoading(false)
		}
	}

	const formatMainData = (special) => {
		let data = {}
		const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
		data = {
			url: {
				mobile: `https://${window.location.host}/data-h5/#/supplier-apply-report?id=${processId}&${OAP_VERSION}`,
				pc: window.location.origin + `/oap/supplier-application?id=${processId}&${OAP_VERSION}`, // 填入真实流程地址
			},
			mainData: [
				{ fieldName: 'employNumber', fieldValue: fieldInfo.report?.superintendentNumber ?? userInfoLocal.employeeNumber }, //用户id
				{ fieldName: 'applyId', fieldValue: processId }, //主表ID
				{ fieldName: 'reportType', fieldValue: fieldInfo.reportType ? fieldInfo.reportType : '在线报告', },
				{ fieldName: 'module', fieldValue: locationSearch.type ?? fieldInfo.reportList[0]?.reportRangeModule }, //报告范围英语
				{ fieldName: 'reportRangeName', fieldValue: fieldInfo.reportChineseName },//报告范围名字
				{ fieldName: 'businessCategoryId', fieldValue: formData.businessCategory[1] },//业务ID
				{ fieldName: 'businessCategoryName', fieldValue: formData.businessCategory[0] },//业务域名字
				{ fieldName: 'reportId', fieldValue: fieldInfo.reportCodeList?.join(',') ?? formData.reportNameList[2].join(',') },//报告编号
				{ fieldName: 'reportName', fieldValue: fieldInfo.applyName ?? formData.reportNameList[0].join(',') },//报告名称
			],
			title: `${fieldInfo.applyName ?? formData.reportNameList[0].join(',')}`
		}
		console.log('1 data = ', data);
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
			return <></>
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
				className="oap-McdWorkflow"
			>
				<SupplierView ref={ApplyFormDomRef} locationSearch={locationSearch} disabled={disabled} userInfoLocal={userInfoLocal} fieldInfo={fieldInfo}></SupplierView>
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
				footerRightSlot={<Button onClick={reversBack}>返回</Button>}
				className="oap-McdWorkflow"
			>
				<SupplierView ref={ApplyFormDomRef} disabled={disabled} locationSearch={locationSearch} userInfoLocal={userInfoLocal} fieldInfo={fieldInfo}></SupplierView>
			</McdWorkflow>
		}
	}
	return <Spin spinning={isLoading} wrapperClassName="report-McdWorkflow-ml8">
		<div className="">
			{errorState ? <Alert message="流程异常，请联系OAP管理员" type="error" /> : null}
			{visible ? <Alert message="报告注册审批流程" description={alertMsg} type="error" closable /> : null}
			{renderWorkflow()}
		</div>
	</Spin>
})

export default processDetailsForm;
