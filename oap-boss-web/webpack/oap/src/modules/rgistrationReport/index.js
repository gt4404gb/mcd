import React, { Component } from "react";
import { Spin, Form, Row, Col, Button, Input, Select, Table, Tooltip, Popconfirm, Modal, Space, message, Cascader } from '@aurum/pfe-ui';
import { IconExclamationCircle, IconAddA, IconStowC, IconOpenC } from "@aurum/icons";
import querystring from "query-string";
import moment from "moment";
import {
	queryReportList,
	deleteReportItem,
	getBusinessList,
	reportRange,
	transfer,
	getReportSubjectList,
	getUserSession,
	getReportSubjectRGBList
} from "@/api/oap/registration_report";
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { BUILDER_TOOL_LIST, REPORT_APPLY_STATUS_LIST, REPORT_UPDATE_TYPE, SCOPE_LIST } from "@/constants/report";
import { SORT, PUBLISH_STATUS_LIST, APPLY_STATUS, ONLINE_STATUS_LIST } from '@/constants';
import { optionFilterProp } from "@/utils/store/func";

export default class RgistrationReport extends Component {
	constructor(props) {
		super(props);
		this.formRgisRef = React.createRef();
		this.sortedInfo = {};
		this.state = {
			// sort:'id,desc',
			transferId: null,
			superintendentNumber: null,
			businessIdList: [],
			// 报告类型
			reportRangeList: [],
			editAbleArr: [APPLY_STATUS.passed, APPLY_STATUS.back, APPLY_STATUS.withdrawn],
			// table选择获取的值
			tableValue: [],
			selectedRowKeys: [],
			subjectList: [],//主题
			RGMList: [],
			filterOptions: ["launchStatusVal", "releaseStatusVal", "applyStatusName", "superintendentName", "lastModifyAt"],
			dataList: [],
			pageSize: 20,
			pageNo: 1,
			total: null,
			supplierDataList: [],
			tableColumns: [
				{ title: '账号', dataIndex: 'adid' },
				{ title: 'eid', dataIndex: 'eid', align: "left" },
			],
			columns: [
				{
					title: "报告编号",
					dataIndex: "reportCode",
					fixed: "left",
					width: 130,
					sorter: true,
					render: (text, record) =>
						checkMyPermission("oap:report:sso") ? <a onClick={() => this.toReportDetails(record.reportUrl, record.builderTool, record.reportName, record.englishName)}>{text}</a> : <span>{text}</span>
				},
				{
					title: "报告中文名称",
					dataIndex: "reportName",
					ellipsis: true,
					fixed: "left",
					width: 200,
					sorter: true,
					render: (text, record) =>
						checkMyPermission("oap:report:sso") ? <a onClick={() => this.toReportDetails(record.reportUrl, record.builderTool, record.reportName, record.englishName)}>{text}</a> : <span>{text}</span>
				},
				{ title: "说明", dataIndex: "description", ellipsis: true, width: 200 },
				{ title: "报告范围", dataIndex: "reportRangeName", ellipsis: true, width: 100 },
				{ title: "业务域", dataIndex: "name", ellipsis: true, width: 120 },
				{ title: "MCD主题", dataIndex: "mcdSubjectName", ellipsis: true, width: 120 },
				{ title: "RGM主题", dataIndex: "rgmSubjectName", ellipsis: true, width: 120 },
				{ title: "更新类型", dataIndex: "updateTypeVal", ellipsis: true, width: 100 },
				{
					title: "更新频率",
					dataIndex: "updateFrequency",
					ellipsis: true,
					width: 130,
					// sorter: (a, b) => a.lastModifyAt - b.lastModifyAt,
					render: (text, record) =>
						<Tooltip placement="topLeft" title={record.updateFrequency + (record.updateTime ?? '')}>
							{record.updateFrequency}
							{record.updateTime}
						</Tooltip>
				},
				{ title: "上线状态", dataIndex: "launchStatusVal", width: 100 },
				{ title: "发布状态", dataIndex: "releaseStatusVal", width: 100 },
				{ title: "业务Owner", dataIndex: "businessOwnerName", width: 100 },
				{ title: "数据Owner", dataIndex: "dataOwnerName", width: 100 },
				{
					title: "审批状态",
					dataIndex: "applyStatusName",
					width: 140,
					render: (text, record) => {
						if (record.reportRangeModule === "IndividualReport") {
							return <a key={record.id} style={{ fontSize: '12px' }}>—</a>
						}
						if (!record?.applyAuthMain) return '';
						//isEditReport=1表示是编辑状态，这时的applyStatus，0表示编辑审批中 1表示已发布 2表示编辑已退回 3表示编辑已撤回
						//isEditReport=0表示是未编辑状态，这时的applyStatus，0表示审批中 1表示已发布 2已退回 3已撤回
						let applyStatusName;
						switch (record.applyAuthMain?.applyStatus) {
							case 0:
								applyStatusName = record?.applyAuthMain.isEditReport ? '已发布(编辑审批中)' : '审批中';
								break;
							case 1:
								applyStatusName = record?.applyAuthMain.isEditReport ? '已发布' : '已发布';
								break;
							case 2:
								applyStatusName = record?.applyAuthMain.isEditReport ? '已发布(编辑已退回)' : '已驳回';
								break;
							case 3:
								applyStatusName = record?.applyAuthMain.isEditReport ? '已发布(编辑已撤回)' : '已撤回';
								break;
							case 9:
								applyStatusName = (record.applyAuthMain?.requestId ?? '') === '' ? '创建失败' : '—';
								break;
						}
						return <a key={record.id} style={{ fontSize: '12px' }} onClick={() => this.handleLink(record)}>{applyStatusName}</a>
					}
				},
				{ title: " 管理者", dataIndex: "superintendentName", width: 100 },
				{
					title: "发布时间",
					dataIndex: "lastModifyAt",
					width: 178,
					sorter: (a, b) => a.lastModifyAt - b.lastModifyAt,
					defaultSortOrder: "descend",
					render: (text, record) => <span>{moment(record.lastModifyAt).format("YYYY-MM-DD HH:mm:ss")}</span>,
				},
				{
					title: "操作",
					dataIndex: "operation",
					fixed: "right",
					width: 160,
					renderAction: (text, record) => this.handleButton(record)
				},
			],
			showModal: false,
			isLoading: false,
			formInitData: {
				releaseStatus: 'all',
				reportStatus: 'all',
				updateType: 'all',
				launchStatus: 'all',
				reportRangeModule: 'all',
				businessCategoryId: 0,
				subjectId: ['all'],
				subjectType: 'all',
				subjectRgmId: ['all'],
				builderTool: 'all'
			},
			expand: false,
		};
	}

