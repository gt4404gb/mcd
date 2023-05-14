import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Spin, Form, Row, Col, Button, Input, Table, message, Select, Space, Tooltip } from '@aurum/pfe-ui';
import querystring from "query-string";
import { queryAnalyseSubjectTreeData, queryAnalyseCategoryTreeData, queryGuideApplyList } from '@/api/oap/guide_analysis';
import { APPLYINFO_TYPE, FIELD_NAMES_DEFAULT, GUILDE_TYPE_LIST } from '@/constants';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { optionFilterProp } from '@/utils/store/func';
import CustomTab from '@/components/CustomTab';

const applyAuthList = forwardRef((props, ref) => {
	const [isLoading, setIsLoading] = useState(false)
	const [columns, setColumns] = useState([
		{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
		{
			title: '分析名称',
			dataIndex: 'name',
			ellipsis: true,
			width: 180,
			fixed: 'left',
			align: 'left',
			render: (text, record) => {
				return <Tooltip placement="topLeft" title={text} key={record.id}>
					{checkMyPermission('oap:apply:save') ? <a onClick={() => linkToApply((record.mainId ?? '') === '' ? 'create' : 'form', record)}>{text}</a> : <a>{text}</a>}
				</Tooltip>
			}
		},
		{ title: '主题', dataIndex: 'subjectNames', ellipsis: true, width: 180 },
		{ title: '业务域', dataIndex: 'categoryNames', ellipsis: true, width: 120 },
		{ title: '分析类型', dataIndex: 'typeName', ellipsis: true, width: 120 },
		{ title: '说明', dataIndex: 'description', ellipsis: true, width: 120 },
		{ title: '业务Owner', dataIndex: 'businessOwnerName', ellipsis: true, width: 120 },
		{ title: '数据Owner', dataIndex: 'dataOwnerName', ellipsis: true, width: 120 },
		{
			title: '操作',
			dataIndex: 'operation',
			fixed: 'right',
			width: 120,
			render: (text, record) => {
				return <Space size="middle" key={record.id}>
					{record.descriptionCount > 0 ? <a href='#' onClick={() => goDetailEditor(record)}>详情</a> : null}
					{checkMyPermission('oap:apply:save') ? ((record.mainId ?? '') === '' ? <a key={record.id} style={{ fontSize: '12px' }} onClick={() => linkToApply('create', record)}>申请</a> : <a key={record.id} style={{ fontSize: '12px' }} onClick={() => linkToApply('form', record)}>查看流程</a>) : ''}
				</Space>
			}
		}
	])
	const [checkedValue, setCheckedValue] = useState(['name', 'subjectNames', 'categoryNames', 'typeName', 'description', 'businessOwnerName', 'dataOwnerName'])
	const [dataList, setDataList] = useState([])
	const [tablePagenation, setTablePagenation] = useState({
		pageSize: 10,
		pageNo: 1,
		total: null,
	})
	const [treeData, setTreeData] = useState([])
	const [fieldNames, setFieldNames] = useState([
		{
			title: 'name',
			key: 'id',
			children: 'sonSubjectList'
		},
		FIELD_NAMES_DEFAULT
	])
	const [treeLoading, setTreeLoading] = useState(false)
	const [guideTypeList, setGuideTypeList] = useState(() => GUILDE_TYPE_LIST.filter(it => it.value != '2_2'))
	const formApplyListRef = useRef();

	//重置查询条件
	const onReset = () => {
		formApplyListRef.current.resetFields();
	}

	const onPageChange = (pageNo, pageSize) => {
		setTablePagenation((preState) => ({
			...preState,
			pageNo: pageNo,
			pageSize: pageSize,
		}))
		formApplyListRef.current.submit();
	}

	const init = async () => {
		setTreeData([]);
		setTreeLoading(true)
		try {
			const res = await Promise.all([
				queryAnalyseSubjectTreeData({ contain: false }),
				queryAnalyseCategoryTreeData({ contain: false })
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
			setTreeData(treeData);
			setTreeLoading(false);
		} catch (errInfo) {
			setTreeLoading(false);
		}
	}

	const fetchDataList = (tabParams = {}) => {
		let formData = formApplyListRef.current.getFieldsValue(), commitParams = {};
		const params = { ...tabParams, ...formData };
		const keysArr = Object.keys(params);
		keysArr.forEach(key => {
			if (params[key] != 'all' && (params[key] ?? '') != '') {
				commitParams[key] = params[key]
			}
		})
		commitParams = { ...commitParams, size: tablePagenation.pageSize, page: tablePagenation.pageNo - 1 }
		setDataList([]);
		setIsLoading(true);
		queryGuideApplyList(commitParams).then(res => {
			let records = res.data.items || [], dataList = [];
			dataList = records.map((item, index) => {
				return {
					...item,
					tableIndex: (tablePagenation.pageNo - 1) * tablePagenation.pageSize + index + 1,
					subjectNames: item.subjectNames.join('-'),
					categoryNames: item.categoryNames.join('-'),
					typeName: optionFilterProp(GUILDE_TYPE_LIST, 'value', item.type)?.label,
				}
			});
			setDataList([...dataList]);
			setTablePagenation({
				...tablePagenation,
				total: res.data?.total
			})
		}).catch((err) => {
			message.error(err?.msg || err?.message || '网络异常，请稍后重试');
		}).finally(() => {
			setIsLoading(false);
		})
	}

	const handleSelectedForTreeData = (data) => {
		let params = {}
		let key = data.curTab == 0 ? 'subjectId' : 'categoryId';
		params[key] = data['selectedKeys']
		fetchDataList(params)
	}

	const linkToApply = (flag, record = {}) => {
		if (flag == 'createOthers') {
			props.history.push({
				pathname: '/oap/index/apply/create',
				search: querystring.stringify({ isOthers: true, from: 'analysis' })
			});
		} else if (flag == 'createSelf') {
			props.history.push({
				pathname: '/oap/index/apply/create',
				search: querystring.stringify({ from: 'analysis' })
			});
		} else if (flag == 'create') {
			props.history.push({
				pathname: '/oap/index/apply/create',
				search: querystring.stringify({ businessCategoryId: record?.businessCategoryId, applyInfo: record?.id, from: 'analysis' })
			});
		} else if (flag == 'form') {
			props.history.push({
				pathname: '/oap/index/apply/form',
				search: querystring.stringify({ id: record?.mainId, from: 'analysis' })
			});
		}
	}

	const goToIndex = () => {
		props.history.push({ pathname: '/oap/index' });
	}

	const goDetailEditor = (record) => {
		let pathname = `/oap/scene-description?id=${record.id}`, tabNameZh = '场景说明';
		const params = {
			tabNameZh: tabNameZh,
			tabNameEn: tabNameZh,
			path: pathname,
		};
		window.EventBus && window.EventBus.emit("setAppTab", null, params);
	}

	useEffect(() => {
		init();
		fetchDataList()
	}, []);

	return <Spin spinning={isLoading}>
		<div className="oap-container">
			<Row className="oap-row oap-sql-row">
				<Col className="oap-analysis-col-flex" style={{ marginRight: '12px', width: '182px', top: 9, height: '100%', overflowY: 'auto' }}>
					<CustomTab
						treeLoading={treeLoading}
						treeData={treeData}
						fieldNames={fieldNames}
						onSelected={handleSelectedForTreeData} />
				</Col>
				<Col className="table-container oap-sql-right">
					<Form
						className="search-form"
						ref={formApplyListRef}
						layout="vertical"
						size="middle"
						initialValues={{ type: 'all' }}
						onFinish={fetchDataList}>
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
											{guideTypeList.map(model => {
												return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
											})}
										</Select>
									</Form.Item>
								</Col>
							</Row>
							<Row>
								<Col flex={1}>
									<Space>
										<Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { setTablePagenation({ ...tablePagenation, pageNo: 1 }); }}>查询</Button>
										<Button onClick={onReset}>重置</Button>
										<Button onClick={goToIndex}>返回</Button>
									</Space>
								</Col>
								<Col flex="210px">
									<Space>
										{checkMyPermission('oap:apply:save') ? <Button type="primary" onClick={() => linkToApply('createSelf')}>申请</Button> : null}
										{checkMyPermission('oap:apply:save') ? <Button onClick={() => linkToApply('createOthers')}>为供应商申请</Button> : null}
									</Space>
								</Col>
							</Row>
						</div>
					</Form>
					<div className="table-top-wrap" style={{ height: '100%' }}>
						<Table
							rowKey="id"
							columns={columns}
							dataSource={dataList}
							allFilterColumns={checkedValue}
							pagination={{
								showQuickJumper: true,
								showSizeChanger: true,
								pageSize: tablePagenation.pageSize,
								current: tablePagenation.pageNo,
								total: tablePagenation.total,
								onChange: (pageNo, pageSize) => onPageChange(pageNo, pageSize)
							}}
							scroll={{ x: '100%' }} />
					</div>
				</Col>
			</Row>
		</div>
	</Spin>
})

export default applyAuthList; 