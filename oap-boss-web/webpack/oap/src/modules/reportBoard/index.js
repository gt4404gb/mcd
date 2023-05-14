import React from "react";
import { Spin, Form, Row, Col, Button, Input, Table, Pagination, Tooltip, Empty, Modal, message, ConfigProvider, Space, Popconfirm } from "@aurum/pfe-ui";
import { checkMyPermission } from "@mcd/portal-components/dist/utils/common";
import { IconAscendingOrder, IconDescendingOrder } from "@aurum/icons";
import { queryReportList } from "@/api/oap/companies_report"; //接口文件
import { subscribeReport, getSubjectTreeData, getBusinessCategoryTreeData } from "@/api/oap/registration_report";
import "@/style/report.less";
import ToggleScene from "@/components/toggleScene";
import TileCard from "@/components/tileCard";
import { connect } from "react-redux";
import { viewReportForReportCenter } from "@/api/oap/buried_api";
import { judgeIsStaff } from '@/utils/store/func';
import CustomTab from '@/components/CustomTab';
import { FIELD_NAMES_DEFAULT } from "@/constants";

class reportBoard extends React.Component {
	constructor(props) {
		super(props);
		this.formReportBoardRef = React.createRef();
		this.state = {
			isLoading: false,
			sortType: "desc", //排序类型asc正序 desc倒叙
			checkedValue: ["name", "theme", "updateFrequency"], //tab筛选
			columns: [
				{
					title: "报告编号",
					dataIndex: "reportCode",
					fixed: "left",
					width: 140,
					sorter: (a, b) => Number(b.reportCode.substring(1)) - Number(a.reportCode.substring(1)),
					defaultSortOrder: "ascend",
					render: (text, record) =>
						checkMyPermission("oap:report:sso") ? <a onClick={() => this.toReportDetails(record.id, record.reportCode, record.reportName)}>{text}</a> : <span>{text}</span>
				},
				{
					title: "报告名称",
					dataIndex: "reportName",
					ellipsis: true,
					fixed: "left",
					width: 200,
					sorter: (a, b) => a.reportName.length - b.reportName.length,
					render: (text, record) => (
						<Tooltip placement="topLeft" title={text}>
							{checkMyPermission("oap:report:sso") ? <a onClick={() => this.toReportDetails(record.id, record.reportCode, record.reportName)}>{text}</a> : <span>{text}</span>}
						</Tooltip>
					),
				},
				{ title: "说明", dataIndex: "description", ellipsis: true, width: 140 },
				{ title: "业务域", dataIndex: "name", ellipsis: true, width: 110 },
				{ title: "主题", dataIndex: "theme", ellipsis: true, width: 160 },
				{
					title: "更新频率",
					dataIndex: "updateFrequency",
					ellipsis: true,
					width: 130,
					render: (text, record) => (
						<Tooltip placement="topLeft" title={record.updateFrequency + (record.updateTime ?? '')}>
							{record.updateFrequency}
							{record.updateTime}
						</Tooltip>
					),
				},
				{ title: "业务Owner", dataIndex: "businessOwnerName", width: 100 },
				{ title: "数据Owner", dataIndex: "dataOwnerName", width: 100 },
				{
					title: "操作",
					dataIndex: "reportCode",
					fixed: "right",
					width: 120,
					render: (text, record) => (
						<Space key={record.reportCode}>
							{record.isSubscribe ? <Popconfirm
								title="确定取消订阅吗？"
								onConfirm={() => this.setSubscribeStatus(record, false)}
								okText="确定"
								cancelText="取消">
								<a>取消订阅</a>
							</Popconfirm> : <a onClick={() => this.setSubscribeStatus(record, true)}>订阅</a>}
							<a onClick={() => this.linkToForm("detail", record)}>详情</a>
						</Space>
					),
				},
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
			treeLoading: false,
			applyAble: false,
			subjectTheme: {},
			showModal: false,
			modalContent: {},
			recordSelectedForTreeData: {},
			pageType: "list",
		};
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
		try {
			const res = await judgeIsStaff();
			this.setState({ applyAble: res.data ?? false })
		} catch (error) {
			console.log('judgeIsStaff 400', error)
		}
	}

	//重置查询条件
	onReset = () => {
		this.formReportBoardRef.current.resetFields();
	}

	onPageChange = (pageNo, pageSize) => {
		this.setState({
			pageNo: pageNo,
			pageSize: pageSize
		}, () => {
			this.formReportBoardRef.current.submit();
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
					accessStatus: 1,
					subjectType: this.state.subjectTheme.subjectType,
					type: 2
				}),
				getBusinessCategoryTreeData({
					reportRangeModule: "ReportBoard",
					accessStatus: 1,
					subjectType: this.state.subjectTheme.subjectType,
					type: 1
				})
			]);
			let treeData = [];
			treeData[0] = [
				{
					name: '订阅的报告',
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
					name: '订阅的报告',
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
		let formData = this.formReportBoardRef.current.getFieldsValue();
		let commitParams = {
			...this.state.recordSelectedForTreeData,
			...formData,
			size: this.state.pageSize,
			page: this.state.pageNo - 1,
			reportRangeModule: "ReportBoard",
			sort: `reportCode,${this.state.sortType}`,
			launchStatus: 1,
			accessStatus: 1,
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
		if (data['selectedKeys'] == 'mine') {
			params['isSubscribe'] = 1;//0否 ，1是
		} else {
			params[key] = data['selectedKeys']
			if (params[key] == 'all') {
				params[key] = '';
			}
		}
		this.setState({
			recordSelectedForTreeData: params
		}, () => {
			this.fetchDataList()
		})
	}

	// 跳转报告数据详情页
	toReportDetails = (id, reportCode, name) => {
		// 埋点start
		const currentUserInfo = localStorage.getItem("USER_INFO");
		let _operatorId = "",
			_operatorName = "",
			_typeRange = "MCD";
		if (currentUserInfo) {
			let info = JSON.parse(currentUserInfo);
			_operatorId = info?.employeeNumber;
			_operatorName = `${info?.chineseName}（${info?.firstName} ${info?.lastName}）`;
		}
		console.log("props = ", this.props);
		if (this.props?.systemHost) {
			_typeRange = String.prototype.toUpperCase.call(this.props.systemHost);
		}
		const obj = {
			typeRange: _typeRange == 'MCD' ? 1: _typeRange == 'RGM' ? 2: 0,
			reportRange: 1, // "ReportBoard", // 企业报告-EnterpriseReport 【1】、BU报告-BUReport 【2】、个人报告-IndividualReport 【3】、业务大屏-BusinessScreen 【4】，其他【0】
			reportId: id,
			// reportName: name,
			// reportCode: reportCode,
			// operatorId: _operatorId,
			// operatorName: _operatorName,
		};
		// console.log('BU报告obj = ', obj);
		viewReportForReportCenter(obj)
			.then((res) => {
				// console.log('埋点成功')
			})
			.catch(() => {
				// console.log('埋点失败')
			});
		// 埋点over
		const params = {
			tabNameZh: name,
			tabNameEn: name,
			path: `/oap/report-data-details?id=${id}`,
		};
		window.EventBus && window.EventBus.emit("setAppTab", null, params);
		this.props.history.push({
			pathname: `/oap/report-data-details?id=${id}`,
		});
	};

	// 跳转至注册报告
	toApplyReport = () => {
		this.props.history.push({
			pathname: `/oap/without-board-report`,
		});
	};

	customizeRenderEmpty = () => {
		return <Empty imgName="person/empty-data">
			<div style={{ color: '#222' }}>
				{this.state.applyAble ? <>更多内容报告，请点击<span className='oap-btn-blue' style={{ margin: '0 4px' }} onClick={this.toApplyReport}>此处</span>申请</> : <>更多报告内容，请联系MCD雇员协助申请</>}
			</div>
		</Empty>
	}

	// 改变排序
	changeSort = () => {
		if (this.state.sortType == "asc") {
			this.setState({
				sortType: "desc",
			}, () => {
				this.fetchDataList();
			});
		} else {
			this.setState({
				sortType: "asc",
			}, () => {
				this.fetchDataList();
			});
		}
	};

	setSubscribeStatus = (record, isSubscribe) => {
		subscribeReport({ id: record.id, isSubscribe }).then(res => {
			res.msg == 'success' && message.success(isSubscribe ? '订阅成功' : '订阅已取消');
			this.fetchDataList();
		}).catch((err) => {
			message.error(err?.msg);
		})
	}

	linkToForm = (type, record) => {
		this.setState({
			showModal: true,
			modalContent: record,
		});
	};

	render () {
		const { isLoading, treeData, fieldNames, showModal, modalContent, pageType, subjectTheme, treeLoading } = this.state;
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
							ref={this.formReportBoardRef}
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
											{checkMyPermission("oap:report:auth") ? <Button onClick={this.toApplyReport}>权限申请</Button> : ''}
										</Space>
									</Col>
									<Col className="sort-report" onClick={this.changeSort}>
										{pageType == "card" ? <div style={{ marginRight: '16px' }}>
											<span style={{ marginRight: "4px", width: "50px" }}>报告编号</span>
											{this.state.sortType === "asc" ? <IconDescendingOrder /> : <IconAscendingOrder />}
										</div> : ''}
										<ToggleScene pageType={pageType} pageChange={(type) => this.setState({ pageType: type })}	></ToggleScene>
									</Col>
								</Row>
							</div>
						</Form>
						<div className="table-top-wrap" style={{ height: '100%' }}>
							<ConfigProvider renderEmpty={this.customizeRenderEmpty}>
								{pageType == "list" ? <Table
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
									scroll={{ x: '100%' }} /> : <>
									<TileCard
										dataSource={this.state.dataList}
										toApplyReport={this.toApplyReport}
										subscriCallBack={this.setSubscribeStatus.bind(this)}
										toReportDetails={this.toReportDetails}
										tolinkToForm={this.linkToForm} />
									{this.state.dataList.length ? <Pagination
										total={this.state.total}
										showSizeChanger
										showQuickJumper
										showTotal={(total) => `总共 ${this.state.total} 项`}
										pageSize={this.state.pageSize}
										current={this.state.pageNo}
										onChange={(pageNo, pageSize) => this.onPageChange(pageNo, pageSize)}
										style={{ padding: "16px 0" }} /> : null}
								</>}
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
						<Input className="detail-input" value={modalContent.updateTypeVal} readOnly
						/>
					</div>
					<div className="report-detailbox">
						<div className="title">更新频率</div>
						<Input className="detail-input" value={modalContent.updateFrequency + (modalContent.updateTime ?? "")} readOnly />
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

const mapStateToProps = (state) => ({
	systemHost: state.system.systemHost,
});

export default connect(mapStateToProps)(reportBoard);
