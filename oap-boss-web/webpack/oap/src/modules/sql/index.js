import React from "react";
import * as codemirror from 'codemirror';
import CodeMirror from 'codemirror';
var Pos = CodeMirror.Pos;
import { UnControlled as CodeMirrorDom } from 'react-codemirror2';
// import {UnControlled as CodeMirrorDom} from '@/plugins/react-codemirror2/index';
// import 'codemirror/lib/codemirror.css'
// import {Spin,Row,Col,Input,Button,TableFilter,Table,Tooltip,Tabs,Form,Select,Modal,Space,Popconfirm,Badge,Tree} from '@mcd/portal-components';
// import {SearchOutlined,DeleteOutlined,FormatPainterOutlined,CloseOutlined,CaretRightOutlined, InfoCircleOutlined, RedoOutlined} from '@ant-design/icons';
import { Tree, Spin, Row, Col, Input, Button, Table, Tooltip, Tabs, Form, Select, Modal, Space, Popconfirm, Badge, message, Empty } from '@aurum/pfe-ui';
// import {Tree} from '@mcd/portal-components';
import { IconSearch, IconRefreshA, IconClearUp, IconClose, IconPlay, IconInfoCircle, IconAddA, IconBack } from '@aurum/icons';
import { getPageSize, getTableKey, getTableHeight } from '@mcd/portal-components/dist/utils/table';
import { querySubjectModelByLevel } from '@/api/oap/self_analysis.js';
import {
    sqlQuery,
    queryModelInfoList,
    saveTemplate,
    templatePage,
    deleteTemplate,
    editTemplate,
    getDetailTemplate,
    querySqlLog,
    savePersonalQueries,
    editPersonalQueries,
    personalQueriesPage,
    getDetailPersonalQueries,
    deletePersonalQueries,
    downLoadCsvForSqlSearchResult,
    getSqlSchema,
    getSqlTableBySchema,
    getSqlFieldByTable,
    getSqlRunResult,
    downLoadCsvForSqlPrestoSearchResult,
    queryFieldInfoByTable,
    querySqlSubjectModelList,
    refreshRedisDataForHive,
    getUserConsoleInfo,
    deleteUserConsoleInfo,
    saveUserConsoleInfo,
} from '@/api/oap/sql_search.js';
// import {message} from "antd";
import moment from 'moment';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ReactSortable } from "react-sortablejs";
import _ from 'lodash';
import { encode, decode } from 'js-base64';

const { TreeNode } = Tree;
import SvgIcon from '@/components/SvgIcon';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import ExploreEmailModal from '@/components/ExploreEmailModal';
import { getCurrentUserIsStaff } from '@/api/oap/commonApi.js';
import { SQL_LIMITS_LIST } from '@/constants';
import SearchInput from '@/components/SearchInput';
import { viewSqlTemplateForSqlSearch } from '@/api/oap/buried_api.js';
import SqlBody from './components/SqlBody';
// import is_new_x from '@/assets/svg/is_new';

// language
// require('codemirror/mode/sql/sql.js');
// theme
require('codemirror/lib/codemirror.js');
require('codemirror/lib/codemirror.css');

// css 主题
// require('codemirror/theme/material.css');
// require('codemirror/theme/neat.css');
// require('codemirror/theme/idea.css');
// require('codemirror/theme/solarized.css');
require('codemirror/theme/neo.css');

// hint
require('codemirror/addon/hint/show-hint.js');
require('codemirror/addon/hint/show-hint.css');
// require('codemirror/addon/hint/sql-hint.js');
require('codemirror/addon/selection/active-line.js');

// keyMap
require('codemirror/addon/edit/matchbrackets.js');
require('codemirror/mode/clike/clike.js');
require('codemirror/addon/display/autorefresh.js');
require('codemirror/addon/edit/closebrackets');

// codemirror搭配sql-formatter实现SQL语句格式化
// import { format } from 'sql-formatter';
import { format } from '@/plugins/sql-formatter/sqlFormatter.js';

require('@/plugins/codemirror-custom/sql-hint.js');
require('@/plugins/codemirror-custom/sql.js');

import '@/style/sql-search.less';
/**
 * 给ant-desing中的message添加手动关闭
 * @param {*} msg 
 * @param {*} duration 
 
const info = (msg, duration) => {
    let hide;
    const onClose = () => {
      hide();
    };
    hide = message.info(
      <span>
        {msg}
        <CloseOutlined
          onClick={onClose}
          style={{ color: "#999", cursor: "pointer", fontSize: 12 }}
        />
      </span>,
      duration
    );
};
*/
const CONS = {
    QUERY_DIV: ';',
    ALIAS_KEYWORD: 'AS'
};
class Index extends React.PureComponent {
    constructor(props) {
        super(props);
        this.sqlContent = '';
        this.formRefBasicInfo = React.createRef();
        this.queryKeywords = React.createRef();
        this.codemirrorEle = React.createRef();
        this.queryFieldKeywords = React.createRef();
        this.formSearchORef = React.createRef();
        this.formSearchTRef = React.createRef();
        this.formSearchSRef = React.createRef();
        this.copySqlForm = React.createRef();
        this.copySqlFormFromOtherPage = React.createRef();
        this.state = {
            isLoading: false,
            isLoaded: false,
            defCollapseList: [],
            collapseList: [],
            activeCollapse: '',
            activeCollapseChildren: '',
            tableLoading: false,
            tableHeight: '',
            sqlContent: '',
            activeTabsKey: '2',
            tabsList: [
                {
                    tabsTitle: '查询结果',
                    key: '1',
                    showSearch: false,
                    showSqlSubjectSearch: false,
                    loading: false,
                    tableData: [],
                    columns: [],
                    defcolumns: [],
                    filterOptions: [],
                    checkedValue: [],
                    pageSize: 20,
                    pageNo: 1,
                    total: null,
                    showExportCsv: true,
                },
                {
                    tabsTitle: '保存的查询',
                    key: '2',
                    showSearch: true,
                    showSqlSubjectSearch: false,
                    formRef: this.formSearchORef,
                    loading: false,
                    tableData: [],
                    columns: [
                        { title: "名称", dataIndex: 'name', ellipsis: true, width: 160, align: 'left' },
                        { title: "描述", dataIndex: 'description', ellipsis: true, width: 160, align: 'left' },
                        { title: "用户名", dataIndex: 'createName', ellipsis: true, width: 120, align: 'left' },
                        { title: "最后修改时间", dataIndex: 'lastModifyDate', ellipsis: true, width: 140, align: 'left' },
                        {
                            title: '操作',
                            dataIndex: 'operation',
                            fixed: 'right',
                            width: 180,
                            render: (text, record) => (
                                // <Space size={0}>
                                //     <Button type="link" size="small" onClick={() => this.handleSwitchSql('search',record.id)}>
                                //         打开
                                //     </Button>
                                <Space size="middle" key={`保存的查询_${record.id}`}>
                                    <a onClick={() => this.handleSwitchSql('search', record)}>打开</a>
                                    {checkMyPermission('oap:dispatch:add') && <a onClick={() => this.onCreateSchedule(record)}>定时任务</a>}
                                    {checkMyPermission('oap:sql:personalQueries') ? <Popconfirm
                                        title="确认要删除吗？"
                                        okText="确定"
                                        cancelText="取消"
                                        onConfirm={() => this.confirmDelete('search', record.id)}>
                                        <a href="#">删除</a>
                                        {/* <Button type="link" size="small">删除</Button> */}
                                    </Popconfirm> : null}
                                </Space>
                            )
                        }
                    ],
                    defcolumns: [],
                    filterOptions: [],
                    checkedValue: ['name', 'description', 'createName', 'lastModifyDate', 'operation'],
                    pageSize: 20,
                    pageNo: 1,
                    total: null,
                    showExportCsv: false,
                },
                {
                    tabsTitle: '历史查询',
                    key: '3',
                    showSearch: true,
                    showSqlSubjectSearch: false,
                    formRef: this.formSearchTRef,
                    loading: false,
                    tableData: [],
                    columns: [
                        {
                            title: "状态",
                            dataIndex: 'queryStatus',
                            ellipsis: true,
                            width: 100,
                            align: 'left',
                            render: (text, record) => (
                                <Tooltip placement="topLeft" title={record.queryStatus}>
                                    <Badge status={record.queryStatus && record.queryStatus.toLowerCase() == 'finish' ? 'success' : 'error'} text={record.queryStatus} />
                                </Tooltip>
                            )
                        },
                        { title: "时间", dataIndex: 'createAt', ellipsis: true, width: 100, align: 'left' },
                        {
                            title: "SQL",
                            dataIndex: 'querySql',
                            // ellipsis: true, 
                            width: 280,
                            align: 'left',
                            render: (text, record) => (<Button key={`${record.id}_querySql`} type="link" onClick={() => this.handleSqlModal(record)}>{record.querySql}</Button>)
                        }
                    ],
                    defcolumns: [],
                    filterOptions: [],
                    checkedValue: ['queryStatus', 'createAt', 'querySql'],
                    pageSize: 20,
                    pageNo: 1,
                    total: null,
                    showExportCsv: false,
                },
                {
                    tabsTitle: '查询模板',
                    key: '4',
                    showSearch: true,
                    showSqlSubjectSearch: true,
                    formRef: this.formSearchSRef,
                    loading: false,
                    tableData: [],
                    columns: [
                        { title: "模板名称", dataIndex: 'name', ellipsis: true, width: 160, align: 'left' },
                        { title: "业务域", dataIndex: 'subjectName', ellipsis: true, width: 100, align: 'left' },
                        { title: "描述", dataIndex: 'description', ellipsis: true, width: 160, align: 'left' },
                        { title: "用户名", dataIndex: 'createName', ellipsis: true, width: 80, align: 'left' },
                        { title: "模板类型", dataIndex: 'templatePageType', ellipsis: true, width: 80, align: 'left' },
                        { title: "最后修改时间", dataIndex: 'lastModifyDate', ellipsis: true, width: 130, align: 'left' },
                        {
                            title: '操作',
                            dataIndex: 'operation',
                            fixed: 'right',
                            width: 100,
                            render: (text, record) => (
                                <Space size="middle" key={`查询模板_${record.id}`}>
                                    <Button type="link" size="small" onClick={() => this.handleSwitchSql('template', record)}>打开</Button>
                                    {record.type === 1 ? <Popconfirm
                                        title="确认要删除吗？"
                                        okText="确定"
                                        cancelText="取消"
                                        onConfirm={() => this.confirmDelete('template', record.id)}>
                                        <a href="#">删除</a>
                                    </Popconfirm> : null}
                                </Space>
                            )
                        }
                    ],
                    defcolumns: [],
                    filterOptions: [],
                    checkedValue: ['name', 'subjectName', 'description', 'createName', 'templatePageType', 'lastModifyDate', 'operation'],
                    pageSize: 20,
                    pageNo: 1,
                    total: null,
                    showExportCsv: false,
                    isTreeLoading: false,
                    tableResLoading: false,
                    sqlTableLoadingAll: false,
                    runLight: false,
                }
            ],
            limit: 1000,
            basicInfo: {},
            visibleBasicInfo: false,
            modalType: '',//基础弹框类型 search  template
            currentDetailType: '',//当前数据类型search  template
            subjectModel: [],
            visibleSql: false,
            sqlInfo: '',
            saveLoading: false,
            saveAsLoading: false,
            sqlHintOptions: {},
            dragFromSourceMenu: null, // 记录当前拖拽的字段名
            recordForRunResultCondition: { // 记录运行前的sql条件和limit，方便导出csv的时候，保留的是记录条件
                datasourceType: 'ClickHouse',
                sql: '',
                limits: 1000,
            },
            sqlRunError: false,
            sqlRunErrorMsg: '',
            treeNodeList: [],
            defTreeNodeList: [],
            isTreeLoading: false,
            defaultExpandedKeysForSqlMenu: [],
            autoExpandParent: true,
            fieldInfoVisible: false,//modal查看字段
            fieldInfo: {},
            fieldInfoColumns: [
                { title: '序号', dataIndex: 'tableIndex', width: 80 },
                { title: '字段名', dataIndex: 'fieldName', ellipsis: true, width: 140 },
                { title: '字段类型', dataIndex: 'fieldType', ellipsis: true, width: 100 },
                { title: '字段含义', dataIndex: 'description', ellipsis: true, width: 180 },
            ],
            fieldInfoDataList: [],
            fieldInfoLoading: false,
            sqlSubjectModel: [],//查询模板的业务域列表
            emailModalData: {
                isStaff: false,
                mcdEmail: '',
                visibleEmailInfo: false,
                isLoading: false,
            },

            // 你就给我割
            sqlTabsList: [
                // {
                //     tabTitle: '控制台1',
                //     componentName: SqlBody,
                //     sql: '',
                //     key: 'sql_body_key_1',
                // }
            ],
            sqlActiveKey: '',
            shrinkSwitch: true,
            isBeyond10ConsoleVisible: false,
            isSqlTempFromOtherPageVisible: false,
            sqlTempFromOtherPage: '',
            sqlBoxLoading: false,
        };
        this.requestCancel = {};
        props.cacheLifecycles.didRecover(this.recoverySqlTemplate);
        this.defaultData = {
            id: '',
            sqlName: 'SQL分析',
            sqlExecInfo: {
                datasourceType: 'ClickHouse',
                sql: '',
                limits: 1000,
            }
        }
    }
    recoverySqlTemplate = () => {
        let record = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapSqlTemplateId'))) || {};
        if (record?.sqlTemplateId) {
            // this.handleDetails('template', record.sqlTemplateId, record);
            // sessionStorage.removeItem('oapSqlTemplateId');
            if (this.state.sqlTabsList.length >= 10) {
                console.log('超出了最大控制台数量');
                this.setState({
                    sqlBoxLoading: true,
                }, () => {
                    getDetailTemplate(record.id).then(res => {
                        console.log('res data sqlContent = ', res.data);
                        this.setState({
                            isBeyond10ConsoleVisible: true,
                            sqlTempFromOtherPage: res.data?.sqlContent,
                            sqlBoxLoading: false,
                        })
                    })
                })

            } else {
                // 需要添加个tab
                saveUserConsoleInfo(this.defaultData).then(res => {
                    console.log('res = ', res);
                    // this.addSqlBody(res.data.id, '');
                    let id = res.data.id, str = '';
                    let sqlTabLen = this.state.sqlTabsList.length;
                    let newActiveKey = 1;
                    if (sqlTabLen > 0) {
                        newActiveKey = +(this.state.sqlTabsList[sqlTabLen - 1].tabTitle.split('控制台')[1]) + 1;
                    }
                    const newSqlTabsList = [...this.state.sqlTabsList];
                    this[`sql_box_id_${id}_ref`] = React.createRef();
                    newSqlTabsList.push({
                        tabTitle: `控制台${newActiveKey}`,
                        componentName: SqlBody,
                        key: id,
                        defaultSqlStr: str,
                        ref: this[`sql_box_id_${id}_ref`]
                    })
                    this.setState(state => ({
                        ...state,
                        sqlTabsList: [...newSqlTabsList],
                        sqlActiveKey: `${id}`,
                    }), () => {
                        getDetailTemplate(record.id).then(res => {
                            console.log('res data sqlContent = ', res.data);
                            this.setState({
                                sqlTempFromOtherPage: res.data?.sqlContent,
                            }, () => {
                                this.handleBeyond10Ok();
                            })
                        })
                    })
                }).catch((err) => {
                    err && message.warning(err.msg || '添加tab出错了！');
                })
            }
        }
    }
    handleBeyond10Ok = async () => {
        let record = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapSqlTemplateId'))) || {};
        let i = this.state.sqlTabsList.length - 1;
        let id = this.state.sqlTabsList[i].key;
        await this[`sql_box_id_${id}_ref`].current.handleDetails('template', record.sqlTemplateId, record);
        sessionStorage.removeItem('oapSqlTemplateId');
        this.setState({
            isBeyond10ConsoleVisible: false,
        })
    }
    handleBeyond10Cancel = () => {
        sessionStorage.removeItem('oapSqlTemplateId');
        this.setState({
            isBeyond10ConsoleVisible: false,
        })
    }
    handleBeyond10ShowSqlTemp = () => {
        this.setState({
            isSqlTempFromOtherPageVisible: true,
        }, () => {
            let formData = this.copySqlFormFromOtherPage.current.getFieldsValue();
            formData.sql = this.state.sqlTempFromOtherPage;
            this.copySqlFormFromOtherPage.current.setFieldsValue(formData);
        })
    }
    componentDidMount () {
        /**
         * 1. 进来，需检验该用户的sql查询list情况
         * 2. 如果有历史sql，则直接展示
         * 3. 如果为新用户，则需要自动掉一次创建接口
        */
        this.getList();
        getUserConsoleInfo().then(res => {
            console.log('111111 = ', res);
            if (res.data.length > 0) {
                let newSqlTabsList = [...this.state.sqlTabsList];
                let len = res.data.length;
                res.data.forEach((it, idx) => {
                    // it.id && this.addSqlBody(it.id, it.sqlExecInfo.sql); // 刷新4次，需改成1次
                    if (it.id) {
                        this[`sql_box_id_${it.id}_ref`] = React.createRef();
                        let sql_content = it.sqlExecInfo.sql;
                        let exg = new RegExp('^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$');
                        // if (it.sqlExecInfo.sql !== '') {
                        if (exg.test(it.sqlExecInfo.sql)) {
                            sql_content = decode(it.sqlExecInfo.sql);
                        }
                        newSqlTabsList.push({
                            tabTitle: `控制台${idx + 1}`,
                            componentName: SqlBody,
                            key: it.id,
                            defaultSqlStr: sql_content, // decode(it.sqlExecInfo.sql),
                            ref: this[`sql_box_id_${it.id}_ref`],
                            sqlName: it.sqlName || 'SQL分析'
                        })
                    }
                })
                this.setState(state => ({
                    ...state,
                    sqlTabsList: [...newSqlTabsList],
                    sqlActiveKey: `${res.data[len - 1].id}`,
                }), () => {
                    getCurrentUserIsStaff().then(res => {
                        this.setState(state => ({
                            ...state,
                            emailModalData: {
                                ...state.emailModalData,
                                isStaff: res.data ?? false,
                            }
                        }))
                    })
                    this.recoverySqlTemplate();
                })
                // this.getList();
                // localStorage.removeItem('sqlContent');
                // this.setState({
                //     tabsList: this.state.tabsList.map(tabs => ({
                //         ...tabs,
                //         defcolumns: tabs.columns,
                //         filterOptions: tabs.columns.map(it => ({
                //             label: it.title,
                //             value: it.dataIndex
                //         })),
                //         checkedValue: tabs.columns.map(it => it.dataIndex)
                //     }))
                // }, () => {
                //     this.getTabsList();
                // })
                // getCurrentUserIsStaff().then(res => {
                //     this.setState(state => ({
                //         ...state,
                //         emailModalData: {
                //             ...state.emailModalData,
                //             isStaff: res.data ?? false,
                //         }
                //     }))
                // }).catch(() => {

                // })
                // this.recoverySqlTemplate();
            } else {
                console.log('this.defaultData = ', this.defaultData);
                saveUserConsoleInfo(this.defaultData).then(res => {
                    console.log('res = ', res);
                    this.addSqlBody(res.data.id, '');
                })
            }
        })
    }

