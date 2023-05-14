import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from "react";
import { Row, Col, Button, Radio, Form, Select, Switch, Modal, Spin, message, DatePicker, Checkbox, Input, Alert, Cascader } from "@aurum/pfe-ui";
import { McdWorkflow } from "@mcdboss/business-components";
import { IconDownload } from "@aurum/icons";
import querystring from "query-string";
import { optionFilterProp } from "@/utils/store/func";
import BlockTitle from "@/components/blockTitle/index";
import { APPLY_STATUS, APPLY_STATUS_LIST, FIELD_NAMES_DEFAULT, APPLY_TYPE } from "@/constants";
import moment from "moment";
import "moment/locale/zh-cn";
import {
	changeStatus,
	saveReport,
	updateReport,
	getrequestId,
	updateReportById,
	getBusinessList,
	reportRange,
	getRoleList,
	getWorkflowId,
	getMainId,
	getThemeType,
	getReportSubjectList,
	getReportSubjectRGBList,
} from "@/api/oap/registration_report";
import { getApplyOwner } from '@/api/oap/apply_form';
import _, { set } from "lodash";
import { BUILDER_TOOL_LIST, REPORT_UPDATE_TYPE, SCOPE_LIST } from "@/constants/report";
import SearchOwner from "./components/searchOwner";
import { OAP_VERSION } from '@/constants';

