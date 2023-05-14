import React from 'react';
import { Spin, Form, Row, Col, Button, Select, Input, Table, Tooltip, Space, Popconfirm, message } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { deleteTemplateLogMulti, getTemplateList, checkDimensionByOwner, deleteTemplateLogByPublic } from '@/api/oap/self_analysis.js';
import moment from 'moment';
import { TEMPLATE_LIST, APPLICANT_TYPE } from '@/constants';
import ShareModal from '../../components/shareModal';

class index extends React.Component {
	constructor(props) {
		super(props);
		this.formTemplateRef = React.createRef();
		this.inputRef = React.createRef();
		this.state = {
			isLoading: false,
			checkedValue: ['tableIndex', 'templateName', 'businessCategoryName', 'tableType', 'templateTypeName', 'createName', 'lastModifyAt', 'operation'],
			columns: [
				{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
				{
					title: '名称',
					dataIndex: 'templateName',
					fixed: 'left',
					width: 280,
					align: 'left',
					ellipsis: true,
					render: (text, record) => (
						<Tooltip placement="topLeft" title={record.templateName} key={record.id}>
							<a onClick={() => this.linkToAnalysis(record)}>{record.templateName}</a>
						</Tooltip>
					)
				},
				{ title: "业务域", dataIndex: 'businessCategoryName', ellipsis: true, width: 160, align: 'left' },
				{
					title: "类型",
					dataIndex: 'tableType',
					ellipsis: true,
					width: 120,
					render: (text, record) => (<>{text === 1 ? '汇总' : '明细'}</>),
				},
				{ title: "模板类型", dataIndex: 'templateTypeName', ellipsis: true, width: 100 },
				{ title: "创建人", dataIndex: 'createName', ellipsis: true, width: 120 },
				{ title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 180 },
				{
					title: '操作',
					dataIndex: 'operation',
					fixed: 'right',
					width: 120,
					render: (text, record) => {
						return <Space size="middle" key={record.id}>
							{checkMyPermission('oap:templatemain:save:share') && record.templateType == APPLICANT_TYPE.self ? <a style={{ fontSize: '12px' }} onClick={() => this.handleShare(record)}>共享</a> : null}
							{checkMyPermission('oap:templatemain:delete') && [APPLICANT_TYPE.self, APPLICANT_TYPE.others].includes(record.templateType) ? <Popconfirm
								title="确认要删除吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmDeleteMulti([record.id])}>
								<a style={{ fontSize: '12px' }}>删除</a>
							</Popconfirm> : null}
							{checkMyPermission('oap:templatemain:publicDelete') && [APPLICANT_TYPE.system].includes(record.templateType) ? <Popconfirm
								title="确认要删除吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmDeletePublicType(record.id)}>
								<a style={{ fontSize: '12px' }}>删除</a>
							</Popconfirm> : null}
						</Space>
					}
				}
			],
			dataList: [],
			pageSize: 20,
			pageNo: 1,
			total: null,
			subjectModel: [],
			selectedRowKeys: [],
			selectedRows: [],
			rowSelectList: {
				type: 'checkbox',
				onChange: this.onSelectChange,
				getCheckboxProps: (record) => ({
					disabled: record.publicType,
				})
			},
			shareModalData: {
				visible: false,
				title: '',
				flag: 'template',
				detailInfos: {},
				isBatch: false,
				msg: '注意：若用户没有某个分析场景的权限，将不会被添加到该场景相关的模板共享中'
			},
			templateTypeList: [
				...TEMPLATE_LIST,
				{ value: '3', label: '系统模板' }
			]
		}
	}

	onSelectChange = (selectedRowKeys, selectedRows) => {
		this.setState({ selectedRowKeys, selectedRows });
	}

	async componentDidMount () {
		await this.fetchDataList();
	}

	//获取查询列表
	fetchDataList = () => {
		let params = this.formTemplateRef.current.getFieldsValue();
		//去除‘全部’的id
		let arr = ['templateType'], tempObj = { ...params };
		arr.forEach(key => {
			if (tempObj[key] == 'all') delete tempObj[key];
		})
		let commitParams = Object.assign({
			size: this.state.pageSize,
			page: this.state.pageNo - 1
		}, tempObj);
		this.setState({
			isLoading: true,
			dataList: [],
			total: null
		}, () => {
			getTemplateList(commitParams).then(res => {
				let records = res.data.items || [], dataList = [], templateTypeName = '';
				const userInfo = localStorage.getItem('USER_INFO');
				dataList = records.map((item, index) => {
					if (userInfo) {
						templateTypeName = JSON.parse(userInfo).employeeNumber
					}
					return {
						...item,
						lastModifyAt: moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss'),
						tableIndex: (this.state.pageNo - 1) * this.state.pageSize + index + 1,
						templateType: item.publicType == 1 ? APPLICANT_TYPE.system : (templateTypeName == item.creatorId ? APPLICANT_TYPE.self : APPLICANT_TYPE.others),
						templateTypeName: item.publicType == 1 ? '系统模板' : (templateTypeName == item.creatorId ? '本人创建' : '与我共享'),
						isTemplate: 'yes'
					}
				});
				this.setState({
					dataList,
					total: res.data.total,
				})
			}).catch(err => {
				err.msg && message.error(err.msg);
			}).finally(() => {
				this.setState({
					isLoading: false
				})
			})
		})
	}

	// 批量删除
	confirmDeleteMulti = (idsArr) => {
		if (idsArr.length > 0) {
			deleteTemplateLogMulti(idsArr).then(res => {
				res.msg == 'success' && message.success('删除成功');
				this.fetchDataList();
			}).catch(err => {
				err.msg && message.error(err.msg);
			})
		} else {
			message.warning('请勾选需要删除的选项！')
		}
	}

	// 删除系统模板
	confirmDeletePublicType = (id) => {
		deleteTemplateLogByPublic(id).then(res => {
			res.msg == 'success' && message.success('删除成功');
			this.fetchDataList();
		}).catch(err => {
			err.msg && message.error(err.msg);
		})
	}

	//重置查询条件
	onReset = () => {
		this.formTemplateRef.current.resetFields();
	}

	onPageChange = (pageNo, pageSize) => {
		this.setState({
			pageNo: pageNo,
			pageSize: pageSize
		}, () => {
			this.formTemplateRef.current.submit();
		});
	}

	linkToAnalysis = (record) => {
		if (!checkMyPermission('oap:templatemain:detail')) return
		this.props.onCreate('template', {
			...record,
			modelId: record.businessId,
			businessDomain: record.businessCategoryName,
			tableType: record.tableType,
		})
	}

	handleShare = async (record) => {
		const { shareModalData } = this.state;
		//校验所分享的模板以及所有模板中包含的人群包、NRE人群、自定义规则是否为本人创建
		this.setState({
			isLoading: true,
			shareModalData: {
				...shareModalData,
				isBatch: false
			}
		}, () => {
			checkDimensionByOwner([record.id]).then(res => {
				if (res.data) {
					this.setState({
						isLoading: false,
						shareModalData: {
							...shareModalData,
							visible: true,
							title: '共享模板',
							detailInfos: {
								businessCategoryName: record.businessCategoryName,
								templateName: record.templateName,
								templateId: record.id,
								businessId: record.businessId
							}
						}
					})
				} else {
					this.setState({
						isLoading: false
					}, () => {
						message.warning('只能分享本人创建的内容，请确认分析模板、人群包、NRE人群、自定义规则是否均为本人创建');
					})
				}
			}).catch(err => {
				err.msg && message.error(err.msg);
				this.setState({
					isLoading: false
				})
			})
		})
	}

	//批量共享
	onBatchShare = () => {
		const { selectedRowKeys, selectedRows, shareModalData } = this.state;
		if (selectedRowKeys.length) {
			//只能分享自己创建的
			let hasValue = selectedRows.findIndex(item => item.templateType == APPLICANT_TYPE.others)
			if (hasValue == -1) {
				//校验所分享的模板以及所有模板中包含的人群包、NRE人群、自定义规则是否为本人创建
				checkDimensionByOwner(selectedRowKeys).then(res => {
					if (res.data) {
						this.setState({
							shareModalData: {
								...shareModalData,
								visible: true,
								title: '批量共享模板',
								detailInfos: {
									templateName: '多个模板',
									templateId: selectedRowKeys,
								},
								isBatch: true
							}
						})
					} else {
						message.warning('只能分享本人创建的内容，请确认分析模板、人群包、NRE人群、自定义规则是否均为本人创建');
					}
				}).catch(err => {
					err.msg && message.error(err.msg);
				})
			} else {
				message.warning('只能分享本人创建的分析模板！')
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
				isBatch: false
			}
		})
	}