    resetColumns = () => {
        let index = Number(this.state.activeTabsKey) - 1,
            tabsList = [...this.state.tabsList];
        tabsList[index] = {
            ...tabsList[index],
            columns: tabsList[index].defcolumns,
            checkedValue: tabsList[index].filterOptions.map((it) => it.value)
        }
        this.setState({
            tabsList
        })
    }

    onPageChange = (pageNo, pageSize, tabsKey) => {
        let index = Number(tabsKey) - 1,
            tabsList = [...this.state.tabsList];
        tabsList[index] = {
            ...tabsList[index],
            pageNo: pageNo,
            pageSize: pageSize
        };
        this.setState({
            tabsList
        }, () => {
            this.getTabsList();
        })
    }

    //左侧 业务域
    /**
     * 
     * 作废
     
        getList = async () => {
            try{
                this.setState({
                    isLoading: true
                })
                let resModelInfoList = await queryModelInfoList();
                let sqlHintOptions = {};
                let _menuList = [];
                resModelInfoList.data.forEach(item => {
                    let _item = [];
                    item.tableInfoVoList.forEach(listItem => {
                        if (listItem.dbName) {
                            if (!sqlHintOptions[listItem.dbName]) {
                                sqlHintOptions[listItem.dbName] = [listItem.tableName]
                            } else {
                                sqlHintOptions[listItem.dbName].push(listItem.tableName)
                            }
                        }
                        listItem.fieldInfoVoList.forEach(fieldItem => {
                            if (!sqlHintOptions[listItem.tableName]) {
                                sqlHintOptions[listItem.tableName] = [fieldItem.fieldName.replace(/\`/g, '')]
                            } else {
                                sqlHintOptions[listItem.tableName].push(fieldItem.fieldName.replace(/\`/g, ''))
                            }
                        })
                        // 对重复数据去重
                        let _fieldInfoVoList = _.unionWith(listItem.fieldInfoVoList, _.isEqual);
                        _fieldInfoVoList = _fieldInfoVoList.map(item => {
                            let hasApostrophe = item.fieldName.includes('`');
                            // if (hasApostrophe) {
                            //     let _key = item.fieldName.replace(/\`/g, '');
                            //     sqlHintOptions[_key] = [item.fieldName];
                            // } else {
                            //     sqlHintOptions[item.fieldName] = [item.fieldName];
                            // }
                            return {
                                ...item,
                                hasApostrophe: hasApostrophe,
                            }
                        })
                        if (_fieldInfoVoList.length > 0) {
                            _item.push({
                                dbName: listItem.dbName,
                                tableName: listItem.tableName,
                                fieldInfoVoList: [..._fieldInfoVoList],
                            })
                        }
                    })
                    if (_item.length > 0) {
                        _menuList.push({
                            modelName: item.modelName,
                            tableInfoVoList: [..._item],
                        })
                    }
                })
                let resList = this.renderTreeNodesJson(_menuList, 0, '0', false);
                // let resNodeList = this.renderTreeNodesFunc(resList);
                this.setState({
                    // collapseList:resModelInfoList.data.length ? resModelInfoList.data:[],
                    // defCollapseList:resModelInfoList.data.length ? resModelInfoList.data:[],
                    //activeCollapse,
                    collapseList:resModelInfoList.data.length ? _menuList:[],
                    defCollapseList:resModelInfoList.data.length ? _menuList:[],
                    isLoading: false,
                    sqlHintOptions,
                    isLoaded: true,
                    treeNodeList: resModelInfoList.data.length ? resList:[],
                    defTreeNodeList:  resModelInfoList.data.length ? resList:[],
                })
            }catch(err){
                this.setState({
                    isLoading: false
                })
            }
        }
    */
    // Promise 批量请求个数限制
    createRequest = (tasks, pool) => {
        pool = pool || 5;
        let results = [];
        let together = new Array(pool).fill(null);
        let index = 0;
        together = together.map((item, i) => {
            return new Promise((resolve, reject) => {
                const run = function run () {
                    if (index >= tasks.length) {
                        resolve();
                        return;
                    }
                    let old_index = index;
                    // 从任务池拿任务，由于index是升级作用域的变量，所以多个Promise共享一个index
                    //这样可以让一个数组里面的任务一次执行
                    let task = tasks[index++].schemaName;
                    getSqlTableBySchema(task).then((result) => {
                        // 将返回的结果放置在results里面，实现请求数据的集中存储。
                        results[old_index] = result;
                        // 只有在上一个任务执行成功后才会执行一个异步任务
                        run();
                    }).catch((reason) => {
                        reject(reason);
                    })
                }
                run();
            })
        })
        // 多个promise同时处理，根据pool来限制同一时刻并发请求的个数
        return Promise.all(together).then(() => results);
    }
    getList = async () => {
        try {
            this.setState({
                isLoading: true,
                isTreeLoading: true,
                sqlTableLoadingAll: true,
            })
            let resSchema = await getSqlSchema();
            let _resSchema = _.unionWith(resSchema.data, _.isEqual);
            let sqlHintOptions = {};
            _resSchema.forEach(item => {
                if (item.catalog) {
                    // if (!sqlHintOptions[item.catalog]) {
                    //     sqlHintOptions[item.catalog] = [item.schemaName];
                    // } else {
                    //     sqlHintOptions[item.catalog].push(item.schemaName);
                    // }
                    if (!sqlHintOptions[item.catalog]) {
                        let schemaObj = {};
                        schemaObj[item.schemaName] = {};
                        sqlHintOptions[item.catalog] = schemaObj;
                    } else {
                        sqlHintOptions[item.catalog][item.schemaName] = {};
                    }
                }
            })
            let resList = this.renderTreeNodesJson(_resSchema, 0, '0', false);
            console.log('_resSchema = ', _resSchema);
            // let mPromiseRes = this.multiRequest(_resSchema, 5);
            // console.log('mPromiseRes = ', mPromiseRes);
            // mPromiseRes.then(rList => {
            //     console.log('rList = ', rList);
            //     rList.forEach((res, index) => {
            //         let nodeOptions = resList[index];
            //         let _level = nodeOptions.level + 1, _parentKey = nodeOptions.key;
            //         let nextTreeNodeData = this.renderTreeNodesJson(res.data, _level, _parentKey, false);
            //         resList[index].children = nextTreeNodeData;
            //     })
            //     this.setState({
            //         treeNodeList: resSchema.data.length>0 ? resList: [],
            //         defTreeNodeList:  resSchema.data.length>0 ? resList: [],
            //         sqlTableLoadingAll: false,
            //     })
            //     console.log('1111')
            // }).catch(() => {
            //     console.log('值呢 = ', 1111)
            // })
            // let promiseList = [];
            // _resSchema.forEach(item => {
            //     if (item && item.schemaName) {
            //         promiseList.push(getSqlTableBySchema(item.schemaName));
            //     }
            // })
            // let promiseListRes = await Promise.all(promiseList) || [];
            // promiseListRes.forEach((res, index) => {
            //     let nodeOptions = resList[index];
            //     let _level = nodeOptions.level + 1, _parentKey = nodeOptions.key;
            //     let nextTreeNodeData = this.renderTreeNodesJson(res.data, _level, _parentKey, false);
            //     resList[index].children = nextTreeNodeData;

            //     let _tableName = _.unionWith(res.data, _.isEqual);

            //     let tableObj = {};
            //     _tableName.forEach(it => {
            //         tableObj[it.tableName] = {}
            //     })
            //     if (_tableName[0] && _tableName[0].catalog && _tableName[0].schemaName) {
            //         sqlHintOptions[_tableName[0].catalog][_tableName[0].schemaName] = tableObj;
            //     }
            // })
            console.log('塞啊')
            this.setState(state => ({
                ...state,
                isLoading: false,
                isLoaded: true,
                isTreeLoading: false,
                sqlHintOptions,
                defaultExpandedKeysForSqlMenu: [],
                treeNodeList: resSchema.data.length > 0 ? resList : [],
                defTreeNodeList: resSchema.data.length > 0 ? resList : [],
                // sqlTableLoadingAll: false,
            }), async () => {
                // let promiseList = [];
                // _resSchema.forEach(item => {
                //     if (item && item.schemaName) {
                //         promiseList.push(getSqlTableBySchema(item.schemaName));
                //     }
                // })
                // let promiseListRes = await Promise.all(promiseList) || [];
                // Promise.all(promiseList).then(promiseListRes => {
                //     promiseListRes.forEach((res, index) => {
                //         let nodeOptions = resList[index];
                //         let _level = nodeOptions.level + 1, _parentKey = nodeOptions.key;
                //         let nextTreeNodeData = this.renderTreeNodesJson(res.data, _level, _parentKey, false);
                //         resList[index].children = nextTreeNodeData;

                //         let _tableName = res.data; // _.unionWith(res.data, _.isEqual);

                //         let tableObj = {};
                //         _tableName.forEach(it => {
                //             tableObj[it.tableName] = {}
                //         })
                //         if (_tableName[0] && _tableName[0].catalog && _tableName[0].schemaName) {
                //             sqlHintOptions[_tableName[0].catalog][_tableName[0].schemaName] = tableObj;
                //         }
                //     })

                //     this.setState((state) => ({
                //         ...state,
                //         sqlHintOptions,
                //         treeNodeList: resList,
                //         defTreeNodeList: resList,
                //         sqlTableLoadingAll: false,
                //     }))
                // })

                let mPromiseRes = this.createRequest(_resSchema, 5);
                console.log('mPromiseRes = ', mPromiseRes);
                mPromiseRes.then(rList => {
                    rList.forEach((res, index) => {
                        let nodeOptions = resList[index];
                        let _level = nodeOptions.level + 1, _parentKey = nodeOptions.key;
                        let nextTreeNodeData = this.renderTreeNodesJson(res.data, _level, _parentKey, false);
                        resList[index].children = nextTreeNodeData;
                    })
                    this.setState(state => ({
                        ...state,
                        treeNodeList: resSchema.data.length > 0 ? resList : [],
                        defTreeNodeList: resSchema.data.length > 0 ? resList : [],
                        sqlTableLoadingAll: false,
                    }))
                }).catch(() => {
                    this.setState({
                        sqlTableLoadingAll: false,
                    })
                })
            })
        } catch (error) {
            this.setState({
                isLoading: false,
                isTreeLoading: false,
            })
        }
    }
    awaitSqlTableList = async (_resSchema, resList, sqlHintOptions) => {
        let promiseList = [];
        _resSchema.forEach(item => {
            if (item && item.schemaName) {
                promiseList.push(getSqlTableBySchema(item.schemaName));
            }
        })
        let promiseListRes = await Promise.all(promiseList) || [];
        promiseListRes.forEach((res, index) => {
            let nodeOptions = resList[index];
            let _level = nodeOptions.level + 1, _parentKey = nodeOptions.key;
            let nextTreeNodeData = this.renderTreeNodesJson(res.data, _level, _parentKey, false);
            resList[index].children = nextTreeNodeData;

            let _tableName = _.unionWith(res.data, _.isEqual);

            let tableObj = {};
            _tableName.forEach(it => {
                tableObj[it.tableName] = {}
            })
            if (_tableName[0] && _tableName[0].catalog && _tableName[0].schemaName) {
                sqlHintOptions[_tableName[0].catalog][_tableName[0].schemaName] = tableObj;
            }
        })
    }
    //运行
    getSqlList = (loading) => {
        if (!this.sqlContent) {
            message.warning('SQL语句不能为空！')
            return
        }
        let codeMirrorEditor = this.codemirrorEle.current.editor, _sqlContent = '';
        if (codeMirrorEditor) {
            _sqlContent = codeMirrorEditor.getSelection();
            if (_sqlContent === '') {
                let nameReg = /(.+(?=[;]$))/;
                let str = this.sqlContent.trim();
                // if (nameReg.test(str)) {
                if (str.endsWith(';')) {
                    _sqlContent = `${str.split(';')[str.split(';').length - 2]};`;
                } else {
                    _sqlContent = str.split(';').pop();
                }
            }
        }
        if (loading) {
            this.cancelSqlRequest()
            return;
        }
        let tabsList = [...this.state.tabsList]
        tabsList[0] = {
            ...tabsList[0],
            loading: true,
            tableData: [],
            columns: [],
            defcolumns: [],
            filterOptions: [],
            checkedValue: [],
            pageNo: 1,
            pageSize: 20,
        }
        this.setState({
            tabsList
        }, () => {
            // let codeMirrorEditor = this.codemirrorEle.current.editor, _sqlContent = '';
            // if (codeMirrorEditor) {
            //     _sqlContent = codeMirrorEditor.getSelection();
            //     if (_sqlContent === '') {
            //         let nameReg = /(.+(?=[;]$))/;
            //         let str = this.sqlContent.trim();
            //         if (nameReg.test(str)) {
            //             _sqlContent = `${str.split(';')[str.split(';').length - 2]};`;
            //         } else {
            //             _sqlContent = str.split(';').pop();
            //         }
            //     }
            // }
            const commitSql = { sql: _sqlContent, limits: this.state.limit };
            // 每次运行前，记录运行的条件，方便导出csv时，条件变更了
            // this.setState({
            //     recordForRunResultCondition: {
            //         datasourceType: 'ClickHouse',
            //         sql: commitSql.sql,
            //         limits: commitSql.limits,
            //     }
            // })
            this.queryBySql(commitSql);
        })
    }