	handleButton = (record) => {
		let arr = []
		if (record.reportRangeModule === "IndividualReport") {
			arr.push({
				name: "查看",
				onClickEvent: () => this.toCreate("edit", record.id)
			})
		} else {
			if (record?.applyAuthMain) {
				if (record.applyAuthMain?.applyStatus == APPLY_STATUS.applying) {  //创建审批中  编辑审批中
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "撤回",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
				} else if (this.state.editAbleArr.includes(Number(record.applyAuthMain.applyStatus))) {
					if (record.releaseStatus == 1) {
						if (checkMyPermission('oap:report:creatorTransfer')) {
							arr.push({
								name: "管理者转移",
								key: 'shift',
								onClickEvent: () => this.linkToForm("transfer", record.id)
							})
						}
					}
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "编辑",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
					if (checkMyPermission('oap:report:delete')) {
						arr.push({
							name: "删除",
							components: (<Popconfirm
								key={record.id}
								title="确认要删除吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmDelete(record.id)}>
								<Button style={{ minWidth: "0px" }} type="link" size="small">删除</Button>
							</Popconfirm>),
						})
					}
				} else if (record.applyAuthMain.applyStatus == APPLY_STATUS.stateless) {
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "申请",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
				}
			} else {
				console.log('注册报告列表，未返回主表信息')
				if (this.state.editAbleArr.includes(Number(record.reportStatus))) {
					if (record.releaseStatus == 1) {
						if (checkMyPermission('oap:report:creatorTransfer')) {
							arr.push({
								name: "管理者转移",
								key: 'shift',
								onClickEvent: () => this.linkToForm("transfer", record.id)
							})
						}
					}
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "编辑",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
					if (checkMyPermission('oap:report:delete')) {
						arr.push({
							name: "删除",
							components: (<Popconfirm
								key={record.id}
								title="确认要删除吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmDelete(record.id)}>
								<Button style={{ minWidth: "0px" }} type="link" size="small">删除</Button>
							</Popconfirm>),
						})
					}
				} else if (record.reportStatus == APPLY_STATUS.applying) {  //审批中
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "撤回",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
				}
			}
		}
		return arr;
	}

