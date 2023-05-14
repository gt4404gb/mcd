import React, { useRef, useState } from 'react';
import { Modal, Form, Select, Row, Col, Input, Switch, message } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';

const SaveTemplateModal = (props) => {
	const templateForm = useRef();
	const [publicType, setPublicType] = useState(false);

	const handleCancel = () => {
		templateForm.current.resetFields()
		setPublicType(false);
		props.onSaved({
			operation: 'cancel'
		})
	}

	const handleConfirm = async () => {
		templateForm.current.validateFields().then(values => {
			templateForm.current.resetFields();
			setPublicType(false);
			props.onSaved({
				operation: 'ok',
				formData: { ...values, publicType: publicType ? 1 : 0 }
			})
		})
	}

	const handleChangePublicType = (checked) => {
		setPublicType(checked);
	}

	return <Modal
		title="保存模板"
		visible={props.visible}
		cancelText="取消"
		okText="确定"
		confirmLoading={props.isLoading}
		onCancel={handleCancel}
		onOk={handleConfirm}>
		<div className="table-container">
			<Form
				ref={templateForm}
				layout="vertical"
				size="middle"
				initialValues={{ subjectId: props.subjectId }}>
				<div>
					<Row gutter={32}>
						<Col span={6}>
							<Form.Item name="subjectId" label="业务域名称" className="oap-form-labelBold">
								<Select placeholder="全部" disabled>
									{props.subjectModelList.length && props.subjectModelList.map(model => {
										return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
									})}
								</Select>
							</Form.Item>
						</Col>
						<Col span={6}>
							<Form.Item
								name="templateName"
								label="模板名称"
								className="oap-form-labelBold"
								rules={[
									{
										validator: (rule, value, callback) => {
											if ((value ?? '') !== '') {
												if (value.replace(/\s+/g, "").length == 0) {
													callback('您输入的全部是空格，请重新输入')
												} else {
													callback()
												}
											} else {
												callback("请输入查询名称")
											}
										}
									}
								]}>
								<Input placeholder="请输入模板名称" maxLength="255" allowClear />
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={32}>
						<Col span={12}>
							<Form.Item name="description" label="详情" className="oap-form-labelBold">
								<Input.TextArea rows={6} maxLength="255" />
							</Form.Item>
						</Col>
						{checkMyPermission('oap:templatemain:publicSave') ? <Col span={12}>
							<Form.Item name="publicType" >
								<span style={{ fontWeight: 'bold' }}>保存为系统模板</span>
								<Form.Item noStyle>
									<Switch checked={publicType} style={{ margin: '0 10px' }} onChange={handleChangePublicType} />
								</Form.Item>
								<span>系统模板将向所有用户公开，且只能由管理员删除</span>
							</Form.Item>
						</Col> : ''}
					</Row>
				</div>
			</Form>
		</div>
	</Modal>
}

export default SaveTemplateModal;