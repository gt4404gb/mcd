import React from 'react';
import { Spin, Form, Row, Col, Button, Input, Table, message, Tooltip, Select, Space, Popconfirm, ConfigProvider, Empty } from '@aurum/pfe-ui';
import { saveAs } from 'file-saver';
import {
	queryAnalyseList,
	queryAnalyseSubjectTreeData,
	queryAnalyseCategoryTreeData,
	subscribeAdd,
	subscribeDel
} from '@/api/oap/guide_analysis.js';
import { downloadFile } from '@/api/oap/commonApi.js';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { judgeIsStaff, optionFilterProp } from '@/utils/store/func';
import { FIELD_NAMES_DEFAULT, GUILDE_TYPE_LIST, APPLYINFO_TYPE } from '@/constants';
import CustomTab from '@/components/CustomTab';
import {
	checkWarnningStatus,
	setNeverWarnning,
} from '@/api/oap/guide_analysis';

export default class INDEX extends React.Component {
	constructor(props) {
		super(props);
		console.log('2023-01-17，看看版本号的日志')
		this.formIndexRef = React.createRef();
		this.state = {
			isLoading: true,
			checkedValue: ['name', 'subjectNames', 'categoryNamesLabel', 'typeName', 'description', 'businessOwnerName', 'dataOwnerName'],
			columns: [
				{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
				{
					title: '分析名称',
					dataIndex: 'name',
					ellipsis: true,
					width: 180,
					fixed: 'left',
					align: 'left',
					render: (text, record) => (
						<Tooltip placement="topLeft" title={text} key={record.id}>
							{record.type == APPLYINFO_TYPE.selfhelp ? (checkMyPermission('oap:home:saveChart') ? <a onClick={() => this.gotoPage(record)}>{text}</a> : <a>{text}</a>) : (
								checkMyPermission('oap:sql:sqlQuery') ? <a onClick={() => this.gotoPage(record)}>{text}</a> : <a>{text}</a>)}
						</Tooltip>
					)
				},
				{ title: '主题', dataIndex: 'subjectNames', ellipsis: true, width: 180 },
				{ title: '业务域', dataIndex: 'categoryNamesLabel', ellipsis: true, width: 120 },
				{ title: '分析类型', dataIndex: 'typeName', ellipsis: true, width: 120 },
				{ title: '说明', dataIndex: 'description', ellipsis: true, width: 150 },
				{ title: '业务Owner', dataIndex: 'businessOwnerName', ellipsis: true, width: 120 },
				{ title: '数据Owner', dataIndex: 'dataOwnerName', ellipsis: true, width: 120 },
				{
					title: '操作',
					dataIndex: 'operation',
					fixed: 'right',
					width: 248,
					render: (text, record) => {
						return <Space size="middle" key={record.id}>
							{checkMyPermission('oap:analyse:care') ? (record.care == 1 ? <Popconfirm
								title="确定取消订阅吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.cancelSubscribe(record)}>
								<a>取消订阅</a>
							</Popconfirm> : <Popconfirm
								title="确定要订阅吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmSubscribe(record)}>
								<a>订阅</a>
							</Popconfirm>) : null}
							{record.descriptionCount > 0 ? <a href='#' onClick={() => this.goDetailEditor(record)}>详情</a> : null}
							{record.type == APPLYINFO_TYPE.selfhelp ? (checkMyPermission('oap:home:saveChart') ? <a onClick={() => this.gotoPage(record)}>开始分析</a> : null) :
								(checkMyPermission('oap:sql:sqlQuery') ? <a onClick={() => this.gotoPage(record)}>开始分析</a> : null)}
							{checkMyPermission('oap:mdx:downList') && record.excelFileId ? <a onClick={() => this.downLoadAnyFiles(record)}>离线分析</a> : null}
						</Space>
					}
				}
			],
			dataList: [],
			pageSize: 10,
			pageNo: 1,
			total: null,
			applyAble: false,
			fieldNames: [
				{
					title: 'name',
					key: 'id',
					children: 'sonSubjectList'
				},
				FIELD_NAMES_DEFAULT
			],
			treeData: [],
			treeLoading: false,
			recordSelectedForTreeData: {},
			guideTypeList: GUILDE_TYPE_LIST.filter(it => it.value != '2_2'),
			fastEntranceTip: false,
		}
	}

	async componentDidMount () {
		await this.init();
		await this.fetchDataList();

		try {
			const res = await judgeIsStaff();
			const checkRes = await checkWarnningStatus({
				scope: 'menu',
				type: 0,
			});
			this.setState({ applyAble: res.data ?? false, fastEntranceTip: !checkRes.data });
		} catch (error) {
			console.log('judgeIsStaff 400', error)
		}
	}

	//重置查询条件
	onReset = () => {
		this.formIndexRef.current.resetFields();
	}

	onPageChange = (pageNo, pageSize) => {
		this.setState({
			pageNo: pageNo,
			pageSize: pageSize
		}, () => {
			this.formIndexRef.current.submit();
		});
	}

	init = async () => {
		this.setState({
			treeData: [],
			treeLoading: true,
		})
		try {
			const res = await Promise.all([
				queryAnalyseSubjectTreeData({ contain: true }),
				queryAnalyseCategoryTreeData({ contain: true })
			]);
			let treeData = [];
			treeData[0] = [
				{
					name: '我的订阅',
					id: 'mine',
					sonSubjectList: []
				},
				{
					name: '全部',
					id: 'all',
					sonSubjectList: []
				},
				...res[0]?.data || []
			]
			treeData[1] = [
				{
					name: '我的订阅',
					id: 'mine',
					children: []
				},
				{
					name: '全部',
					id: 'all',
					children: []
				},
				...res[1].data || []
			]
			this.setState({
				treeData,
				treeLoading: false
			})
		} catch (errInfo) {
			this.setState({ treeLoading: false })
		}
	}

	//获取查询列表
	fetchDataList = () => {
		let formData = this.formIndexRef.current.getFieldsValue(), commitParams = {};
		const params = { ...this.state.recordSelectedForTreeData, ...formData }
		const keysArr = Object.keys(params);
		keysArr.forEach(key => {
			if (params[key] != 'all' && (params[key] ?? '') != '') {
				commitParams[key] = params[key]
			}
		})
		commitParams = { ...commitParams, size: this.state.pageSize, page: this.state.pageNo - 1 }
		this.setState({
			isLoading: true,
			dataList: [],
		}, () => {
			queryAnalyseList(commitParams).then(res => {
				let records = res.data.items || [], dataList = [];
				dataList = records.map((item, index) => {
					return {
						...item,
						tableIndex: (this.state.pageNo - 1) * this.state.pageSize + index + 1,
						subjectNames: item.subjectNames.join('-'),
						categoryNamesLabel: item.categoryNames.join('-'),
						typeName: optionFilterProp(GUILDE_TYPE_LIST, 'value', item.type)?.label,
					}
				});
				this.setState({
					dataList,
					total: res.data.total
				});
			}).catch(err => {
				message.error(err?.msg || err?.message || '网络异常，请稍后重试');
			}).finally(() => {
				this.setState({
					isLoading: false
				})
			})
		})
	}

	// 下载
	downLoadAnyFiles = (record) => {
		downloadFile(record.excelFileId).then(res => {
			const blob = new Blob([res.data.fileBlob], { type: 'application/octet-stream' })
			let downName = res.data.fileName.replace(/"/g, '');
			saveAs(blob, downName);
			message.success("文件下载成功！")
			this.setState({
				isLoading: false
			})
		})
	}

	//申请分析
	linkToApply = () => {
		this.props.history.push({
			pathname: "/oap/index/apply"
		});
	}

	handleSelectedForTreeData = (data) => {
		let params = {}
		let key = data.curTab == 0 ? 'subjectId' : 'categoryId';
		if (data['selectedKeys'] == 'mine') {
			params['care'] = 1;//0否 ，1是
		} else {
			params[key] = data['selectedKeys']
		}
		this.setState({
			recordSelectedForTreeData: params
		}, () => {
			this.fetchDataList()
		})
	}

	confirmSubscribe = (record) => {
		subscribeAdd({ type: record.type, dataId: record.id }).then(res => {
			res.msg == 'success' && message.success('订阅成功');
			this.fetchDataList();
		}).catch((err) => {
			message.error(err?.msg);
		})
	}

	cancelSubscribe = (record) => {
		subscribeDel({ type: record.type, dataId: record.id }).then(res => {
			res.msg == 'success' && message.success('订阅已取消');
			this.fetchDataList();
		}).catch((err) => {
			message.error(err?.msg);
		})
	}

	gotoPage = (record) => {
		if (record.type == APPLYINFO_TYPE.selfhelp) {
			this.gotoHomePage(record)
		} else if (record.type == APPLYINFO_TYPE.sql) {
			this.gotoSQLPage(record)
		}
	}

	//去自助取数页面
	gotoHomePage = (record) => {
		let pathname = "/oap/home", tabNameZh = '自助取数';
		sessionStorage.setItem('oapHomeModelInfo', encodeURIComponent(JSON.stringify({
			modelId: record.id,
			tableType: record.tableType
		})))
		const params = {
			tabNameZh: tabNameZh,
			tabNameEn: tabNameZh,
			path: pathname,
		};
		window.EventBus && window.EventBus.emit("setAppTab", null, params);
	}

	//去SQL页面
	gotoSQLPage = (record) => {
		let pathname = "/oap/sql", tabNameZh = 'SQL查询';
		sessionStorage.setItem('oapSqlTemplateId', encodeURIComponent(JSON.stringify({
			sqlTemplateId: record.id,
			name: record.name,
			id: record.id,
			subjectName: record.categoryNames.at(-1),
			subjectId: record.businessCategoryId,
		})))
		const params = {
			tabNameZh: tabNameZh,
			tabNameEn: tabNameZh,
			path: pathname,
		};
		window.EventBus && window.EventBus.emit("setAppTab", null, params);
	}

	customizeRenderEmpty = () => {
		return <Empty imgName="person/empty-data">
			<div style={{ color: '#222' }}>
				{this.state.applyAble ? <>更多分析内容，请点击<span className='oap-btn-blue' style={{ margin: '0 4px' }} onClick={this.linkToApply}>此处</span>进行申请</> : <>更多分析内容，请联系MCD雇员协助申请</>}
			</div>
		</Empty>
	}
	titleNode = () => {
		return (<div>
			<div>点击此处，快速了解怎么使用数据工具分析</div>
			<div style={{ textAlign: 'right' }}>
				<a href='#' onClick={this.neverShowTips}>不再提示</a>
			</div>
		</div>)
	}
	goFastPage = () => {
		// this.props.history.push({
		// 	pathname: "/oap/fast-entrance",
		// });
		let pathname = "/oap/fast-entrance", tabNameZh = '快速入门';
		const params = {
			tabNameZh: tabNameZh,
			tabNameEn: tabNameZh,
			path: pathname,
		};
		window.EventBus && window.EventBus.emit("setAppTab", null, params);
	}
	goDetailEditor = (record) => {
		// this.props.history.push({
		// 	pathname: `/oap/scene-description?id=${record.id}`,
		// })
		let pathname = `/oap/scene-description?id=${record.id}`, tabNameZh = '场景说明';
		const params = {
			tabNameZh: tabNameZh,
			tabNameEn: tabNameZh,
			path: pathname,
		};
		window.EventBus && window.EventBus.emit("setAppTab", null, params);
	}
	neverShowTips = () => {
		setNeverWarnning({
			scope: 'menu',
			type: 0,
		}).then(res => {
			console.log('res = ', res);
			this.setState({
				fastEntranceTip: false,
			})
		}).catch(err => {
			message.error(err.msg || '关闭提示失败了')
		})
	}
	render () {
		const { isLoading, applyAble, treeData, fieldNames, treeLoading, fastEntranceTip } = this.state;
		return <Spin spinning={isLoading}>
			<div className="oap-container">
				<Row className="oap-row oap-sql-row">
					<Col className="oap-analysis-col-flex" style={{ marginRight: '12px', width: '182px', top: 9, height: '100%', overflowY: 'auto' }}>
						<CustomTab
							treeLoading={treeLoading}
							treeData={treeData}
							fieldNames={fieldNames}
							onSelected={this.handleSelectedForTreeData} />
					</Col>
					<Col className="table-container oap-sql-right">
						<Form
							className="search-form"
							ref={this.formIndexRef}
							layout="vertical"
							size="middle"
							initialValues={{ type: 'all' }}
							onFinish={this.fetchDataList}>
							<div className="search-area">
								<Row gutter={32}>
									<Col span={4}>
										<Form.Item name="name" label="分析名称">
											<Input placeholder="查询分析名称" allowClear />
										</Form.Item>
									</Col>
									<Col span={4}>
										<Form.Item name="businessOwnerName" label="业务Owner">
											<Input placeholder="查询Owner名称" allowClear />
										</Form.Item>
									</Col>
									<Col span={4}>
										<Form.Item name="dataOwnerName" label="数据Owner">
											<Input placeholder="查询Owner名称" allowClear />
										</Form.Item>
									</Col>
									<Col span={4}>
										<Form.Item name="type" label="分析类型">
											<Select placeholder='请选择' allowClear>
												{this.state.guideTypeList.map(model => {
													return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
												})}
											</Select>
										</Form.Item>
									</Col>
								</Row>
								<Row>
									<Col flex={1}>
										<Space>
											<Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
											<Button onClick={this.onReset}>重置</Button>
										</Space>
									</Col>
									<Col flex="100px">
										{applyAble && checkMyPermission('oap:apply:save') ? <Button type="primary" onClick={this.linkToApply}>申请分析</Button> : null}
									</Col>
								</Row>
							</div>
						</Form>
						<div className="table-top-wrap" style={{ height: '100%', position: 'relative' }}>
							<Tooltip placement="right" title={() => this.titleNode()} open={fastEntranceTip}>
								<Button type='primary' onClick={this.goFastPage}>快速入门</Button>
							</Tooltip>
							<ConfigProvider renderEmpty={this.customizeRenderEmpty}>
								<Table
									rowKey="id"
									columns={this.state.columns}
									dataSource={this.state.dataList}
									allFilterColumns={this.state.checkedValue}
									tableKey="oapIndexList"
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
					</Col>
				</Row>
			</div>
		</Spin>
	}
}