	// 处理按钮显示
	handleButton2 = record => {
		let arr = []
		if (!(record.reportRangeModule === "IndividualReport")) {
			if (!record.applyAuthMain) {
				console.log('注册报告列表，未返回主表信息')
				if (this.state.editAbleArr.includes(Number(record.reportStatus))) {
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "编辑",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
					if (checkMyPermission('oap:report:delete')) {
						arr.push({
							name: "删除",
							components: (<Popconfirm
								key={record.id}
								title="确认要删除吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmDelete(record.id)}>
								<Button style={{ minWidth: "0px" }} type="link" size="small">删除</Button>
							</Popconfirm>),
						})
					}
				} else if (record.reportStatus == APPLY_STATUS.applying) {  //审批中
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "撤回",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
				}
				return arr;
			} else {
				if (this.state.editAbleArr.includes(Number(record.applyAuthMain.applyStatus))) {
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "编辑",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
					if (checkMyPermission('oap:report:delete')) {
						arr.push({
							name: "删除",
							components: (<Popconfirm
								key={record.id}
								title="确认要删除吗？"
								okText="确定"
								cancelText="取消"
								onConfirm={() => this.confirmDelete(record.id)}>
								<Button style={{ minWidth: "0px" }} type="link" size="small">删除</Button>
							</Popconfirm>),
						})
					}
					// if (checkMyPermission('oap:report:creatorTransfer')) {
					// 	arr.push({
					// 		name: "管理者转移",
					// 		key: 'shift',
					// 		onClickEvent: () => this.linkToForm("transfer", record.id)
					// 	})
					// }
				} else if (record.applyAuthMain.applyStatus == APPLY_STATUS.applying) {  //审批中
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "撤回",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
				} else if (record.applyAuthMain.applyStatus == APPLY_STATUS.stateless) {
					if (checkMyPermission('oap:report:update')) {
						arr.push({
							name: "申请",
							onClickEvent: () => this.toCreate("edit", record.id)
						})
					}
				}
			}
		} else {
			arr.push({
				name: "查看",
				onClickEvent: () => this.toCreate("edit", record.id)
			})
		}
		return arr
	}

	handleLink = (record) => {
		if (record?.applyAuthMain) {
			if (record.applyAuthMain?.applyStatus == APPLY_STATUS.applying) {  //创建审批中  编辑审批中
				if (checkMyPermission('oap:report:update')) {
					this.toCreate("edit", record.id)
				}
			} else if (this.state.editAbleArr.includes(Number(record.applyAuthMain.applyStatus))) {
				if (checkMyPermission('oap:report:update')) {
					this.toCreate("edit", record.id)
				}
			} else if (record.applyAuthMain.applyStatus == APPLY_STATUS.stateless) {
				this.toCreate("edit", record.id)
			}
		} else {
			console.log('注册报告列表，未返回主表信息')
			if (this.state.editAbleArr.includes(Number(record.reportStatus))) {
				if (checkMyPermission('oap:report:update')) {
					this.toCreate("edit", record.id)
				}
			} else if (record.reportStatus == APPLY_STATUS.applying) {  //审批中
				if (checkMyPermission('oap:report:update')) {
					this.toCreate("edit", record.id)
				}
			}
		}
	}

	// 跳转报告数据详情页
	toReportDetails = (reportUrl, builderTool, CNname, ENname) => {
		const params = {
			tabNameZh: CNname,
			tabNameEn: ENname,
			path: `/oap/report-data-details?reportUrl=${reportUrl}&builderTool=${builderTool}`,
		};
		window.EventBus && window.EventBus.emit("setAppTab", null, params);
		this.props.history.push({
			pathname: `/oap/report-data-details?reportUrl=${reportUrl}&builderTool=${builderTool}`,
		});
	};

	componentDidMount () {
		this.initMeta();
		this.setState({
			sort: 'id,desc'
		})
		this.fetchDataList();
		let { columns } = this.state;
		columns.forEach(item => {
			if (['id', 'reportName'].includes(item.dataIndex)) {
				item = {
					...item,
					sorter: (a, b) => a[dataIndex] - b[dataIndex],
					sortOrder: this.sortedInfo.columnKey === item.dataIndex ? this.sortedInfo.order : null,
				}
			}
		})
		this.setState({
			columns: columns
		});
	}