const userInfo = localStorage.getItem('USER_INFO');
const sheetDirectoryForm = forwardRef((props, ref) => {
	const ApplyFormDomRef = useRef();
	const [isLoading, setLoading] = useState(true);
	const [editAbleArr, setEditAble] = useState([
		APPLY_STATUS.stateless,  //0306  add
		APPLY_STATUS.passed,
		APPLY_STATUS.back,
		APPLY_STATUS.withdrawn,
	]);
	// 是否允许编辑版
	// const [editAbleArrs, setEditAbles] = useState([APPLY_STATUS.back, APPLY_STATUS.withdrawn]);
	const [fieldInfo, setFieldInfo] = useState({});
	const [requestId, setRequestId] = useState();
	const [processId, setProcessId] = useState();
	const [disabled, setDisabled] = useState(true);
	// const [id, setId] = useState();
	const [workflowId, setWorkflowId] = useState();
	const [visible, setVisible] = useState(false);
	// 存储获取过来的res数据
	const [allData, setAllData] = useState(false);
	// 根据修改内容执行 save保存还是重新提交流程
	const [save, setSave] = useState(true);
	// 当关键字段被修改弹出提示框
	const [alertMsg, setAlertMsg] = useState(
		<>
			<div>code:</div>
			<div>errMsg:</div>
		</>
	);
	// 控制流程按钮是否可用
	const [buttonDisabled, setButtonDisabled] = useState(true);
	// 限制初次渲染
	const [firstRender, setFirstRender] = useState(false)
	// 控制显示按钮
	const scopeList = [
		{ value: "MCD Boss", key: 1 },
		{ value: "RGM Boss", key: 2 },
	];
	const [errorState, setErrorState] = useState(false);
	const [buttonText, setButtonText] = useState({
		submit: !disabled ? "提交申请" : "通过",
	});
	const { id, type } = querystring.parse(props.location.search);
	// let config = {
	// 	//workflowId: '79', // 工作流类型id
	// 	title: "注册报告审批流程",
	// 	eid: "", // 当前用户的eid
	// 	systemName: "NoB"
	// }, userInfoLocal = {};

	// const userInfo = localStorage.getItem("USER_INFO");
	// if (userInfo) {
	// 	config = { ...config, eid: JSON.parse(userInfo)?.employeeNumber };
	// 	userInfoLocal = JSON.parse(userInfo);
	// }
	let userInfoLocal = JSON.parse(userInfo);
	const [flowConfig, setFlowConfig] = useState({
        title: `注册报告审批流程`,
        eid: '',
        systemName: 'NoB',
    })
	useEffect(() => {
		if (userInfo) {
			setFlowConfig({
                ...flowConfig,
                eid: JSON.parse(userInfo)?.employeeNumber
            })
		
			const { id, type } = querystring.parse(props.location.search);
			if (id) {
				_init(id, type);
			} else {
				_initCreate();
			}
		}
	}, []);

	useEffect(() => {
		const { id, type } = querystring.parse(props.location.search);
		if (firstRender) {
			if (id) {
				_init(id, type, true);
			}
		}
		setButtonText({
			submit: !disabled ? "提交申请" : "通过",
		})
	}, [disabled]);

	//获取审批人
	const _getApplyOwner = async (dataNext) => {
		try {
			const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
			const resApplyOwner = await getApplyOwner({
				applyInfo: [
					{ id: formData.id, type: APPLY_TYPE.register }
				],
				businessCategoryId: formData.businessCategoryId,
				applyType: APPLY_TYPE.register
			})
			dataNext.mainData.push({ fieldName: 'ownerEmplNumber', fieldValue: resApplyOwner.data })
			return true
		} catch (err) {
			console.log('err = ', err);
			message.warning(err.msg || '流程失败！');
			setLoading(false);
		}
	}
	const onAction = async ({ type, next, update }) => {
		console.log('config = ', flowConfig);
		setLoading(true);
		const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
		let dataNext = {};
		switch (type) {
			// 保存
			case "submit":
				//如果是流程发起人
				if (!disabled) {
					ApplyFormDomRef.current.getForm()?.validateFields().then(async (values) => {
						//如果当前报告状态是个人报告怎不走流程中心
						const params = formVal(values);
						try {
							dataNext = await formatMainData();
							console.log('next submit', formData, allData)
							if (allData) {
								formData.id = null;
							}
							console.log('23232', formData)
							//return;
							if (!formData.id) {
								// 发布状态修改重新提交需要的数据
								if (allData) {
									const { id } = querystring.parse(props.location.search);
									params.id = id;
								}
								// 判断是否是修改再提交 获取id
								let resApplyId = {};
								// 存储报告CODE
								let reportCode;
								if (allData) {
									resApplyId = await updateReport(params);
									resApplyId.id = params.id;
								} else {
									let res = await saveReport(params);
									resApplyId.data = res.data.mainId;
									resApplyId.id = res.data.id;
									reportCode = res.data.reportCode;
								}
								if (resApplyId.data) {
									setFieldInfo(() => ({
										...fieldInfo,
										id: resApplyId.data,
									}));
									ApplyFormDomRef.current.getForm().setFieldsValue({ mainId: resApplyId.data, id: resApplyId.id });
									dataNext = {
										...dataNext,
										url: {
											mobile: `https://${window.location.host}/data-h5/#/register-report?id=${resApplyId.data}&${OAP_VERSION}`,
											pc: window.location.origin + `/oap/registration-approval-process?id=${resApplyId.data}&type=main&${OAP_VERSION}`, // 填入真实流程地址
										},
										title: `${formData.reportName}`,
									};
									dataNext.mainData.forEach((mainItem) => {
										if (mainItem.fieldName == "applyId") {
											mainItem.fieldValue = "" + resApplyId.data;
										}
										// 报告id可能重复，暂时用流程主表ID
										if (!allData) {
											if (mainItem.fieldName == "reportId") {
												mainItem.fieldValue = "" + reportCode;
											}
										}
									});
								}
							}
							await _getApplyOwner(dataNext);
							next(dataNext).then((res) => {
								if (res.success) {
									// 个人报告另走流程
									if (formData.id) {
										updateApply({ ...params, id: formData.id, isDeleted: 0 }, () => {
											setDisabled(true);
											update();
											setLoading(false);
										});
									} else {
										message.success("提交申请成功")
										ApplyFormDomRef.current.getForm().setFieldsValue({ id: null })
										props.history.push({
											pathname: `/oap/registration-report`,
										})
										setDisabled(false)
										setLoading(false);
									}
								} else {
									setAlertMsg(
										<>
											<div>code: {res?.originalRes.code}</div>
											<div>
												msgType: {res?.originalRes.reqFailMsg.msgType}
											</div>
										</>
									);
									setVisible(true);
									setLoading(false);
								}
							}).catch((errInfo) => {
								message.error(errInfo?.msg || '流程中心接口错误');
								setLoading(false);
							});
						} catch (errInfo) {
							errInfo.msg && message.error(errInfo.msg);
							setLoading(false);
							console.log(errInfo);
						}

					}).catch((err) => {
						message.warning("表单校验失败");
						console.log(err);
						setLoading(false);
					});
				} else {
					dataNext = await formatMainData();
					await _getApplyOwner(dataNext);
					console.log(disabled);
					setLoading(true);
					next(dataNext).then((res) => {
						if (res.success) {
							update(); // 重新渲染工作流组件
							setLoading(false);
						} else {
							setAlertMsg(
								<>
									<div>code: {res?.originalRes.code}</div>
									<div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
								</>
							);
							setVisible(true);
							setLoading(false);
						}
					}).catch(err => {
						message.error(err?.msg || '流程中心接口错误');
						setLoading(false);
					});
				}
				break;
			// 回退
			case "back":
				dataNext = await formatMainData();
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
				});
				break;
			// 撤回
			case "withdraw":
				dataNext = await formatMainData();
				Modal.confirm({
					title: "撤回流程",
					content: (
						<>
							是否撤回流程？
							<br />
							撤回后可重新发起
						</>
					),
					cancelText: "取消",
					okText: "撤回",
					onOk: async () => {
						await _getApplyOwner(dataNext);
						next(dataNext).then((res) => {
							if (res.success) {
								reEditStatus(APPLY_STATUS.withdrawn, update);
							} else {
								setAlertMsg(
									<>
										<div>code: {res?.originalRes.code}</div>
										<div>msgType: {res?.originalRes.reqFailMsg.msgType}</div>
									</>
								);
								setVisible(true);
							}
						}).catch(err => {
							message.error(err || err?.msg || '流程中心接口错误');
							setLoading(false);
						});
					},
					onCancel: () => {
						setLoading(false);
					},
				});
				break;
		}
	};

	// from表单数据整理
	const formVal = (values) => {
		const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
		const ownerNumber = ApplyFormDomRef.current.getOwnerNumber();
		return {
			...values,
			...ownerNumber,
			employeeNumber: JSON.parse(userInfo)?.employeeNumber,
			launchStatus: ApplyFormDomRef.current.getSwitchStatus() ? "1" : "2",
			launchDate: values.onlineDate
				? new Date(values.onlineDate[0]).getTime()
				: new Date().getTime(),
			offlineDate: values.onlineDate
				? new Date(values.onlineDate[1]).getTime()
				: new Date("2099.12.31").getTime(),
			reportRangeName: ApplyFormDomRef.current
				.getReportRangeName()
				.find((item) => item.module === values.reportRangeModule).name,
			businessCategoryName: formData.businessCategoryName,
			subjectId: values.subjectId ? values.subjectId.at(-1) : null,
			subjectRgmId: values.subjectRgmId ? values.subjectRgmId.at(-1) : null,
			// subjectId: values.subjectId ? values.subjectId.key : null,
			// subjectRgmId: values.subjectRgmId ? values.subjectRgmId.key : null,
			// subjectName: values.subjectId ? values.subjectId.children : null,
			// subjectRgmName: values.subjectRgmId ? values.subjectRgmId.children : null,
			roleCodes: values.roleCodes?.length
				? values.roleCodes.map((item) => item.value)
				: null,
			roleName: values.roleCodes?.length
				? values.roleCodes.map((item) => item.children ?? item.value).join("##")
				: null
		};
	};

	const formatMainData = async () => {
		const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
		let data = {};
		let reportName = await reportRange();
		formData.reportRangeName = reportName.data.filter((item) => {
			if (item.module === formData.reportRangeModule) {
				return item.name;
			}
		});
		data = {
			url: {
				mobile: `https://${window.location.host}/data-h5/#/register-report?id=${processId}&${OAP_VERSION}`,
				pc: window.location.origin + `/oap/registration-approval-process?id=${processId}&type=main&${OAP_VERSION}`, // 填入真实流程地址
			},
			mainData: [
				{
					fieldName: "employNumber",
					fieldValue:
						formData.applyEmployeeNumber ?? fieldInfo.superintendentNumber,
				},
				{ fieldName: "applyId", fieldValue: processId },
				{
					fieldName: "reportType",
					fieldValue: formData.reportType ? formData.reportType : "在线报告",
				},
				{ fieldName: "module", fieldValue: formData.reportRangeModule },
				{
					fieldName: "reportRangeName",
					fieldValue: formData.reportRangeName[0].name,
				}, //报告范围名字
				{
					fieldName: "businessCategoryId",
					fieldValue: formData.businessCategoryId,
				},
				{
					fieldName: "businessCategoryName",
					fieldValue: formData.businessCategoryName,
				}, //业务域名字
				{ fieldName: "reportId", fieldValue: formData?.reportCode },
				{ fieldName: "reportName", fieldValue: formData.reportName },
			],
			title: `${formData.reportName}`, //flowConfig.title,
		};
		console.log(data);
		return data;
	};

	// 创建报告
	const _initCreate = async () => {
		setLoading(true);
		try {
			const res = await Promise.all([getWorkflowId(3)]);
			if (res[0].data) {
				setWorkflowId(res[0].data?.value);
				setFieldInfo({
					...fieldInfo,
					applyAdid: userInfoLocal.adid,
					applyEmployeeNumber: userInfoLocal.employeeNumber,
					//applyType:APPLY_TYPE[locationSearch.from],
				});
				setDisabled(false);
				setButtonText({ submit: '提交申请' });
			}
			setLoading(false);
		} catch (errInfo) {
			setLoading(false);
			console.log(errInfo);
		}
	};

	const _init = async (id, type, state) => {
		setLoading(true);
		try {
			switch (type) {
				case "report":
					{
						let mainId = await getrequestId(id);
						// session 方便下面一致获取信息
						let val, session, resApplyInfo = {}, resReportInfo = {};
						// 因为个人报告没有主表所以做了分别获取
						if (mainId.data) {
							// 通过主表id获取报告主表信息
							val = await Promise.all([
								getWorkflowId(3),
								getMainId(mainId?.data.id),
							]);
							session = val[1].data?.report;
						} else {
							// 通过报告编号获取详情信息
							val = await Promise.all([getWorkflowId(3), updateReportById(id)]);
							session = val[1].data;
						}
						if (mainId && mainId.data) {
							setProcessId(mainId?.data.id);
							resApplyInfo = { ...mainId.data };
							console.log('0,', mainId, session)
							if ((mainId.data.requestId ?? "") !== "") {
								// 判断审核状态 如果为已发则怎不加入requesID使其正常提交申请
								// if (session.releaseStatus != 1) {
								// 	setRequestId(() => mainId.data.requestId);
								// 	// 0306 修改
								// 	//setButtonText({ submit: "提交申请" })
								// 	handleDiabled(session.reportStatus, "" + session.superintendentNumber);
								// } else {
								// 	setButtonText({ submit: "提交申请" })
								// 	console.log('0adsfadfa', state)
								// 	// 不是的话就切换成可保存选项
								// 	if (!state) {
								// 		setDisabled(false);
								// 		setSave(false);
								// 		setAllData(session);
								// 	}
								// }

								//branch-v1049 isEditReport：0 未编辑状态 isEditReport：1 编辑状态
								if (mainId.data.applyStatus == APPLY_STATUS.applying) { //审批中
									setRequestId(() => mainId.data.requestId);
									handleDiabled(session.reportStatus, "" + session.superintendentNumber);
								} else {
									console.log('ssdfsfsf', state)
									if (mainId.data.applyStatus != APPLY_STATUS.passed) {
										setRequestId(() => mainId.data.requestId);
										setButtonText({ submit: "提交申请" })
										handleDiabled(session.reportStatus, "" + session.superintendentNumber);
									} else {
										//setButtonText({ submit: "提交申请22" })
										//handleDiabled(session.reportStatus, "" + session.superintendentNumber);
										if (!state) {
											setDisabled(false);
											setSave(false);
											setAllData(session);
										}
									}
								}
							} else {
								if (!state) {
									setDisabled(false);
								}
							}
						} else {
							if (!state) {
								setDisabled(false);
								setSave(false);
								setAllData(session);
							}
						}
						if (session) {
							let mainData = filterInfo(
								session,
								val[1].data?.reportLog,
								val[1].data
							);
							resReportInfo = mainData;
						}

						setFieldInfo({ ...resApplyInfo, ...resReportInfo, mainId: mainId?.data?.id || '' });
						console.log('init:', val[1].data)
						// 判断是不是个人报告 开启保存按钮
						if ((val[1].data.reportRangeModule ?? val[1].data.report.reportRangeModule) === "IndividualReport") {
							if (!state) {
								setDisabled(true);
								setSave(true);
								setAllData(session);
							}
						}
						if (val[0].data) {
							setWorkflowId(val[0].data?.value);
						}
						// 防止第一次进入检测到disabled状态改变再次请求数据
						setFirstRender(true)
						setLoading(false);
					}
					break;
				case "main":
					{
						let res = await Promise.all([getWorkflowId(3), getMainId(id)]);
						if (res[1] && res[1].data) {
							setProcessId(res[1].data.id);
							if ((res[1].data.requestId ?? "") !== "") {
								setRequestId(() => res[1].data.requestId);
							}
							let dataInfo = filterInfo(
								res[1].data.reportLog,
								res[1].data.reportLog,
								res[1].data
							);
							setFieldInfo({ ...dataInfo });
						}
						if (res[0] && res[0].data) {
							setWorkflowId(res[0].data?.value);
						}
						setErrorState(
							!res[1].data.requestId && type === "main" ? true : false
						);
						// 防止第一次进入检测到disabled状态改变再次请求数据
						setFirstRender(true)
						setLoading(false);
					}
					break;
				case "approver":
					{
						let res = await Promise.all([getWorkflowId(3), getMainId(id)]);
						if (res[1] && res[1].data) {
							setProcessId(res[1].data.id);
							console.log('approver', res[1].data)
							if ((res[1].data.requestId ?? "") !== "") {
								setRequestId(() => res[1].data.requestId);
								handleDiabled(res[1].data?.applyStatus, '' + res[1].data?.applyEmployeeNumber);
							} else {
								setButtonText({ submit: "提交申请" })
								//setButtonDisabled(true);
								if (!state) {
									setDisabled(false);
								}
							}
							let dataInfo = filterInfo(
								res[1].data.reportLog,
								res[1].data.reportLog,
								res[1].data
							);
							setFieldInfo({ ...dataInfo });
						}
						if (res[0] && res[0].data) {
							setWorkflowId(res[0].data?.value);
						}
						// 防止第一次进入检测到disabled状态改变再次请求数据
						setFirstRender(true)
						setLoading(false);
					}
					break;
			}
		} catch (errInfo) {
			setLoading(false);
			console.log(errInfo);
		}
	};

	// 页面加载数据整理 减少代码数量
	const filterInfo = (session, reportLog, resData) => {
		//console.log('init filterInfo', session);
		let { applyAdid, requestId } = resData;
		let mainData = {
			...fieldInfo,
			...session,
			applyAdid,
			requestId,
			onlineDate: [
				moment(Number(session.launchDate)),
				moment(Number(session.offlineDate)),
			],
			reportRangeName: session.reportRange.name,
			businessCategoryName: session.businessCategory.name,
			// subjectId: session.subjectId
			// 	? {
			// 		value: session.subjectId,
			// 		key: session.subjectId,
			// 		children: session.subject.name,
			// 	}
			// 	: null,
			// subjectRgmId: session.subjectRgmId
			// 	? {
			// 		value: session.subjectRgmId,
			// 		key: session.subjectRgmId,
			// 		children: session.subjectRgm.name,
			// 	}
			// 	: null,
			//subjectId: echoTreeData(session.subject, session.subjectId),
			roleCodes: session.roleCodeList ?? [],
		};
		// 判断是否拥有日志进行读取
		console.log('sdfsdf', session.roleCodeList)
		if (reportLog) {
			(mainData.roleCodes = session.roleCodeList.map((item, index) => {
				return {
					key: item,
					value: item,
					children: reportLog.roleName?.split("##")[index],
				};
			})),
				mainData.roleName = reportLog.roleName
		} else if (session.roleCodeList ?? null) {
			mainData.roleCodes = session.roleCodeList.map((item, index) => {
				return {
					key: item,
					value: item
				};
			})
		}
		console.log('init filterInfo', mainData.roleCodes)
		mainData.scopeLists = [];
		if (session.subjectId) {
			mainData.scopeLists.push(scopeList[0].key);
		}
		if (session.subjectRgmId) {
			mainData.scopeLists.push(scopeList[1].key);
		}
		return mainData;
	};

	const updateApply = (params, callBack) => {
		updateReport(params).then(async (res) => {
			// reEditStatus(APPLY_STATUS.applying, update);
			if (res.msg == "success") {
				await changeStatus({
					id: processId,
					applyStatus: APPLY_STATUS.applying,
				});
				message.success("报告修改成功");
				callBack && callBack();
			}
		}).catch((err) => {
			err.msg && message.error(err.msg);
			console.log(err);
			setLoading(false);
		});
	};

	const reEditStatus = async (backStatus, callback) => {
		setLoading(true);
		try {
			const res = await changeStatus({
				id: processId,
				applyStatus: backStatus,
			});
			if (res.msg == "success") {
				message.success(
					optionFilterProp(APPLY_STATUS_LIST, "value", backStatus)?.label +
					"成功"
				);
				callback && callback();
				handleDiabled(backStatus, fieldInfo.superintendentNumber);
				setLoading(false);
			}
		} catch (errInfo) {
			setLoading(false);
		}
	};

	const handleDiabled = (applyStatus, applyEmployeeNumber) => {
		// 读取发布状态 判断是否可修改报告
		if (editAbleArr.includes(Number(applyStatus)) && isOriginator(applyEmployeeNumber)) {
			setDisabled(false);
		}
	};

	// 按钮文字显示
	const handleState = (applyStatus, applyEmployeeNumber) => {
		if (editAbleArr.includes(Number(applyStatus)) && isOriginator(applyEmployeeNumber)) {
			return false;
		}
		return true;
	};

	//判断是否是流程发起人
	const isOriginator = (applyEmployeeNumber) => {
		let result = true;
		if (applyEmployeeNumber !== userInfoLocal?.employeeNumber) {
			result = false;
		}
		return result;
	};

	const goBack = () => {
		props.history.go(-1);
	};

	// 保存信息审核
	const updateSave = () => {
		console.log('updateSave')
		ApplyFormDomRef.current
			.getForm()
			?.validateFields()
			.then(async (values) => {
				setLoading(true);
				// 报告范围  builderTool 访问地址 业务域 指标维度
				const { id } = querystring.parse(props.location.search);
				const params = formVal(values);
				params.id = id;
				updateReport(params).then((res) => {
					message.success("修改成功");
					setLoading(false);
					goBack();
				}).catch((err) => {
					message.error("修改报告失败");
					setLoading(false);
				});
			}).catch((err) => {
				console.log(err);
				setLoading(false);
			});
	};

	const updateSetSave = (params) => {
		console.log('updateSetSave', params)
		setSave(params);
	};

	const renderWorkflow = () => {
		if ((workflowId ?? "") === "") {
			return <></>;
		} else if (!requestId) {
			console.log('renderWorkflow :', requestId, save)
			return (
				<McdWorkflow
					workflowId={workflowId}
					{...flowConfig}
					onAction={onAction}
					buttonVisible={{
						save: false,
						back: false,
						withdraw: false,
						submit: allData.reportRangeModule === "IndividualReport" ? false : save,
					}}
					buttonText={buttonText}
					buttonDisabled={errorState ? true : false}
					footerRightSlot={
						<>
							{!save ? <Button onClick={updateSave}>保存</Button> : null}
							{
								allData.reportRangeModule === "IndividualReport" ?
									<Button onClick={goBack}>返回</Button>
									:
									<Button onClick={goBack}>{allData ? "取消" : "返回"}</Button>
							}

						</>
					}
					className="oap-McdWorkflow"
				>
					<ApplyFormDom
						ref={ApplyFormDomRef}
						updateSaves={updateSetSave}
						allData={allData}
						bigProps={props}
						fieldInfo={fieldInfo}
						disabled={disabled} />
				</McdWorkflow>
			);
		} else {
			return <>
				<McdWorkflow
					{...flowConfig}
					workflowId={workflowId}
					requestId={requestId}
					onAction={onAction}
					buttonVisible={
						type === "main"
							? {
								save: false,
								withdraw: false,
							}
							: buttonDisabled
								? { save: false }
								: false
					}
					buttonText={buttonText}
					footerRightSlot={
						<Button onClick={goBack}>
							{handleState(
								fieldInfo.reportStatus,
								"" + fieldInfo.superintendentNumber
							)
								? "返回"
								: "取消"}
						</Button>
					}
					className="oap-McdWorkflow">
					<ApplyFormDom
						ref={ApplyFormDomRef}
						fieldInfo={fieldInfo}
						disabled={disabled}
						requestId={requestId} />
				</McdWorkflow>
			</>
		}
	};

	return <Spin spinning={isLoading} wrapperClassName="oap-report-fixed-height">
		{errorState ? (
			<Alert message="流程异常，请联系OAP管理员" type="error" />
		) : null}
		{visible ? (
			<Alert
				message="报告注册审批流程"
				description={alertMsg}
				type="error"
				closable
			/>
		) : null}
		{renderWorkflow()}
	</Spin>
});

