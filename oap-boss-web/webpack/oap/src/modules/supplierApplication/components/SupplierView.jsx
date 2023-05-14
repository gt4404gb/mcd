import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Row, Col, Button, Form, Table, Select, message, Spin, Empty, Input } from "@aurum/pfe-ui";
import {
	getBusinessList,
	queryReportList
} from "@/api/oap/registration_report";
import { queryUserInfo } from '@/api/oap/commonApi';
import BlockTitle from '@/components/blockTitle/index'
import "moment/locale/zh-cn";
import { IconLoadingFill } from '@aurum/icons';

const SupplierView = forwardRef((props, ref) => {
	const { userInfoLocal, fieldInfo, disabled, locationSearch } = props
	// 获取from表单
	const [formApply] = Form.useForm();
	const formApplyRef = useRef();
	const { TextArea } = Input;
	// 业务域数据
	const [businessIdList, setBusinessIdList] = useState([]);
	// 报告名称
	const [reportName, setReportName] = useState([])

	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	// 供应商数据
	const [supplierDataList, setSupplierDataList] = useState(fieldInfo.authAccounts || [])
	const [selectedRow, setSelectedRow] = useState(fieldInfo.authAccounts || []);
	// 请求报告列表加载
	const [selectLoading, setSelectLoading] = useState(false)
	const subjectState = !(/rgm-boss/gi.test(window.location.hostname))

	useEffect(() => {
		if (fieldInfo.authAccounts && fieldInfo.authAccounts[0]) {
			setSelectedRowKeys([fieldInfo.authAccounts[0].employeeNumber])
		}
		init()
	}, [])
	const selectRef = useRef()

	const init = async () => {
		try {
			// 获取业务域
			let res = await Promise.all([getBusinessList(locationSearch.type ?? fieldInfo.reportList[0].reportRangeModule)])
			setBusinessIdList(res[0].data)
			//设置BU报告中文名
			if (fieldInfo.reportList) {
				queryReportList({
					accessStatus: 2,
					size: 999,
					page: 0,
					reportRangeModule: locationSearch.type && fieldInfo.reportList[0].reportRangeModule,
					businessCategoryId: fieldInfo.reportList[0].businessCategoryId,
					sort: "id,asc",
					subjectType: subjectState ? 1 : 2,
					launchStatus: 1,
					superintendentNumber: "all",
				}).then(res => {
					setReportName(res.data.items)
					console.log(res);
				})
			}
		} catch (err) {
			console.log(err);
		}

	}

	// 返回给父组件的ref方法
	useImperativeHandle(ref, () => ({
		getForm: () => {
			return formApply
		},
		getSwitchStatus: () => {
			return switchStatu
		},
		getReportRangeName: () => {
			return reportRangeList
		},
		getBusinessIdList: (value) => {
			return getNewValue('reportRangeList', value)
		}
	}))

	const columns = [
		{
			title: '账号',
			dataIndex: 'adid'
		},
		{
			title: 'eid',
			align: "left",
			dataIndex: 'eid'
		},
		{
			title: '姓名',
			dataIndex: 'chineseName'
		},
		{
			title: '邮箱',
			dataIndex: 'email'
		},
	];

	const onSelectChange = (selectedRowKeys, selectedRow) => {
		setSelectedRowKeys(selectedRowKeys);
		setSelectedRow(selectedRow);
		formApplyRef.current.setFieldsValue({
			authAccounts: [...selectedRow]
		})
	}

	// table的配置项
	let rowSelection = {
		type: 'radio',
		selectedRowKeys,
		onChange: onSelectChange,
		getCheckboxProps: (record) => ({
			disabled: locationSearch.type ? false : true
		}),

	};

	//查询供应商
	const handleSupplier = async () => {
		const formSupplier = formApplyRef.current.getFieldValue('supplier') || {};
		if (!Object.keys(formSupplier).length) {
			message.warning('请输入要查询的供应商信息')
			return;
		}
		setSupplierDataList([])
		setSelectedRowKeys([])
		setSelectedRow([])
		formApplyRef.current.setFieldsValue({
			employeeNumber: undefined
		})
		try {
			const res = await queryUserInfo({ ...formSupplier, userType: 2 });
			if (res.data.length) {
				setSupplierDataList([...res.data])
			}
			// else {
			// 	message.warning('无法查询到匹配的供应商信息')
			// }
		} catch (errInfo) {
			message.error(errInfo || errInfo?.msg || errInfo?.message);
		}
	}

	const resetSearch = () => {
		formApplyRef.current.setFieldsValue({ 'supplier': undefined })
	}

	// onchange事件
	const getNewValue = (dataType, value) => {
		if (dataType === "businessName") {
			if ((value ?? '') !== '') {
				setSelectLoading(true)
				console.log(value);
				let obj = businessIdList.find(item => item.businessCategoryId === value.trim())
				formApplyRef.current.setFieldsValue({
					businessCategory: [obj.businessCategoryName, obj.businessCategoryId]
				})
				queryReportList({
					accessStatus: 0,
					reportStatus: 1,
					size: 999,
					page: 0,
					reportRangeModule: locationSearch.type,
					businessCategoryId: obj.businessCategoryId,
					subjectType: subjectState ? 1 : 2,
					sort: "id,asc",
					launchStatus: 1,
					superintendentNumber: "all",
				}).then(res => {
					setReportName(res.data.items)
					let dpg = res.data.items.map(item => item.id)
					console.log(dpg);
					setSelectLoading(false)
					console.log(res);
				}).catch(err => {
					console.log(err);
				})
				formApplyRef.current.setFieldsValue({
					applyInfo: []
				})
			} else {
				setReportName([])
				formApplyRef.current.setFieldsValue({
					applyInfo: []
				})
			}
		}
		if (dataType === "reportNameList") {
			let res = value.map(items => reportName.find(item => item.id == items.key))
			let val = res.map(item => item.reportName)
			let keys = value.map(item => item.key)
			let reportCode = res.map(item => item.reportCode)
			formApplyRef.current.setFieldsValue({
				reportNameList: [val, keys, reportCode]
			})
		}
	}

	return <div style={{ background: '#fff', padding: ' 0 16px' }}>
		<BlockTitle text="申请信息" top={16} bottom={16} />
		<Form
			form={formApply}
			ref={formApplyRef}
			initialValues={fieldInfo}
			labelCol={{ flex: '86px' }}
			className='oap-form-labelBold'>
			<Row>
				<Col flex="772px" >
					<Form.Item label="申请账号:" style={{ marginBottom: '6px' }}>
						<span>{fieldInfo.applyAdid ?? userInfoLocal.adid}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="772px">
					<Form.Item label="供应商账号:" style={{ marginBottom: '0' }}>
						<Row gutter={8}>
							<Col>
								<Form.Item layout="vertical" className='oap-form-supplier' >
									<Row gutter={8}>
										<Col span={3}>
											<Form.Item label="账号" name={['supplier', 'adid']}>
												<Input disabled={locationSearch.type ? false : true} allowClear placeholder='请输入' />
											</Form.Item>
										</Col>
										<Col span={3}>
											<Form.Item label="eid" name={['supplier', 'eidCode']}>
												<Input disabled={locationSearch.type ? false : true} allowClear placeholder='请输入' />
											</Form.Item>
										</Col>
										<Col span={3}>
											<Form.Item label="姓名" name={['supplier', 'cnName']}>
												<Input disabled={locationSearch.type ? false : true} allowClear placeholder='请输入' />
											</Form.Item>
										</Col>
										<Col span={3}>
											<Form.Item label="邮箱" name={['supplier', 'email']}>
												<Input disabled={locationSearch.type ? false : true} allowClear placeholder='请输入' />
											</Form.Item>
										</Col>
									</Row>
									<Row gutter={8} style={{ marginTop: '24px' }}>
										<Col flex="80px">
											<Button type="primary" disabled={locationSearch.type ? false : true} onClick={handleSupplier}>查询</Button>
										</Col>
										<Col flex="80px">
											<Button disabled={locationSearch.type ? false : true} onClick={resetSearch}>重置</Button>
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
						<span>{fieldInfo.reportChineseName}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="772px">
					<Form.Item
						className='report-apply-span-4'
						name="businessCategoryId"
						rules={[{ required: true, message: "请填写业务域！" }]}
						label="业务域:">
						<Select
							placeholder='请选择'
							allowClear
							disabled={locationSearch.type ? false : true}
							onChange={(e) => getNewValue("businessName", e)}
						// filterOption={(input, option) => option.children.toerCase().includes(input.toLowerCase())}
						>
							{businessIdList.map((model) => {
								return <Select.Option value={String(model.businessCategoryId)} key={String(model.businessCategoryId)}>
									{model.businessCategoryName}
								</Select.Option>
							})}
						</Select>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="772px" >
					<Form.Item
						className='report-apply-span-4'
						name="applyInfo"
						rules={[{ required: true, message: "请填写报告名称！" }]}
						label="报告名称:">
						<Select
							placeholder='请选择'
							allowClear
							showSearch
							ref={selectRef}
							disabled={locationSearch.type ? false : true}
							notFoundContent={selectLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
							mode="multiple"
							onChange={(e, option) => getNewValue("reportNameList", option)}
						>
							{reportName.map((model) => {
								return <Select.Option value={model.reportCode + '.' + model.reportName} key={model.id}>
									{model.reportCode + '.' + model.reportName}
								</Select.Option>
							})}
						</Select>
					</Form.Item>
				</Col>
			</Row>
			<Form.Item
				className='report-apply-span-4'
				name="reportNameList"
				label="报告名称:"
				hidden={true}>
				<span>存东西用的</span>
			</Form.Item>
			<Row>
				<Col flex="772px">
					<Form.Item
						name="applyReason"
						className='report-apply-span-4'
						rules={[{ required: true, message: "请填写说明！" }]}
						label="申请用途:">
						<TextArea disabled={disabled} style={{ width: "594px" }} placeholder={"请输入说明"} rows={4} showCount maxLength={500} />
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="772px">
					<Form.Item
						name="applyTarget"
						className='report-apply-span-4'
						rules={[{ required: true, message: "请填写业务目标！" }]}
						label="业务目标:">
						<TextArea disabled={disabled} style={{ width: "594px" }} placeholder={"请输入可达成的业务目标"} rows={4} showCount maxLength={500} />
					</Form.Item>
				</Col>
			</Row>
		</Form>
	</div>
})

export default SupplierView