	//初始化
	initMeta = async () => {
		this.setState({ isLoading: true });
		try {
			const resData = await Promise.all([
				getBusinessList(''),
				reportRange(),
				getReportSubjectList(),
				getReportSubjectRGBList(),
			]);
			let businessIdList = resData[0].data || [], reportRangeList = resData[1]?.data || [], subjectList = resData[2]?.data || [], RGMList = resData[3]?.data.items || []
			businessIdList.unshift({ businessCategoryId: 0, businessCategoryName: '全部' });
			reportRangeList.unshift({ module: 'all', name: '全部' });
			subjectList.unshift({ id: 'all', name: '全部' });
			RGMList.unshift({ id: 'all', name: '全部' })
			this.setState({
				businessIdList,
				reportRangeList,
				subjectList,
				RGMList,
				isLoading: false
			})
		} catch (errInfo) {
			errInfo.msg && message.error(errInfo.msg);
			this.setState({
				isLoading: false
			})
		}
	}

	handleProcess = (record) => {
		this.props.history.push({
			pathname: "/oap/registration-approval-process",
			search: querystring.stringify({ id: record.id, type: 'report' }),
		});
	}

	handleTableChange = (newPagination, filters, sorter) => {
		this.sortedInfo = { ...sorter };
		if (sorter.order != undefined) {
			this.setState({
				sort: `${sorter?.field},${SORT[sorter?.order]}`,
			}, () => {
				this.fetchDataList()
			})
		} else {
			this.setState({
				sort: `id,desc`,
			}, () => {
				this.fetchDataList()
			})
		}

	}

	// 查询
	fetchDataList = () => {
		let params = this.formRgisRef.current.getFieldsValue();
		//去除‘全部’的id
		let arr = ['releaseStatus', 'launchStatus', 'reportRangeModule', 'reportStatus', 'updateType', 'subjectType', 'builderTool'],
			arrCs = ['subjectId', 'subjectRgmId'],
			tempObj = { ...params };
		arr.forEach(key => {
			if (tempObj[key] == 'all') delete tempObj[key];
		})

		arrCs.forEach(key => {
			if ((tempObj[key] ?? '') == '') {
				delete tempObj[key];
			} else if (tempObj[key].length == 1 && tempObj[key][0] == 'all') {
				delete tempObj[key];
			} else if (tempObj[key].length) {
				tempObj[key] = tempObj[key][tempObj[key].length - 1]
			}
		})

		let commitParams = Object.assign({
			size: this.state.pageSize,
			page: this.state.pageNo - 1,
			sort: this.state.sort
		}, tempObj);
		this.setState({
			isLoading: true,
			dataList: [],
			total: null
		}, () => {
			queryReportList(commitParams).then((res) => {
				let dataList = res.data.items || [];
				dataList.forEach((item, index) => {
					if (item.businessCategory) {
						item.name = item.businessCategory.name;
					}
					if (item.reportRange) {
						item.reportRangeName = item.reportRange.name;
					}
				})
				this.setState({
					dataList,
					total: res.data?.total,
				});
			}).catch((err) => {
				err.msg && message.error(err.msg);
			}).finally(() => {
				this.setState({
					isLoading: false
				});
			});
		}
		);
	};

	//重置查询条件
	onReset = () => {
		this.formRgisRef.current.resetFields();
		this.setState({
			pageSize: 50,
			pageNo: 1,
		}, () => {
			this.fetchDataList()
		});
	}

	toCreate = (type, reportId) => {
		if (type === "edit") {
			this.props.history.push({
				pathname: "/oap/registration-approval-process",
				// pathname: "/oap/create-registration-report",
				search: querystring.stringify({ id: reportId, type: 'report' }),
			});
		} else if (type === "create") {
			const params = {
				tabNameZh: '创建报告',
				tabNameEn: 'crateReport',
				path: `/oap/create-report`,
			};
			window.EventBus && window.EventBus.emit("setAppTab", null, params);
			// this.props.history.push({
			// 	pathname: `/oap/create-report`,
			// });
		}
	};

	//删除
	confirmDelete = (id) => {
		deleteReportItem(id).then((res) => {
			res.msg == "success" && message.success("删除成功");
			this.fetchDataList();
		});
	};

	linkToForm = (type, value) => {
		if (type === "transfer") {
			this.setState(
				{
					showModal: true,
					transferId: value,
				},
				() => { }
			);
		}
	};

	getTransferNum = (value) => {
		this.setState({
			superintendentNumber: value.trim(),
		});
	};

