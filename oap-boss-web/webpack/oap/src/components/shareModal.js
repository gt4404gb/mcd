import React from 'react';
import { Form, Row, Col, Button, Input, Table, message, Modal } from '@aurum/pfe-ui';
import { queryUserInfoByPermission, queryUserInfo } from '@/api/oap/commonApi';
import { getCustomRulesSharedList, saveCustomRulesSharedList, saveBatchCustomRulesSharedList } from "@/api/oap/custom_rule.js";
import { getTemplateSharedList, saveTemplateSharedList, saveBatchTemplateSharedList } from '@/api/oap/self_analysis.js';

export default class ShareModal extends React.Component {
	constructor(props) {
		super(props);
		this.shareForm = React.createRef();
		this.state = {
			queryColumns: [
				{ title: "账号", dataIndex: 'adid' },
				{ title: "eid", dataIndex: 'eid' },
				{ title: "姓名", dataIndex: 'chineseName' },
				{ title: "邮箱", dataIndex: 'email' },
				{
					title: "操作",
					dataIndex: 'action',
					width: 100,
					align: 'left',
					render: (text, record) => this.renderQueryColumns(record)
				}
			],
			queryDataList: [],
			queryIsLoading: false,
			columns: [
				{ title: '序号', dataIndex: 'tableIndex' },
				{ title: "账号", dataIndex: 'adid' },
				{ title: "eid", dataIndex: 'eid' },
				{ title: "姓名", dataIndex: 'chineseName' },
				{ title: "邮箱", dataIndex: 'email' },
				{
					title: "操作",
					dataIndex: 'action',
					width: 80,
					align: 'left',
					render: (text, record) => {
						return <a key={record.employeeNumber} style={{ fontSize: '12px' }} onClick={() => this.handleRemove(record)}>移除</a>
					}
				}
			],
			dataList: [],
			isLoading: false,
			confirmLoading: false,
		}
	}

	componentWillReceiveProps (nextProps) {
		this.setState({ queryDataList: [], dataList: [] })
		if (nextProps.visible && !this.props.visible) this.initList(nextProps)
	}

	initList = async (props) => {
		if (props.isBatch) return;
		this.setState({ isLoading: true })
		try {
			let res = {};
			if (props.flag == 'custom') {
				res = await getCustomRulesSharedList({ id: props.detailInfos.templateId });
			} else {
				res = await getTemplateSharedList({ id: props.detailInfos.templateId });
			}
			let dataList = [...res.data || []].map((item, index) => {
				return {
					...item,
					tableIndex: index + 1,
				}
			})
			this.setState({
				dataList,
				isLoading: false,
			})
		} catch (errInfo) {
			errInfo.msg && message.error(errInfo.msg);
			this.setState({ isLoading: false })
		}
	}

	//查询用户
	fetchUser = () => {
		let formSupplier = this.shareForm.current.getFieldValue('supplier') || {},
			userInfo = localStorage.getItem('USER_INFO'),
			res = {};
		if (!Object.keys(formSupplier).length) {
			message.warning('请输入要查询的供应商信息')
			return;
		}
		//排除本人
		// if (formSupplier.employeeNumber == JSON.parse(userInfo).employeeNumber) {
		// 	message.warning('您输入的是您本人的账户')
		// 	return;
		// }
		this.setState({
			queryIsLoading: true
		}, async () => {
			try {
				if (this.props.isBatch) {
					res = await queryUserInfo({ ...formSupplier, userType: 2 });
				} else {
					res = await queryUserInfoByPermission({ ...formSupplier, businessId: this.props.detailInfos.businessId });
				}
				if (res.data.length) {
					this.setState({
						queryDataList: [...res.data],
						queryIsLoading: false
					})
				} else {
					//message.warning('无法查询到匹配的供应商信息')
					this.setState({ queryIsLoading: false })
				}
			} catch (errInfo) {
				message.error(errInfo || errInfo?.msg || errInfo?.message);
				this.setState({ queryIsLoading: false })
			}
		})
	}

	resetSearch = () => {
		this.shareForm.current.resetFields()
	}

	renderQueryColumns = (record) => {
		let hasValue = this.state.dataList.findIndex(item => item.eid == record.eid)
		return <a key={record.adid} style={{ fontSize: '12px', color: hasValue == -1 ? '#1890ff' : 'rgba(0, 0, 0, 0.85)' }} onClick={() => this.handleAdd(hasValue, record)}>{hasValue == -1 ? '添加' : '已添加'}</a>
	}

	//添加
	handleAdd = (hasValue, record) => {
		if (hasValue != -1) return;
		let dataList = [...this.state.dataList, ...[record]].map((item, index) => {
			return {
				...item,
				tableIndex: index + 1,
			}
		})
		this.setState({ dataList })
	}

	//移除
	handleRemove = (record) => {
		let dataList = this.state.dataList.filter(item => item.eid != record.eid)
		this.setState({ dataList })
	}

	handleShareCancel = () => {
		this.props.onSaved({
			operation: 'cancel'
		})
		this.shareForm.current.resetFields()
	}