const ApplyFormDom = forwardRef((props, ref) => {
	const { fieldInfo, disabled, requestId } = props;
	const [switchStatu, setSwitchStatu] = useState(true);
	const [isShowRoles, setIsShowRoles] = useState(true);
	const [reportRangeList, setReportRangeList] = useState([]);
	const [RoleList, setRoleList] = useState([]);
	const [MCDThemeList, setMCDThemeList] = useState(false);
	const [RGMThemeList, setRGMThemeList] = useState(false);
	// MCD and RGM 主题
	const [allTheme, setAllTheme] = useState([]);
	const [dfupdateList, setDfupdateList] = useState([]);
	const [businessIdList, setBusinessIdList] = useState([]);
	// 限制初次渲染
	const [firstRender, setFirstRender] = useState(false)
	// 选择框的值
	const [formApply] = Form.useForm();
	const formApplyRef = useRef();
	const scopeList = SCOPE_LIST.slice(1)
	// 主题域存在渲染
	const [realScope, setRealScope] = useState([]);
	const [searchOwnerModal, setSearchOwnerModal] = useState({
		title: '',
		valueKey: '',
		isShow: false
	});
	const updateTimeList = REPORT_UPDATE_TYPE.slice(1)
	const builderToolList = BUILDER_TOOL_LIST.slice(1)
	const everyTime = [
		[
			{
				label: "每时",
				value: "1",
			},
			{
				label: "每分",
				value: "2",
			}
		],
		[
			{
				label: "每日",
				value: "1",
			},
			{
				label: "Manual",
				value: "4",
			}
		],
		[
			{
				label: "每周",
				value: "2",
			}
		],
		[
			{
				label: "每月",
				value: "3",
			}
		]

	];
	const [showReportUrlTip, setShowReportUrlTip] = useState(() => {
		return fieldInfo.builderTool ? fieldInfo.builderTool == 'Guandata' : true
	});
	const [ownerNumber, setOwnerNumber] = useState({})
	// 暴露组件的方法
	useImperativeHandle(ref, () => ({
		getForm: () => {
			return formApply;
		},
		getSwitchStatus: () => {
			return switchStatu;
		},
		getReportRangeName: () => {
			return reportRangeList;
		},
		getBusinessIdList: (value) => {
			return getNewValue("reportRangeList", value);
		},
		getOwnerNumber: (value) => {
			return ownerNumber
		}
	}));

	useEffect(() => {
		initMeta();
		setFirstRender(true)
		setOwnerNumber({
			...ownerNumber,
			businessOwnerNo: fieldInfo?.businessOwnerNo || '',
			dataOwnerNo: fieldInfo?.dataOwnerNo || '',
		})
	}, []);
	useEffect(() => {
		if (reportRangeList.length > 0 && fieldInfo?.reportRangeModule) {
			filterScope(fieldInfo.reportRangeModule);
		}
	}, [reportRangeList]);

	useEffect(() => {
		if (firstRender) {
			if (!disabled) {
				initMeta();
				formApply.resetFields();
			}
		}
		console.log('useEffect child', disabled)
	}, [disabled]);
	const initMeta = async () => {
		try {
			const res = await Promise.all([
				reportRange(),
				getRoleList(),
				getReportSubjectList(),
				getReportSubjectRGBList(),
			]);
			setAllTheme([res[2].data, res[3].data.items]);
			setSwitchStatu(fieldInfo.launchStatus != 2);
			if (fieldInfo.reportRangeModule === "IndividualReport") {
				setIsShowRoles(false);
			}
			if (res[0].data.length > 0) {
				setReportRangeList(res[0].data);
				if (!(fieldInfo.id)) {  //!(fieldInfo.requestId) && !requestId  0306
					filterScopeInit(res[0].data);
				}
			}
			if (res[1].data.length > 0) {
				if (RoleList.length == 0) {
					let record = _.groupBy(res[1].data, "roleName");
					// 角色去重，防止多选samekey报错和选项污染
					let roleList = _.unionBy(res[1].data, "roleCode");
					setRoleList([...roleList]);
				}
			}
			let subjectIdArr = [], subjectRgmIdArr = [];
			if (res[2].data.length > 0) {
				subjectIdArr = echoTreeData(res[2].data, fieldInfo.subjectId, 'sonSubjectList');
			}
			if (res[3].data.items.length > 0) {
				subjectRgmIdArr = echoTreeData(res[3].data.items, fieldInfo.subjectRgmId, 'sonSubjectList');
			}
			formApplyRef.current.setFieldsValue({
				subjectId: subjectIdArr,
				subjectRgmId: subjectRgmIdArr
			})
			if (fieldInfo.updateType) {
				setDfupdateList(everyTime[fieldInfo.updateType])
			}
			if (fieldInfo.scopeLists) {
				fieldInfo.scopeLists.forEach((item) => {
					if (item == 1) {
						setMCDThemeList(true);
					} else if (item == 2) {
						setRGMThemeList(true);
					}
				});
			}
		} catch (errInfo) {
			console.log("errInfo", errInfo);
		}
	};

	//处理treeData
	const echoTreeData = (object, value, childrenKey) => {
		for (let key in object) {
			if (object[key].id == value) return [object[key].id];
			if (object[key][childrenKey] && Object.keys(object[key][childrenKey]).length > 0) {
				let temp = echoTreeData(object[key][childrenKey], value, childrenKey)
				if (temp) return [object[key].id, temp].flat()
			}
		}
	};

	const updateSave = () => {
		console.log('child updateSave', props, formApply)
		if (props.allData) {
			const values = formApply.getFieldsValue();
			// 报告范围  builderTool 访问地址 业务域 指标维度
			let reportArr = [
				//"reportRangeModule",
				//"builderTool",
				"reportUrl",
				"scopeLists", //branch-1049 新增
				//"businessCategoryId",
				"confluenceUrl",
			];

			// 允许访问角色是否一致 默认为true是一位个人没
			let reportsNumber = true;
			if (values.reportRangeModule !== "IndividualReport") {
				// reportsNumber = values.roleCodes.every((item, index) => item == props.allData.roleCodeList[index])
				if (props.allData.roleCodeList.length === values.roleCodes.length) {
					reportsNumber = props.allData.roleCodeList.every((item) =>
						values.roleCodes.some((items) => items.key == item)
					);
				} else {
					reportsNumber = false;
				}
			}
			// 审核修改内容特殊字段是否一致
			let reportBoolean = reportArr.every(
				(item) => props.allData[item] === values[item]
			);
			if (reportsNumber && reportBoolean) {
				props.updateSaves(false);
			} else {
				props.updateSaves(true);
			}
			return
			formApply.validateFields().then((formValues) => {

			}).catch((err) => {
				console.log(err, "表单校验失败");
			});
		}
	};

	const filterScope = (val) => {
		let arrBusiness = reportRangeList.filter((item) => item.module == val);
		if (arrBusiness[0]?.id) {
			Promise.all([getBusinessList(val), getThemeType(arrBusiness[0].id)]).then(res => {
				setBusinessIdList(res[0].data)
				let checkboxScope = scopeList.filter(item => {
					let a = res[1].data.filter(items => items.subjectType == item.key)
					return a.length > 0
				})
				console.log(reportRangeList, 'filterScope', checkboxScope)
				setRealScope(checkboxScope)
			}).catch(err => {
				message.error(err.msg)
				console.log(err);
			})
		}
	};

	const filterScopeInit = (val) => {
		Promise.all([getBusinessList(val[0].module), getThemeType(val[0].id)]).then(res => {
			setBusinessIdList(res[0].data);
			let checkboxScope = scopeList.filter((item) => {
				let a = res[1].data.filter((items) => items.subjectType == item.key);
				return a.length > 0;
			});
			setRealScope(checkboxScope);
			console.log(scopeList, 'filterScopeInit', checkboxScope)
			getNewValue("realScope", checkboxScope[0]);
		}).catch((err) => {
			message.error(err?.msg || '网络故障，请稍后重试');
			console.log(err);
		});
	};

	// onchange事件
	const getNewValue = (dataType, value) => {
		if (dataType === "updateType") {
			formApplyRef.current.setFieldsValue({
				updateFrequency: null
			})
			setDfupdateList(everyTime[value])
		} else if (dataType === "launchStatus") {
			setSwitchStatu(value);
			// setIsRequired(value)
		} else if (dataType === "reportRangeList") {
			// 判断报告范围是：个人报告时，不显示角色选择框=>isShowRoles:false
			if (value == "IndividualReport") {
				setIsShowRoles(false);
			} else {
				setIsShowRoles(true);
			}
			setMCDThemeList(false);
			setRGMThemeList(false);
			console.log('getNewValue reportRangeList', value)
			formApplyRef.current.setFieldsValue({
				scopeLists: null,
				subjectRgmId: [],
				subjectId: [],
				businessCategoryId: null,
			});
			filterScope(value);
		} else if (dataType === "businessName") {
			let obj = businessIdList.find(
				(item) => item.businessCategoryId === value
			);
			fieldInfo.businessCategoryName = obj.businessCategoryName;
			formApplyRef.current.setFieldsValue({
				//businessCategoryId:value,
				businessCategoryName: obj.businessCategoryName,
			});
			// 时间
		} else if (dataType === "roleCodes") {
			console.log('getNewValue', value)
			formApplyRef.current.setFieldsValue({
				roleCodes: value,
			});
		} else if (dataType === "subjectRgmId") {
			formApplyRef.current.setFieldsValue({
				subjectRgmId: value,
			});
		} else if (dataType === "subjectId") {
			formApplyRef.current.setFieldsValue({
				subjectId: value,
			});
		} else if (dataType === "onlineDate") {
			console.log("onlineDate", value);
		} else if (dataType === "realScope") {
			console.log('getNewValue:realScope', MCDThemeList, value.key ?? value.value, value)
			switch (value.key ?? value.value) {
				case 1:
					if (value.checked || typeof value.key == "number") {
						setMCDThemeList(true);
					} else {
						setMCDThemeList(false);
					}
					break;
				case 2:
					if (value.checked || typeof value.key == "number") {
						setRGMThemeList(true);
					} else {
						setRGMThemeList(false);
					}
					break;
				default:
					break;
			}
		} else if (dataType === "builderTool") {
			setShowReportUrlTip(() => value == 'Guandata')
		}
	};

	const toReportDetails = () => {
		const values = formApply.getFieldsValue();
		console.log(!(values.reportUrl === undefined || values.reportUrl.trim() === ''));
		if (!(values.reportUrl === undefined || values.reportUrl.trim() === '')) {
			const params = {
				tabNameZh: values.reportName ?? '预览报告',
				tabNameEn: values.englishName ?? 'preview',
				path: `/oap/report-data-details?reportUrl=${values.reportUrl.trim()}&builderTool=${values.builderTool}`,
			};
			window.EventBus && window.EventBus.emit("setAppTab", null, params);
			props.bigProps.history.push({
				pathname: `/oap/report-data-details?reportUrl=${values.reportUrl.trim()}&builderTool=${values.builderTool}`,
			});
		} else {
			message.warning("请填写访问地址")
		}
	};

	const handleShowSearchModal = (keyName, key) => {
		setSearchOwnerModal({
			title: key == 'businessOwnerNo' ? '查询业务Owner' : '查询数据Owner',
			valueKey: key,
			valueKeyName: keyName,
			isShow: true
		})
	}

	const handleOwner = (data) => {
		console.log('handleOwner', data)
		formApplyRef.current.setFieldsValue({
			[data.curKey]: data.selectedRow[0].employeeNumber,
			[data.curKeyName]: data.selectedRow[0].chineseName
		})
		setOwnerNumber({
			...ownerNumber,
			[data.curKey]: data.selectedRow[0].employeeNumber,
			[data.curKeyName]: data.selectedRow[0].chineseName
		})
	}

	const hideNotice = () => {
		setSearchOwnerModal({
			title: '',
			valueKey: '',
			isShow: false
		})
	}
	const needSyncTitleChild = (e) => {
    	console.log('e = ', e);
    }
	// 修改编辑状态
	return <>
		{disabled ? <div className="processDetails">
			<div className="processDetails-box" style={{ padding: "10px" }}>
				<Form
					form={formApply}
					ref={formApplyRef}
					labelCol={{ flex: '86px' }}
					initialValues={fieldInfo}
					className='oap-form-labelBold'>
					<Row>
						<Col span={12}>
							<BlockTitle text="申请主要审核信息" top={16} bottom={16} />
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="申请账号:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.applyAdid}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="报告类型:" style={{ marginBottom: '0' }}>
								<span>在线报告</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="报告范围:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.reportRangeName}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="报告编号:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.reportCode}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="报告中文名称:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.reportName}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="Builder Tool:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.builderTool}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="访问地址:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.reportUrl}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="业务域:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.businessCategoryName}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="允许访问角色:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.roleName?.split("##").join(",")}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px" >
							<Form.Item label="指标&amp;维度:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.confluenceUrl}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<BlockTitle text="申请基本信息" top={16} bottom={16} />
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="报告英文名:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.englishName}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item style={{ marginBottom: 0 }} label="说明:">
								<span>{fieldInfo.description}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="更新频率:" style={{ marginBottom: '0' }}>
								{/* 类型渲染错误引起的报错 改为字符串可解决 */}
								<span>
									{fieldInfo.updateFrequency}
									{fieldInfo.updateTime}
								</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px" >
							<Form.Item label="MCD主题:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo?.mcdSubjectName}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="RGM主题:" style={{ marginBottom: '0', lineHeight: '18px' }}>
								<span>{fieldInfo?.rgmSubjectName}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="业务Owner:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo?.businessOwnerName}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="数据Owner:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo?.dataOwnerName}</span>
							</Form.Item>
						</Col>
					</Row>
					<Row>
						<Col flex="772px">
							<Form.Item label="上线状态:" style={{ marginBottom: '0' }}>
								<span>{fieldInfo.launchStatusVal}</span>
							</Form.Item>
						</Col>
					</Row>
				</Form>
			</div>
		</div> : <div className="oap-containerWrapper data-container">
			<div className="oap-approver-report-title-box">
				<div className="oap-approver-report-title">创建报告</div>
				{
					requestId ?? props.allData ? null : <Button className="oap-approver-report-btn" onClick={() => {
						formApply.resetFields()
						formApply.setFieldValue('id', null)
						setMCDThemeList(true);
						setRGMThemeList(false)
						if (fieldInfo?.scopeLists?.length) {
							fieldInfo.scopeLists.forEach(scopeItem => {
								if (scopeItem == 1) {
									setMCDThemeList(true);
								} else if (scopeItem == 2) {
									setRGMThemeList(true)
								}
							})
						}
					}}>清空</Button>
				}
			</div>
			<Form
				form={formApply}
				className="edit-form"
				ref={formApplyRef}
				layout="vertical"
				size="middle"
				initialValues={fieldInfo}>
				<Row>
					<Col span={12}>
						<BlockTitle text="基础信息" top={16} bottom={16} />
					</Col>
				</Row>
				<Row>
					<Col flex="772px">
						<Form.Item label="报告类型">
							<Input className="input" placeholder="在线报告" disabled />
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col span={18}>
						{reportRangeList.length > 0 ? (
							<Form.Item
								label="报告范围"
								name="reportRangeModule"
								initialValue={reportRangeList[0].module}
								rules={[{ required: true, message: "请选择报告范围！" }]}
							>
								<Radio.Group
									className="radioFlex"
									// defaultValue={reportRangeList[0].module}
									onChange={(e) => {
										getNewValue("reportRangeList", e.target.value);
										// if (props.allData) {
										// 	updateSave();
										// }
									}}
								>
									{reportRangeList.map((item, index) => {
										return (
											<Radio value={item.module} key={item.module}>
												{item.name}
											</Radio>
										);
									})}
								</Radio.Group>
							</Form.Item>
						) : (
							""
						)}
					</Col>
				</Row>
				<Row>
					<Col flex="772px">
						<Form.Item
							name="reportName"
							label="报告中文名"
							rules={[{ required: true, message: "请填写报告中文名称！" }]}
						>
							<Input
								onChange={e => needSyncTitleChild(e)}
								className="nameInput number-hint"
								placeholder="最多输入60个字符"
								maxLength={60}
								showCount={true}
							/>
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col flex="772px">
						<Form.Item
							name="englishName"
							label="报告英文名"
							rules={[{ required: true, message: "请填写报告英文名称！" }]}
						>
							<Input
								className="nameInput number-hint"
								placeholder="最多输入60个字符"
								maxLength={60}
								showCount={true}
							/>
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col flex="772px">
						<Form.Item
							name="description"
							label="说明"
							rules={[{ required: true, message: "请填写说明！" }]}
						>
							<Input.TextArea
								className="TextArea"
								placeholder="最多输入200个字符"
								rows={4}
								maxLength={200}
								showCount={true}
							/>
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col span={24}>
						<Form.Item
							name="builderTool"
							label="Builder Tool"
							initialValue="Guandata"
							rules={[{ required: true, message: "请选择Builder Tool！" }]}>
							<Radio.Group
								onChange={(e) => {
									getNewValue("builderTool", e.target.value);
									// if (props.allData) {
									// 	updateSave();
									// }
								}}
								className="radioFlex"
							>
								{builderToolList.map(model => {
									return <Radio value={model.value} key={model.value}>{model.label}</Radio>
								})}
							</Radio.Group>
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col flex="772px">
						<Form.Item
							name="reportUrl"
							onChange={(e) => {
								getNewValue("reportUrl", e.target.value);
								if (props.allData) {
									updateSave();
								}
							}}
							label={<span className="form-item-label">访问地址<>{showReportUrlTip ? ' ( https://d-guanyuan.mcdonalds.cn/page/报告ID?ps=mcdonald )' : ''}</></span>}
							rules={[{ required: true, message: "请选择visitUrl！" }]}
						>
							<Input
								className="urlInput number-hint"
								placeholder="请输入访问地址"
								maxLength={200}
								showCount={true} />
						</Form.Item>
					</Col>
					<a className="preview-report" onClick={toReportDetails}>预览报告</a>
				</Row>
				<Row gutter={16}>
					<Col flex="394px">
						<Form.Item
							label={
								<span className="form-item-label">
									<i>*</i>更新频率
								</span>
							}
						>
							<Form.Item
								name="updateType"
								rules={[{ required: true, message: "请选择！" }]}
								style={{
									display: "inline-block",
									width: "calc(50% - 16px)",
								}}
							>
								<Select
									placeholder="请选择"
									onChange={(e) => getNewValue("updateType", e)}
								>
									{updateTimeList.map((model) => {
										return (
											<Select.Option value={model.value} key={model.value}>
												{model.label}
											</Select.Option>
										);
									})}
								</Select>
							</Form.Item>
							<Form.Item
								name="updateFrequency"
								rules={[{ required: true, message: "请选择！" }]}
								style={{
									display: "inline-block",
									width: "50%",
									marginLeft: "16px",
								}}
							>
								<Select placeholder="请选择">
									{dfupdateList.map((model) => {
										return (
											<Select.Option value={model.label} key={model.label}>
												{model.label}
											</Select.Option>
										);
									})}
								</Select>
							</Form.Item>
						</Form.Item>
					</Col>
					<Col flex="394px">
						<Form.Item name="updateTime" label="更新时间">
							<Input placeholder="请输入" />
						</Form.Item>
					</Col>
				</Row>
				<Row>
					<Col span={12}>
						<BlockTitle text="配置信息" bottom={16} />
					</Col>
				</Row>
				<Row gutter={16}>
					{realScope.length > 0 ? (
						<Col flex="392px">
							<Form.Item
								name="scopeLists"
								label="配置范围"
								initialValue={[realScope[0].key]}
								rules={[{ required: true, message: "请选择配置！" }]}
							>
								<Checkbox.Group
								// defaultValue={[realScope[0].key]}
								>
									{realScope.map((item, index) => (
										<Checkbox
											checked={true}
											value={item.key}
											key={item.key}
											onChange={(e) => {
												getNewValue("realScope", e.target);
												if (props.allData) {
													updateSave();
												}
											}}
										>
											{item.value}
										</Checkbox>
									))}
								</Checkbox.Group>
							</Form.Item>
						</Col>
					) : null}
					<Col flex="392px">
						<Form.Item
							name="businessCategoryId"
							label="业务域"
							rules={[{ required: true, message: "请填写业务域！" }]}
						>
							<Select
								placeholder="请选择"
								className="business"
								onChange={(e) => {
									getNewValue("businessName", e);
									// if (props.allData) {
									// 	updateSave();
									// }
								}}
							>
								{businessIdList.map((model) => {
									return (
										<Select.Option
											value={model.businessCategoryId}
											key={model.businessCategoryId}
										>
											{model.businessCategoryName}
										</Select.Option>
									);
								})}
							</Select>
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					{MCDThemeList ? <Col flex="none">
						<Form.Item
							name="subjectId"
							label="MCD主题"
							rules={[{ required: true, message: "请填写主题！" }]}
							style={{ width: '376px' }}
						>
							<Cascader
								options={allTheme[0]}
								fieldNames={{ label: 'name', value: 'id', children: 'sonSubjectList' }}
								changeOnSelect
								onChange={(value, option) => {
									updateSave();
									getNewValue("subjectId", value);
								}}
							/>
						</Form.Item>
					</Col> : null}
					{RGMThemeList ? <Col flex="none">
						<Form.Item
							name="subjectRgmId"
							label="RGM主题"
							rules={[{ required: true, message: "请填写主题！" }]}
							style={{ width: '376px' }}
						>
							<Cascader
								options={allTheme[1]}
								fieldNames={{ label: 'name', value: 'id', children: 'sonSubjectList' }}
								changeOnSelect
								onChange={(value, option) => {
									updateSave();
									getNewValue("subjectRgmId", value);
								}}
							/>
						</Form.Item>
					</Col> : null}
				</Row>
				<Row gutter={16}>
					<Col flex="none">
						<Form.Item
							label={
								<span className="form-item-label">
									<i>*</i>业务Owner
								</span>
							}
							style={{ width: '376px' }}>
							<Form.Item name="businessOwnerName" noStyle rules={[{ required: true, message: "请输入业务Owner！" }]}>
								<Input placeholder="请输入员工编号" disabled style={{ width: '280px' }} />
							</Form.Item>
							<Button onClick={() => handleShowSearchModal('businessOwnerName', 'businessOwnerNo')}>查询</Button>
						</Form.Item>
					</Col>
					<Col flex="none">
						<Form.Item
							label={
								<span className="form-item-label">
									<i>*</i>数据Owner
								</span>
							}
							style={{ width: '376px' }}
						>
							<Form.Item name="dataOwnerName" noStyle rules={[{ required: true, message: "请输入数据Owner！" }]}>
								<Input placeholder="请输入员工编号" disabled style={{ width: '280px' }} />
							</Form.Item>
							<Button onClick={() => handleShowSearchModal('dataOwnerName', 'dataOwnerNo')}>查询</Button>
						</Form.Item>
					</Col>
				</Row>
				{isShowRoles ? (
					<Row>
						<Col flex="772px">
							<Form.Item name="roleCodes" label="允许访问角色">
								<Select
									placeholder="请选择"
									mode="multiple"
									showSearch
									allowClear
									onChange={(e, option) => {
										getNewValue("roleCodes", option);
										if (props.allData) {
											updateSave();
										}
									}}
									filterOption={(input, option) =>
										option.children
											.toLowerCase()
											.includes(input.toLowerCase())
									}
								>
									{RoleList.map((model) => {
										return (
											<Select.Option
												value={model.roleCode}
												key={model.roleCode}
											>
												{model.roleName}
											</Select.Option>
										);
									})}
								</Select>
							</Form.Item>
						</Col>
					</Row>
				) : null}
				<Row gutter={16}>
					<Col flex="394px">
						<Form.Item name="launchStatus" label="上线标识">
							<Switch
								checked={switchStatu}
								onChange={(e) => getNewValue("launchStatus", e)}
							/>
						</Form.Item>
					</Col>
					{switchStatu ? (
						<Col flex="394px">
							<Form.Item name="onlineDate" label="有效时间">
								<DatePicker.RangePicker
									placeholder={["开始日期", "结束日期", "今天"]}
									showToday
									onChange={(e) => getNewValue("onlineDate", e)}
								/>
							</Form.Item>
						</Col>
					) : null}
				</Row>
				<Row>
					<Col span={12}>
						<BlockTitle text="配置信息" bottom={16} />
					</Col>
				</Row>
				<Row>
					<Col flex="772px">
						<Form.Item
							name="confluenceUrl"
							onChange={() => {
								if (props.allData) {
									updateSave();
								}
							}}
							label={
								<span className="form-item-label">
									指标&维度
									<a
										href="https://pmo.mcd.com.cn/confluence/pages/viewpage.action?pageId=51212134"
										target={"_blank"}
									>
										<IconDownload />
									</a>
								</span>
							}
							rules={[
								{ required: true, message: "请输入文件Confluence链接！" },
							]}
						>
							<Input
								className="fileUrl number-hint"
								placeholder="请输入文件Confluence链接"
								maxLength={200}
								showCount={true}
							/>
						</Form.Item>
					</Col>
				</Row>
				{/* <Row>
                <Col>
                    <Button type="primary" onClick={this.fetchValue}>提交</Button>
                    <Button type="default" onClick={this.handleCancle}>取消</Button>
                </Col>
            </Row> */}
			</Form>
		</div>
		}
		<SearchOwner {...searchOwnerModal} handleOwner={handleOwner} onHide={hideNotice} />
	</>
});

export default sheetDirectoryForm;
