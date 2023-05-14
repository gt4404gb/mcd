import React from 'react';
import { Spin, Form, Input, Select, Table, Popconfirm, message, Tooltip, Row, Col, Button, Space } from '@aurum/pfe-ui';
import { IconAddA } from '@aurum/icons';
import { queryCustomRulesList, deleteCustomRules, queryModelForCustom } from "@/api/oap/custom_rule.js";
import { optionFilterProp } from "@/utils/store/func";
import moment from 'moment';
import querystring from "query-string";
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { TEMPLATE_LIST, APPLICANT_TYPE } from '@/constants';
import ShareModal from '../../components/shareModal';

export default class CustomRules extends React.Component {
	constructor(props) {
		super(props);
		this.formCustomRef = React.createRef();
		this.state = {
			isLoading: false,
			checkedValue: ['tableIndex', 'dimensionName', 'description', 'businessName', 'customType', 'buildTypeName', 'createName', 'lastModifyAt', 'operating'],
			columns: [
				{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 70 },
				{
					title: "维度名称",
					dataIndex: 'dimensionName',
					ellipsis: true,
					fixed: 'left',
					width: 180,
					render: (text, record) => (
						<Tooltip placement="topLeft" title={record.dimensionName} key={record.id}>
							<a onClick={() => this.linkToForm('edit', record.id)}>{record.dimensionName}</a>
						</Tooltip>
					)
				},
				{ title: "说明", dataIndex: 'description', ellipsis: true, width: 180 },
				{ title: "所属分析", dataIndex: 'businessName', ellipsis: true, width: 120 },
				{ title: "类型", dataIndex: 'customType', ellipsis: true, width: 120 },
				{ title: "共享类型", dataIndex: 'buildTypeName', ellipsis: true, width: 90 },
				{ title: "创建人", dataIndex: 'createName', ellipsis: true, width: 110 },
				{ title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 130 },
				{
					title: '操作',
					dataIndex: 'operating',
					fixed: 'right',
					width: 130,
					render: (text, record) => (
						<Space key={record.id}>
							{record.buildType == APPLICANT_TYPE.self ? <a onClick={() => this.linkToForm('edit', record.id)} style={{ fontSize: '12px' }}>编辑</a> : null}
							{checkMyPermission('oap:customRules:save:share') && (record.buildType == APPLICANT_TYPE.self && record.tableType != 2) ? <a style={{ fontSize: '12px' }} onClick={() => this.handleShare(record)}>共享</a> : null}
							{checkMyPermission('oap:customRules:delete') ? <Popconfirm
								title="确认要删除吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmDelete(record.id)}>
								<a style={{ fontSize: '12px' }}>删除</a>
							</Popconfirm> : null}
						</Space>
					)
				}
			],
			dataList: [],
			pageSize: 10,
			pageNo: 1,
			total: null,
			customTypeList: [
				{
					label: '全部',
					value: 'all'
				},
				{
					label: '自定义字段分组',
					value: '0'
				},
				{
					label: 'Ticket Analysis',
					value: '1'
				}
			],
			businessList: [],
			selectedRowKeys: [],
			selectedRows: [],
			rowSelectList: {
				type: 'checkbox',
				onChange: this.onSelectChange,
				getCheckboxProps: (record) => ({
					disabled: record.tableType == 2,
				})
			},
			shareModalData: {
				visible: false,
				title: '',
				flag: 'custom',
				detailInfos: {},
				isBatch: false,
				msg: '注意：若用户没有某个分析场景的权限，将不会被添加到属于该分析的自定义规则共享中'
			}
		}
		props.cacheLifecycles.didRecover(this.fetchDataList)
	}

	async componentDidMount () {
		await this.initMeta();
		await this.fetchDataList();
	}

	//重置查询条件
	onReset = () => {
		this.formCustomRef.current.resetFields();
	}

	onPageChange = (pageNo, pageSize) => {
		this.setState({
			pageNo: pageNo,
			pageSize: pageSize
		}, () => {
			this.formCustomRef.current.submit();
		});
	}

	initMeta = async () => {
		try {
			let params = this.formCustomRef.current.getFieldValue('customType');
			const resMetas = await queryModelForCustom({
				customType: params == 'all' ? '' : params
			});
			this.setState({
				businessList: resMetas.data || []
			})
		} catch (errInfo) {
			errInfo.msg && message.error(errInfo.msg);
			this.setState({
				isLoading: false
			})
		}
	}

	//获取查询列表
	fetchDataList = () => {
		let params = this.formCustomRef.current.getFieldsValue();
		//去除‘全部’的id
		let arr = ['customType', 'buildType'], tempObj = { ...params };
		arr.forEach(key => {
			if (tempObj[key] == 'all') delete tempObj[key];
		})
		let commitParams = Object.assign({
			size: this.state.pageSize,
			page: this.state.pageNo - 1,
		}, tempObj);
		this.setState({
			isLoading: true,
			dataList: [],
		}, () => {
			queryCustomRulesList(commitParams).then(res => {
				let records = res.data.items || [], dataList = [], buildTypeName = '';
				const userInfo = localStorage.getItem('USER_INFO');
				if (userInfo) {
					buildTypeName = JSON.parse(userInfo).employeeNumber
				}
				dataList = records.map((item, index) => {
					return {
						...item,
						lastModifyAt: item?.lastModifyAt ? moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss') : '',
						tableIndex: (this.state.pageNo - 1) * this.state.pageSize + index + 1,
						customType: optionFilterProp(this.state.customTypeList, 'value', item?.customType)?.label || '',
						buildType: buildTypeName == item.creatorId ? APPLICANT_TYPE.self : APPLICANT_TYPE.others,
						buildTypeName: buildTypeName == item.creatorId ? '本人创建' : '与我共享',
						isTemplate: 'yes',
					}
				});
				this.setState({
					dataList,
					total: res.data?.total,
				});
			}).catch(err => {
				err.msg && message.error(err.msg);
			}).finally(() => {
				this.setState({
					isLoading: false
				})
			})
		})
	}