	handleTransfer = () => {
		let params = {};
		if (this.state.tableValue.length > 0) {
			params.id = this.state.transferId;
			params.superintendentNumber = this.state.tableValue;
		} else {
			message.error('请选择员工')
			return
		}
		transfer(params).then((res) => {
			res.msg == "success" && message.success("转移成功");
			this.setState({
				showModal: false,
				superintendentNumber: null,
				supplierDataList: [],
				tableValue: [],
				selectedRowKeys: []
			});
			this.fetchDataList();
		}).catch((err) => {
			message.error(err?.msg || '管理者转移失败');
		})
	};

	handleCancel = () => {
		this.setState({
			showModal: false,
			supplierDataList: [],
			superintendentNumber: null,
			tableValue: [],
			selectedRowKeys: []
		});

	};

	handleSupplier = async () => {
		const keyWords = this.state.superintendentNumber;
		if (!keyWords) {
			message.warning('请输入要查询的员工编号')
			return;
		}
		this.setState({
			supplierDataList: []
		})
		try {
			const res = await getUserSession(keyWords);
			if ((res.data ?? '') !== '') {
				if (res.data.userType == 0) {
					this.setState({
						supplierDataList: [res.data]
					})
				} else {
					message.error('请输入正确的员工编号')
				}
			}
		} catch (errInfo) {
			console.log(errInfo);
			message.error(errInfo.msg)
		}
	}

	onSelectChange = (selectedRowKeys, selectedRow) => {
		console.log(selectedRowKeys);
		if (selectedRow.length > 0) {
			this.setState({
				tableValue: selectedRow[0].employeeNumber,
				selectedRowKeys
			})
		} else {
			this.setState({
				tableValue: [],
				selectedRowKeys
			})
		}
	}

	onPageChange = (pageNo, pageSize) => {
		this.setState({
			pageNo: pageNo,
			pageSize: pageSize,
		});
	};

	setExpand = () => {
		this.setState({
			expand: !this.state.expand
		});
	};

