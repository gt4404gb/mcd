import React, { forwardRef, useEffect, useState, useRef, useImperativeHandle, useCallback } from 'react';
import * as codemirror from 'codemirror';
import CodeMirror from 'codemirror';
const Pos = CodeMirror.Pos;
import { UnControlled as CodeMirrorDom } from 'react-codemirror2';
import {
  Spin, Row, Col, Input, Button, Table, Tooltip, Tabs, Form, Select, Modal, Space, Popconfirm, Badge, message,
} from '@aurum/pfe-ui';
import {
  IconSearch, IconRefreshA, IconClearUp, IconClose, IconPlay, IconInfoCircle, IconAiCloud
} from '@aurum/icons';
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
  // refreshRedisDataForHive,
  saveUserConsoleInfo,
  getSqlRunResultNew,
  getSqlRunResultBoolean,
  getSqlRunResultFinish,
  downLoadCsvForSqlReady,
  downLoadCsvForSqlFinish,
  chatWithRobot,
} from '@/api/oap/sql_search.js';
import { querySubjectModelByLevel } from '@/api/oap/self_analysis.js';
// import {getCurrentUserIsStaff} from '@/api/oap/commonApi.js';
import { viewSqlTemplateForSqlSearch } from '@/api/oap/buried_api.js';

import { CopyToClipboard } from 'react-copy-to-clipboard';
// import { ReactSortable } from "react-sortablejs";

import SvgIcon from '@/components/SvgIcon';
import SearchInput from '@/components/SearchInput';
import ExploreEmailModal from '@/components/ExploreEmailModal';

import moment from 'moment';
import { encode, decoded } from 'js-base64';
import _ from 'lodash';
// import _debounce from 'lodash/debounce';
import { format } from '@/plugins/sql-formatter/sqlFormatter.js';

import { checkMyPermission } from '@mcd/boss-common/dist/utils/common';

import { SQL_LIMITS_LIST } from '@/constants';
import { uuid } from '@/utils/store/func';
// import useClipboard from 'react-hook-clipboard';

require('codemirror/lib/codemirror.js');
require('codemirror/lib/codemirror.css');
require('codemirror/theme/neo.css');
require('codemirror/addon/hint/show-hint.js');
require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/selection/active-line.js');
require('codemirror/addon/edit/matchbrackets.js');
require('codemirror/mode/clike/clike.js');
require('codemirror/addon/display/autorefresh.js');
require('codemirror/addon/edit/closebrackets');
require('@/plugins/codemirror-custom/sql-hint.js');
require('@/plugins/codemirror-custom/sql.js');

// import ClipboardJS from 'clipboard';