	//删除
	confirmDelete = (id) => {
		deleteCustomRules(id).then(res => {
			res.msg == 'success' && message.success('删除成功');
			this.fetchDataList();
		})
	}

	//新增、编辑
	linkToForm = (action, id = null) => {
		if (action === 'add') {
			this.props.history.push({
				pathname: "/oap/customRules/form",
			});
		} else if (action === 'edit') {
			this.props.history.push({
				pathname: "/oap/customRules/form",
				search: querystring.stringify({ id })
			});
		}
	}

	// 类型切换
	handleCustomTypeChange = (val) => {
		this.initMeta();
		let formData = this.formCustomRef.current.getFieldsValue();
		formData.businessId = '';
		this.formCustomRef.current.setFieldsValue(formData);
	}

	handleShare = async (record) => {
		const { shareModalData } = this.state;
		try {
			this.setState({
				shareModalData: {
					...shareModalData,
					visible: true,
					title: '共享规则',
					detailInfos: {
						//businessCategoryName:record.businessCategoryName,
						dimensionName: record.dimensionName,
						templateId: record.id,
						businessId: record.businessId
					},
					isBatch: false
				}
			})
		} catch (errInfo) {
			errInfo.msg && message.error(errInfo.msg);
			this.setState({
				shareModalData: {
					...shareModalData,
					isBatch: false
				}
			})
		}
	}

	onSelectChange = (selectedRowKeys, selectedRows) => {
		this.setState({ selectedRowKeys, selectedRows });
	}

	//批量共享
	onBatchShare = () => {
		const { selectedRowKeys, selectedRows, shareModalData } = this.state;
		if (selectedRowKeys.length) {
			//只能分享自己创建的
			let hasValue = selectedRows.findIndex(item => item.buildType == APPLICANT_TYPE.others)
			if (hasValue == -1) {
				this.setState({
					shareModalData: {
						...shareModalData,
						visible: true,
						title: '批量共享规则',
						detailInfos: {
							dimensionName: '多个维度',
							templateId: selectedRowKeys,
						},
						isBatch: true
					}
				})
			} else {
				message.warning('只能分享本人创建的自定义规则！')
			}
		} else {
			message.warning('请勾选需要共享的选项！')
		}
	}

	confirmSaveTemplate = () => {
		const { shareModalData } = this.state;
		this.setState({
			shareModalData: {
				...shareModalData,
				visible: false,
			}
		})
	}

	render () {
		const { isLoading, customTypeList, businessList } = this.state;
		return <Spin spinning={isLoading}>
			<div className="table-container">
				<Form
					className="search-form"
					ref={this.formCustomRef}
					layout="vertical"
					size="middle"
					initialValues={{
						customType: 'all',
						buildType: 'all'
					}}
					onFinish={this.fetchDataList}>
					<div className="search-area">
						<Row gutter={32}>
							<Col span={3}>
								<Form.Item name="customType" label="选择类型">
									<Select placeholder='请选择' onChange={this.handleCustomTypeChange}>
										{customTypeList.map(model => {
											return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="businessId" label="所属分析">
									<Select placeholder='请选择'>
										{businessList.map(model => {
											return <Select.Option value={model.id} key={model.id}>{model.businessName}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="name" label="查询名称">
									<Input
										placeholder="请输入查询名称"
										allowClear />
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="buildType" label="共享类型">
									<Select placeholder="全部">
										{TEMPLATE_LIST.length && TEMPLATE_LIST.map(model => {
											return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
						</Row>
						<Row>
							<Col span={24}>
								<Space>
									<Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
									<Button onClick={this.onReset}>重置</Button>
									{checkMyPermission('oap:customRules:save:batch:share') && <Popconfirm
										placement="top"
										title={<div>批量共享<p>是否批量共享所选内容？</p></div>}
										okText="确定"
										cancelText="取消"
										onConfirm={this.onBatchShare}>
										<Button>批量共享</Button>
									</Popconfirm>}
								</Space>

							</Col>
						</Row>
					</div>
				</Form>
				<div className="table-top-wrap" style={{ paddingTop: '32px' }}>
					<div className="table-top-btn">
						{checkMyPermission('oap:customRules:save') ? <Button type="primary" icon={<IconAddA />} onClick={() => this.linkToForm('add')}>创建维度</Button> : null}
					</div>
					<Table
						rowKey="id"
						columns={this.state.columns}
						dataSource={this.state.dataList}
						rowSelection={this.state.rowSelectList}
						allFilterColumns={this.state.checkedValue}
						tableKey="oapCustomRules"
						pagination={{
							showQuickJumper: true,
							showSizeChanger: true,
							pageSize: this.state.pageSize,
							current: this.state.pageNo,
							total: this.state.total,
							onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize),
						}}
						scroll={{ x: '100%' }} />
				</div>
			</div>
			<ShareModal {...this.state.shareModalData} onSaved={this.confirmSaveTemplate} />
		</Spin>
	}
}