import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Row, Col, Form, Input } from "@aurum/pfe-ui";
import BlockTitle from '@/components/blockTitle/index'
import "moment/locale/zh-cn";

const ApplyView = forwardRef((props, ref) => {
	console.log('useEffect child', props)
	const { userInfoLocal, fieldInfo, disabled } = props
	const { TextArea } = Input
	const [formApply] = Form.useForm();
	// 获取from表单1
	const formApplyRef = useRef();

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

	useEffect(() => {
		console.log('useEffect child', disabled)
	}, [disabled])

	return <div style={{ padding: '16px', backgroundColor: '#fff' }}>
		<BlockTitle text="申请信息" top={0} bottom={16} />
		{disabled ? <Form
			form={formApply}
			ref={formApplyRef}
			labelCol={{ flex: '86px' }}
			className='oap-form-labelBold'
			initialValues={fieldInfo}>
			<Row>
				<Col flex="685px">
					<Form.Item label="申请账号:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo?.applyAdid}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item label="报告类型:" style={{ marginBottom: '0' }}>
						<span>在线报告</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item label="报告范围:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo?.reportChineseName}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item label="业务域:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo.report.businessCategory?.name}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item label="报告名称:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo.report?.reportName}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item name="applyReason" label="申请用途:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo?.applyReason}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item name="applyTarget" label="业务目标:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo?.applyTarget}</span>
					</Form.Item>
				</Col>
			</Row>
		</Form> : <Form
			form={formApply}
			ref={formApplyRef}
			labelCol={{ flex: '86px' }}
			className='oap-form-labelBold'
			initialValues={fieldInfo}>
			<Row>
				<Col flex="685px">
					<Form.Item label="申请账号:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo.applyAdid ?? userInfoLocal?.adid}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item label="报告类型:" style={{ marginBottom: '0' }}>
						<span>在线报告</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item label="报告范围:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo?.reportChineseName}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item label="业务域:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo.businessCategory?.name ?? fieldInfo.report.businessCategory?.name}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item label="报告名称:" style={{ marginBottom: '0' }}>
						<span>{fieldInfo.applyName ?? fieldInfo?.reportName}</span>
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item name="applyReason" rules={[{ required: true, message: "请填写说明！" }]} label="申请用途:">
						<TextArea style={{ width: "594px" }} placeholder={"请输入说明"} rows={4} showCount maxLength={500} />
					</Form.Item>
				</Col>
			</Row>
			<Row>
				<Col flex="685px">
					<Form.Item name="applyTarget" rules={[{ required: true, message: "请填写业务目标！" }]} label="业务目标:">
						<TextArea style={{ width: "594px" }} placeholder={"请输入可达成的业务目标"} rows={4} showCount maxLength={500} />
					</Form.Item>
				</Col>
			</Row>
		</Form>}
	</div>
})
export default ApplyView