    //取消运行
    cancelSqlRequest = () => {
        if (this.requestCancel.cancel) {
            this.requestCancel.cancel()
        }
        this.requestCancel = {}
        let tabsList = [...this.state.tabsList]
        tabsList[0] = {
            ...tabsList[0],
            loading: false,
            tableData: [],
            columns: [],
            defcolumns: [],
            filterOptions: [],
            checkedValue: [],
        }
        this.setState({
            tabsList
        })
    }
    dealRecordForPresto = (data) => {
        let obj = {
            columns: [],
            dataList: [],
        };
        let keyList = [];
        data.resultMetaDataList.forEach((item, index) => {
            let flag = {
                keyName: item.field,
                field: item.field
            };

            obj.columns.push({
                title: item.columnName,
                dataIndex: item.field, // item.columnLabel,
                width: 140,
                align: 'left',
                ellipsis: true,
            })

            keyList.push(flag);
        })
        data.resultList.forEach((item, index) => {
            let dataColumns = {
                id: index,
            };
            keyList.forEach(col => {
                if (Object.prototype.toString.call(item[col.field]) === '[object Array]') {
                    dataColumns[col.keyName] = JSON.stringify(item[col.field]);
                } else {
                    dataColumns[col.keyName] = item[col.field];
                }
            })
            obj.dataList.push(dataColumns);
        })
        return obj;
    }
    queryBySql = async (commitSql) => {
        try {
            this.setState({
                // isLoading:true,
                tableResLoading: true,
                sqlRunError: false,
                sqlRunErrorMsg: '',
            })
            const encodeSql = encode(commitSql.sql);
            // const encodeSql = commitSql.sql;

            // const resSqlQuery = await sqlQuery({
            const resSqlQuery = await getSqlRunResult({
                datasourceType: 'ClickHouse',
                sql: encodeSql,
                limits: commitSql.limits,
                page: this.state.tabsList[0].pageNo - 1,
                size: this.state.tabsList[0].pageSize,
            }, this.requestCancel);
            /**
             * 直接用后端返回的json格式
             */
            // let records = this.parseRecord(resSqlQuery.data?.records), columns = [], dataList = [];
            // records.forEach((record, index) => {
            //     index == 0 && record.forEach((item) => {
            //         columns.push({
            //             title: item,
            //             dataIndex: item,
            //             width: 140,
            //             align: 'left',
            //             ellipsis: true,
            //         })
            //     })
            //     index != 0 && index != 1 && record.forEach((itm, idx) => {
            //         dataList[index - 2] = {
            //             ...dataList[index - 2] || {},
            //             [records[0][idx]]: itm,
            //             id: `${index - 2}`
            //         }
            //     })
            // })
            // let _records = this.dealRecord(resSqlQuery.data?.records), columns = [], dataList = [];
            let _records = this.dealRecordForPresto(resSqlQuery.data), columns = [], dataList = [];
            columns = _records.columns;
            dataList = _records.dataList;
            const filterOptions = columns.map(it => ({
                label: it.title,
                value: it.dataIndex
            }))
            const checkedValue = filterOptions.map(it => it.value)
            let tabsList = this.state.tabsList;
            tabsList[0] = {
                ...tabsList[0],
                loading: false,
                tableData: dataList,
                columns,
                defcolumns: columns,
                dataList,
                filterOptions,
                checkedValue,
                pageNo: resSqlQuery.data?.page + 1,
                total: resSqlQuery.data?.totalCount,
            }
            this.setState({
                tabsList,
                // isLoading: false,
                tableResLoading: false,
                activeTabsKey: '1',
            }, () => {
                //已运行的sql保存，点击分页时备用
                localStorage.setItem('sqlContent', encodeURIComponent(JSON.stringify(commitSql)))
            })
        } catch (err) {
            err.toString() === 'Cancel' && message.warning(err.message || '已取消操作！');
            // err.toString() !== 'Cancel' && err.msg && info(err.msg, 0); // 手动关闭
            // err.toString() !== 'Cancel' && err.msg && message.error(err.msg); // 弃用之前的message，因为duration太短
            if (err.toString() !== 'Cancel') {
                this.setState({
                    sqlRunError: true,
                    sqlRunErrorMsg: err.msg
                })
            }
            // 查询失败，需要重置运行按钮状态
            let tabsList = this.state.tabsList;
            tabsList[0] = {
                ...tabsList[0],
                loading: false,
                tableData: [],
                columns: [],
                defcolumns: [],
                dataList: [],
                filterOptions: [],
                checkedValue: [],
                pageSize: 20,
                pageNo: 1,
                total: null,
            }
            this.setState({
                // isLoading: false,
                tableResLoading: false,
                tabsList
            })
        }
    }
    // 之前返回的数据是字符串，所以需要处理下
    // 现在返回了json对象，无需处理
    parseRecord = (hostData) => {
        let dataArray = hostData.split('\n'), tableData = []
        for (let i = 0; i < dataArray.length; i++) {
            if (dataArray[i].length == 0) {
                continue
            }
            const colArray = dataArray[i].split('\t')
            tableData.push(colArray)
        }
        return tableData
    }
    dealRecord = (list) => {
        let obj = {
            columns: [],
            dataList: [],
        };
        list.forEach((item, idx) => {
            let dataColumns = {};
            Object.keys(item).forEach(keyName => {
                if (idx < 1) {
                    obj.columns.push({
                        title: keyName,
                        dataIndex: keyName,
                        width: 140,
                        align: 'left',
                        ellipsis: true,
                    })
                }
                dataColumns[keyName] = item[keyName];
            })
            obj.dataList.push({
                id: idx,
                ...dataColumns,
            });
        })
        return obj;
    }
    //本地过滤
    handleSearch = (keyWords_) => {
        if (this.state.isTreeLoading) {
            return
        }
        // let collapseList = [...this.state.defCollapseList],
        let treeNodeList = [...this.state.defTreeNodeList],
            keyWords = keyWords_ || ''; // this.queryKeywords.current.state.value.trim().toLowerCase();    
        if (!keyWords) {

            this.setState({
                // collapseList,
                treeNodeList,
                defaultExpandedKeysForSqlMenu: [],
            })
            return;
        }
        // let arr = collapseList.reduce((total,collapse) => {
        //     let temp = collapse.tableInfoVoList.reduce((cur,next) => {
        //         let isClude = next.tableName.toLowerCase().includes(keyWords.toLowerCase());
        //         isClude && cur.push(next);
        //         if (!isClude) {
        //             let fieldInfoVoList = next.fieldInfoVoList.filter(item => {
        //                 return item.fieldName.includes(keyWords.toLowerCase())
        //             })
        //             fieldInfoVoList.length && cur.push({
        //                 ...next,
        //                 fieldInfoVoList
        //             })
        //         }
        //         return cur
        //     },[])
        //     temp.length && total.push({
        //         ...collapse,
        //         tableInfoVoList: [...temp]
        //     })
        //     return total 
        // },[])

        // 优先匹配fieldName,再去匹配tableName,
        // let arr = collapseList.reduce((total, collapse) => {
        //     let _tableInfoVoList = collapse.tableInfoVoList.reduce((acc, cur) => {
        //         let isClude = cur.tableName.toLowerCase().includes(keyWords);
        //         if (isClude) {
        //             let _fieldInfoVoList = _.filter(cur.fieldInfoVoList, it => it.fieldName.includes(keyWords)) || [];
        //             acc.push({
        //                 ...cur,
        //                 fieldInfoVoList: [..._fieldInfoVoList],
        //             })
        //         } else {
        //             let _fieldInfoVoList = _.filter(cur.fieldInfoVoList, it => it.fieldName.includes(keyWords)) || [];
        //             _fieldInfoVoList.length > 0 && acc.push({
        //                 ...cur,
        //                 fieldInfoVoList: [..._fieldInfoVoList],
        //             })
        //         }
        //         return acc;
        //     }, []) || [];
        //     _tableInfoVoList.length > 0 && total.push({
        //         ...collapse,
        //         tableInfoVoList: [..._tableInfoVoList]
        //     })
        //     return total;
        // }, [])

        // 只针对tableName 进行搜索，字段太多了，本地不合适
        let resList = treeNodeList.reduce((total, treeNode) => {
            if (treeNode.level === 0) {
                let tableNodeList = treeNode.children.reduce((acc, cur) => {
                    let isClude = cur.tableName.toLowerCase().includes(keyWords);
                    if (isClude) {
                        acc.push({
                            ...cur,
                        })
                    }
                    return acc;
                }, [])
                tableNodeList.length > 0 && total.push({
                    ...treeNode,
                    children: [...tableNodeList],
                })
            }
            return total;
        }, []);
        let firstKey = resList.length > 0 ? [`${resList[0].key}`] : [];
        this.setState({
            // collapseList:arr,
            // activeCollapse:arr[0]?.modelName || '',
            // activeCollapseChildren:arr[0]?.tableInfoVoList[0]?.tableName,
            treeNodeList: resList,
            defaultExpandedKeysForSqlMenu: firstKey, // ['0-0'],
        }, () => {

        })
    }

