import React from 'react'
import { Spin, Form, Row, Col, Button, Input, Table, Tooltip, Empty, Modal, Space, message, ConfigProvider } from '@aurum/pfe-ui';
import { queryReportList } from "@/api/oap/companies_report"//接口文件
import { APPLY_STATUS } from '@/constants';
import "@/style/report.less";
import querystring from "query-string";
import { getSubjectTreeData, getBusinessCategoryTreeData } from "@/api/oap/registration_report"
import CustomTab from '@/components/CustomTab';
import { FIELD_NAMES_DEFAULT } from "@/constants";

export default class withputReportBoard extends React.Component {
	constructor(props) {
		super(props)
		this.formWithoutReportBoardRef = React.createRef();
		this.state = {
			sortType: 'asc',//排序类型asc正序 desc倒叙
			isLoading: false,
			editAbleArr: [APPLY_STATUS.applying, APPLY_STATUS.passed, APPLY_STATUS.back, APPLY_STATUS.withdrawn],
			checkedValue: ["name", "theme", "updateFrequency"],//tab筛选
			columns: [
				// { title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
				{
					title: '报告编号',
					dataIndex: 'id',
					fixed: 'left',
					width: 160,
					sorter: (a, b) => a.id - b.id,
					defaultSortOrder: 'ascend',
					render: (text, record) => <span>{record.reportCode}</span>
				},
				{
					title: '报告名称',
					dataIndex: 'reportName',
					ellipsis: true,
					fixed: 'left',
					width: 200,
					sorter: (a, b) => a.reportName.length - b.reportName.length,
					render: (text, record) => (
						<Tooltip placement="topLeft" title={text}>
							<span>{text}</span>
						</Tooltip>
					)
				},
				{ title: '说明', dataIndex: 'description', ellipsis: true, width: 140 },
				{ title: '业务域', dataIndex: 'name', ellipsis: true, width: 100 },
				{ title: "主题", dataIndex: "theme", ellipsis: true, width: 160 },
				{
					title: '更新频率', dataIndex: 'updateFrequency', width: 130, ellipsis: true,
					render: (text, record) => <span>{record.updateFrequency}{record.updateTime}</span>
				},
				{ title: "业务Owner", dataIndex: "businessOwnerName", width: 100 },
				{ title: "数据Owner", dataIndex: "dataOwnerName", width: 100 },
				{ title: '申请状态', dataIndex: 'applyAuthMain', ellipsis: true, width: 140,
				 	render: (text, record) => this.dealApplyStatus(record)
				},
				{
					title: '操作',
					dataIndex: 'operation',
					fixed: 'right',
					width: 100,
					// render: (text, record) => {
					// 	return <Space key={record.reportCode}>
					// 		<a onClick={() => this.linkToForm(record)}>详情</a>

					// 	</Space>
					// },
					renderAction: (text, record) => this.handleButton(record)
				}
			],
			dataList: [],
			pageSize: 50,
			pageNo: 1,
			total: null,
			fieldNames: [
				{
					title: 'name',
					key: 'id',
					children: 'sonSubjectList'
				},
				FIELD_NAMES_DEFAULT
			],
			treeData: [],
			subjectTheme: {},
			showModal: false,
			modalContent: {},
			treeLoading: false
		}
	}

	async componentDidMount () {
		if (/rgm-boss/gi.test(window.location.hostname)) {
			this.setState({
				subjectTheme: {
					nameValue: 'rgmSubjectName',
					subjectIdKey: 'subjectRgmId',
					subjectType: 2  // 1.MCD 2.RGM
				}
			}, async () => {
				await this.init();
				await this.fetchDataList();
			})
		} else {
			this.setState({
				subjectTheme: {
					nameValue: 'mcdSubjectName',
					subjectIdKey: 'subjectId',
					subjectType: 1
				},
			}, async () => {
				await this.init();
				await this.fetchDataList();
			})
		}
	}

	//重置查询条件
	onReset = () => {
		this.formWithoutReportBoardRef.current.resetFields();
	}