	render () {
		return <Spin spinning={this.state.isLoading}>
			<div className="table-container">
				<Form
					className="search-form"
					ref={this.formTemplateRef}
					layout="vertical"
					size="middle"
					initialValues={{ templateType: 'all' }}
					onFinish={this.fetchDataList}>
					<div className="search-area">
						<Row gutter={32}>
							<Col span={3}>
								<Form.Item name="businessId" label="业务域名称">
									<Select placeholder="全部" allowClear>
										{this.props.subjectModelList.length && this.props.subjectModelList.map(model => {
											return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="templateName" label="名称">
									<Input
										placeholder="请输入查询名称"
										allowClear />
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="templateType" label="模板类型">
									<Select placeholder="全部" allowClear>
										{this.state.templateTypeList.map(model => {
											return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
						</Row>
						<Row>
							<Col span={12}>
								<Space>
									<Button type="primary" htmlType="submit" loading={this.state.isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
									<Button onClick={this.onReset}>重置</Button>
									{checkMyPermission('oap:templatemain:delete') && <Popconfirm
										placement="top"
										title={<div>批量删除<p>是否批量删除所选内容？<br />删除后不可恢复</p></div>}
										okText="确定"
										cancelText="取消"
										onConfirm={() => this.confirmDeleteMulti([...this.state.selectedRowKeys])}>
										<Button>批量删除</Button>
									</Popconfirm>}
									{checkMyPermission('oap:templatemain:save:share') && <Popconfirm
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
				<div style={{ height: '12px', background: '#f6f6f6', position: 'relative' }}></div>
				<div className="table-top-wrap">
					<Table
						rowKey="id"
						columns={this.state.columns}
						dataSource={this.state.dataList}
						allFilterColumns={this.state.checkedValue}
						tableKey="oapTemplateList"
						rowSelection={this.state.rowSelectList}
						pagination={{
							showQuickJumper: true,
							showSizeChanger: true,
							pageSize: this.state.pageSize,
							current: this.state.pageNo,
							total: this.state.total,
							onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize)
						}}
						scroll={{ x: '100%' }} />
				</div>
			</div>
			<ShareModal {...this.state.shareModalData} onSaved={this.confirmSaveTemplate} />
		</Spin>
	}
}

export default index;