    //保存、保存模板
    handleSave = (btnType) => {
        btnType === 'template' && this.getSubjectModel();
        if (this.state.currentDetailType != '') {
            if (this.state.currentDetailType !== btnType) { delete this.state.basicInfo?.id }
            if (this.state.currentDetailType === btnType) {
                const basicInfo = {
                    ...this.state.basicInfo,
                    id: this.state.currentDetailId
                }
                this.setState({ basicInfo })
            }
        }
        this.setState({
            visibleBasicInfo: true,
            modalType: btnType
        })
    }

    //基本信息弹框的的“保存”、“取消”、“另存为”
    handleBasicInfo = async (btnType) => {
        if (btnType == 'add' || btnType == 'update') {
            try {
                const values = await this.formRefBasicInfo.current.validateFields();
                let params = {
                    ...values,
                    sqlContent: encode(this.sqlContent),
                    limits: this.state.limit,
                    type: this.state.modalType === 'template' ? 1 : 0
                }
                let tabsList = [...this.state.tabsList]
                if (this.state.modalType === 'template') tabsList[3] = { ...tabsList[3], loading: true }
                if (this.state.modalType === 'search') tabsList[1] = { ...tabsList[1], loading: true }
                if (btnType == 'add') this.setState({ saveAsLoading: true })
                if (btnType == 'update') this.setState({ saveLoading: true })
                this.setState({
                    isLoading: true,
                    tabsList
                }, () => {
                    let requestApi = btnType == 'add' ? saveTemplate : editTemplate;
                    if (btnType == 'update') {
                        params.id = this.state.basicInfo.id;
                        requestApi = this.state.modalType === 'template' ? editTemplate : editPersonalQueries;
                    };
                    if (btnType == 'add') {
                        delete params.id
                        requestApi = this.state.modalType === 'template' ? saveTemplate : savePersonalQueries;
                    };
                    requestApi(params).then(res => {
                        if (res.code === '00000') {
                            if (this.state.modalType === 'template') tabsList[3] = { ...tabsList[3], loading: false }
                            if (this.state.modalType === 'search') tabsList[1] = { ...tabsList[1], loading: false }
                            // 初次保存查询、保存模板、页面刷新成当前保存状态的详情
                            // 更新也要保存，最新的状态详情
                            if (btnType === 'add' && this.state.modalType === 'template') {
                                let record = Object.assign(res.data, {
                                    name: '',
                                    id: '',
                                    subjectName: '',
                                    subjectId: ''
                                })
                                this.handleDetails('template', res.data.id, record);
                            } else if (btnType === 'add' && this.state.modalType === 'search') {
                                this.handleDetails('search', res.data, {});
                            } else if (btnType === 'update' && this.state.modalType === 'template') {
                                let record = Object.assign(params, {
                                    name: '',
                                    id: '',
                                    subjectName: '',
                                    subjectId: ''
                                })
                                this.handleDetails('template', params.id, record);
                            } else if (btnType === 'update' && this.state.modalType === 'search') {
                                this.handleDetails('search', params.id, {});
                            }
                            this.setState((state) => ({
                                ...state,
                                visibleBasicInfo: false,
                                isLoading: false,
                                activeTabsKey: this.state.modalType === 'template' ? '4' : '2',
                                saveLoading: false,
                                saveAsLoading: false,
                                tabsList
                            }), () => {
                                this.getTabsList()
                            })
                        }
                    }).catch(err => {
                        err.msg && message.error(err.msg);
                        if (this.state.modalType === 'template') tabsList[3] = { ...tabsList[3], loading: true }
                        if (this.state.modalType === 'search') tabsList[1] = { ...tabsList[1], loading: true }
                        this.setState({
                            visibleBasicInfo: false,
                            isLoading: false,
                            tabsList,
                            saveLoading: false,
                            saveAsLoading: false
                        })
                    })
                })
            } catch (errorInfo) {
                console.log('Failed:', errorInfo);
            }
            return
        }
        this.setState({
            visibleBasicInfo: false
        })
    }

    getSubjectModel = async () => {
        try {
            const resSubjectModel = await querySubjectModelByLevel({ level: 1 });
            this.setState({
                subjectModel: resSubjectModel.data || [],
            });
        } catch (err) { }
    }

    //查询tabs的table列表
    getTabsList = () => {
        if (this.state.activeTabsKey == '1') {
            const data = JSON.parse(decodeURIComponent(localStorage.getItem("sqlContent")));
            const commitSql = data ? data : { sql: this.sqlContent, limits: this.state.limit };
            commitSql.sql.replace(/\s+/g, "").length != 0 && this.queryBySql(commitSql);
            return;
        }
        let index = Number(this.state.activeTabsKey) - 1,
            tabsList = [...this.state.tabsList],
            name = this.refs[`search${this.state.activeTabsKey}`]?.state.value || '';
        tabsList[index] = {
            ...tabsList[index],
            tableData: [],
            total: null
        };
        this.setState({
            tabsList,
            // isLoading:true
            tableResLoading: true,
        }, async () => {
            try {
                const params = tabsList[index].formRef.current.getFieldsValue(true);
                let commitParams = Object.assign({
                    size: tabsList[index].pageSize,
                    page: tabsList[index].pageNo - 1,
                }, params);
                let resList = {}, tempCommitParams = { ...commitParams };
                switch (index) {
                    case 1:
                        delete tempCommitParams['subjectId'];
                        resList = await personalQueriesPage(tempCommitParams);
                        break;
                    case 2:
                        delete tempCommitParams['subjectId'];
                        tempCommitParams = { ...tempCommitParams, sql: tempCommitParams.name };
                        delete tempCommitParams['name'];
                        resList = await querySqlLog(tempCommitParams);
                        break;
                    case 3:
                        //resList = await templatePage({name:name.trim(),size:tabsList[index].pageSize,page});
                        let promiseArr = [];
                        if (tempCommitParams['subjectId'] == 'all') delete tempCommitParams['subjectId'];//去除‘全部’的id
                        if (!this.state.sqlSubjectModel.length) {
                            promiseArr = [templatePage(tempCommitParams), querySqlSubjectModelList()] //业务域 0524(查看字段功能) add by zhangting
                        } else {
                            promiseArr = [templatePage(tempCommitParams)];
                        }
                        let promiseAllList = await Promise.all(promiseArr);
                        if (promiseArr.length > 1) {
                            let sqlSubjectModel = promiseAllList[1].data || [];
                            sqlSubjectModel.unshift({ id: 'all', name: '全部' });
                            this.setState({ sqlSubjectModel });
                        }
                        resList = promiseAllList[0];
                        break;
                }
                tabsList[index] = {
                    ...tabsList[index],
                    tableData: resList.data?.items.map(item => {
                        return {
                            ...item,
                            lastModifyDate: moment(item?.lastModifyAt).format('YYYY-MM-DD HH:mm:ss') || '',
                            createAt: moment(item?.createAt).format('YYYY-MM-DD HH:mm:ss') || '',
                            templatePageType: item?.type ? (item.type == 1 ? '个人模板' : '系统模板') : '',
                        }
                    }),
                    total: resList.data?.total,
                    // loading:false
                    tableResLoading: false,
                };
                this.setState({
                    tabsList,
                    // isLoading:false
                    tableResLoading: false,
                })
            } catch (err) {
                this.setState({
                    // isLoading:false
                    tableResLoading: false,
                })
            }
        })
    }

    //单条数据打开
    handleSwitchSql = (btnType, record) => {
        if (this.sqlContent.replace(/\s+/g, "").length != 0) {
            const that = this;
            Modal.confirm({
                centered: true,
                width: 354,
                title: '切换查询提示',
                content: '打开保存过的查询会丢失当前页面的SQL信息，是否确定',
                okText: "确定",
                cancelText: "取消",
                onOk () {
                    that.handleDetails(btnType, record.id, record)
                }
            })
            return;
        }
        this.handleDetails(btnType, record.id, record)
    }

    //详情
    handleDetails = (btnType, id, record) => {
        if (btnType === 'template' && Object.prototype.hasOwnProperty.call(record, 'id')) {
            // 埋点start
            const currentUserInfo = localStorage.getItem('USER_INFO');
            let _operatorId = '', _operatorName = '';
            if (currentUserInfo) {
                let info = JSON.parse(currentUserInfo);
                _operatorId = info?.employeeNumber;
                _operatorName = `${info?.chineseName}（${info?.firstName} ${info?.lastName}）`;
            }
            console.log('props = ', this.props);
            const obj = {
                // templateName: record.name,
                templateId: record.id,
                // businessDomain: record.subjectName,
                // businessDomainId: record.subjectId,
                // operatorId: _operatorId,
                // operatorName: _operatorName,
            }
            // console.log('obj = ', obj);
            viewSqlTemplateForSqlSearch(obj).then(res => {
                // console.log('埋点成功')
            }).catch(() => {
                // console.log('埋点失败')
            })
            // 埋点over
        }
        let requestApi = btnType == 'template' ? getDetailTemplate : getDetailPersonalQueries;
        requestApi(id).then(res => {
            this.setState({
                sqlContent: res.data?.sqlContent,
                limit: res.data?.limits,
                basicInfo: {
                    name: res.data?.name,
                    subjectId: res.data?.subjectId,
                    description: res.data?.description,
                    id: res.data?.id
                },
                currentDetailType: btnType,
                currentDetailId: res.data?.id
            })
            this.codemirrorEle.current.editor.setValue(res.data?.sqlContent)
        })
    }

    //单条数据删除
    confirmDelete = (btnType, id) => {
        let requestApi = btnType == 'template' ? deleteTemplate : deletePersonalQueries;
        requestApi(id).then(res => {
            res.msg == 'success' && message.success('删除成功');
            this.getTabsList();
            //若被删除的id === 当前打开数据的id
            id === this.state.currentDetailId && this.setState({
                currentDetailId: null
            })
        })
    }

    //切换面板的回调
    handleTabsChange = (activeKey) => {
        if (activeKey == '4' && this.state.subjectModel.length == 0) this.getSubjectModel();
        if (activeKey == '1') { // 切换到查询结果，不默认运行sql语句--2022.03.08
            return this.setState({
                activeTabsKey: activeKey,
            })
        };
        this.setState({
            activeTabsKey: activeKey,
        }, () => {
            this.getTabsList()
        })
    }

    handleTabsSearch = (tabsKey) => {
        let index = Number(tabsKey) - 1,
            tabsList = [...this.state.tabsList];
        tabsList[index] = {
            ...tabsList[index],
            pageNo: 1
        }
        this.setState({
            tabsList
        }, () => {
            this.getTabsList()
        })
    }

