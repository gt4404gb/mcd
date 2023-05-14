import React from 'react';
import { Spin, Form, Row, Col, Button, Select, Input, Table, Space, Badge, Popconfirm, message, Tooltip, ConfigProvider, Empty } from '@aurum/pfe-ui';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import {
	querySliceLog,
	deleteSliceLogMulti,
	handleRefreshCkAnalysisTask,
	handleCancelCkAnalysisTask,
	queryBusinessList
} from '@/api/oap/self_analysis.js';
import moment from 'moment';
import { TABLE_TYPE } from '@/constants/index'

class index extends React.Component {
	constructor(props) {
		super(props);
		this.formRef = React.createRef();
		this.dataFormRef = React.createRef();
		this.state = {
			isLoading: false,
			checkedValue: ['tableIndex', 'sliceName', 'datasourceName', 'businessName', 'tableType', 'queryStatus', 'queryProcess', 'createName', 'lastModifyAt', 'operation'],
			columns: [
				{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
				{
					title: '名称',
					dataIndex: 'sliceName',
					fixed: 'left',
					width: 280,
					align: 'left',
					ellipsis: true,
					render: (text, record) => (
						<Tooltip placement="topLeft" title={record.sliceName} key={record.id}>
							<a onClick={() => this.linkToAnalysis(record)}>{record.sliceName}</a>
						</Tooltip>
					)
				},
				{ title: "业务域", dataIndex: 'datasourceName', ellipsis: true, width: 160, align: 'left' },
				{ title: "查询名称", dataIndex: 'businessName', ellipsis: true, width: 160 },
				{
					title: "类型",
					dataIndex: 'tableType',
					ellipsis: true,
					width: 160,
					align: 'left',
					render: (text, record) => (<>{text === 1 ? '汇总' : '明细'}</>),
				},
				{
					title: "状态",
					dataIndex: 'queryStatus',
					ellipsis: true,
					width: 160,
					align: 'left',
					render: (text, record) => (
						<Tooltip placement="topLeft" title={record.queryStatus} key={record.id}>
							<Badge status={record.queryStatus && record.queryStatus.toLowerCase() == 'finish' ? 'success' : 'error'} text={record.queryStatus} />
						</Tooltip>
					)
				},
				{ title: "进度", dataIndex: 'queryProcess', ellipsis: true, width: 160, align: 'left' },
				{ title: "创建人", dataIndex: 'createName', ellipsis: true, width: 160, align: 'left' },
				{ title: "更新时间", dataIndex: 'lastModifyAt', ellipsis: true, width: 180, align: 'left' },
				{
					title: '操作',
					dataIndex: 'operation',
					fixed: 'right',
					width: 180,
					render: (text, record) => {
						let btnEle = null;
						if ([TABLE_TYPE.ck, TABLE_TYPE.trino].includes(+record.tableType)) {
							let statusStr = record.queryStatus.toLowerCase();
							if (['finish', 'cancel'].includes(statusStr)) {
								btnEle = checkMyPermission('oap:home:refresh') ? (<Popconfirm
									title='确认要刷新吗？'
									okText="确定"
									cancelText="取消"
									onConfirm={() => this.confirmRefresh(record.id)}>
									<a href="#">刷新</a>
								</Popconfirm>) : null;
							}
							if (['waiting', 'processing'].includes(statusStr)) {
								btnEle = checkMyPermission('oap:home:cancel') ? (<Popconfirm
									title='确认要取消吗？'
									okText="确定"
									cancelText="取消"
									onConfirm={() => this.confirmCancel(record.id)}>
									<a href="#">取消</a>
								</Popconfirm>) : null;
							}
						}
						return <Space size="middle" key={record.id}>
							{btnEle}
							{(checkMyPermission('oap:dispatch:add') && [TABLE_TYPE.ck, TABLE_TYPE.trino].includes(+record.tableType)) && <a onClick={() => this.onCreateSchedule(record)}>定时任务</a>}
							{checkMyPermission('oap:home:deleteSliceMulti') ? <Popconfirm
								title="确认要删除吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmDelete(record.id)}>
								<a href="#">删除</a>
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
			rowSelectList: {
				type: 'checkbox',
				onChange: this.onSelectChange,
			},
			queryNameList: []
		}
	}

	onSelectChange = selectedRowKeys => {
		this.setState({ selectedRowKeys });
	}

	async componentDidMount () {
		await this.initMeta();
		await this.fetchDataList();
	}

	initMeta = async () => {
		try {
			const resMetas = await queryBusinessList();
			this.setState({
				queryNameList: resMetas.data || []
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
		let params = this.formRef.current.getFieldsValue();
		let commitParams = Object.assign({
			size: this.state.pageSize,
			page: this.state.pageNo - 1
		}, params);
		this.setState({
			isLoading: true,
			dataList: [],
			total: null
		}, () => {
			querySliceLog(commitParams).then(res => {
				let records = res.data.records || [], dataList = [];
				dataList = records.map((item, index) => {
					return {
						...item,
						lastModifyAt: moment(item.lastModifyAt).format('YYYY-MM-DD HH:mm:ss'),
						tableIndex: (this.state.pageNo - 1) * this.state.pageSize + index + 1,
						queryProcess: item.queueIndex == 0 ? `${item.queryProcess}%` : (item.queueIndex > 0 ? `正在队列${item.tableType == 0 ? 1 : 2}中，第${item.queueIndex}位` : '入队等待中')
					}
				});
				this.setState({
					dataList,
					total: res.data.page.totalElements,
				})
			}).catch(err => {
				message.error(err?.msg || err?.message || '网络异常，请稍后重试');
			}).finally(() => {
				this.setState({
					isLoading: false
				})
			})
		})
	}

	confirmRefresh = (id) => {
		handleRefreshCkAnalysisTask(id).then(res => {
			res.msg == 'success' && message.success('刷新成功');
			this.fetchDataList();
		}).catch((err) => {
			message.error(err.msg);
		})
	}

	confirmCancel = (id) => {
		handleCancelCkAnalysisTask(id).then(res => {
			res.msg == 'success' && message.success('取消成功');
			this.fetchDataList();
		}).catch((err) => {
			message.error(err.msg);
		})
	}

	//单条数据删除
	confirmDelete = (id) => {
		let list = [id];
		deleteSliceLogMulti(list).then(res => {
			res.msg == 'success' && message.success('删除成功');
			this.fetchDataList();
		})
	}

	// 批量删除
	confirmDeleteMulti = () => {
		let list = [...this.state.selectedRowKeys]
		if (list.length > 0) {
			deleteSliceLogMulti(list).then(res => {
				res.msg == 'success' && message.success('删除成功');
				this.fetchDataList();
			})
		} else {
			message.warning('请勾选需要删除的选项！')
		}
	}

	//重置查询条件
	onReset = () => {
		this.formRef.current.resetFields();
	}

	onPageChange = (pageNo, pageSize) => {
		this.setState({
			pageNo: pageNo,
			pageSize: pageSize
		}, () => {
			this.formRef.current.submit();
		});
	}

	linkToAnalysis = (record) => {
		this.props.onCreate('edit', record)
	}

	onCreateSchedule = (record) => {
		//tableType --- ck:0   trino:2
		sessionStorage.setItem('oapScheduleCreate', encodeURIComponent(JSON.stringify({
			sliceId: record.id,
			sliceName: record?.sliceName,
			taskType: record.tableType == TABLE_TYPE.ck ? 2 : 3,
			businessCategoryName: record?.datasourceName
		})))
		const params = {
			tabNameZh: "分析调度",
			tabNameEn: "分析调度",
			path: "/oap/schedule",
		};
		window.EventBus && window.EventBus.emit("setAppTab", null, params);
	}

	customizeRenderEmpty = () => {
		return <Empty imgName="person/empty-data">
			<div style={{ color: '#222' }}>
				点击开始<span className='oap-btn-blue' style={{ margin: '0 4px' }} onClick={this.props.onChooseData}>创建分析</span>
			</div>
		</Empty>
	}

	render () {
		return <Spin spinning={this.state.isLoading}>
			<div className="table-container">
				<Form
					className="search-form"
					ref={this.formRef}
					layout="vertical"
					size="middle"
					onFinish={this.fetchDataList}>
					<div className="search-area">
						<Row gutter={32}>
							<Col span={3}>
								<Form.Item name="subjectId" label="业务域名称">
									<Select placeholder="全部" allowClear>
										{this.props.subjectModelList.length && this.props.subjectModelList.map(model => {
											return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="datasourceId" label="查询名称">
									<Select placeholder="全部" allowClear>
										{this.state.queryNameList.length && this.state.queryNameList.map(model => {
											return <Select.Option value={model.id} key={model.id}>{model.businessName}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="sliceName" label="名称">
									<Input
										placeholder="请输入任务名称"
										allowClear />
								</Form.Item>
							</Col>
						</Row>
						<Row>
							<Col span={12}>
								<Space>
									<Button type="primary" htmlType="submit" loading={this.state.isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询/刷新</Button>
									<Button onClick={this.onReset}>重置</Button>
									{checkMyPermission('oap:home:deleteSliceMulti') ? <Popconfirm
										placement="top"
										title="确认要删除吗？"
										okText="确定"
										cancelText="取消"
										onConfirm={this.confirmDeleteMulti}>
										<Button>批量删除</Button>
									</Popconfirm> : null}
								</Space>
							</Col>
						</Row>
					</div>
				</Form>
				<div style={{ height: '12px', background: '#f6f6f6', position: 'relative' }}></div>
				<div className="table-top-wrap" style={{ paddingTop: '32px' }}>
					<div className="table-top-btn">
						<Space>
							{checkMyPermission('oap:home:saveChart') ? <Button type="primary" onClick={this.props.onChooseData}>创建分析</Button> : null}
						</Space>
					</div>
					<ConfigProvider renderEmpty={this.customizeRenderEmpty}>
						<Table
							rowKey="id"
							columns={this.state.columns}
							dataSource={this.state.dataList}
							allFilterColumns={this.state.checkedValue}
							tableKey="oapHomeList"
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
					</ConfigProvider>
				</div>
			</div>
		</Spin>
	}
}

export default index;