const CONS = {
  QUERY_DIV: ';',
  ALIAS_KEYWORD: 'AS'
};
let sqlContentWindow = ''; // 全局存的sql语句
let sqlHintOptionsWindow = {}; // 全局hint
const SqlBody = forwardRef((props, ref) => {
  console.log('props = ', props);
  sqlContentWindow = props.defaultSqlStr;
  // console.log('sqlContentWindow = ', sqlContentWindow);
  let requestCancel = {};
  const resultTimer = useRef(null);
  const handleDebounceFn = (value, name, lim) => {
    console.log('触发了保存事件');
    saveUserConsoleInfo({
      id: props.sqlKey,
      sqlName: name || 'SQL分析',
      sqlExecInfo: {
        datasourceType: 'ClickHouse',
        sql: encode(value),
        limits: lim,
      }
    }).then(res => {
      console.log('保存成功了 = ', res);
    })
  }
  const debounceFn = useCallback(_.debounce(handleDebounceFn, 1000), []);

  const topSqlBox_for_sql = useRef();
  const codemirrorEle = useRef();
  const formSearchORef = useRef();
  const formSearchTRef = useRef();
  const formSearchSRef = useRef();
  const copySqlForm = useRef();
  const midResizeBox_for_sql = useRef();
  const formRefBasicInfo = useRef();
  const [tabsList, setTabsList] = useState([
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
      formRef: formSearchORef,
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
            <Space size="middle" key={`保存的查询_${record.id}`}>
              <a onClick={() => handleSwitchSql('search', record)}>打开</a>
              {checkMyPermission('oap:dispatch:add') && <a onClick={() => onCreateSchedule(record)}>定时任务</a>}
              {checkMyPermission('oap:sql:personalQueries') ? <Popconfirm
                title="确认要删除吗？"
                okText="确定"
                cancelText="取消"
                onConfirm={() => confirmDelete('search', record.id)}>
                <a href="#">删除</a>
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
      formRef: formSearchTRef,
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
          render: (text, record) => (<Button key={`${record.id}_querySql`} type="link" onClick={() => handleSqlModal(record)}>{record.querySql}</Button>)
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
      formRef: formSearchSRef,
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
              <Button type="link" size="small" onClick={() => handleSwitchSql('template', record)}>打开</Button>
              {record.type === 1 ? <Popconfirm
                title="确认要删除吗？"
                okText="确定"
                cancelText="取消"
                onConfirm={() => confirmDelete('template', record.id)}>
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
      // tableResLoading: false,
      sqlTableLoadingAll: false,
      runLight: false,
    }
  ]);
  const [basicInfo, setBasicInfo] = useState({});
  const [limit, setLimit] = useState(1000);
  const [tableResLoading, setTableResLoading] = useState(false);
  const [sqlHintOptions, setSqlHintOptions] = useState({});
  const [runLight, setRunLight] = useState(false);
  const [currentDetailType, setCurrentDetailType] = useState('');
  const [currentDetailId, setCurrentDetailId] = useState('');
  const [sqlRunError, setSqlRunError] = useState({
    err: false,
    errMsg: '',
  });
  const CodeMirrorContentId = `mySpecialCodeMirrorContnet${props.tabSuffix}`
  const [subjectModel, setSubjectModel] = useState([]);
  const [sqlSubjectModel, setSqlSubjectModel] = useState([]);
  const [visibleSql, setVisibleSql] = useState(false);
  const [sqlInfo, setSqlInfo] = useState('');
  const [copied, setCopied] = useState(false);
  // const [clipboard, copyToClipboard] = useClipboard('');
  const [fieldInfo, setFieldInfo] = useState({});
  const [fieldInfoVisible, setFieldInfoVisible] = useState(false); //modal查看字段
  // let sqlHintOptions = null
  // const onCopySql = () => {
  //   let formData = copySqlForm.current.getFieldsValue();
  //   let sql_copy = formData.sql || '';
  //   copyToClipboard(sql_copy);
  //   setVisibleSql(false);
  // }

  // const copyBtnRef = useRef();
  // const [resultSqlText,setResultSqlText] = useState('');
  // let curClipboard = null;
  // useEffect(() => {
  //   if (copyBtnRef.current) {
  //     console.log('resultSqlText = ', resultSqlText);
  //     curClipboard = new ClipboardJS(copyBtnRef.current, {
  //       text: () => resultSqlText
  //     })
  //     curClipboard.on('success', () => {
  //       console.log('success');
  //       curClipboard.destroy();
  //     });
  //     curClipboard.on('error', () => {
  //       console.log('error');
  //       curClipboard.destroy();
  //     });
  //     copyBtnRef.current.click();
  //   }
  // }, [copyBtnRef, resultSqlText]);
  // const copySqlTextMessage = (record) => {
  //   if (record.errorMessage) {
  //     setErrorTxt(record.errorMessage);
  //     message.success("复制成功！");
  //   }
  // }
  const promptRef = useRef(null);
  const [formPrompt] = Form.useForm();
  const [aiSqlLoading, setAiSqlLoading] = useState(false);
  const [aiSqlText, setAiSqlText] = useState('');
  const [aiSqlStep, setAiSqlStep] = useState(1);
  const [aiSqlDom, setAiSqlDom] = useState([]);
  // const [searchPrompt, setSearchPrompt] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  const onCopyFixBug = useCallback(() => {
    setCopied(true);
    setVisibleSql(false);
  }, [])
  const onCancelFieldInfo = () => {
    setFieldInfoVisible(false);
    setFieldInfo({});
  }
  const fieldInfoColumns = [
    { title: '序号', dataIndex: 'tableIndex', width: 80 },
    { title: '字段名', dataIndex: 'fieldName', ellipsis: true, width: 140 },
    { title: '字段类型', dataIndex: 'fieldType', ellipsis: true, width: 100 },
    { title: '字段含义', dataIndex: 'description', ellipsis: true, width: 180 },
  ]
  const [fieldInfoLoading, setFieldInfoLoading] = useState(false);
  const [fieldInfoDataList, setFieldInfoDataList] = useState([]);
  const [emailModalData, setEmailModalData] = useState({
    isStaff: false,
    mcdEmail: '',
    visibleEmailInfo: false,
    isLoading: false,
  });

  const didMount = useRef(false);
  const [activeTabsKey, setActiveTabsKey] = useState('2');
  const [visibleBasicInfo, setVisibleBasicInfo] = useState(false);
  const [modalType, setModalType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveAsLoading, setSaveAsLoading] = useState(false);

  const [aiCloudVisible, setAiCloudVisible] = useState(false);
  const stateRef = useRef();
  // console.log('stateRef = ', stateRef);
  // stateRef.current = props.sqlHintOptionsFather;
  useImperativeHandle(ref, () => ({
    getCurrentSqlBoxContent,
    handleDetails,
    getBasicInfo,
    getLimit,
    getTabsList,
    activeTabsKey,
    basicInfo,
    limit
  }))
  const getBasicInfo = () => {
    return JSON.parse(JSON.stringify(basicInfo));
  }
  const getLimit = () => {
    return limit;
  }
  const getCurrentSqlBoxContent = () => {
    return codemirrorEle.current.editor.getValue();
  }
  const recoverySqlTemplate = () => {
    // 引导域过来的默认填充--按理说要放父组件
    // let record = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapSqlTemplateId'))) || {};
    // if (record?.sqlTemplateId) {
    //   handleDetails('template', record.sqlTemplateId, record);
    //   sessionStorage.removeItem('oapSqlTemplateId');
    // }
  }
  useEffect(() => {
    console.log('模拟 componentDidMount！')
    getTabsList(tabsList);
    console.log('模拟结束！')
  }, []);
  useEffect(() => {
    if (props.defaultSqlStr) {
      sqlContentWindow = props.defaultSqlStr;
      setRunLight(true);
    }
  }, [props.defaultSqlStr])
  useEffect(() => {
    setBasicInfo({
      ...basicInfo,
      name: props.sqlName,
    })
  }, [props.sqlName])
  useEffect(() => {
    const { emailModalDataFather } = props;
    if (emailModalDataFather) {
      const newItem = JSON.parse(JSON.stringify(emailModalDataFather));
      setEmailModalData(newItem);
    }
  }, [props.emailModalDataFather]);
  useEffect(() => {
    console.log('进来了', props);
    const { sqlHintOptionsFather } = props;
    if (sqlHintOptionsFather) {
      const newItem = JSON.parse(JSON.stringify(sqlHintOptionsFather))
      setSqlHintOptions(newItem);
      sqlHintOptionsWindow = newItem;
      console.log('ffdfdffdfdf', sqlHintOptions);
    }
  }, [props.sqlHintOptionsFather]);

  // useEffect(() => {
  //   console.log('sqlHintOptions 变化了', sqlHintOptions);
  //   stateRef.current = JSON.parse(JSON.stringify(sqlHintOptions));
  // }, [sqlHintOptions]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
    } else {
      // 列表activeTabsKey
      console.log('列表activeTabsKey 变了, = ', activeTabsKey);
      if (activeTabsKey !== '1') {
        getTabsList(tabsList);
      }
    }
  }, [activeTabsKey]);
  // useEffect(() => {
  //   if (activeTabsKey !== '1') {
  //     getTabsList();
  //   }
  // }, [tabsList]);
  const handleLimitChange = (value) => {
    setLimit(value);
    let sql_content = codemirrorEle.current.editor.getValue().trim();
    handleDebounceFn(sql_content, basicInfo.name, value);
  }
  const dealRecordForPresto = (data) => {
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
          dataColumns[col.keyName] = `${item[col.field]}`;
        }
      })
      obj.dataList.push(dataColumns);
    })
    return obj;
  }
  const getSqlRun = (payload, requestCancel) => {
    return new Promise((resolve) => {
      console.log('阿西吧')
      setTimeout(async () => {
        console.log('阿西吧，延迟3s')
        let res = await getSqlRunResultBoolean(payload, requestCancel);
        console.log('阿西吧，接口请求完了')
        resolve(res.data);
      }, 5000);
    })
  }
  const queryBySql = async (commitSql, goRes, tabs_List) => {
    try {
      setTableResLoading(true);
      setSqlRunError({ err: false, errMsg: '' });
      const encodeSql = encode(commitSql.sql);
      /**
       * 原来的查询
       
      const resSqlQuery = await getSqlRunResult({
        datasourceType: 'ClickHouse',
        sql: encodeSql,
        limits: commitSql.limits,
        page: tabs_List[0].pageNo - 1,
        size: tabs_List[0].pageSize,
      }, requestCancel)
      */

      /**
       * 第一版的轮询
       * 
       
      const queryId = await getSqlRunResultNew({
        datasourceType: 'ClickHouse',
        sql: encodeSql,
        limits: commitSql.limits,
        page: tabs_List[0].pageNo - 1,
        size: tabs_List[0].pageSize,
      }, requestCancel);
      
      const resultBoolean = await getSqlRunResultBoolean({
          datasourceType: 'ClickHouse',
          sql: encodeSql,
          limits: commitSql.limits,
          sqlQueryResultId: queryId.data.id,
          page: tabs_List[0].pageNo - 1,
          size: tabs_List[0].pageSize,
      }, requestCancel);

      if(resultBoolean.data == false) {
        let timer = () => {
          if (resultTimer.current) {
            clearInterval(resultTimer.current);
          }
          resultTimer.current = setInterval(async () => {
            let res = await getSqlRunResultBoolean({
              datasourceType: 'ClickHouse',
              sql: encodeSql,
              limits: commitSql.limits,
              sqlQueryResultId: queryId.data.id,
              page: tabs_List[0].pageNo - 1,
              size: tabs_List[0].pageSize,
            });
            if (res.data == true) {
              clearInterval(resultTimer.current);
              let resSqlQuery = await getSqlRunResultFinish({
                datasourceType: 'ClickHouse',
                sql: encodeSql,
                limits: commitSql.limits,
                sqlQueryResultId: queryId.data.id,
                page: tabs_List[0].pageNo - 1,
                size: tabs_List[0].pageSize,
              });
              if (resSqlQuery.data.result.code == null) {
                let _records = dealRecordForPresto(resSqlQuery.data.result), columns = [], dataList = [];
                columns = _records.columns;
                dataList = _records.dataList;
                const filterOptions = columns.map(it => ({
                  label: it.title,
                  value: it.dataIndex
                }))
                const checkedValue = filterOptions.map(it => it.value)
                let _tabsList = [...tabs_List];
                _tabsList[0] = {
                  ..._tabsList[0],
                  loading: false,
                  tableData: dataList,
                  columns,
                  defcolumns: columns,
                  dataList,
                  filterOptions,
                  checkedValue,
                  pageNo: resSqlQuery.data.result?.page + 1,
                  total: resSqlQuery.data.result?.totalCount,
                }
                //   localStorage.removeItem(getTableKey('oap-sql1'));
                //   const checkedValue = this.state.tabsList[0].checkedValue;
                //   this.onFilterChange(checkedValue);
                //   //已运行的sql保存，点击分页时备用
                //   localStorage.setItem('sqlContent', encodeURIComponent(JSON.stringify(commitSql)))
                return new Promise((resolve, reject) => {
                  setTableResLoading(false);
                  setTabsList(_tabsList);
                  goRes && setActiveTabsKey('1');
                  resolve();
                }).then(() => {
                  // localStorage.removeItem(getTableKey('oap-sql1'));
                  // const checkedValue = tabsList[0].checkedValue;
                  // this.onFilterChange(checkedValue);
                  //已运行的sql保存，点击分页时备用
                  localStorage.setItem('sqlContent', encodeURIComponent(JSON.stringify(commitSql)))
                })
              } else {
                // message.error(resSqlQuery.data.result.msg || '查询失败！');
                setSqlRunError({ err: true, errMsg: resSqlQuery.data.result.msg });
                let _tabsList = [...tabsList];
                _tabsList[0] = {
                  ..._tabsList[0],
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
                setTabsList(_tabsList);
                setTableResLoading(false);
              }
            }
          }, 5000);
        }
        timer();
      } else {
        let resSqlQuery = await getSqlRunResultFinish({
          datasourceType: 'ClickHouse',
          sql: encodeSql,
          limits: commitSql.limits,
          sqlQueryResultId: queryId.data.id,
          page: tabs_List[0].pageNo - 1,
          size: tabs_List[0].pageSize,
        });
        if (resSqlQuery.data.result.code == null) {
          let _records = dealRecordForPresto(resSqlQuery.data.result), columns = [], dataList = [];
          columns = _records.columns;
          dataList = _records.dataList;
          const filterOptions = columns.map(it => ({
            label: it.title,
            value: it.dataIndex
          }))
          const checkedValue = filterOptions.map(it => it.value)
          let _tabsList = [...tabs_List];
          _tabsList[0] = {
            ..._tabsList[0],
            loading: false,
            tableData: dataList,
            columns,
            defcolumns: columns,
            dataList,
            filterOptions,
            checkedValue,
            pageNo: resSqlQuery.data.result?.page + 1,
            total: resSqlQuery.data.result?.totalCount,
          }
          return new Promise((resolve, reject) => {
            setTableResLoading(false);
            setTabsList(_tabsList);
            goRes && setActiveTabsKey('1');
            resolve();
          }).then(() => {
            localStorage.setItem('sqlContent', encodeURIComponent(JSON.stringify(commitSql)))
          })
        }else {
          // message.error(resSqlQuery.data.result.msg || '查询失败！');
          setSqlRunError({ err: true, errMsg: resSqlQuery.data.result.msg });
          let _tabsList = [...tabsList];
          _tabsList[0] = {
            ..._tabsList[0],
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
          setTabsList(_tabsList);
          setTableResLoading(false);
        }
      }
      */

      /**
       * 循环直至result为true时，才调result接口
       * 
      */
      const queryId = await getSqlRunResultNew({
        datasourceType: 'ClickHouse',
        sql: encodeSql,
        limits: commitSql.limits,
        page: tabs_List[0].pageNo - 1,
        size: tabs_List[0].pageSize,
      }, requestCancel);
      let resultBoolean = false, i = 0;
      console.log('开始')
      while (!resultBoolean) {
        console.log('i = ', i);
        let result_xx = await getSqlRun({
          datasourceType: 'ClickHouse',
          sql: encodeSql,
          limits: commitSql.limits,
          sqlQueryResultId: queryId.data.id,
          page: tabs_List[0].pageNo - 1,
          size: tabs_List[0].pageSize,
        }, requestCancel)
        resultBoolean = result_xx;
        i++;
        console.log('i = ', i);
      }
      console.log('循环结束了')
      if (resultBoolean) {
        let resSqlQuery = await getSqlRunResultFinish({
          datasourceType: 'ClickHouse',
          sql: encodeSql,
          limits: commitSql.limits,
          sqlQueryResultId: queryId.data.id,
          page: tabs_List[0].pageNo - 1,
          size: tabs_List[0].pageSize,
        });
        if (resSqlQuery.data.result.code == null) {
          let _records = dealRecordForPresto(resSqlQuery.data.result), columns = [], dataList = [];
          columns = _records.columns;
          dataList = _records.dataList;
          const filterOptions = columns.map(it => ({
            label: it.title,
            value: it.dataIndex
          }))
          const checkedValue = filterOptions.map(it => it.value)
          let _tabsList = [...tabs_List];
          _tabsList[0] = {
            ..._tabsList[0],
            loading: false,
            tableData: dataList,
            columns,
            defcolumns: columns,
            dataList,
            filterOptions,
            checkedValue,
            pageNo: resSqlQuery.data.result?.page + 1,
            total: resSqlQuery.data.result?.totalCount,
          }
          //   localStorage.removeItem(getTableKey('oap-sql1'));
          //   const checkedValue = this.state.tabsList[0].checkedValue;
          //   this.onFilterChange(checkedValue);
          //   //已运行的sql保存，点击分页时备用
          //   localStorage.setItem('sqlContent', encodeURIComponent(JSON.stringify(commitSql)))
          return new Promise((resolve, reject) => {
            setTableResLoading(false);
            setTabsList(_tabsList);
            goRes && setActiveTabsKey('1');
            resolve();
          }).then(() => {
            // localStorage.removeItem(getTableKey('oap-sql1'));
            // const checkedValue = tabsList[0].checkedValue;
            // this.onFilterChange(checkedValue);
            //已运行的sql保存，点击分页时备用
            localStorage.setItem('sqlContent', encodeURIComponent(JSON.stringify(commitSql)))
          })
        } else {
          // message.error(resSqlQuery.data.result.msg || '查询失败！');
          setSqlRunError({ err: true, errMsg: resSqlQuery.data.result.msg });
          let _tabsList = [...tabsList];
          _tabsList[0] = {
            ..._tabsList[0],
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
          setTabsList(_tabsList);
          setTableResLoading(false);
        }
      }
      console.log('终于返回true了 = ', resultBoolean);
    } catch (err) {
      err.toString() === 'Cancel' && message.warning(err.message || '已取消操作！');
      console.log('err = ', err);
      if (err && err.toString() !== 'Cancel') {
        setSqlRunError({ err: true, errMsg: err.msg });
      }
      // 查询失败，需要重置运行按钮状态
      let _tabsList = [...tabsList];
      _tabsList[0] = {
        ..._tabsList[0],
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
      // this.setState({
      //   tableResLoading: false,
      //   tabsList
      // })
      setTabsList(_tabsList);
      setTableResLoading(false);
    }
  }
  //查询tabs的table列表
  const getTabsList = (_tabsList) => {
    if (activeTabsKey == '1') {
      let sql_content = codemirrorEle.current.editor.getValue().trim();
      const data = JSON.parse(decodeURIComponent(localStorage.getItem("sqlContent")));
      const commitSql = data ? data : { sql: sql_content, limits: limit };
      commitSql.sql.replace(/\s+/g, "").length != 0 && queryBySql(commitSql, false, _tabsList);
      return;
    }
    let index = +activeTabsKey - 1;
    _tabsList = [..._tabsList];
    // name = refs[`search${activeTabsKey}`]?.state.value || '';
    _tabsList[index] = {
      ..._tabsList[index],
      tableData: [],
      total: null
    };
    new Promise((resolve, reject) => {
      // setTabsList(_tabsList);
      setTableResLoading(true);
      resolve();
    }).then(async () => {
      try {
        const params = _tabsList[index].formRef.current.getFieldsValue(true);
        let commitParams = Object.assign({
          size: _tabsList[index].pageSize,
          page: _tabsList[index].pageNo - 1,
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
            let promiseArr = [];
            if (tempCommitParams['subjectId'] == 'all') delete tempCommitParams['subjectId'];//去除‘全部’的id
            if (!sqlSubjectModel.length) {
              promiseArr = [templatePage(tempCommitParams), querySqlSubjectModelList()] //业务域 0524(查看字段功能) add by zhangting
            } else {
              promiseArr = [templatePage(tempCommitParams)];
            }
            let promiseAllList = await Promise.all(promiseArr);
            if (promiseArr.length > 1) {
              let sqlSubjectModel = promiseAllList[1].data || [];
              sqlSubjectModel.unshift({ id: 'all', name: '全部' });
              setSqlSubjectModel(sqlSubjectModel);
            }
            resList = promiseAllList[0];
            break;
        }
        _tabsList[index] = {
          ..._tabsList[index],
          tableData: resList.data?.items.map(item => {
            return {
              ...item,
              lastModifyDate: moment(item?.lastModifyAt).format('YYYY-MM-DD HH:mm:ss') || '',
              createAt: moment(item?.createAt).format('YYYY-MM-DD HH:mm:ss') || '',
              templatePageType: item?.type ? (item.type == 1 ? '个人模板' : '系统模板') : '',
            }
          }),
          total: resList.data?.total,
          tableResLoading: false,
        };
        setTabsList(_tabsList);
        setTableResLoading(false);
      } catch (err) {
        setTableResLoading(false);
      }
    })
  }
  // 智能AI弹框
  const openAICloudPop = () => {
    setAiCloudVisible(true);
  }
  const onCopyAiSql = useCallback(() => {
    setSqlCopied(true);
    message.success('复制成功！')
  }, [])
  const onCancelAiCloud = () => {
    // promptRef.current.resizableTextArea.textArea.value = '';
    // setSearchPrompt('');
    setAiSqlLoading(false);
    setAiSqlText('');
    setAiSqlStep(1);
    setAiSqlDom([]);
    setAiCloudVisible(false);
    formPrompt.resetFields();
  }
  const oneClickGeneration = () => {
    // let prompt_val = promptRef.current.resizableTextArea.textArea.value?.trim() || '';
    let prompt_val = formPrompt.getFieldValue('prompt');
    console.log('formData = ', prompt_val);
    if (prompt_val) {
      let payload = {
        prompt: prompt_val,
        history: []
      }
      setAiSqlStep(2);
      setAiSqlLoading(true);
      chatWithRobot(payload).then(res => {
        console.log('res = ', res);
        setAiSqlText(res?.data.response);
        let result_dom = dealWithSqlStr(res?.data.response);
        setAiSqlDom(result_dom);
        setAiSqlStep(3);
      }).catch(err => {
        message.error(err?.msg || err);
        setAiSqlStep(1);
      }).finally(() => {
        setAiSqlLoading(false);
      })
    } else {
      message.warning('请填写内容！')
    }
  }
  const renderAiSqlDom = (num) => {
    let dom = <div className='sql-start'>暂无咨询结果，请先完成需求咨询</div>;
    switch(num) {
      case 1: break;
      case 2: dom = <div className='sql-waitting'>生成中，请稍后...生成结果将在此展示</div>; break;
      case 3: dom = <div className='step-3-result'>
        <div className='sql-code'>
          {/* <code>{format(`SELECT * FROM users WHERE age &gt; 18 AND gender = 'Female';`, { language: 'sql' })}</code> */}
          {/* <code>{'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}'}</code> */}
          {
            aiSqlDom.map(dom => (dom))
          }
        </div>
      </div>; break;
      default: break;
    }
    return dom;
  }
  const dealWithSqlStr = (str) => {
    let domList = [];
    let strList = str.split('```');
    let times = parseInt((strList.length - 1)/2);
    let k = 0;
    while(times >= 0) {
      let first_i = str.indexOf('```'); // 起始i
      if (first_i === 0) {
        str = str.slice(3);
        let last_i = str.indexOf('```');
        let item_str = str.slice(first_i, last_i);
        last_i = last_i+3;
        str = str.slice(last_i);
        domList.push(<div className='sql-code-0000'><code key={`ai_sql_text_code_${times}`}>{item_str}</code></div>);
        times--;
      } else {
        let d_c = str.slice(k,first_i);
        str = str.slice(first_i);
        domList.push(<div className='normal-div' key={`ai_sql_text_div_${times}`}>{d_c}</div>)
        if (first_i < 0) {
          times--;
        }
      }      
    }
    return domList;
  }
  // const inputWhatYouKnow = (e) => {
  //   console.log('e = ', e);
  //   setSearchPrompt(e.target.value);
  // }
  // 格式化SQL
  const formatSqlContent = () => {
    let sql_content = codemirrorEle.current.editor.getValue().trim();
    // let _sqlContent = format(sqlContentWindow, {language: 'sql'});
    let _sqlContent = format(sql_content, { language: 'sql' });
    codemirrorEle.current.editor.setValue(_sqlContent);
    sqlContentWindow = _sqlContent;
  }
  // 查询结果导出CSV
  const sqlSearchResultDownLoadCsv = () => {
    let codeMirrorEditor = codemirrorEle.current.editor, _sqlContent = '';
    let sql_content = codeMirrorEditor.getValue().trim();
    if (codeMirrorEditor) {
      _sqlContent = codeMirrorEditor.getSelection();
      if (_sqlContent === '') {
        let nameReg = /(.+(?=[;]$))/;
        let str = sql_content;
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
      limits: limit,
      fileName: basicInfo.name || '',
    }
    return commitSql;
  }
  // SQL清空后-初始化
  const initializeSql = () => {
    setBasicInfo({});
    setCurrentDetailType('');
    setCurrentDetailId('');
    sqlContentWindow = '';
    codemirrorEle.current.editor.setValue('');
    codemirrorEle.current.editor.clearHistory();
  }
  // err
  const onCloseSqlRunError = () => {
    setSqlRunError({
      err: false,
      errMsg: '',
    })
  }
  // 上下拽-改变SQL box的高度
  const darggableHeight = (e) => {
    // let resize = document.getElementById('midResizeBox_for_sql');
    let resize = midResizeBox_for_sql.current;
    // let top = document.getElementById('topSqlBox_for_sql');
    let top = topSqlBox_for_sql.current;
    let startY = e.clientY;
    resize.top = resize.offsetTop;
    document.onmousemove = function (e) {
      let endY = e.clientY;
      let moveLen = resize.top + (endY - startY);
      if (moveLen < 293) moveLen = 293;
      resize.style.top = moveLen;
      top.style.height = moveLen + 'px';
      document.getElementById(CodeMirrorContentId).getElementsByClassName('mySpecialCodeMirrorDom')[0].getElementsByClassName('CodeMirror')[0].style.height = (moveLen - 103) + 'px';
    }
    document.onmouseup = function (evt) {
      document.onmousemove = null;
      document.onmouseup = null;
      resize.releaseCapture && resize.releaseCapture();
    }
    resize.setCapture && resize.setCapture();
    return false;
  }
  const getSubjectModel = async () => {
    try {
      const resSubjectModel = await querySubjectModelByLevel({ level: 1 });
      // this.setState({
      //   subjectModel: resSubjectModel.data || [],
      // });
      setSubjectModel(resSubjectModel.data);
    } catch (err) { }
  }
  //单条数据删除
  const confirmDelete = (btnType, id) => {
    let requestApi = btnType == 'template' ? deleteTemplate : deletePersonalQueries;
    requestApi(id).then(res => {
      res.msg == 'success' && message.success('删除成功');
      getTabsList(tabsList);
      //若被删除的id === 当前打开数据的id
      if (id === currentDetailId) {
        setCurrentDetailId(null);
      }
    })
  }
  //切换面板的回调
  const handleTabsChange = (actKey) => {
    console.log('actKey = ', actKey);
    if (actKey == '4' && subjectModel.length == 0) getSubjectModel();
    if (actKey == '1') { // 切换到查询结果，不默认运行sql语句--2022.03.08
      return setActiveTabsKey(actKey);
    };
    setActiveTabsKey(actKey);
    // new Promise((resolve) => {
    //   setActiveTabsKey(actKey);
    //   resolve();
    // }).then(() => {
    //   getTabsList();
    // })
    // getTabsList(tabsList);
  }
  const handleTabsSearch = (tabsKey) => {
    let index = +tabsKey - 1,
      _tabsList = [...tabsList];
    _tabsList[index] = {
      ..._tabsList[index],
      pageNo: 1
    }
    setTabsList(_tabsList);
    getTabsList(_tabsList);
    // new Promise((resolve) => {
    //   setTabsList(_tabsList);
    //   resolve();
    // }).then(() => {
    //   getTabsList()
    // })
  }
  const handleSqlModal = (record) => {
    new Promise((resolve) => {
      setVisibleSql(true);
      setSqlInfo(record.querySql);
      resolve();
    }).then(() => {
      let formData = copySqlForm.current.getFieldsValue();
      formData.sql = record.querySql;
      copySqlForm.current.setFieldsValue(formData);
    })
  }
  const onPageChange = (pageNo, pageSize, tabsKey) => {
    let index = +tabsKey - 1,
      _tabsList = [...tabsList];
    _tabsList[index] = {
      ..._tabsList[index],
      pageNo: pageNo,
      pageSize: pageSize
    };
    getTabsList(_tabsList);
    // new Promise((resolve) => {
    //   setTabsList(_tabsList);
    //   resolve();
    // }).then(() => {
    //   getTabsList();
    // })
  }
  // 导出接口
  const downLoadCsv = () => {
    const downObj = sqlSearchResultDownLoadCsv();
    setEmailModalData({
      ...emailModalData,
      visibleEmailInfo: true,
      downLoadApi: downLoadCsvForSqlFinish, // downLoadCsvForSqlPrestoSearchResult,
      // downLoadCsvForSqlFinish,downLoadCsvForSqlReady
      downLoadParams: downObj,
      needCycle: true,
      cycleFun: getSqlRunResultBoolean,
      downLoadId: downLoadCsvForSqlReady,
    })
  }

  /**
   * 根据用户输入的代名词，匹配实际的库表名称
   * 
   */
  const eachWord = (lineText, f) => {
    let words = lineText.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (words[i]) {
        f(words[i].replace(/[,;]/g, ''));
      }
    }
  }
  const getIdentifierQuote = (editor) => {
    var mode = editor.doc.modeOption;
    if (mode === "sql") mode = "text/x-sql";
    return CodeMirror.resolveMode(mode).identifierQuote || "`";
  }
  const fetchStartPoint = (token) => {//根据token获取截取开始的位置
    let index = token.string.lastIndexOf("\.");
    if (index < 0) {
      return token.start;
    } else {
      return token.start + index + 1;
    }
  }
  const cleanName = (name, identifierQuote) => {
    // 获取名称并且去除“.”
    if (name.charAt(0) == ".") {
      name = name.substr(1);
    }
    // 使用单引号替换双引号
    // 并且去除单个引号
    let nameParts = name.split(identifierQuote + identifierQuote);
    for (let i = 0; i < nameParts.length; i++) {
      nameParts[i] = nameParts[i].replace(new RegExp(identifierQuote, "g"), "");
    }
    return nameParts.join(identifierQuote);
  }
  const getTableByAllTableName = (allTableName) => {//根据全表名从tables中获取表Obj。如果找不到该表，则返回null。全表名用“.”分割。
    let nameParts = allTableName.split(".");
    // let theTable = tables;
    let theTable = sqlHintOptionsWindow;
    // let theTable = JSON.parse(JSON.stringify(stateRef.current));
    // if (nameParts.length === 2) {
    //   await getSqlTableBySchema(nameParts[1]).then(res => {
    //   }).catch(() => {

    //   })
    // }
    for (let i = 0; i < nameParts.length; i++) {
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
  const findTableByAlias = (alias, editor) => {//尝试通过昵称查询表名
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
        eachWord(lineText, function (word) {
          let wordUpperCase = word.toUpperCase();
          if (wordUpperCase === aliasUpperCase && getTableByAllTableName(previousWord)) {
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
  //运行
  const getSqlList = (loading) => {
    let sql_content = codemirrorEle.current.editor.getValue().trim();
    if (!sql_content) {
      message.warning('SQL语句不能为空！')
      return
    }
    let codeMirrorEditor = codemirrorEle.current.editor, _sqlContent = '';
    if (codeMirrorEditor) {
      _sqlContent = codeMirrorEditor.getSelection();
      if (_sqlContent === '') {
        let nameReg = /(.+(?=[;]$))/;
        let str = sql_content; // sqlContentWindow.trim();
        if (str.endsWith(';')) {
          _sqlContent = `${str.split(';')[str.split(';').length - 2]};`;
        } else {
          _sqlContent = str.split(';').pop();
        }
      }
    }
    if (loading) {
      cancelSqlRequest();
      return;
    }
    let _tabsList = [...tabsList]
    _tabsList[0] = {
      ..._tabsList[0],
      loading: true,
      tableData: [],
      columns: [],
      defcolumns: [],
      filterOptions: [],
      checkedValue: [],
      pageNo: 1,
      pageSize: 20,
    }
    new Promise((resolve) => {
      setTabsList(_tabsList);
      resolve();
    }).then(() => {
      const commitSql = { sql: _sqlContent, limits: limit };
      queryBySql(commitSql, true, _tabsList);
    })
  }

  //取消运行
  const cancelSqlRequest = () => {
    if (requestCancel.cancel) {
      requestCancel.cancel()
    }
    requestCancel = {}
    clearInterval(resultTimer.current);
    let _tabsList = [...tabsList]
    _tabsList[0] = {
      ..._tabsList[0],
      loading: false,
      tableData: [],
      columns: [],
      defcolumns: [],
      filterOptions: [],
      checkedValue: [],
    }
    setTabsList(_tabsList);
    setTableResLoading(false);
  }
  //单条数据打开
  const handleSwitchSql = (btnType, record) => {
    let sql_content = codemirrorEle.current.editor.getValue().trim();
    // if (sqlContentWindow.replace(/\s+/g, "").length != 0) {
    if (sql_content.replace(/\s+/g, "").length != 0) {
      Modal.confirm({
        centered: true,
        width: 354,
        title: '切换查询提示',
        content: '打开保存过的查询会丢失当前页面的SQL信息，是否确定',
        okText: "确定",
        cancelText: "取消",
        onOk () {
          handleDetails(btnType, record.id, record)
        }
      })
      return;
    }
    handleDetails(btnType, record.id, record)
  }
  //详情
  const handleDetails = (btnType, id, record) => {
    if (btnType === 'template' && Object.prototype.hasOwnProperty.call(record, 'id')) {
      // 埋点start
      const currentUserInfo = localStorage.getItem('USER_INFO');
      let _operatorId = '', _operatorName = '';
      if (currentUserInfo) {
        let info = JSON.parse(currentUserInfo);
        _operatorId = info?.employeeNumber;
        _operatorName = `${info?.chineseName}（${info?.firstName} ${info?.lastName}）`;
      }
      console.log('props = ', props);
      const obj = {
        // templateName: record.name,
        templateId: record.id,
        // businessDomain: record.subjectName,
        // businessDomainId: record.subjectId,
        // operatorId: _operatorId,
        // operatorName: _operatorName,
      }
      viewSqlTemplateForSqlSearch(obj).then(res => {
        // console.log('埋点成功')
      }).catch(() => {
        // console.log('埋点失败')
      })
      // 埋点over
    }
    let requestApi = btnType == 'template' ? getDetailTemplate : getDetailPersonalQueries;
    requestApi(id).then(res => {
      new Promise((resolve) => {
        setLimit(res.data?.limits);
        setBasicInfo({
          name: res.data?.name,
          subjectId: res.data?.subjectId,
          description: res.data?.description,
          id: res.data?.id,
        });
        setCurrentDetailType(btnType);
        setCurrentDetailId(res.data?.id);
        resolve();
      }).then(() => {
        sqlContentWindow = res.data?.sqlContent;
        codemirrorEle.current.editor.setValue(res.data?.sqlContent);
      })
    })
  }
  //创建调度
  const onCreateSchedule = (record) => {
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
  //保存、保存模板
  const handleSave = (btnType) => {
    let sql_content = codemirrorEle.current.editor.getValue().trim();
    if (!sql_content) {
      message.warning('SQL语句不能为空！')
      return
    }
    btnType === 'template' && getSubjectModel();
    if (currentDetailType != '') {
      let _basicInfo = { ...basicInfo };
      if (currentDetailType !== btnType) { delete _basicInfo?.id }
      if (currentDetailType === btnType) {
        _basicInfo = {
          ..._basicInfo,
          id: currentDetailId
        }
        setBasicInfo(_basicInfo);
      }
    }
    setVisibleBasicInfo(true);
    setModalType(btnType);
  }
  //基本信息弹框的的“保存”、“取消”、“另存为”
  const handleBasicInfo = async (btnType) => {
    let sql_content = codemirrorEle.current.editor.getValue().trim();
    if (btnType == 'add' || btnType == 'update') {
      try {
        const values = await formRefBasicInfo.current.validateFields();
        let params = {
          ...values,
          sqlContent: encode(sql_content), // encode(sqlContentWindow),
          limits: limit,
          type: modalType === 'template' ? 1 : 0
        }
        let _tabsList = [...tabsList]
        if (modalType === 'template') _tabsList[3] = { ..._tabsList[3], loading: true }
        if (modalType === 'search') _tabsList[1] = { ..._tabsList[1], loading: true }
        if (btnType == 'add') setSaveAsLoading(true);
        if (btnType == 'update') setSaveLoading(true);
        new Promise((resolve) => {
          setIsLoading(true);
          // setTabsList(_tabsList);
          resolve();
        }).then(() => {
          let requestApi = btnType == 'add' ? saveTemplate : editTemplate;
          if (btnType == 'update') {
            params.id = basicInfo.id;
            requestApi = modalType === 'template' ? editTemplate : editPersonalQueries;
          };
          if (btnType == 'add') {
            delete params.id
            requestApi = modalType === 'template' ? saveTemplate : savePersonalQueries;
          };
          requestApi(params).then(res => {
            if (res.code === '00000') {
              if (modalType === 'template') _tabsList[3] = { ..._tabsList[3], loading: false }
              if (modalType === 'search') _tabsList[1] = { ..._tabsList[1], loading: false }
              // 初次保存查询、保存模板、页面刷新成当前保存状态的详情
              // 更新也要保存，最新的状态详情
              if (btnType === 'add' && modalType === 'template') {
                let record = Object.assign(res.data, {
                  name: '',
                  id: '',
                  subjectName: '',
                  subjectId: ''
                })
                handleDetails('template', res.data.id, record);
              } else if (btnType === 'add' && modalType === 'search') {
                handleDetails('search', res.data, {});
              } else if (btnType === 'update' && modalType === 'template') {
                let record = Object.assign(params, {
                  name: '',
                  id: '',
                  subjectName: '',
                  subjectId: ''
                })
                handleDetails('template', params.id, record);
              } else if (btnType === 'update' && modalType === 'search') {
                handleDetails('search', params.id, {});
              }
              // new Promise((resolve) => {
              let toKey = modalType === 'template' ? '4' : '2';
              setActiveTabsKey(toKey);

              setIsLoading(false);
              setSaveLoading(false);
              setSaveAsLoading(false);
              setVisibleBasicInfo(false);
              // setTabsList(_tabsList);
              // resolve();
              // }).then(() => {
              // getTabsList()
              // });
              if (activeTabsKey === toKey) {
                // getTabsList();
                getTabsList(_tabsList);
              }
            }
          }).catch(err => {
            err.msg && message.error(err.msg);
            if (modalType === 'template') _tabsList[3] = { ..._tabsList[3], loading: false }
            if (modalType === 'search') _tabsList[1] = { ..._tabsList[1], loading: false }
            setIsLoading(false);
            setSaveLoading(false);
            setSaveAsLoading(false);
            setVisibleBasicInfo(false);
            setTabsList(_tabsList);
          })
        })
      } catch (errorInfo) {
        console.log('Failed:', errorInfo);
      }
      return
    }
    setVisibleBasicInfo(false);
  }
  //查看字段的搜索
  const handleSearchField = (keyWords_) => {
    new Promise((resolve) => {
      setFieldInfoLoading(true);
      setFieldInfoDataList([]);
      resolve();
    }).then(() => {
      const name = keyWords_ || ''; // queryFieldKeywords.current.state.value;
      let _fieldInfo = { ...fieldInfo };
      queryFieldInfoByTable({
        dbname: _fieldInfo.schemaName,
        tableName: _fieldInfo.tableName,
        name
      }).then(resList => {
        let _fieldInfoDataList = resList.data || [];
        _fieldInfoDataList.forEach((item, index) => {
          item.tableIndex = index + 1;
        })
        setFieldInfoDataList(_fieldInfoDataList);
        setFieldInfoLoading(false);
      }).catch(errInfo => {
        errInfo.msg && message.error(errInfo.msg);
        setFieldInfoLoading(false);
      })
    })
  }

  const handleExploreForDownloadData = (data) => {
    if (data.operation === 'ok') {
      // 此处需要循环
      const res = data.downResponse;
      const url = window.URL.createObjectURL(new Blob([res.fileBlob], { type: 'application/octet-stream' }))
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      let downName = res.fileName.replace(/"|'/g, '');
      link.setAttribute('download', downName);
      document.body.appendChild(link)
      link.click();
      document.body.removeChild(link);
      setIsLoading(false);
      setEmailModalData({
        ...emailModalData,
        visibleEmailInfo: false,
        isLoading: false,
      })
    } else if (data.operation === 'cancel') {
      setIsLoading(false);
      setEmailModalData({
        ...emailModalData,
        visibleEmailInfo: false,
        isLoading: false,
      })
    }
  }

  const handleExploreForDownloadData2 = (data) => {
    if (data.operation === 'ok') {
      if (emailModalData.isStaff) {
        console.log('雇员取当前用户的邮箱，非雇员才取输入的邮箱')
      }
      new Promise((resolve) => {
        setIsLoading(true);
        setEmailModalData({
          ...emailModalData,
          isLoading: true,
        })
        resolve();
      }).then(() => {
        const downObj = sqlSearchResultDownLoadCsv();
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
          setIsLoading(false);
          setEmailModalData({
            ...emailModalData,
            visibleEmailInfo: false,
            isLoading: false,
          })
        }).catch(err => {
          message.error('下载失败');
          setIsLoading(false);
        })
      })
    } else if (data.operation === 'cancel') {
      setIsLoading(false);
      setEmailModalData({
        ...emailModalData,
        visibleEmailInfo: false,
        isLoading: false,
      })
    }
  }

  let modalFooter = [
    <Button key="cancel" onClick={() => handleBasicInfo('cancel')}>取消</Button>,
    <Button key="save" type="primary" loading={basicInfo.id ? saveLoading : saveAsLoading} onClick={() => handleBasicInfo(basicInfo.id ? 'update' : 'add')}>{basicInfo.id ? '更新' : '保存'}</Button>
  ]
  basicInfo.id && modalFooter.splice(1, 0, <Button key="as" loading={saveAsLoading} onClick={() => handleBasicInfo('add')}>另存为</Button>)
  return (<Spin spinning={isLoading}><div className="right-sql-box-item">
    <div ref={topSqlBox_for_sql} className="oap-card">
      <div className="oap-card-top">
        <Row className="oap-row" justify="space-between">
          <Col style={{ minWidth: '452px', width: '62%' }}>
            <div className="oap-card-top-title">
              <Tooltip title={basicInfo.name ? basicInfo.name : 'SQL分析'}>
                <div className="title ellipsis">
                  {basicInfo.name ? basicInfo.name : 'SQL分析'}
                </div>
              </Tooltip>
            </div>
          </Col>
          <Col flex="420px" className="oap-flex-row oap-flex-row-to-right">
            <Space>
              <div className="oap-sql-limit">
                <span style={{ lineHeight: '36px' }}>LIMIT</span>
                <Select options={SQL_LIMITS_LIST} value={limit} onChange={(value) => handleLimitChange(value)}></Select>
              </div>
              {checkMyPermission('oap:sql:personalQueries') ? <Button
                loading={tabsList[1].loading}
                onClick={() => handleSave('search')}>保存</Button> : null}
              {checkMyPermission('oap:sql:query') ? <Button type={sqlContentWindow.replace(/\s+/g, "").length == 0 ? 'primary' : 'primary'}
                onClick={() => getSqlList(tabsList[0].loading)}>{tabsList[0]?.loading ? '取消运行' : '运行'}</Button> : null}
            </Space>
          </Col>
        </Row>
      </div>
      <div className="special-code-mirror-dom-content" id={CodeMirrorContentId}>
        <div className="code-mirror-left-tools">
          <Button
            size="small"
            type="text"
            title={tabsList[0]?.loading ? '取消运行' : '运行'}
            icon={<IconPlay className={tableResLoading ? "oap-sql-run-btn-icon no-sql-statement" : "oap-sql-run-btn-icon"} />}
            disabled={tableResLoading}
            onClick={() => getSqlList(tabsList[0].loading)}>
          </Button>
        </div>
        <CodeMirrorDom
          ref={codemirrorEle}
          className="mySpecialCodeMirrorDom"
          value={sqlContentWindow}
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
              tables: sqlHintOptions,
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
              let identifierQuote = getIdentifierQuote(editor);
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

                nameParts.unshift(cleanName(token.string, identifierQuote));

                token = editor.getTokenAt(Pos(cur.line, token.start));
                if (token.string == ".") {
                  cont = true;
                  token = editor.getTokenAt(Pos(cur.line, token.start));
                }
              }
              let theLastString = nameParts.pop();
              let allTableName = nameParts.join('.');
              let theTable = getTableByAllTableName(allTableName);
              if (theTable == null && nameParts.length > 0) {//如果不能根据全表名获取到Obj，并且nameParts长度为1，则尝试根据表昵称获取表Obj
                let theTableName = findTableByAlias(nameParts[0], editor);
                nameParts.splice(0, 1, ...theTableName.split('.'));
              }
              if (nameParts.length === 2 && !theLastString) {
                let _schemaName = [...nameParts].pop();
                getSqlTableBySchema(_schemaName).then(res => {
                  // let _sqlHintOptions = {...sqlHintOptions};
                  // let _sqlHintOptions = JSON.parse(JSON.stringify(stateRef.current));
                  let _sqlHintOptions = { ...sqlHintOptionsWindow };
                  let obj = {};
                  res?.data.forEach(it => {
                    obj[it.tableName] = {};
                  })
                  _sqlHintOptions[nameParts[0]][nameParts[1]] = obj;
                  // setState((state) => ({
                  //   ...state,
                  //   sqlHintOptions: _sqlHintOptions
                  // }), () => {
                  //   editor.setCursor({
                  //     line: cur.line,
                  //     ch: cur.ch,
                  //   })
                  //   editor.showHint();
                  // })
                  new Promise((resolve, reject) => {
                    console.log('................2')
                    setSqlHintOptions(_sqlHintOptions);
                    resolve();
                  }).then(res => {
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
                  // let _sqlHintOptions = {...sqlHintOptions}; // JSON.parse(JSON.stringify(sqlHintOptions));
                  // let _sqlHintOptions = JSON.parse(JSON.stringify(stateRef.current));
                  let _sqlHintOptions = { ...sqlHintOptionsWindow };
                  let obj = {};
                  res?.data.forEach(it => {
                    obj[it.column] = {};
                  })
                  _sqlHintOptions[nameParts[0]][nameParts[1]][nameParts[2]] = obj;
                  // setState(state => ({
                  //   ...state,
                  //   sqlHintOptions: _sqlHintOptions
                  // }), () => {
                  //   // 此处增加插入光标函数，防止插入sql语句时，停顿一会儿光标跑最后面去了
                  //   editor.setCursor({
                  //     line: cur.line,
                  //     ch: cur.ch,
                  //   })
                  //   editor.showHint();
                  // })
                  new Promise((resolve, reject) => {
                    console.log('................3')
                    setSqlHintOptions(_sqlHintOptions);
                    resolve();
                  }).then(res => {
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
            if (!runLight && value) {
              console.log('亮了 = ');
              setRunLight(true);
            }
            if (runLight && !value) {
              console.log('灭了 = ');
              setRunLight(false);
            }
            // sqlContent = value;
            sqlContentWindow = value;
            console.log('sqlContentWindow = ', sqlContentWindow)
            debounceFn(value, basicInfo.name, limit);
            if (['+input'].includes(data.origin) && data.text[0] !== ' ' && data.text[0] !== ';' && data.text[0] !== '') {
              setTimeout(function () { editor.execCommand("autocomplete"); }, 100);
            }
          }}
        />
      </div>
      <div className="oap-sql-btn">
        <Space>
          {/* 生产暂时屏蔽 */}
          {/* {checkMyPermission('oap:ai:chat') && <Button
            type="text"
            icon={<IconAiCloud />}
            className="oap-sql-aiRobotBtn"
            onClick={openAICloudPop}>智能SQL助手</Button>} */}
          <Button
            type="text"
            icon={<SvgIcon icon='format_shua' />}
            className="oap-sql-formatBtn"
            onClick={formatSqlContent}>格式化SQL</Button>
          <Button
            type="text"
            icon={<IconClearUp />}
            className="oap-sql-clearBtn"
            onClick={initializeSql}>清空窗口</Button>
        </Space>
      </div>
    </div>
    {sqlRunError.err ? <div className="message-custom-style">
      <span>{sqlRunError.errMsg}</span>
      <IconClose
        onClick={onCloseSqlRunError}
        style={{ color: "#999", cursor: "pointer", fontSize: 12, position: 'absolute', top: '2px', right: '1px' }}
      />
    </div> : null}
    <div className='midResizeBox_for_sql' ref={midResizeBox_for_sql} style={{ width: '100%', height: '0px', border: '8px solid #f6f6f6', cursor: 'ns-resize' }} onMouseDown={darggableHeight}></div>
    <div className="table-top-wrap oap-card oap-sqlList" style={{ flex: '1' }} key="no-need-refresh">
      {<Spin spinning={tableResLoading}>
        <Tabs
          key="just-for-sql"
          type="card"
          activeKey={activeTabsKey}
          onChange={(activeKey) => handleTabsChange(activeKey)}>
          {
            tabsList.map(tabs => {
              return <Tabs.TabPane tab={tabs.tabsTitle} key={tabs.key} forceRender={true}>
                {tabs.showSearch ? <Form
                  className="search-form"
                  ref={tabs.formRef}
                  layout="vertical"
                  size="middle"
                  initialValues={{
                    subjectId: 'all'
                  }}>
                  <div className="search-area oap-sql-search-area">
                    <Row gutter={32}>
                      {tabs.showSqlSubjectSearch ? <Col span={3}>
                        <Form.Item name="subjectId">
                          <Select placeholder='请选择' onChange={() => handleTabsSearch(tabs.key)}>
                            {sqlSubjectModel.map(model => {
                              return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
                            })}
                          </Select>
                        </Form.Item>
                      </Col> : null}
                      <Col span={3}>
                        <Form.Item>
                          <Input.Group compact className="oap-analysis-localSearch">
                            <Form.Item name="name" noStyle>
                              <Input
                                ref={`search${tabs.key}`}
                                style={{ width: `calc(100% - 66px)` }}
                                placeholder="输入名称"
                                allowClear />
                            </Form.Item>
                            <span style={{ display: 'inline-flex', width: `56px` }}>
                              <Button
                                style={{ padding: 0, margin: 0, minWidth: `56px`, height: `36px`, borderLeft: 'none', borderRadius: '0 4px 4px 0', borderColor: '#e1e1e1' }}
                                icon={<IconSearch />}
                                onClick={() => handleTabsSearch(tabs.key)}>
                              </Button>
                            </span>
                          </Input.Group>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                </Form> : null}
                {tabs.showExportCsv ? <Row>
                  <Col span={4}>
                    {checkMyPermission('oap:sql:download') ? <Space><Button type={!runLight ? '' : 'primary'} disabled={!runLight} onClick={() => downLoadCsv()}>导出CSV</Button></Space> : null}
                  </Col>
                </Row> : null}
                <div className="table-top-wrap" style={{ padding: '0' }}>
                  <Table
                    rowKey="id"
                    tableKey={`sql_list_${tabs.key}_${Date.now()}`}
                    columns={tabs.columns}
                    dataSource={tabs.tableData}
                    allFilterColumns={tabs.checkedValue}
                    pagination={{
                      showQuickJumper: true,
                      showSizeChanger: true,
                      pageSize: tabs.pageSize,
                      current: tabs.pageNo,
                      total: tabs.total,
                      onChange: (pageNo, pageSize) => onPageChange(pageNo, pageSize, tabs.key)
                    }}
                    scroll={{ x: '100%' }}
                  />
                </div>
              </Tabs.TabPane>
            })
          }
        </Tabs>
      </Spin>}
    </div>
    <Modal
      title={modalType == 'template' ? '保存模板' : '保存查询'}
      visible={visibleBasicInfo}
      className="basicInfo"
      zIndex={1030}
      onCancel={() => handleBasicInfo('cancel')}
      footer={modalFooter}>
      <div className="table-container">
        <Form
          ref={formRefBasicInfo}
          layout="vertical"
          size="middle"
          initialValues={basicInfo}>
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
          {modalType === 'template' ? <Form.Item
            name="subjectId"
            label="业务域"
            rules={[
              {
                required: true,
                message: '请选择'
              }
            ]}>
            <Select placeholder='请选择'>
              {subjectModel.map(model => {
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
      title="SQL"
      visible={visibleSql}
      className="basicInfo"
      zIndex={1030}
      onCancel={() => setVisibleSql(false)}
      footer={[
        <CopyToClipboard key={`copy_${props.sqlKey}`} text={sqlInfo} onCopy={onCopyFixBug}><Button type="primary">复制SQL</Button></CopyToClipboard>
        // <Button key={`copy_${props.sqlKey}`} type="primary" onClick={onCopySql}>复制SQL</Button>
      ]}>
      <div className="table-container">
        <Form
          ref={copySqlForm}
          layout="vertical"
          size="middle"
          initialValues={{
            sql: sqlInfo
          }}>
          <Form.Item name="sql">
            <Input.TextArea rows={6} disabled />
          </Form.Item>
        </Form>
      </div>
    </Modal>
    <Modal
      width={600}
      centered
      title={`查看${fieldInfo.schemaName}.${fieldInfo.tableName}`}
      visible={fieldInfoVisible}
      footer={[
        <Button key="close" onClick={onCancelFieldInfo}>关闭</Button>
      ]}
      onCancel={onCancelFieldInfo}
      bodyStyle={{ maxHeight: '60vh' }}
      className="oap-sheet-detailInfo">
      <Row>
        <Col span={6}>
          <SearchInput placeholder={'请输入字段名或字段含义'} btnWidth={56} disabled={false} onSearch={(str) => handleSearchField(str)} />
        </Col>
      </Row>
      <div style={{ fontSize: '14px', margin: '6px 0' }}>总共<b style={{ color: '#1890FF', margin: '0 4px' }}>{fieldInfoDataList.length}</b>条记录</div>
      <Table
        rowKey="id"
        columns={fieldInfoColumns}
        dataSource={fieldInfoDataList}
        loading={fieldInfoLoading}
      />
    </Modal>
    <Modal
      width={800}
      centered
      title={`智能SQL助手`}
      visible={aiCloudVisible}
      footer={[
        <Button key="close" onClick={onCancelAiCloud}>关闭</Button>
      ]}
      onCancel={onCancelAiCloud}
      bodyStyle={{ maxHeight: '80vh' }}
    >
      <div className='oap-sql-ai-cloud-dialog'>
        <div className='first-step-content common-step'>
          <div className='common-title-h4' style={{ position: 'relative' }}>
            <div className='common-title-item'>咨询需求</div>
            <i className='left-icon'></i>
          </div>
          <div className='main-content'>
            {/* <div className='description-words'>
              <span className='left-desc'>咨询内容</span>
              <span className='right-desc'>今日可生成次数：39/50次，每日0:00重置可用次数</span>
            </div> */}
            <div className='textarea-content' style={{marginTop: 20}}>
              <Form
                form={formPrompt}
              >
                <Form.Item name="prompt" style={{marginBottom: 0}}>
                  <Input.TextArea ref={promptRef} allowClear placeholder={`例：请介绍下Trino的时间转换函数`} style={{height: 120}} showCount maxLength={500} />
                </Form.Item>
              </Form>
              {/* <Input.TextArea ref={promptRef} allowClear placeholder={`例：请介绍下Trino的时间转换函数`} style={{height: 120}} showCount maxLength={500} /> */}
              {/* <Input.TextArea ref={promptRef} defaultValue={searchPrompt} allowClear placeholder={`请输入SQL相关的问题咨询，比如函数使用方法或SQL代码生成 \n例1：请告诉我Trino引擎时间转换函数的使用方法 \n例2：假设有个订单表，包含字段net,amount,order_id,uscode, 请统计每个uscode的订单总数`} style={{height: 120}} showCount maxLength={500} /> */}
            </div>
            <div className='custom-button'>
              {/* <Spin spinning={aiSqlLoading}> */}
                <Button loading={aiSqlLoading} type='primary' style={{marginRight: '10px'}} onClick={oneClickGeneration}>一键生成</Button>
                <span className='btn-fun-desc'>生成结果需要1-2min时间</span>
              {/* </Spin> */}
            </div>
            
          </div>
        </div>
        <div className='second-step-content common-step'>
          <div className='common-title-h4' style={{ position: 'relative' }}>
            <div className='common-title-item'>生成结果</div>
            <i className='left-icon'></i>
          </div>
          <Spin spinning={aiSqlLoading}>
            <div className='result-content'>
              {
                renderAiSqlDom(aiSqlStep)
              }
              {/* <div className='sql-start'>请输入咨询需求，开始一键生成回答</div>
              <Spin spinning={aiSqlLoading}>
                <div className='sql-waitting'>生成中，请稍后...生成结果将在此展示</div>
              </Spin>
              <div className='sql-code'>
                <code>{'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}'}</code>
              </div>
              <div className='custom-button'>
                <Button type='primary' style={{marginRight: '10px', marginTop: 20}}>复制结果</Button>
                <CopyToClipboard key={`copy_ai_cloud`} text={aiSqlText} onCopy={onCopyAiSql}><Button type="primary" style={{marginRight: '10px', marginTop: 20}}>复制结果</Button></CopyToClipboard>
                <span className='btn-fun-desc'>如果对结果不满意，请优化咨询需求的描述</span>
              </div> */}
            </div>
            {
              aiSqlStep == 3 ? <div className='custom-button'>
                <CopyToClipboard key={`copy_ai_cloud`} text={aiSqlText} onCopy={onCopyAiSql}><Button type="primary" style={{marginRight: '10px', marginTop: 20, marginLeft: 8}}>复制结果</Button></CopyToClipboard>
                <span className='btn-fun-desc'>如果对结果不满意，请优化咨询需求的描述</span>
              </div>: null
            }
          </Spin>
        </div>
      </div>
    </Modal>
    <ExploreEmailModal onExplored={handleExploreForDownloadData} {...emailModalData} />
  </div></Spin>)
})

export default SqlBody;