    handleSqlModal = (record) => {
        this.setState({
            visibleSql: true,
            sqlInfo: record.querySql
        }, () => {
            let formData = this.copySqlForm.current.getFieldsValue();
            formData.sql = record.querySql;
            this.copySqlForm.current.setFieldsValue(formData);
        })
    }
    // 左右拽-改变宽度
    darggableWidth = (e) => {
        let resize = document.getElementById("resizeBox_for_sql");
        let left = document.getElementById("leftBox_for_sql");
        let right = document.getElementById("rightBox_for_sql");
        let box = document.getElementById("bigBox_for_sql");
        let shrinkBtn = document.getElementById("sql_fields_shrink_icon_btn");
        let startX = e.clientX;
        resize.left = resize.offsetLeft;
        document.onmousemove = function (e) {
            let endX = e.clientX;
            let moveLen = resize.left + (endX - startX);
            let maxT = box.clientWidth - resize.offsetWidth;
            if (moveLen < 150) moveLen = 150;
            if (moveLen > maxT - 150) moveLen = maxT - 150;
            resize.style.left = moveLen;
            left.style.width = moveLen + "px";
            right.style.width = (box.clientWidth - moveLen - 5) + "px";
            shrinkBtn.style.left = (moveLen - 1) + "px";
        }
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resize.releaseCapture && resize.releaseCapture();
        }
        resize.setCapture && resize.setCapture();
        return false;
    }
    // 上下拽-改变SQL box的高度
    darggableHeight = (e) => {
        let resize = document.getElementById('midResizeBox_for_sql');
        let top = document.getElementById('topSqlBox_for_sql');
        let startY = e.clientY;
        resize.top = resize.offsetTop;
        document.onmousemove = function (e) {
            let endY = e.clientY;
            let moveLen = resize.top + (endY - startY);
            if (moveLen < 293) moveLen = 293;
            resize.style.top = moveLen;
            top.style.height = moveLen + 'px';
            document.getElementsByClassName('mySpecialCodeMirrorDom')[0].getElementsByClassName('CodeMirror')[0].style.height = (moveLen - 103) + 'px';
        }
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resize.releaseCapture && resize.releaseCapture();
        }
        resize.setCapture && resize.setCapture();
        return false;
    }
    // 高阶分析支持拖动字段名到SQL box
    setSourceMenuData = (fromParent, dataTransfer, dragEl) => {
        // dataTransfer.setData('fieldName', dragEl.getAttribute('data-id'))
        let fullName = dragEl.getAttribute('data-id');
        dataTransfer.setData('text/plain', fullName);
    }
    setSourceMenuStart = (fromParent, evt) => {
        // let item = fromParent?.fieldInfoVoList[evt.oldIndex];
        let item = { ...fromParent }; // JSON.parse(JSON.stringify(fromParent));
        this.setState((state) => ({
            ...state,
            dragFromSourceMenu: item,
        }), () => {
        })
    }
    setSourceMenuClone = (fromParent, dataTransfer, dragEl) => {
        console.log('clone')
    }
    setSourceMenuEnd = (fromParent, evt) => {
        this.setState((state) => ({
            ...state,
            dragFromSourceMenu: null,
        }), () => {
        })
    }
    // SQL清空后-初始化
    initializeSql = () => {
        this.setState(state => ({
            ...state,
            sqlContent: '',
            basicInfo: {},
            currentDetailType: '',
            currentDetailId: '',
        }))
        this.sqlContent = '';
        this.codemirrorEle.current.editor.setValue('');
        this.codemirrorEle.current.editor.clearHistory();
    }
    // 格式化SQL
    formatSqlContent = () => {
        const _sqlContent = format(this.sqlContent, { language: 'sql' });
        this.codemirrorEle.current.editor.setValue(_sqlContent);
        // this.setState({
        //     sqlContent: _sqlContent,
        // })
    }
    // 查询结果导出CSV
    sqlSearchResultDownLoadCsv = () => {
        // const commitSql = Object.assign({}, this.state.recordForRunResultCondition); // 根据运行结果的条件记录导出
        let codeMirrorEditor = this.codemirrorEle.current.editor, _sqlContent = '';
        if (codeMirrorEditor) {
            _sqlContent = codeMirrorEditor.getSelection();
            if (_sqlContent === '') {
                let nameReg = /(.+(?=[;]$))/;
                let str = this.sqlContent.trim();
                // if (nameReg.test(str)) {
                if (str.endsWith(';')) {
                    _sqlContent = `${str.split(';')[str.split(';').length - 2]};`;
                } else {
                    _sqlContent = str.split(';').pop();
                }
            }
        }

        const encodeSql = encode(_sqlContent);

        const commitSql = { // 实时根据sql语句导出
            datasourceType: 'ClickHouse',
            sql: encodeSql,
            limits: this.state.limit,
            fileName: this.state.basicInfo.name || '',
        }
        // this.downLoadCsv(commitSql)
        return commitSql;
    }
    // 导出接口
    downLoadCsv = (commitSql) => {
        this.setState((state) => ({
            ...state,
            emailModalData: {
                ...state.emailModalData,
                visibleEmailInfo: true,
            }
        }))
    }
    // 自定义提示多层级语句、xxx.xxx.xxx
    handleShowHint = (editor, options) => {
        const cur = editor.getCursor();
        const curLine = editor.getLine(cur.line);
        const len = cur.ch;
        let token = editor.getTokenAt(cur);
        let start = token.start, end = cur.ch;
        const cursorLastCharacter = `${curLine.charAt(len - 1)}`;
        let list = _.filter(Object.keys(options.tables), it => it.includes(cursorLastCharacter));
        return {
            list: list,
            from: editor.posFromIndex(start),
            to: editor.posFromIndex(end),
        }
    }
    onCloseSqlRunError = () => {
        this.setState({
            sqlRunError: false,
            sqlRunErrorMsg: '',
        })
    }
    // 这里需要个自定义的树组件的json结构
    renderTreeNodesJson = (data, level, parentKey, isNeedEthanol) => {
        let list = [];
        data.forEach((item, index) => {
            let obj = {
                catalog: '',
                schemaName: '',
                tableName: '',
                tableDisplayName: '',
                title: '',
                icon: null,
                key: `${parentKey}-${index}`,
                parentKey: `${parentKey}`,
                children: [],
                isDraggable: false,
                // checked: false,
                isLeaf: false,
                level: level,
                curIndex: index,
            }
            if (level === 0) {
                obj.schemaName = item.schemaName;
                obj.catalog = item.catalog;
                // obj.title = item.schemaDisplayName;
                obj.icon = (<SvgIcon icon='database' className='database'></SvgIcon>);
                obj.title = (<ReactSortable
                    className="tableNameDraggableTitle"
                    list={[item.schemaDisplayName]}
                    setList={() => { }}
                    animation={150}
                    group={{ name: 'support-sql-box', pull: 'clone', put: false }}
                    clone={item => ({ ...item })}
                    sort={false}
                    chosenClass="sortable-drag">
                    <Tooltip title={item.schemaDisplayName}>{item.schemaDisplayName}</Tooltip>
                </ReactSortable>)
                obj.isLeaf = false;
                if (isNeedEthanol) {
                    // let _level = level + 1;
                    // obj.children = this.renderTreeNodesJson(item.tableInfoVoList, _level, `${parentKey}-${index}`, isNeedEthanol);
                }
            } else if (level === 1) {
                obj.tableDisplayName = item.tableDisplayName;
                obj.tableName = item.tableName;
                obj.isDraggable = true;
                obj.icon = (<SvgIcon icon='dbtable' className='dbtable'></SvgIcon>);
                obj.title = (<div className="oap-tableNameDraggableTitle-box">
                    <ReactSortable
                        className="tableNameDraggableTitle"
                        list={[item.tableName]}
                        setList={() => { }}
                        animation={150}
                        group={{ name: 'support-sql-box', pull: 'clone', put: false }}
                        clone={item => ({ ...item })}
                        sort={false}
                        chosenClass="sortable-drag"
                        // onStart={(evt) => this.setSourceMenuStart(item, evt)}
                        // onEnd={(evt) => this.setSourceMenuEnd(item, evt)}
                        setData={(dataTransfer, dragEl) => this.setSourceMenuData(item, dataTransfer, dragEl)}
                    >
                        <Tooltip title={item.tableDisplayName}>
                            <span data-id={item.tableDisplayName}>{item.tableName}</span>
                        </Tooltip>
                    </ReactSortable>
                    <Tooltip title="查看字段">
                        <IconInfoCircle onClick={() => this.handleView(item)} />
                    </Tooltip>
                </div>
                )
                obj.isLeaf = false;
                if (isNeedEthanol) {
                    // let _level = level + 1;
                    // obj.children = this.renderTreeNodesJson(item.fieldInfoVoList, _level, `${parentKey}-${index}`, isNeedEthanol);
                }
            } else if (level === 2) {
                obj.isDraggable = true;
                obj.isLeaf = true;
                let icon_type = (<SvgIcon icon='dtfield_default' className='dtfield_default'></SvgIcon>);
                let fieldType = item.type.toLowerCase();
                if (fieldType.includes('array')) {
                    icon_type = (<SvgIcon icon='dtfield_array' className='dtfield_array'></SvgIcon>);
                } else if (fieldType.includes('int')) {
                    icon_type = (<SvgIcon icon='dtfield_int' className='dtfield_int'></SvgIcon>);
                } else if (fieldType.includes('varchar')) {
                    icon_type = (<SvgIcon icon='dtfield_string' className='dtfield_string'></SvgIcon>);
                } else if (fieldType.includes('date')) {
                    icon_type = (<SvgIcon icon='dtfield_date' className='dtfield_date'></SvgIcon>);
                } else if (fieldType.includes('decimal')) {
                    icon_type = (<SvgIcon icon='dtfield_decimal' className='dtfield_decimal'></SvgIcon>);
                }
                obj.icon = icon_type;
                obj.title = (
                    <ReactSortable
                        className="fieldNameDraggableTitle"
                        list={[item.column]}
                        setList={() => { }}
                        animation={150}
                        group={{ name: 'support-sql-box', pull: 'clone', put: false }}
                        clone={item => ({ ...item })}
                        sort={false}
                        chosenClass="sortable-drag"
                    >
                        <Tooltip title={item.comment}>{item.column}</Tooltip>
                    </ReactSortable>
                )
                delete obj.children;
            }
            list.push(obj);
        })
        return list;
    }
    renderTreeNodesFunc = (data) => {
        let list = [];
        if (data && data.length > 0) {
            data.forEach(item => {
                let treeNodeEle = null;
                if (item.isDraggable) {
                    item.title = (
                        <ReactSortable
                            list={[item.title]}
                            setList={() => { }}
                            animation={150}
                            group={{ name: 'support-sql-box', pull: 'clone', put: false }}
                            clone={item => ({ ...item })}
                            sort={false}
                            chosenClass="sortable-drag">
                            <Tooltip title={item.title}>{item.title}</Tooltip>
                        </ReactSortable>
                    )
                }
                if (item.children && item.children.length > 0) {
                    treeNodeEle = (<TreeNode title={item.title} key={item.key} dataRef={item}>
                        {this.renderTreeNodesFunc(item.children)}
                    </TreeNode>)
                } else {
                    treeNodeEle = (<TreeNode {...item} />);
                }
                treeNodeEle && list.push(treeNodeEle);
            })
        }
        return list
    }
    dealUpdateTreeData = (list, options) => {
        if (options.isLeaf) {
            return []
        } else {
            let arr = [...list], // JSON.parse(JSON.stringify(list)),
                _level = options.level + 1,
                _parentKey = `${options.key}`;
            let roadeList = options.key.split('-');
            // 目前只支持3层嵌套
            for (let i = 0; i < roadeList.length; i++) {
                if (i === 0) {
                    arr = arr[roadeList[i + 1]];
                } else if (i === 1) {
                    arr = arr.tableInfoVoList;
                } else if (i === 2) {
                    arr = arr[roadeList[i]].fieldInfoVoList;
                }
            }
            return this.renderTreeNodesJson(arr, _level, _parentKey, false);;
        }
    }
    // 更新数据
    updateTreeData = (list, key, children) => {
        return list.map((node) => {
            if (node.key === key) {
                return { ...node, children }
            }
            if (!node.isLeaf) {
                return { ...node, children: this.updateTreeData(node.children, key, children) }
            }
            return node;
        })
    }
    // 点击展开时，触发 children:{event, node}
    /**
     * 
     * @param {*} nodeOptions 
     * @returns 
     
    onLoadTreeNode = (nodeOptions) => {
        return new Promise(resolve => {
            if (nodeOptions.isLeaf) {
                resolve();
                return;
            }
            setTimeout(() => {
                let nextTreeNodeData = this.dealUpdateTreeData(this.state.defCollapseList, nodeOptions);
                let treeNodeList = this.updateTreeData(this.state.treeNodeList, nodeOptions.key, nextTreeNodeData);
                this.setState(state => ({
                    ...state,
                    treeNodeList: treeNodeList,
                }))
                resolve();
            }, 0);
        })
    }
    */
    onLoadTreeNode = (nodeOptions) => {
        if (nodeOptions.isLeaf) {
            return;
        }
        // if (nodeOptions.level === 0) {
        //     return getSqlTableBySchema(nodeOptions.schemaName).then(res => {
        //         let _level = nodeOptions.level + 1, _parentKey = nodeOptions.key;
        //         let nextTreeNodeData = this.renderTreeNodesJson(res.data, _level, _parentKey, false);
        //         let treeNodeList = this.updateTreeData(this.state.treeNodeList, nodeOptions.key, nextTreeNodeData);
        //         this.setState(state => ({
        //             ...state,
        //             treeNodeList: treeNodeList,
        //         }))
        //     }).catch(() => {

        //     })
        // } else if (nodeOptions.level === 1) {
        if (nodeOptions.level === 1) {
            return getSqlFieldByTable(nodeOptions.tableDisplayName).then(res => {
                let _level = nodeOptions.level + 1, _parentKey = nodeOptions.key;
                let nextTreeNodeData = this.renderTreeNodesJson(res.data, _level, _parentKey, false);
                let treeNodeList = this.updateTreeData(this.state.treeNodeList, nodeOptions.key, nextTreeNodeData);
                this.setState(state => ({
                    ...state,
                    treeNodeList: treeNodeList,
                }))
            }).catch(() => {

            })
        } else if (nodeOptions.level === 0) {
            /**
             * 第二层已经提前loading好数据了，这里模拟一下搜索效果
             */
            return new Promise((resolve) => {
                setTimeout(() => {
                    let treeNodeList = [...this.state.treeNodeList];
                    this.setState({
                        treeNodeList: treeNodeList,
                    })
                    resolve();
                }, 10)
            })
            /**
             * 正常请求
             */
            // return getSqlTableBySchema(nodeOptions.schemaName).then(res => {
            //     let _level = nodeOptions.level + 1, _parentKey = nodeOptions.key;
            //     let nextTreeNodeData = this.renderTreeNodesJson(res.data, _level, _parentKey, false);
            //     let treeNodeList = this.updateTreeData(this.state.treeNodeList, nodeOptions.key, nextTreeNodeData);
            //     this.setState(state => ({
            //         ...state,
            //         treeNodeList: treeNodeList,
            //     }))
            // })
        }
    }
    getIdentifierQuote = (editor) => {
        var mode = editor.doc.modeOption;
        if (mode === "sql") mode = "text/x-sql";
        return CodeMirror.resolveMode(mode).identifierQuote || "`";
    }
    fetchStartPoint = (token) => {//根据token获取截取开始的位置
        let index = token.string.lastIndexOf("\.");
        if (index < 0) {
            return token.start;
        } else {
            return token.start + index + 1;
        }
    }
    cleanName = (name, identifierQuote) => {
        // 获取名称并且去除“.”
        if (name.charAt(0) == ".") {
            name = name.substr(1);
        }
        // 使用单引号替换双引号
        // 并且去除单个引号
        var nameParts = name.split(identifierQuote + identifierQuote);
        for (var i = 0; i < nameParts.length; i++)
            nameParts[i] = nameParts[i].replace(new RegExp(identifierQuote, "g"), "");
        return nameParts.join(identifierQuote);
    }
    //展开方法
    onExpandSql = defaultExpandedKeysForSqlMenu => {
        this.setState({
            defaultExpandedKeysForSqlMenu,
            autoExpandParent: false,
        });
    };

    //查看字段
    handleView = (record) => {
        this.setState({
            fieldInfoVisible: true,
            fieldInfo: {
                schemaName: record.schemaName,
                tableName: record.tableName
            }
        }, () => {
            this.handleSearchField('');
        })
    }

    //查看字段的搜索
    handleSearchField = (keyWords_) => {
        this.setState({ fieldInfoLoading: true, fieldInfoDataList: [] });
        const name = keyWords_ || ''; // this.queryFieldKeywords.current.state.value;
        const { fieldInfo } = this.state;
        queryFieldInfoByTable({
            dbname: fieldInfo.schemaName,
            tableName: fieldInfo.tableName,
            name
        }).then(resList => {
            let fieldInfoDataList = resList.data || [];
            fieldInfoDataList.forEach((item, index) => {
                item.tableIndex = index + 1;
            })
            this.setState({
                fieldInfoDataList,
                fieldInfoLoading: false,
                tableHeight: getTableHeight('oap-sheet-detailInfo', 140)
            })
        }).catch(errInfo => {
            errInfo.msg && message.error(errInfo.msg);
            this.setState({
                fieldInfoLoading: false
            })
        })
    }

    handleExploreForDownloadData = (data) => {
        if (data.operation === 'ok') {
            if (this.state.emailModalData.isStaff) {
                console.log('雇员取当前用户的邮箱，非雇员才取输入的邮箱')
            }
            this.setState((state) => ({
                ...state,
                isLoading: true,
                emailModalData: {
                    ...state.emailModalData,
                    isLoading: true,
                }
            }), () => {
                const downObj = this.sqlSearchResultDownLoadCsv();
                downObj.email = data.emailStr ?? '';
                downLoadCsvForSqlPrestoSearchResult(downObj).then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data.fileBlob], { type: 'application/octet-stream' }))
                    const link = document.createElement('a');
                    link.style.display = 'none';
                    link.href = url;
                    let downName = res.data.fileName.replace(/"|'/g, '');
                    link.setAttribute('download', downName);
                    document.body.appendChild(link)
                    link.click();
                    document.body.removeChild(link);
                    this.setState((state) => ({
                        ...state,
                        isLoading: false,
                        emailModalData: {
                            ...state.emailModalData,
                            visibleEmailInfo: false,
                            isLoading: false,
                        }
                    }))
                }).catch(err => {
                    message.error('下载失败');
                    this.setState({
                        isLoading: false
                    })
                })
            })
        } else if (data.operation === 'cancel') {
            this.setState((state) => ({
                ...state,
                emailModalData: {
                    ...state.emailModalData,
                    visibleEmailInfo: false,
                    isLoading: false,
                }
            }))
        }
    }
    handleRefreshRedisDataForHive = () => {
        this.setState({
            isTreeLoading: true,
            treeNodeList: [],
        }, () => {
            refreshRedisDataForHive().then(res => {
                if (res) {
                    message.success('刷新成功！');
                    this.getList();
                }
            }).catch(() => {
                message.warning('刷新失败！');
                this.setState({
                    isTreeLoading: false,
                })
            })
        })
    }
    /**
     * 根据用户输入的代名词，匹配实际的库表名称
     * 
     */
    eachWord (lineText, f) {
        let words = lineText.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            if (words[i]) {
                f(words[i].replace(/[,;]/g, ''));
            }
        }
    }
    getTableByAllTableName (allTableName) {//根据全表名从tables中获取表Obj。如果找不到该表，则返回null。全表名用“.”分割。
        let nameParts = allTableName.split(".");
        // let theTable = tables;
        let theTable = this.state.sqlHintOptions;
        // if (nameParts.length === 2) {
        //   await getSqlTableBySchema(nameParts[1]).then(res => {
        //   }).catch(() => {

        //   })
        // }
        for (var i = 0; i < nameParts.length; i++) {
            // if (theTable.hasOwnProperty(nameParts[i])){
            if (Object.prototype.hasOwnProperty.call(theTable, nameParts[i])) {
                theTable = theTable[nameParts[i]];
            } else {
                theTable = null;
                break;
            }
        }
        return theTable;
    }
    findTableByAlias (alias, editor) {//尝试通过昵称查询表名
        let that = this;
        let Pos = CodeMirror.Pos,
            cmpPos = CodeMirror.cmpPos;
        let doc = editor.doc;
        let fullQuery = doc.getValue();
        let aliasUpperCase = alias.toUpperCase();
        let previousWord = '';
        let table = '';
        let separator = [];
        let validRange = {
            start: Pos(0, 0),
            end: Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).length)
        };

        //add separator
        let indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV);
        while (indexOfSeparator != -1) {
            separator.push(doc.posFromIndex(indexOfSeparator));
            indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV, indexOfSeparator + 1);
        }
        separator.unshift(Pos(0, 0));
        separator.push(Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).text.length));

        //find valid range
        let prevItem = null;
        let current = editor.getCursor();
        for (let i = 0; i < separator.length; i++) {
            if ((prevItem == null || cmpPos(current, prevItem) > 0) && cmpPos(current, separator[i]) <= 0) {
                validRange = { start: prevItem, end: separator[i] };
                break;
            }
            prevItem = separator[i];
        }

        if (validRange.start) {
            let query = doc.getRange(validRange.start, validRange.end, false);

            for (let i = 0; i < query.length; i++) {
                let lineText = query[i];
                this.eachWord(lineText, function (word) {
                    let wordUpperCase = word.toUpperCase();
                    if (wordUpperCase === aliasUpperCase && that.getTableByAllTableName(previousWord)) {
                        table = previousWord;
                    }
                    if (wordUpperCase !== CONS.ALIAS_KEYWORD) {
                        previousWord = word;
                    }
                });
                if (table) break;
            }
        }
        return table;
    }

    //创建调度
    onCreateSchedule = (record) => {
        sessionStorage.setItem('oapScheduleCreate', encodeURIComponent(JSON.stringify({
            sliceName: record?.name || 'SQL分析',
            taskType: 1,
            sqlStr: encode(record.sqlContent),
            limits: record?.limits
        })))
        const params = {
            tabNameZh: "分析调度",
            tabNameEn: "分析调度",
            path: "/oap/schedule",
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }
    /**
     * 收起来
     */
    shrinkSqlMeta = () => {
        let resize = document.getElementById("resizeBox_for_sql");
        let left = document.getElementById("leftBox_for_sql");
        let right = document.getElementById("rightBox_for_sql");
        let box = document.getElementById("bigBox_for_sql");
        let shrinkBtn = document.getElementById("sql_fields_shrink_icon_btn");
        resize.left = resize.offsetLeft;
        if (this.state.shrinkSwitch) {
            left.style.width = "0px";
            left.style.visibility = 'hidden';
            shrinkBtn.style.left = "0px";
            left.style.transition = '.5s all ease-in';
            shrinkBtn.style.transition = '.5s all ease-in';
            right.style.width = (box.clientWidth - 16) + "px";
            resize.setCapture && resize.setCapture();
            this.setState({
                shrinkSwitch: false,
            })
        } else {
            const default_sql_width = 240;
            left.style.width = default_sql_width + "px";
            left.style.visibility = 'visible';
            shrinkBtn.style.left = (default_sql_width - 1) + "px";
            left.style.transition = '.5s all ease-in';
            shrinkBtn.style.transition = '.5s all ease-in';
            right.style.width = (box.clientWidth - default_sql_width - 5) + "px";
            resize.setCapture && resize.setCapture();
            this.setState({
                shrinkSwitch: true,
            })
        }

        return false;
    }
    /**
     * sql模块化---2022.11.15
     */
    addSqlBody = (id, str = '') => {
        // const newActiveKey = this.state.sqlTabsList.length + 1;
        let sqlTabLen = this.state.sqlTabsList.length;
        let newActiveKey = 1;
        if (sqlTabLen > 0) {
            newActiveKey = +(this.state.sqlTabsList[sqlTabLen - 1].tabTitle.split('控制台')[1]) + 1;
        }
        const newSqlTabsList = [...this.state.sqlTabsList];
        console.log('str 111111111111111111 = ', str);
        this[`sql_box_id_${id}_ref`] = React.createRef();
        newSqlTabsList.push({
            tabTitle: `控制台${newActiveKey}`,
            componentName: SqlBody,
            // key: `sql_body_key_${newActiveKey}`
            key: id,
            defaultSqlStr: str,
            ref: this[`sql_box_id_${id}_ref`]
        })
        this.setState(state => ({
            ...state,
            sqlTabsList: [...newSqlTabsList],
            // sqlActiveKey: `sql_body_key_${newActiveKey}`,
            sqlActiveKey: `${id}`,
        }))
    }
    removeSqlBody = (targetKey) => {
        let newActiveKey = this.state.sqlActiveKey;
        let lastIndex = -1;
        this.state.sqlTabsList.forEach((item, i) => {
            if (item.key === targetKey) {
                lastIndex = i - 1;
            }
        })
        const newPanes = this.state.sqlTabsList.filter(it => it.key !== targetKey);
        if (newPanes.length && newActiveKey === targetKey) {
            if (lastIndex >= 0) {
                newActiveKey = newPanes[lastIndex].key;
            } else {
                newActiveKey = newPanes[0].key;
            }
        }
        this.setState(state => ({
            ...state,
            sqlTabsList: [...newPanes],
            sqlActiveKey: newActiveKey
        }))
    }
    callbackForSqlTab = (newActiveKey) => {
        console.log('this[`sql_box_id_${this.state.sqlActiveKey}_ref`].current = ', this[`sql_box_id_${this.state.sqlActiveKey}_ref`].current);
        let curSqlStr = this[`sql_box_id_${this.state.sqlActiveKey}_ref`].current.getCurrentSqlBoxContent();
        let curSqlName = this[`sql_box_id_${this.state.sqlActiveKey}_ref`].current.getBasicInfo().name || 'SQL分析';
        let curLimit = this[`sql_box_id_${this.state.sqlActiveKey}_ref`].current.getLimit();
        let curActiveKey = this[`sql_box_id_${this.state.sqlActiveKey}_ref`].current.activeTabsKey;

        console.log('str = ', curSqlStr);
        console.log('name = ', curSqlName);
        console.log('limit = ', curLimit);
        saveUserConsoleInfo({
            id: this.state.sqlActiveKey,
            sqlName: curSqlName,
            sqlExecInfo: {
                limits: curLimit,
                sql: encode(curSqlStr),
            }
        })
        this.setState({
            sqlActiveKey: newActiveKey
        })
    }
    onEditForSqlTab = (targetKey, action) => {
        console.log('targetKey = ', targetKey);
        console.log('action = ', action);
        this.setState({
            sqlBoxLoading: true,
        }, () => {
            if (action === 'add') {
                saveUserConsoleInfo(this.defaultData).then(res => {
                    console.log('res = ', res);
                    this.addSqlBody(res.data.id, '');
                }).catch((err) => {
                    err && message.warning(err.msg);
                }).finally(() => {
                    this.setState({
                        sqlBoxLoading: false,
                    })
                })
            } else {
                deleteUserConsoleInfo(targetKey).then(res => {
                    this.removeSqlBody(targetKey);
                }).catch((err) => {
                    err && message.warning(err.msg);
                }).finally(() => {
                    this.setState({
                        sqlBoxLoading: false,
                    })
                })
            }
        })
    }
    linkToDataDirectory = () => {
        // this.props.history.push({
        //     pathname: '/oap/sheetDirectory',
        // });
        let pathname = '/oap/sheetDirectory', tabNameZh = '数据目录';
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }
    render () {
        // var source = {"oa": {"users" : ["aa","bb"],"groups" : ["cc","dd"]}, 'ob': {'obSon': {'obGrandSon': ['first_grand_son', 'second_grand_son', 'third_grand_son']}}};
        let modalFooter = [
            <Button key="cancel" onClick={() => this.handleBasicInfo('cancel')}>取消</Button>,
            <Button key="save" type="primary" loading={this.state.basicInfo.id ? this.state.saveLoading : this.state.saveAsLoading} onClick={() => this.handleBasicInfo(this.state.basicInfo.id ? 'update' : 'add')}>{this.state.basicInfo.id ? '更新' : '保存'}</Button>
        ]
        this.state.basicInfo.id && modalFooter.splice(1, 0, <Button key="as" loading={this.state.saveAsLoading} onClick={() => this.handleBasicInfo('add')}>另存为</Button>)
        return <Spin spinning={this.state.isLoading}>
            <div className="oap-container oap-sql-search-page-special">
                <Row id="bigBox_for_sql" className="oap-row oap-sql-row" style={{ position: 'relative' }}>
                    <Col id="leftBox_for_sql" className="oap-analysis-col-flex" style={{ marginRight: '0px', width: '240px', position: 'relative' }}>
                        <div className="oap-analysis-localSearch oap-flex-between" style={{ marginBottom: '16px' }}>
                            <div className="input-and-btn-and-btn">
                                <SearchInput placeholder='搜索表名' btnWidth={56} disabled={this.state.sqlTableLoadingAll} onSearch={(str) => this.handleSearch(str)} />
                                <Tooltip title="刷新列表">
                                    <span className="operator-btn-refresh" style={{ display: 'inline-flex' }}>
                                        <Button disabled={this.state.sqlTableLoadingAll} style={{ padding: 0, margin: 0, minWidth: 0 }} icon={<IconRefreshA />} onClick={this.handleRefreshRedisDataForHive}></Button>
                                    </span>
                                </Tooltip>
                            </div>
                        </div>
                        <div style={{ position: 'absolute', top: 62, left: 0, right: 0, bottom: 0, zIndex: 99, background: 'rgba(225,225,225,.3)', display: this.state.sqlTableLoadingAll ? 'block' : 'none', cursor: this.state.sqlTableLoadingAll ? 'not-allowed' : 'default' }}>
                            <Spin spinning={this.state.sqlTableLoadingAll} style={{ position: 'absolute', top: 100, left: '50%', transform: 'translate(-50%, 0)' }}></Spin>
                        </div>
                        <div className="oap-card padnone" style={{ padding: '10px 0 0 5px', position: 'relative' }}>
                            {/* {this.state.collapseList.length ? <div className="oap-Collapse-area">
                                <Collapse accordion expandIconPosition="right" ghost activeKey={this.state.activeCollapse} onChange={(key) => this.setState({activeCollapse:key})}>
                                    {this.state.collapseList.map(collapse => {
                                        return <Collapse.Panel header={<Tooltip title={collapse.modelName}>{collapse.modelName}</Tooltip>} key={collapse.modelName}>    
                                            <Collapse accordion expandIconPosition="right" ghost activeKey={this.state.activeCollapseChildren} onChange={(key) => this.setState({activeCollapseChildren:key})}>
                                                {collapse.tableInfoVoList.map(tableInfoVo => {
                                                    return <Collapse.Panel header={
                                                    <ReactSortable 
                                                        list={[tableInfoVo.tableName]}
                                                        setList={() => {}}
                                                        animation={150}
                                                        group={{ name: 'support-sql-box', pull: 'clone', put: false}}
                                                        clone={item => ({...item})}
                                                        sort={false}
                                                        chosenClass="sortable-drag">
                                                        <Tooltip title={tableInfoVo.tableName}>{tableInfoVo.tableName}</Tooltip>
                                                    </ReactSortable>} key={tableInfoVo.tableName}>
                                                        <ReactSortable
                                                            list={tableInfoVo.fieldInfoVoList}
                                                            setList={() => {}}
                                                            animation={150}
                                                            group={{ name: 'support-sql-box', pull: 'clone', put: false}}
                                                            clone={item => ({...item})}
                                                            sort={false}
                                                            chosenClass="sortable-drag"
                                                            // setData={(dataTransfer, dragEl) => this.setSourceMenuData(tableInfoVo, dataTransfer, dragEl)}
                                                            onStart={(evt) => this.setSourceMenuStart(tableInfoVo, evt)}
                                                            // onClone={(evt) => this.setSourceMenuClone(tableInfoVo, evt)}
                                                            onEnd={(evt) => this.setSourceMenuEnd(tableInfoVo, evt)}
                                                        >
                                                            {tableInfoVo.fieldInfoVoList.map(fieldInfoVo => {
                                                                return <div key={fieldInfoVo.fieldName}>
                                                                    <Tooltip title={`${fieldInfoVo.fieldName}: ${fieldInfoVo.fieldType}`}>
                                                                        <div className="oap-drag-item ellipsis">{`${fieldInfoVo.hasApostrophe? fieldInfoVo.fieldName.replace(/\`/g,''): fieldInfoVo.fieldName}`}</div>
                                                                    </Tooltip>
                                                                </div>
                                                            })}
                                                        </ReactSortable>
                                                    </Collapse.Panel>
                                                })}
                                            </Collapse>
                                        </Collapse.Panel>
                                     })} 
                                </Collapse>
                            </div>:<div className="oap-flex-between">暂无数据</div>} */}
                            {/* 用树的结构去展示库·表·字段，然后支持拖拽 */}
                            {/*  defaultExpandAll defaultExpandedKeys={this.state.defaultExpandedKeysForSqlMenu} */}
                            {/* <div className="refresh_btn_for_hive" onClick={this.handleRefreshRedisDataForHive}>
                                <Tooltip title='刷新'><RedoOutlined /></Tooltip>
                            </div> */}
                            {this.state.isTreeLoading ? <div className="oap-flex-between"><Empty imgName="person/empty-data"><div>当前用户分析数据表，查询中...</div></Empty></div> : this.state.treeNodeList.length ?
                                <Tree
                                    motion={null}
                                    showIcon
                                    showLine={{ showLeafIcon: false }}
                                    loadData={this.onLoadTreeNode}
                                    treeData={this.state.treeNodeList}
                                    onExpand={this.onExpandSql}
                                    expandedKeys={this.state.defaultExpandedKeysForSqlMenu}
                                    autoExpandParent={this.state.autoExpandParent}
                                /> : <div className="oap-flex-between"><Empty imgName="person/empty-data"><div>更多分析数据表，请点击<a onClick={() => this.linkToDataDirectory()}>此处</a>进行申请</div></Empty></div>}
                            {/* <div className="refresh_btn_for_hive">
                                <Button 
                                    type="text" 
                                    icon={<RedoOutlined />}
                                    className="oap-sql-formatBtn2"
                                    onClick={this.handleRefreshRedisDataForHive}>刷新列表</Button>   
                            </div> */}
                        </div>
                    </Col>
                    <Tooltip placement="right" title={`${this.state.shrinkSwitch ? '收起' : '展开'}`}>
                        <div id="sql_fields_shrink_icon_btn" className="sql_fields_shrink_icon_btn" onClick={this.shrinkSqlMeta}><IconBack style={{ transform: `rotate(${this.state.shrinkSwitch ? '0' : '180'}deg)` }} /></div>
                    </Tooltip>
                    <Col id="resizeBox_for_sql">
                        <div style={{ width: '16px', height: '100vh', cursor: 'ew-resize' }} onMouseDown={this.darggableWidth}></div>
                    </Col>
                    <Col id="rightBox_for_sql" className="table-container oap-sql-right">
                        {/* <div>
                            <div id="topSqlBox_for_sql" className="oap-card">
                                <div className="oap-card-top">
                                    <Row className="oap-row" justify="space-between">
                                        <Col style={{minWidth:'452px',width:'62%'}}>
                                            <div className="oap-card-top-title">
                                                <Tooltip title={this.state.basicInfo.name ? this.state.basicInfo.name:'SQL分析'}>
                                                    <div className="title ellipsis">
                                                        {this.state.basicInfo.name ? this.state.basicInfo.name:'SQL分析'}
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        </Col>
                                        <Col flex="420px" className="oap-flex-row oap-flex-row-to-right">
                                            <Space>
                                                <div className="oap-sql-limit">
                                                    <span style={{lineHeight: '36px'}}>LIMIT</span>
                                                    <Select options={SQL_LIMITS_LIST} value={this.state.limit} onChange={(value) => this.setState({limit:value})}></Select>
                                                </div>
                                                {checkMyPermission('oap:sql:personalQueries') ? <Button
                                                    loading={this.state.tabsList[1].loading}
                                                    onClick={() => this.handleSave('search')}>保存</Button>:null}
                                                {checkMyPermission('oap:sql:query') ? <Button type={this.sqlContent.replace(/\s+/g, "").length == 0 ? 'primary':'primary'}
                                                    onClick={() => this.getSqlList(this.state.tabsList[0].loading)}>{this.state.tabsList[0].loading ? '取消运行':'运行'}</Button>:null}
                                            </Space>
                                        </Col>
                                    </Row>
                                </div>
                                <div className="special-code-mirror-dom-content">
                                    <div className="code-mirror-left-tools">
                                        <Button 
                                            size="small"
                                            type="text"
                                            title={this.state.tabsList[0].loading ? '取消运行':运行
                                            icon={<IconPlay className={this.state.tableResLoading ? "oap-sql-run-btn-icon no-sql-statement": "oap-sql-run-btn-icon"} />}
                                            disabled={this.state.tableResLoading}
                                            onClick={() => this.getSqlList(this.state.tabsList[0].loading)}>
                                        </Button>
                                    </div>
                                    <CodeMirrorDom
                                        ref={this.codemirrorEle}
                                        className="mySpecialCodeMirrorDom"
                                        options={{
                                            mode: 'text/x-hql',
                                            styleActiveLine: true,
                                            lineNumbers: true,
                                            lineWrapping: true,
                                            theme: 'neo',//solarized juejin
                                            autoCloseBrackets: true, //键入时将自动关闭()[]{}''""
                                            line: true,
                                            hint: codemirror.hint.sql,
                                            hintOptions: {
                                                // 当匹配只有一项的时候是否自动补全
                                                completeSingle: false,
                                                tables: this.state.sqlHintOptions,
                                            },
                                            indentWithTabs: true,
                                            smartIndent: true,
                                            matchBrackets: true,
                                            autoRefresh: true,
                                            extraKeys: {
                                                Ctrl: "autocomplete",
                                            }, // To invoke the auto complete
                                            dragDrop: true, // 支持拖拽至sql box
                                        }}
                                        onInputRead={(editor, changeObj) => {
                                            // 根据点号，获取上次输入的catalog, schema, table, field
                                            let isPoint = changeObj.text[0].charAt(0) === '.' ? true : false;
                                            if (isPoint) {
                                                let cur = editor.getCursor();
                                                let result = [];
                                                let useIdentifierQuotes = false;
                                                let identifierQuote = this.getIdentifierQuote(editor);
                                                let token = editor.getTokenAt(cur),
                                                start, end, search;
                                                if (token.end > cur.ch) {
                                                    token.end = cur.ch;
                                                    token.string = token.string.slice(0, cur.ch - token.start);
                                                }
                                                if (token.string.match(/^[.`"\w@]\w*$/)) {
                                                    search = token.string;
                                                    start = token.start;
                                                    end = token.end;
                                                } else {
                                                    start = end = cur.ch;
                                                    search = "";
                                                }
                                                let nameParts = [];
                                                let cont = true;
                                                while (cont) { // 获取表名词组并存储到nameParts
                                                    cont = (token.string.charAt(0) == ".");
                                                    useIdentifierQuotes = useIdentifierQuotes || (token.string.charAt(0) == identifierQuote);
                                        
                                                    nameParts.unshift(this.cleanName(token.string, identifierQuote));
                                        
                                                    token = editor.getTokenAt(Pos(cur.line, token.start));
                                                    if (token.string == ".") {
                                                        cont = true;
                                                        token = editor.getTokenAt(Pos(cur.line, token.start));
                                                    }
                                                }
                                                let theLastString = nameParts.pop();
                                                let allTableName = nameParts.join('.');
                                                let theTable = this.getTableByAllTableName(allTableName);
                                                if(theTable == null && nameParts.length > 0){//如果不能根据全表名获取到Obj，并且nameParts长度为1，则尝试根据表昵称获取表Obj
                                                    let theTableName = this.findTableByAlias(nameParts[0],editor);
                                                    nameParts.splice(0,1, ...theTableName.split('.'));
                                                }
                                                if (nameParts.length === 2 && !theLastString) {
                                                    let _schemaName = [...nameParts].pop();
                                                    getSqlTableBySchema(_schemaName).then(res => {
                                                        let _sqlHintOptions = {...this.state.sqlHintOptions};
                                                        let obj = {};
                                                        res?.data.forEach(it => {
                                                            obj[it.tableName] = {};
                                                        })
                                                        _sqlHintOptions[nameParts[0]][nameParts[1]] = obj;
                                                        this.setState((state) => ({
                                                            ...state,
                                                            sqlHintOptions: _sqlHintOptions
                                                        }), () => {
                                                            editor.setCursor({
                                                                line: cur.line,
                                                                ch: cur.ch,
                                                            })
                                                            editor.showHint();
                                                        })
                                                    })
                                                } else if (nameParts.length === 3 && !theLastString) {
                                                    let _tableName = nameParts.join('.');
                                                    getSqlFieldByTable(_tableName).then(res => {
                                                        let _sqlHintOptions = {...this.state.sqlHintOptions}; // JSON.parse(JSON.stringify(this.state.sqlHintOptions));
                                                        let obj = {};
                                                        res?.data.forEach(it => {
                                                            obj[it.column] = {};
                                                        })
                                                        _sqlHintOptions[nameParts[0]][nameParts[1]][nameParts[2]] = obj;
                                                        this.setState(state => ({
                                                            ...state,
                                                            sqlHintOptions: _sqlHintOptions
                                                        }), () => {
                                                            // 此处增加插入光标函数，防止插入sql语句时，停顿一会儿光标跑最后面去了
                                                            editor.setCursor({
                                                                line: cur.line,
                                                                ch: cur.ch,
                                                            })
                                                            editor.showHint();
                                                        })
                                                    })
                                                }
                                            }
                                        }}
                                        onChange={(editor, data, value) => {
                                            if (!this.state.runLight && value) {
                                                console.log('亮了 = ');
                                                this.setState({
                                                    runLight: true
                                                })
                                            }
                                            if (this.state.runLight && !value) {
                                                console.log('灭了 = ');
                                                this.setState({
                                                    runLight: false
                                                })
                                            }
                                            this.sqlContent = value;
                                            if (['+input'].includes(data.origin) && data.text[0] !== ' ' && data.text[0] !== ';' && data.text[0] !== '') {
                                                setTimeout(function() { editor.execCommand("autocomplete"); }, 100);
                                                // _.throttle(function() { editor.execCommand("autocomplete"); }, 1000)
                                            }
                                            // if (data.origin === '+input') {
                                            //     const textArray = data.text;
                                            //     if (textArray != ' ') {
                                            //         setTimeout(function() { editor.execCommand("autocomplete"); }, 100);
                                            //         // codemirror.commands.autocomplete(editor, null, {completeSingle: false});
                                            //     }
                                            // }
                                        }}
                                    />
                                </div>
                                <div className="oap-sql-btn">
                                    <Space>
                                        <Button 
                                            type="text" 
                                            icon={<SvgIcon icon='format_shua' />}
                                            className="oap-sql-formatBtn"
                                            onClick={this.formatSqlContent}>格式化SQL</Button>
                                        <Button 
                                            type="text" 
                                            icon={<IconClearUp />} 
                                            className="oap-sql-clearBtn" 
                                            onClick={this.initializeSql}>清空窗口</Button>  
                                    </Space>
                                </div>  
                            </div>
                            {this.state.sqlRunError ? <div className="message-custom-style">
                                <span>{this.state.sqlRunErrorMsg}</span>
                                <IconClose
                                onClick={this.onCloseSqlRunError}
                                style={{ color: "#999", cursor: "pointer", fontSize: 12, position:'absolute', top: '2px', right: '1px' }}
                                />
                            </div>: null}
                            <div id="midResizeBox_for_sql" style={{ width: '100%', height: '0px', border: '8px solid #f6f6f6', cursor: 'ns-resize' }} onMouseDown={this.darggableHeight}></div>
                            <div className="table-top-wrap oap-card oap-sqlList" style={{flex: '1'}} key="no-need-refresh">
                                {
                                    <Spin spinning={this.state.tableResLoading}>
                                        <Tabs 
                                            key="just-for-sql"
                                            type="card" 
                                            activeKey={this.state.activeTabsKey} 
                                            onChange={(activeKey) => this.handleTabsChange(activeKey)}>
                                            {this.state.tabsList.map(tabs => {
                                                return  <Tabs.TabPane tab={tabs.tabsTitle} key={tabs.key} forceRender={true}>
                                                    {tabs.showSearch ? <Form
                                                        className="search-form"
                                                        ref={tabs.formRef}
                                                        layout="vertical"
                                                        size="middle"
                                                        initialValues={{
                                                            subjectId:'all'
                                                        }}>
                                                        <div className="search-area oap-sql-search-area">
                                                            <Row gutter={32}>
                                                                {tabs.showSqlSubjectSearch ? <Col span={3}>
                                                                    <Form.Item name="subjectId">
                                                                        <Select placeholder='请选择' onChange={() => this.handleTabsSearch(tabs.key)}>
                                                                            {this.state.sqlSubjectModel.map(model => {
                                                                                return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
                                                                            })}
                                                                        </Select>
                                                                    </Form.Item>
                                                                </Col>:null}
                                                                <Col span={3}>
                                                                    <Form.Item>
                                                                        <Input.Group compact className="oap-analysis-localSearch">
                                                                            <Form.Item name="name" noStyle>
                                                                                <Input 
                                                                                    ref={`search${tabs.key}`}
                                                                                    style={{width: `calc(100% - 66px)`}}
                                                                                    placeholder='输入名称进行搜索'
                                                                                    allowClear/>
                                                                            </Form.Item>
                                                                            
                                                                            <span style={{display: 'inline-flex', width: `56px`}}>
                                                                                <Button 
                                                                                    style={{padding: 0, margin: 0,minWidth: `56px`,borderLeft: 'none', borderRadius: '0 4px 4px 0', borderColor: '#e1e1e1'}} 
                                                                                    icon={<IconSearch />} 
                                                                                    onClick={() => this.handleTabsSearch(tabs.key)}>
                                                                                </Button>
                                                                            </span>
                                                                        </Input.Group> 
                                                                    </Form.Item>
                                                                </Col>   
                                                            </Row>
                                                        </div>
                                                    </Form>:null}
                                                    {tabs.showExportCsv ? <Row>
                                                        <Col span={4}>

                                                            {checkMyPermission('oap:sql:download') ? <Space><Button type={!this.state.runLight ? '':'primary'} disabled={!this.state.runLight} onClick={() => this.downLoadCsv()}>导出CSV</Button></Space>:null}
                                                        </Col>
                                                    </Row>:null}
                                                    <div className="table-top-wrap" style={{padding:'0'}}>
                                                        <Table
                                                            rowKey="id"
                                                            tableKey={`sql_list_${tabs.key}`}
                                                            columns={tabs.columns}
                                                            dataSource={tabs.tableData}
                                                            allFilterColumns={tabs.checkedValue}
                                                            pagination={{
                                                                showQuickJumper: true,
                                                                showSizeChanger: true,
                                                                pageSize: tabs.pageSize,
                                                                current: tabs.pageNo,
                                                                total: tabs.total,
                                                                onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize,tabs.key)
                                                            }}
                                                            scroll={{x: '100%', y: `calc(100vh - ${this.state.tableHeight}px)`}}/>
                                                    </div>
                                                </Tabs.TabPane>       
                                            })}
                                        </Tabs>
                                    </Spin>
                                }
                            </div> 
                        </div> */}
                        <Spin spinning={this.state.sqlBoxLoading}>
                            <Tabs
                                addIcon={<IconAddA />}
                                activeKey={this.state.sqlActiveKey}
                                type="editable-card"
                                onChange={this.callbackForSqlTab}
                                onEdit={this.onEditForSqlTab}
                                hideAdd={this.state.sqlTabsList.length > 9}
                            >
                                {
                                    this.state.sqlTabsList.map(pane => {
                                        let tabSuffix = +(pane.tabTitle.split('控制台')[1]);
                                        console.log('dom', tabSuffix)
                                        return pane ? <Tabs.TabPane closeIcon={<IconClose />} tab={pane.tabTitle} key={pane.key} closable={this.state.sqlTabsList.length > 1}>
                                            <SqlBody
                                                ref={pane.ref}
                                                key={pane.key}
                                                sqlKey={pane.key}
                                                sqlName={pane.sqlName}
                                                tabSuffix={tabSuffix}
                                                sqlHintOptionsFather={this.state.sqlHintOptions}
                                                emailModalDataFather={this.state.emailModalData}
                                                defaultSqlStr={pane.defaultSqlStr}
                                            />
                                        </Tabs.TabPane> : null
                                    })
                                }
                            </Tabs>
                        </Spin>
                    </Col>
                </Row>
            </div>
            <Modal
                title={this.state.modalType == 'template' ? '保存模板' : '保存查询'}
                visible={this.state.visibleBasicInfo}
                className="basicInfo"
                zIndex={1030}
                onCancel={() => this.handleBasicInfo('cancel')}
                footer={modalFooter}>
                <div className="table-container">
                    <Form
                        ref={this.formRefBasicInfo}
                        layout="vertical"
                        size="middle"
                        initialValues={this.state.basicInfo}>
                        <Form.Item
                            name="name"
                            label="名称"
                            rules={[
                                {
                                    type: 'string',
                                    whitespace: true,//如果字段仅包含空格则校验不通过
                                    required: true,
                                    message: `名称不能为空或全部为空格`
                                }
                            ]}>
                            <Input
                                placeholder='请输入'
                                maxLength="255"
                                allowClear />
                        </Form.Item>
                        {this.state.modalType === 'template' ? <Form.Item
                            name="subjectId"
                            label="业务域"
                            rules={[
                                {
                                    required: true,
                                    message: '请选择'
                                }
                            ]}>
                            <Select placeholder='请选择'>
                                {this.state.subjectModel.map(model => {
                                    return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
                                })}
                            </Select>
                        </Form.Item> : null}
                        <Form.Item name="description" label="描述：">
                            <Input.TextArea rows={6} maxLength="255" />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
            <Modal
                width={600}
                centered
                title={`查看${this.state.fieldInfo.schemaName}.${this.state.fieldInfo.tableName}`}
                visible={this.state.fieldInfoVisible}
                footer={[
                    <Button key="close" onClick={() => this.setState({ fieldInfoVisible: false, fieldInfo: {} })}>关闭</Button>
                ]}
                onCancel={() => this.setState({ fieldInfoVisible: false, fieldInfo: {} })}
                bodyStyle={{ maxHeight: '60vh' }}
                className="oap-sheet-detailInfo">
                <Row>
                    <Col span={6}>
                        <SearchInput placeholder={'请输入字段名或字段含义'} btnWidth={56} disabled={false} onSearch={(str) => this.handleSearchField(str)} />
                    </Col>
                </Row>
                <div style={{ fontSize: '14px', margin: '6px 0' }}>总共<b style={{ color: '#1890FF', margin: '0 4px' }}>{this.state.fieldInfoDataList.length}</b>条记录</div>
                <Table
                    rowKey="id"
                    columns={this.state.fieldInfoColumns}
                    dataSource={this.state.fieldInfoDataList}
                    loading={this.state.fieldInfoLoading}
                    scroll={{ x: '100%', y: `calc(60vh - ${this.state.tableHeight}px)` }} />
            </Modal>
            <ExploreEmailModal onExplored={this.handleExploreForDownloadData} {...this.state.emailModalData} />
            <Modal
                modalType="noticeType"
                visible={this.state.isBeyond10ConsoleVisible}
                onOk={this.handleBeyond10Ok}
                onCancel={this.handleBeyond10Cancel}
                width={200}
                centered
                title={`提示`}
                okText="覆盖"
                cancelText="取消"
            >
                <div>控制台数量已达上限，是否使用<span onClick={this.handleBeyond10ShowSqlTemp} style={{ color: '#4880ff', textDecoration: 'underline', cursor: 'pointer' }}>模板SQL</span>覆盖最新控制台页面的SQL信息？</div>
            </Modal>
            <Modal
                title="SQL"
                visible={this.state.isSqlTempFromOtherPageVisible}
                className="basicInfo"
                zIndex={1030}
                onCancel={() => this.setState({ isSqlTempFromOtherPageVisible: false })}
                footer={[
                    <CopyToClipboard key="copy" text={this.state.sqlTempFromOtherPage} onCopy={() => this.setState({ copied: true, isSqlTempFromOtherPageVisible: false })}><Button type="primary">复制SQL</Button></CopyToClipboard>
                ]}>
                <div className="table-container">
                    <Form
                        ref={this.copySqlFormFromOtherPage}
                        layout="vertical"
                        size="middle"
                        initialValues={{
                            sql: this.state.sqlTempFromOtherPage
                        }}>
                        <Form.Item name="sql">
                            <Input.TextArea rows={6} disabled />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </Spin>
    }
}

export default Index