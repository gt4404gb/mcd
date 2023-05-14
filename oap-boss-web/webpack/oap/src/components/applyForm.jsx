import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Spin, Button, Modal, Form, message, Select, Row, Col, Table, Empty, Alert, Input } from '@aurum/pfe-ui';
import { IconLoadingFill } from '@aurum/icons';
import { McdWorkflow } from '@mcdboss/business-components';
import { getBusinessCategory } from '@/api/oap/guide_analysis';
import {
	queryTableListAuthBySupplier,
	saveApplyInfos,
	bindRequestId,
	getWorkflowId,
	getApplyDetails,
	changeApplyStatus,
	updateApplyInfos,
	queryAnalysisAuthList,
	getApplyOwner
} from '@/api/oap/apply_form';
import { querySupplierInfo, queryUserInfo } from '@/api/oap/commonApi';
import querystring from "query-string";
import { optionFilterProp } from "@/utils/store/func";
import { APPLY_STATUS, APPLY_STATUS_LIST, APPLY_TYPE, APPLICANT_TYPE, APPLY_MAINDATA } from '@/constants';
import { OAP_VERSION } from '@/constants';

const applyForm = forwardRef((props, ref) => {
	const ApplyFormDomRef = useRef();
	const [locationSearch, setLocationSearch] = useState(() => {
		return querystring.parse(props.location.search);
	})
	const [isLoading, setLoading] = useState(false);
	const [editAbleArr, setEditAble] = useState([APPLY_STATUS.stateless, APPLY_STATUS.back, APPLY_STATUS.withdrawn]);
	const [fieldInfo, setFieldInfo] = useState({});
	const [workflowId, setWorkflowId] = useState();
	const [requestId, setRequestId] = useState();
	const [disabled, setDisabled] = useState(true);
	const [visible, setVisible] = useState(false);
	const [alertMsg, setAlertMsg] = useState(<>
		<div>code:</div>
		<div>errMsg:</div>
	</>)
	const [emptyTips, setEmptyTips] = useState();
	const [buttonDisabled, setButtonDisabled] = useState(false);
	let config = {
		//workflowId: '79', // 工作流类型id
		title: `申请${locationSearch?.from == 'analysis' ? '分析场景' : '数据表权限'}`,
		eid: '', // 当前用户的eid
		systemName: 'NoB',
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
		_initAsync();
	}, [])

	const _initAsync = async () => {
		setLoading(true);
		try {
			let promiseAllRequest = [getWorkflowId(APPLY_TYPE[locationSearch?.from])];
			if (locationSearch.id) {
				promiseAllRequest.push(getApplyDetails({ id: locationSearch?.id }))
			}
			const res = await Promise.all(promiseAllRequest);
			if (res[1] && res[1].data) {
				setFieldInfo({
					...res[1].data,
					applyInfo: res[1].data.applyInfo.map(itm => {
						return { ...itm, value: itm.id, label: itm.name, children: itm.name, 'aria-label': itm.type }
					})
				})
				setLocationSearch({
					...locationSearch,
					...{ isOthers: res[1].data.applyEmployeeType == APPLICANT_TYPE.others }
				})
				if ((res[1].data.requestId ?? '') !== '') {
					setRequestId(() => (res[1].data.requestId))
					handleDiabled(res[1].data?.applyStatus, '' + res[1].data?.applyEmployeeNumber);
				} else {
					//setButtonDisabled(true)
					setDisabled(false)
				}
			}
			if (promiseAllRequest.length == 1) {
				setFieldInfo({
					...fieldInfo,
					applyAdid: userInfoLocal.adid,
					applyEmployeeNumber: userInfoLocal.employeeNumber,
					applyType: APPLY_TYPE[locationSearch.from],
					applyEmployeeType: locationSearch?.isOthers ? APPLICANT_TYPE.others : APPLICANT_TYPE.self, //1：本人申请，2：为供应商申请
					authAccounts: locationSearch?.isOthers ? [] : [{
						employeeNumber: userInfoLocal.employeeNumber,
						adid: userInfoLocal?.adid,
						eid: userInfoLocal?.eid,
						chineseName: userInfoLocal?.chineseName || '',
						email: userInfoLocal?.email || ''
					}],
					businessCategoryId: locationSearch.businessCategoryId ? locationSearch.businessCategoryId : undefined,
				})
				setDisabled(false)
			}
			if (res[0].data) {
				setWorkflowId(res[0].data?.value)
			}
			setLoading(false)
		} catch (errInfo) {
			console.log('_initAsync', errInfo)
			setEmptyTips(errInfo && errInfo.msg)
			setLoading(false)
		}
	}

	const onAction = async ({ type, next, update }) => {
		const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
		let dataNext = {};
		console.log('type:', type, formData)
		switch (type) {
			// 保存
			case 'submit':
				//如果是流程发起人
				if (!disabled) {
					ApplyFormDomRef.current.getForm()?.validateFields().then(async (values) => {
						try {
							const commitParams = {
								applyEmployeeType: formData.applyEmployeeType,
								authAccounts: [
									{
										employeeNumber: ApplyFormDomRef.current.getSupplier()[0]?.employeeNumber,
										adid: ApplyFormDomRef.current.getSupplier()[0]?.adid || '',
										eid: ApplyFormDomRef.current.getSupplier()[0]?.eid || '',
										chineseName: ApplyFormDomRef.current.getSupplier()[0]?.chineseName || '',
										email: ApplyFormDomRef.current.getSupplier()[0]?.email || ''
									}
								],
								applyType: formData.applyType,//申请类型
								businessCategoryId: values?.businessCategoryId,
								applyInfo: values.applyInfo.map(itm => {
									return {
										id: itm.value,
										type: itm['aria-label']
									}
								}),
								applyReason: values.applyReason,
								applyTarget: values.applyTarget,
							}
							dataNext = formatMainData();
							if (!formData.id) {
								console.log('saveApplyInfos', commitParams)
								setLoading(true)
								const resApplyId = await saveApplyInfos(commitParams);//保存申请信息  17085163993833472
								if (resApplyId.data) {
									setFieldInfo(() => ({ ...fieldInfo, id: resApplyId.data }));
									ApplyFormDomRef.current.getForm().setFieldsValue({ id: resApplyId.data });
									dataNext = {
										...dataNext,
										url: {
											mobile: `https://${window.location.host}/data-h5/#/apply?id=${resApplyId.data}&from=${locationSearch?.from}&${OAP_VERSION}`,
											pc: window.location.origin + `/oap/index/apply/form?id=${resApplyId.data}&from=${locationSearch.from}&${OAP_VERSION}`, // 填入真实流程地址
										}
									}
									dataNext.mainData.forEach(mainItem => {
										if (mainItem.fieldName == 'applyId') {
											mainItem.fieldValue = '' + resApplyId.data
										}
									})
								}
							}
							await _getApplyOwner(dataNext);  //获取审批人
							// console.log('111111', commitParams)
							// return
							setLoading(true)
							next(dataNext).then(resNxt => { //100126
								if (resNxt.success) {
									//主键id 即流程编号存在时，需要更新form数据
									if (formData.id) {
										console.log('updateApply', commitParams)
										updateApply({ ...commitParams, id: formData.id }, () => {
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
						} catch (errInfo) {
							errInfo.msg && message.error(errInfo.msg);
							setLoading(false)
						}
					}).catch(err => {
						console.log('表单校验失败')
					})
				} else {
					dataNext = formatMainData();
					await _getApplyOwner(dataNext);
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
			// 退回
			case 'back':
				dataNext = formatMainData();
				setLoading(true)
				next(dataNext).then((res) => {
					if (res.success) {
						reEditStatus(formData.id, APPLY_STATUS.back, update);
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
			//撤回
			case 'withdraw':
				dataNext = formatMainData();
				Modal.confirm({
					title: "撤回流程",
					content: (<>是否撤回流程？<br />撤回后可重新发起</>),
					cancelText: "取消",
					okText: "撤回",
					onOk: () => {
						setLoading(true)
						next(dataNext).then((res) => {
							if (res.success) {
								reEditStatus(formData.id, APPLY_STATUS.withdrawn, update);
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

	const formatMainData = () => {
		const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
		let data = {}, key = '';
		switch (formData.applyType) {
			case APPLY_TYPE.data:
				key = 'data';
				break;
			case APPLY_TYPE.analysis:
				key = 'analysis';
				break;
		}
		data = {
			url: {
				mobile: `https://${window.location.host}/data-h5/#/apply?id=${formData?.id}&from=${locationSearch?.from}&${OAP_VERSION}`,
				pc: window.location.origin + `/oap/index/apply/form?id=${formData?.id}&from=${locationSearch?.from}&${OAP_VERSION}`, // 填入真实流程地址
			},
			mainData: APPLY_MAINDATA[key].map(itm => {
				let transformValue = '';
				if (itm.needTransform) {
					if (itm.fieldName == 'authAdid') {
						if (locationSearch?.isOthers) {
							transformValue = formData[itm.fieldValue].map(valueItm => valueItm[itm.labelKey]).join(',')
						} else {
							transformValue = '';
						}
					} else {
						transformValue = formData[itm.fieldValue].map(valueItm => valueItm[itm.labelKey]).join(',')
					}
				}
				return {
					"fieldName": itm.fieldName,
					"fieldValue": itm.needTransform ? transformValue : formData[itm.fieldValue]
				}
			})
		}
		return data;
	}

	//获取审批人
	const _getApplyOwner = async (dataNext) => {
		try {
			const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
			const applyInfo = formData?.applyInfo.map(it => {
				return { id: it.value, type: it['aria-label'] }
			})
			const resApplyOwner = await getApplyOwner({
				applyInfo,
				businessCategoryId: formData?.businessCategoryId,
				applyType: formData?.applyType
			})
			if (resApplyOwner.data) dataNext.mainData.push({ fieldName: 'ownerEmplNumber', fieldValue: resApplyOwner.data });
		} catch (err) {
			console.log('err = ', err);
			message.warning(err.msg || '流程失败！');
			setLoading(false);
		}
	}

	const saveRequestId = (params, callBack) => {
		const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
		bindRequestId({ ...params, id: formData.id }).then(res => {
			if (res.msg == 'success') {
				message.success('申请成功');
				callBack && callBack()
			}
		}).catch(err => {
			err.msg && message.error(err.msg);
			setLoading(false);
		})
	}

	const updateApply = (params, callBack) => {
		updateApplyInfos(params).then(res => {
			if (res.msg == 'success') {
				message.success('申请成功');
				callBack && callBack();
			}
		}).catch(err => {
			message.error(err?.msg || '更新form表单接口报错');
		})
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

	const reEditStatus = async (id, backStatus, callback) => {
		setLoading(true);
		const formData = ApplyFormDomRef.current.getForm().getFieldsValue(true);
		try {
			const res = await changeApplyStatus({ id, applyStatus: backStatus });
			if (res.msg == 'success') {
				message.success(optionFilterProp(APPLY_STATUS_LIST, 'value', backStatus)?.label + '成功');
				new Promise(async (resolve) => {
					await callback && callback();
					resolve()
				}).then(() => {
					handleDiabled(backStatus, '' + formData.applyEmployeeNumber);
					setLoading(false)
				})
			}
		} catch (errInfo) {
			setAlertMsg(<>
				<div>接口:/apply/change_apply_status</div>
				<div>code: {errInfo.code}</div>
				<div>msgType: {errInfo.msg}</div>
			</>)
			setVisible(true)
			setLoading(false)
		}
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
				<ApplyFormDom
					ref={ApplyFormDomRef}
					setLoading={setLoading}
					locationSearch={locationSearch}
					fieldInfo={fieldInfo}
					disabled={disabled} />
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
				<ApplyFormDom
					ref={ApplyFormDomRef}
					setLoading={setLoading}
					locationSearch={locationSearch}
					fieldInfo={fieldInfo}
					disabled={disabled} />
			</McdWorkflow>
		}
	}

	return <Spin spinning={isLoading}>
		{buttonDisabled && !requestId ? <Alert message="流程异常，请联系OAP管理员" type="error" /> : null}
		{visible ? (
			<Alert message={locationSearch?.from == 'analysis' ? '分析目录审批流程' : '数据目录审批流程'} description={alertMsg} type="error" closable />
		) : null}
		{renderWorkflow()}
	</Spin>
})

const ApplyFormDom = forwardRef((props, ref) => {
	const { locationSearch, setLoading, fieldInfo, disabled } = props;
	const [formApply] = Form.useForm();
	const formApplyRef = useRef();
	const [businessCategoryList, setBusinessCategoryList] = useState([]);
	const [columns, setColumns] = useState([
		{ title: "账号", dataIndex: 'adid' },
		{ title: "eid", dataIndex: 'eid' },
		{ title: '姓名', dataIndex: 'chineseName' },
		{ title: '邮箱', dataIndex: 'email' },
	]);
	const [supplierDataList, setSupplierDataList] = useState(fieldInfo.authAccounts || []);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [selectedRow, setSelectedRow] = useState(fieldInfo.authAccounts || []);
	const [applyInfoList, setApplyInfoList] = useState([]);
	const [applyInfoLoading, setApplyInfoLoading] = useState(false);

	// 暴露组件的方法
	useImperativeHandle(ref, () => ({
		getForm: () => {
			return formApply
		},
		getSupplier: () => {
			return selectedRow
		}
	}))

	useEffect(() => {
		if (fieldInfo.authAccounts && fieldInfo.authAccounts[0]) {
			setSelectedRowKeys([fieldInfo.authAccounts[0].employeeNumber])
		}
		initMeta();
	}, [])

	//查询供应商
	const handleSupplier = async () => {
		const formSupplier = formApplyRef.current.getFieldValue('supplier') || {};
		if (!Object.keys(formSupplier).length) {
			message.warning('请输入要查询的供应商信息')
			return;
		}
		setLoading(true)
		setSupplierDataList([])
		setSelectedRowKeys([])
		setSelectedRow([])
		setApplyInfoList([])
		formApplyRef.current.setFieldsValue({
			applyInfo: []
		})
		try {
			const res = await queryUserInfo({ ...formSupplier, userType: 2 });
			if (res.data.length) {
				setSupplierDataList([...res.data])
			}
			// else {
			// 	message.warning('无法查询到匹配的供应商信息')
			// }
			setLoading(false)
		} catch (errInfo) {
			message.error(errInfo || errInfo?.msg || errInfo?.message);
			setLoading(false)
		}
	}

	const resetSearch = () => {
		formApplyRef.current.setFieldsValue({ 'supplier': undefined })
	}

	const initMeta = async () => {
		setLoading(true)
		try {
			let promiseAllRequest = [getBusinessCategory()];
			if (locationSearch.id || locationSearch.applyInfo) {
				if (locationSearch?.from == 'data') {
					promiseAllRequest.push(queryTableListAuthBySupplier({
						businessCategoryId: fieldInfo?.businessCategoryId,
						employeeNumber: fieldInfo.authAccounts[0].employeeNumber,
						adId: fieldInfo.authAccounts[0].adid
					}))
				} else if (locationSearch?.from == 'analysis') {
					promiseAllRequest.push(queryAnalysisAuthList({
						businessCategoryId: fieldInfo?.businessCategoryId,
						employeeNumber: fieldInfo.authAccounts[0].employeeNumber
					}))
				}

			}
			const res = await Promise.all(promiseAllRequest);
			if (res[0].data) {
				setBusinessCategoryList(res[0].data)
			}
			if (res[1] && res[1].data) {
				setApplyInfoList(res[1].data)
				if (locationSearch.applyInfo) {
					formApplyRef.current.setFieldsValue({
						applyInfo: res[1].data.filter(item => (item.id == locationSearch.applyInfo))
							.map(info => ({ ...info, key: info.id, value: info.id, children: info.name, 'aria-label': info.type }))
					})
				}
			}
			setLoading(false)
		} catch (errInfo) {
			console.log('child initMeta', errInfo)
			setLoading(false)
		}
	}

	//选中供应商
	const onSelectChange = (selectedRowKeys, selectedRow) => {
		setSelectedRowKeys(selectedRowKeys);
		setSelectedRow(selectedRow);
		formApplyRef.current.setFieldsValue({
			authAccounts: [...selectedRow]
		})
	}

	//选择业务域
	const handleChangeBusinessCategoryId = (value, option) => {
		formApplyRef.current.setFieldsValue({
			businessCategoryId: value,
			businessCategoryName: option.children,
			applyInfo: []
		})
	}

	const onDropdownVisibleChange = (open) => {
		if (open) {
			let requestApi = queryTableListAuthBySupplier, commitParams = {};
			if (locationSearch.isOthers && !selectedRow.length) {
				message.warning('请先选择供应商账号')
				return;
			}
			const formData = formApplyRef.current?.getFieldsValue(true);
			if ((formData.businessCategoryId ?? '') === '') {
				message.warning('请先选择业务域')
				return;
			}
			if (locationSearch?.from == 'data') {
				commitParams = {
					businessCategoryId: formData.businessCategoryId,
					employeeNumber: selectedRow[0].employeeNumber,
					adId: selectedRow[0].adid
				}
			} else if (locationSearch?.from == 'analysis') {
				requestApi = queryAnalysisAuthList;
				commitParams = {
					businessCategoryId: formData.businessCategoryId,
					employeeNumber: locationSearch?.isOthers ? selectedRow[0].employeeNumber : formData.applyEmployeeNumber
				}
			}
			setApplyInfoLoading(true)
			setApplyInfoList([])
			requestApi(commitParams).then(res => {
				if (res.data) { //res.data && res.data.length
					setApplyInfoList(() => {
						const mapRes = new Map();
						let formApplyInfo = [];
						const resData = res.data.map(itm => {
							return { ...itm, value: itm.id, label: itm.name, children: itm.name, key: itm.id }
						})
						if (formData.applyInfo.length) {
							formApplyInfo = formData.applyInfo.map(itm => {
								return { ...itm, label: itm.children, name: itm.children, id: itm.value }
							})
						}
						console.log(121121, resData, formApplyInfo)
						return [...resData, ...formApplyInfo].filter(itm => {
							return !mapRes.has(itm['id']) && mapRes.set(itm['id'], 1)
						})
					})
				}
				setApplyInfoLoading(false)
			}).catch(err => {
				err.msg && message.error(err.msg);
				setApplyInfoLoading(false)
			})
		}
	}

	const handleChangeApplyInfo = (value, option) => {
		formApplyRef.current.setFieldsValue({
			applyInfo: option
		})
	}

	let rowSelection = {
		type: 'radio',
		selectedRowKeys,
		onChange: onSelectChange,
		getCheckboxProps: (record) => ({
			disabled: disabled,
		}),
	};

	useEffect(() => {
		console.log('useEffect child', disabled)
	}, [disabled])

	const renderContainer = () => {
		const branchName = locationSearch?.from == 'analysis' ? '分析名' : '表名';
		return <>
			{(locationSearch?.isOthers || fieldInfo.applyEmployeeType == 2) && <Row>
				<Col flex="772px">
					<Form.Item label="供应商账号:" style={{ marginBottom: '0' }}>
						<Row gutter={8}>
							<Col>
								<Form.Item layout="vertical" className='oap-form-supplier' >
									<Row gutter={8}>
										<Col span={3}>
											<Form.Item label="账号" name={['supplier', 'adid']}>
												<Input disabled={disabled} allowClear placeholder='请输入' />
											</Form.Item>
										</Col>
										<Col span={3}>
											<Form.Item label="eid" name={['supplier', 'eidCode']}>
												<Input disabled={disabled} allowClear placeholder='请输入' />
											</Form.Item>
										</Col>
										<Col span={3}>
											<Form.Item label="姓名" name={['supplier', 'cnName']}>
												<Input disabled={disabled} allowClear placeholder='请输入' />
											</Form.Item>
										</Col>
										<Col span={3}>
											<Form.Item label="邮箱" name={['supplier', 'email']}>
												<Input disabled={disabled} allowClear placeholder='请输入' />
											</Form.Item>
										</Col>
									</Row>
									<Row gutter={8} style={{ marginTop: '24px' }}>
										<Col flex="80px">
											<Button type="primary" disabled={disabled} onClick={handleSupplier}>查询</Button>
										</Col>
										<Col flex="80px">
											<Button disabled={disabled} onClick={resetSearch}>重置</Button>
										</Col>
									</Row>
								</Form.Item>
							</Col>
						</Row>
						<Form.Item
							name="authAccounts"
							rules={[{
								validator: (rule, value, callback) => {
									if (!rowSelection.selectedRowKeys.length) {
										callback('请选择供应商账号')
									} else {
										callback()
									}
								}
							}]}>
							<Table
								rowKey="employeeNumber"
								pagination={{ position: ["none"] }}
								rowSelection={rowSelection}
								columns={columns}
								dataSource={supplierDataList}
								style={{ marginTop: '16px' }} />
						</Form.Item>
					</Form.Item>
				</Col>
			</Row>}
			<Row>
				<Col span={4}>
					<Form.Item label="业务域" name="businessCategoryId" rules={[{ required: true, message: '请选择业务域' }]}>
						<Select
							placeholder='请选择'
							allowClear
							showSearch
							disabled={disabled}
							option-filter-prop="children"
							filterOption={(input, option) => (option?.children.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
							onChange={handleChangeBusinessCategoryId}>
							{businessCategoryList.map(model => {
								return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
							})}
						</Select>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col span={6}>
					<Form.Item label={`申请${branchName}`} name="applyInfo" rules={[{ required: true, message: `申请${branchName}` }]}>
						<Select
							mode="multiple"
							showArrow
							labelInValue
							placeholder='请选择'
							allowClear
							showSearch
							option-filter-prop="children"
							filterOption={(input, option) => (option?.children.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
							disabled={disabled}
							notFoundContent={applyInfoLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
							onDropdownVisibleChange={onDropdownVisibleChange}
							onChange={handleChangeApplyInfo}>
							{applyInfoList.map(model => {
								return <Select.Option value={model.id} key={model.id} aria-label={model.type}>{model.name}</Select.Option>
							})}
						</Select>
					</Form.Item>
				</Col>
			</Row>
		</>
	}

	return <div style={{ background: '#fff', padding: ' 0 16px' }}>
		<div className='oap-mcd-workflow-box-title'>申请信息</div>
		<Form
			form={formApply}
			ref={formApplyRef}
			initialValues={fieldInfo}
			labelCol={{ flex: '86px' }}
			className='oap-form-labelBold'>
			{fieldInfo.id && <Row>
				<Col span={6}><Form.Item label="流程编号" style={{ marginBottom: '0' }}>
					<span className="ant-form-text">{fieldInfo?.id}</span>
				</Form.Item></Col>
			</Row>}
			<Row>
				<Col span={6}>
					<Form.Item label="申请账号" style={{ marginBottom: '6px' }}>
						<span className="ant-form-text">{fieldInfo?.applyAdid}</span>
					</Form.Item>
				</Col>
			</Row>
			{renderContainer()}
			<Row>
				<Col span={6}>
					<Form.Item label="申请用途" name="applyReason" rules={[{ required: true, message: '请输入申请用途' }]}>
						<Input.TextArea rows={4} placeholder="请输入申请用途" maxLength={500} showCount disabled={disabled} />
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col span={6}>
					<Form.Item label="业务目标" name="applyTarget" rules={[{ required: true, message: '请输入可达成的业务目标' }]}>
						<Input.TextArea rows={4} placeholder="请输入可达成的业务目标" maxLength={500} showCount disabled={disabled} />
					</Form.Item>
				</Col>
			</Row>
		</Form>
	</div>
})

export default applyForm;