	render () {
		const {
			reportRangeList,
			businessIdList,
			showModal,
			superintendentNumber,
			isLoading,
			subjectList,
			tableColumns,
			supplierDataList,
			RGMList
		} = this.state;
		return <Spin spinning={isLoading}>
			<div className="table-container">
				<Form
					className="search-form report-search-form"
					ref={this.formRgisRef}
					layout="vertical"
					size="middle"
					initialValues={this.state.formInitData}
					onFinish={this.fetchDataList}>
					<div className="search-area">
						<Row gutter={30}>
							<Col span={3}>
								<Form.Item name="reportName" className="report-input-mb report-input-font" label="关键词">
									<Input placeholder="报告编号、名称、说明" allowClear />
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="reportRangeModule" className="report-input-mb" label="报告范围">
									<Select placeholder='请选择' allowClear>
										{reportRangeList.map((model) => {
											return <Select.Option value={model.module} key={model.module}>{model.name}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="businessCategoryId" className="report-input-mb" label="业务域">
									<Select placeholder='请选择' allowClear>
										{businessIdList.map((model) => {
											return <Select.Option value={model.businessCategoryId} key={model.businessCategoryId}>{model.businessCategoryName}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
							<Col span={3}>
								<Form.Item name="updateType" className="report-input-mb" label="更新类型">
									<Select placeholder='请选择' allowClear>
										{REPORT_UPDATE_TYPE.map((model) => {
											return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
										})}
									</Select>
								</Form.Item>
							</Col>
							{this.state.expand ? <>
								<Col span={3}>
									<Form.Item name="releaseStatus" className="report-input-mb" label="发布状态">
										<Select placeholder='请选择' allowClear>
											{PUBLISH_STATUS_LIST.map((model) => {
												return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
											})}
										</Select>
									</Form.Item>
								</Col>
								<Col span={3}>
									<Form.Item name="reportStatus" className="report-input-mb" label="审批状态">
										<Select placeholder='请选择' allowClear>
											{REPORT_APPLY_STATUS_LIST.map((model) => {
												return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
											})}
										</Select>
									</Form.Item>
								</Col>
								<Col span={3}>
									<Form.Item name="launchStatus" className="report-input-mb" label="上线状态">
										<Select placeholder='请选择' allowClear>
											{ONLINE_STATUS_LIST.map((model) => {
												return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
											})}
										</Select>
									</Form.Item>
								</Col>
								<Col span={3}>
									<Form.Item name="subjectType" className="report-input-mb" label="配置范围">
										<Select allowClear>
											{SCOPE_LIST.map((model) => {
												return <Select.Option value={model.key} key={model.key}>{model.value}</Select.Option>
											})}
										</Select>
									</Form.Item>
								</Col>
								<Col span={3}>
									<Form.Item name="subjectId" className="report-input-mb" label="MCD主题">
										<Cascader
											options={subjectList}
											fieldNames={{ label: 'name', value: 'id', children: 'sonSubjectList' }}
											changeOnSelect />
									</Form.Item>
								</Col>
								<Col span={3}>
									<Form.Item name="subjectRgmId" className="report-input-mb" label="RGM主题">
										<Cascader
											options={RGMList}
											fieldNames={{ label: 'name', value: 'id', children: 'sonSubjectList' }}
											changeOnSelect />
									</Form.Item>
								</Col>
								<Col span={3}>
									<Form.Item name="builderTool" className="report-input-mb" label="Builder Tool">
										<Select placeholder='请选择' allowClear>
											{BUILDER_TOOL_LIST.map((model) => {
												return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
											})}
										</Select>
									</Form.Item>
								</Col>
							</> : null}
						</Row>
						<Row span={24}>
							<Col>
								<Space size="xs">
									<Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { this.setState({ pageNo: 1, sort: 'id,desc' }); this.sortedInfo = {} }}>查询</Button>
									<Button onClick={this.onReset}>重置</Button>
									<Button type="link" size="small" onClick={this.setExpand}>
										{this.state.expand ? '隐藏查询条件' : '全部查询条件'}
										{this.state.expand ? <IconStowC className="imp-icon-svg-base-style" /> : <IconOpenC className="imp-icon-svg-base-style" />}
									</Button>

								</Space>
							</Col>
						</Row>
					</div>
				</Form>
				<div style={{ height: '12px', background: '#f6f6f6', position: 'relative' }}></div>
				<div className="table-top-wrap" style={{ paddingTop: '32px' }}>
					{checkMyPermission('oap:report:delete') ? <div className="table-top-btn">
						<Button
							type="primary"
							icon={<IconAddA />}
							style={{ position: "absolute", zIndex: 10 }}
							onClick={() => this.toCreate("create", null)}>
							创建
						</Button>
					</div> : null}
					<Table
						rowKey="id"
						columns={this.state.columns}
						dataSource={this.state.dataList}
						showSorterTooltip={false}
						expanded
						allFilterColumns={this.state.filterOptions}
						pagination={{
							showQuickJumper: true,
							showSizeChanger: true,
							pageSize: this.state.pageSize,
							current: this.state.pageNo,
							total: this.state.total,
							onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize)
						}}
						onChange={this.handleTableChange}
						scroll={{ x: '100%' }} />
				</div>
			</div>
			<Modal
				width={490}
				title="管理者转移"
				visible={showModal}
				className="report-administrator-transfer"
				footer={[
					<Button
						type="primary"
						onClick={this.handleTransfer}
						key="submit"
						className="submit">
						确定
					</Button>,
					<Button key="cancle" onClick={this.handleCancel}>
						取消
					</Button>,
				]}
				onCancel={this.handleCancel}>
				<div className="transfer-modal-box">
					<div className="managerTitle">
						<span className="name">管理者</span>
						<span className="star">*</span>
						<Tooltip title={<div>请输入用户员工编号<br />报告所有者转移后，您将无法编辑此报告</div>}>
							<IconExclamationCircle style={{ fontSize: '14px' }} />
						</Tooltip>
					</div>
					<Row gutter={8}>
						<Col flex="1">
							<Input placeholder="请输入员工编号搜索" value={superintendentNumber} onChange={(e) => this.getTransferNum(e.target.value)} />
						</Col>
						<Col flex="80px">
							<Button type="primary" onClick={this.handleSupplier}>查询</Button>
						</Col>
					</Row>
					<Form.Item>
						<Table
							rowKey="adid"
							rowSelection={{
								onChange: this.onSelectChange,
								selectedRowKeys: this.state.selectedRowKeys,
							}}
							columns={tableColumns}
							dataSource={supplierDataList}
							scroll={{ x: '100%' }}
							style={{ marginTop: '16px' }} />
					</Form.Item>
				</div>
			</Modal>
		</Spin>
	}
}