	handleShareConfirm = () => {
		this.setState({
			confirmLoading: true
		}, async () => {
			try {
				let res = {}, { isBatch, flag, detailInfos } = this.props;
				switch (true) {
					case (isBatch && flag == 'custom'):
						res = await saveBatchCustomRulesSharedList({
							templateIds: detailInfos.templateId,
							employeeInfos: this.state.dataList
						})
						if (res.msg == 'success') {
							message.success('保存成功');
							this.setState({
								visible: false,
								confirmLoading: false,
							})
							this.props.onSaved({ operation: 'cancel' })
						}
						break;
					case (!isBatch && flag == 'custom'):
						res = await saveCustomRulesSharedList({
							templateId: detailInfos.templateId,
							employeeInfos: this.state.dataList
						})
						if (res.msg == 'success') {
							message.success('保存成功');
							this.setState({
								visible: false,
								confirmLoading: false,
							})
							this.props.onSaved({ operation: 'cancel' })
						}
						break;
					case (isBatch && flag == 'template'):
						Modal.confirm({
							title: "请注意",
							content: "模板所包含的人群包、NRE人群、自定义规则均会共享至所选用户，是否确认？",
							cancelText: "取消",
							okText: "确认",
							onOk: async () => {
								res = await saveBatchTemplateSharedList({
									templateIds: detailInfos.templateId,
									employeeInfos: this.state.dataList
								});

								if (res.msg == 'success') {
									message.success('保存成功');
									this.setState({
										visible: false,
										confirmLoading: false,
									})
									this.props.onSaved({ operation: 'cancel' })
								}
							},
							onCancel: () => {
								this.setState({ confirmLoading: false })
							}
						})
						break;
					case (!isBatch && flag == 'template'):
						Modal.confirm({
							title: "请注意",
							content: "模板所包含的人群包、NRE人群、自定义规则均会共享至所选用户，是否确认？",
							cancelText: "取消",
							okText: "确认",
							onOk: async () => {
								res = await saveTemplateSharedList({
									templateId: detailInfos.templateId,
									employeeInfos: this.state.dataList
								});
								if (res.msg == 'success') {
									message.success('保存成功');
									this.setState({
										visible: false,
										confirmLoading: false,
									})
									this.props.onSaved({ operation: 'cancel' })
								}
							},
							onCancel: () => {
								this.setState({ confirmLoading: false })
							}
						})
						break;
				}
				this.shareForm.current.resetFields()
			} catch (errInfo) {
				errInfo.msg && message.error(errInfo.msg);
				this.setState({ confirmLoading: false })
			}
		})
	}

	render () {
		return <Modal
			title={this.props.title}
			centered
			width={660}
			visible={this.props.visible}
			cancelText="取消"
			okText="确定"
			confirmLoading={this.state.confirmLoading}
			onCancel={this.handleShareCancel}
			onOk={this.handleShareConfirm}
			bodyStyle={{ height: '60vh', overflowY: 'auto', padding: '8px 30px 0' }}>
			<Form className='oap-form-labelBold' layout="vertical" ref={this.shareForm}>
				{(!this.props.isBatch && this.props.flag == 'template') && <Form.Item label="业务域：" style={{ marginBottom: '0px' }}>
					<span className="ant-form-text">{this.props.detailInfos?.businessCategoryName}</span>
				</Form.Item>}
				{this.props.flag == 'template' && <Form.Item label="模板名称：" style={{ marginBottom: '6px' }}>
					<span className="ant-form-text">{this.props.detailInfos?.templateName}</span>
				</Form.Item>}
				{this.props.flag == 'custom' && <Form.Item label="维度名称：" style={{ marginBottom: '6px' }}>
					<span className="ant-form-text">{this.props.detailInfos?.dimensionName}</span>
				</Form.Item>}
				<Form.Item label="共享用户：" className='oap-applied-business-domain'>
					<Row gutter={8}>
						<Col span={3}>
							<Form.Item label="账号" name={['supplier', 'adid']}>
								<Input allowClear placeholder='请输入' />
							</Form.Item>
						</Col>
						<Col span={3}>
							<Form.Item label="eid" name={['supplier', 'eidCode']}>
								<Input allowClear placeholder='请输入' />
							</Form.Item>
						</Col>
						<Col span={3}>
							<Form.Item label="姓名" name={['supplier', 'cnName']}>
								<Input allowClear placeholder='请输入' />
							</Form.Item>
						</Col>
						<Col span={3}>
							<Form.Item label="邮箱" name={['supplier', 'email']}>
								<Input allowClear placeholder='请输入' />
							</Form.Item>
						</Col>
					</Row>
					<Row gutter={8}>
						<Col flex="80px">
							<Button type="primary" onClick={this.fetchUser}>查询</Button>
						</Col>
						<Col flex="80px">
							<Button onClick={this.resetSearch}>重置</Button>
						</Col>
					</Row>
					<Row>
						<Col span={12}>
							<Table
								rowKey="employeeNumber"
								sticky={false}
								columns={this.state.queryColumns}
								dataSource={this.state.queryDataList}
								loading={this.state.queryIsLoading}
								pagination={{ position: ['none'] }}
								locale={{ emptyText: '暂无数据' }}
								scroll={{ x: '100%' }}
								style={{ marginTop: '16px', width: '100%' }} />
						</Col>
					</Row>
				</Form.Item>
			</Form>
			<div style={{ fontSize: '12px', fontWeight: 'bold', margin: '16px 0 6px' }}>{this.props.isBatch ? '本次添加用户：' : '已共享用户：'}</div>
			<Table
				rowKey="tableIndex"
				columns={this.state.columns}
				dataSource={this.state.dataList}
				loading={this.state.isLoading}
				locale={{ emptyText: '暂无数据' }}
				pagination={{ position: ['none'] }}
				scroll={{ x: '100%' }}
				style={{ minHeight: 'calc(100% - 262px)' }} />
			{this.props.isBatch && <div style={{ fontWeight: 'bold', marginTop: '8px' }}>{this.props.msg}</div>}
		</Modal>
	}
}