	onPageChange = (pageNo, pageSize) => {
		this.setState({
			pageNo: pageNo,
			pageSize: pageSize
		}, () => {
			this.formWithoutReportBoardRef.current.submit();
		});
	}

	init = async () => {
		this.setState({
			treeData: [],
			treeLoading: true
		})
		try {
			const res = await Promise.all([
				getSubjectTreeData({
					reportRangeModule: "ReportBoard",
					accessStatus: 2,
					subjectType: this.state.subjectTheme.subjectType,
					type: 2
				}),
				getBusinessCategoryTreeData({
					reportRangeModule: "ReportBoard",
					accessStatus: 2,
					subjectType: this.state.subjectTheme.subjectType,
					type: 1
				})
			]);
			let treeData = [];
			treeData[0] = [
				{
					name: '全部',
					id: 'all',
					sonSubjectList: []
				},
				...res[0]?.data || []
			]
			treeData[1] = [
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
		let formData = this.formWithoutReportBoardRef.current.getFieldsValue();
		let commitParams = {
			...this.state.recordSelectedForTreeData,
			...formData,
			size: this.state.pageSize,
			page: this.state.pageNo - 1,
			reportRangeModule: "ReportBoard",
			sort: `id,${this.state.sortType}`,
			launchStatus: 1,
			accessStatus: 2,
			isSubscribe: 0,
			subjectType: this.state.subjectTheme.subjectType,
			superintendentNumber: "all",
		}
		this.setState({
			isLoading: true,
			dataList: [],
		}, () => {
			queryReportList(commitParams).then(res => {
				let records = res.data.items || [], dataList = [];
				dataList = records.map((item) => {
					const url = window.URL.createObjectURL(
						new Blob([item.iconUrl], { type: "image/png" })
					);
					return {
						...item,
						name: item.businessCategory?.name ?? null,
						theme: item[this.state.subjectTheme.nameValue],
						previewImage: url,
						// reportRangeName: item.reportRange.name
					};
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
	};

	handleSelectedForTreeData = (data) => {
		let key = data.curTab == 0 ? this.state.subjectTheme.subjectIdKey : 'businessCategoryId', params = {};
		params[key] = data['selectedKeys']
		if (params[key] == 'all') {
			params[key] = '';
		}
		this.setState({
			recordSelectedForTreeData: params
		}, () => {
			this.fetchDataList()
		})
	}

	// 前往申请页
	goApplyPage (type, param) {
		this.props.history.push({
			pathname: "/oap/apply-business-time",
			search: querystring.stringify({ [type === "apply" ? 'id' : "mainId"]: param }),
		});
	}

	linkToForm = (record) => {
		console.log(2222, record)
		this.setState({
			showModal: true,
			modalContent: record
		})
	}

	toSupplierApply = () => {
		this.props.history.push({
			pathname: "/oap/supplier-application",
			search: querystring.stringify({ type: "ReportBoard" })
		});

	}

	customizeRenderEmpty = () => {
		return <Empty
			imgName="person/empty-data"
			description={
				<>
					<div className="oap-tilecard-empty">暂无报告</div>
					<div className="oap-tilecard-fontGray">暂无更多报告，敬请期待……</div>
				</>
			}>
		</Empty>
	}

	goBack = () => {
		this.props.history.go(-1)
	}

	// 处理按钮显示
	handleButton = (record) => {
		let arr = [
			{
				name: "详情",
				onClickEvent: () => this.linkToForm(record)
			}
		]
		if (!record.applyAuthMain) {
			arr.push({
				name: '申请',
				onClickEvent: () => this.goApplyPage('apply', record.id)
			})
		} else {
			arr.push({
				name: '',
				onClickEvent: () => this.goApplyPage('update', record.applyAuthMain?.id)
			})
			if (record.applyAuthMain?.applyStatus === this.state.editAbleArr[0]) {
				arr[1].name = "撤回"
			} else {
				arr[1].name = "申请"
			}
		}
		return arr
	}
	// 处理状态显示
	dealApplyStatus = (record) => {
		let ele = null;
		if (Object.prototype.hasOwnProperty.call(record, 'applyAuthMain') && record.applyAuthMain) {
			switch(record.applyAuthMain.applyStatus) {
				case 0: ele = <a onClick={() => this.linkToApplyForm(record)}>审批中</a>; break;
				case 1: ele = <a onClick={() => this.linkToApplyForm(record)}>已发布</a>; break;
				case 2: ele = <a onClick={() => this.linkToApplyForm(record)}>已驳回</a>; break;
				case 3: ele = <a onClick={() => this.linkToApplyForm(record)}>已撤回</a>; break;
				case 9: ele = <span>-</span>; break;
				default: ele = null; break;
			}
		}
		return ele;
	}
	// 打开详情页面
	linkToApplyForm = (record) => {
		this.props.history.push({
			pathname: `/oap/apply-business-time?mainId=${record.applyAuthMain.id}`,
		});
	}
	render () {
		const { isLoading, treeData, fieldNames, showModal, modalContent, subjectTheme, treeLoading } = this.state;
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
							ref={this.formWithoutReportBoardRef}
							layout="vertical"
							size="middle"
							onFinish={this.fetchDataList}>
							<div className="search-area">
								<Row gutter={32}>
									<Col span={4}>
										<Form.Item name="reportName" label="关键词">
											<Input placeholder="查询报告编号或报告名称" allowClear />
										</Form.Item>
									</Col>
								</Row>
								<Row>
									<Col flex={1}>
										<Space>
											<Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1 }); }}>查询</Button>
											<Button onClick={this.onReset}>重置</Button>
											<Button onClick={this.goBack}>返回</Button>
											<Button className="apply" onClick={this.toSupplierApply}>为供应商申请</Button>
										</Space>
									</Col>
								</Row>
							</div>
						</Form>
						<div className="table-top-wrap" style={{ height: '100%' }}>
							<ConfigProvider renderEmpty={this.customizeRenderEmpty}>
								<Table
									rowKey="id"
									columns={this.state.columns}
									dataSource={this.state.dataList}
									allFilterColumns={this.state.checkedValue}
									expanded
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
			<Modal
				className="report-detail-box"
				width={487}
				title={"详情-" + modalContent.reportCode}
				visible={showModal}
				footer={[
					<Button type="primary" key="submit" onClick={() => this.setState({ showModal: false, modalContent: {} })}>确定</Button>
				]}
				onCancel={() => this.setState({ showModal: false, modalContent: {} })}>
				<div className="report-detail-modal">
					<div className="report-detailbox">
						<div className="title">报告中文名称</div>
						<Input className="detail-input" value={modalContent.reportName} readOnly />
					</div>
					<div className="report-detailbox">
						<div className="title">报告英文名称</div>
						<Input className="detail-input" value={modalContent.englishName} readOnly />
					</div>
					<div className="report-detailbox">
						<div className="title">说明</div>
						<Input className="detail-input" value={modalContent.description} readOnly />
					</div>
					<div className="report-detailbox">
						<div className="title">业务域</div>
						<Input className="detail-input" value={modalContent.name} readOnly />
					</div>
					<div className="report-detailbox">
						<div className="title">主题</div>
						<Input className="detail-input" value={modalContent[subjectTheme.nameValue]} readOnly />
					</div>
					<div className="report-detailbox">
						<div className="title">更新类型</div>
						<Input className="detail-input" value={modalContent.updateTypeVal} readOnly />
					</div>
					<div className="report-detailbox">
						<div className="title">更新频率</div>
						<Input className="detail-input" value={modalContent.updateTime ? modalContent.updateFrequency + modalContent.updateTime : modalContent.updateFrequency} readOnly />
					</div>
					<div className="report-detailbox">
						<div className="title">指标&维度</div>
						<Input className="detail-input" value={modalContent.confluenceUrl} readOnly />
					</div>
				</div>
			</Modal>
		</Spin>
	}
}
