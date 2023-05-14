import React, { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react';
import {
    Spin, Checkbox, Button, Form, DatePicker, Table, Tooltip, message, Input, Select, TreeSelect, Radio
} from '@aurum/pfe-ui';
import {
    IconAddA, IconDateA, IconProductionCColorFill, IconSearch
} from '@aurum/icons';
import {
    getTopCheckOptions,
    getDemandBoardTop,
    getSpintList,
    getTableListByType,
} from '@/api/oap/demand_dashboard.js';
import '@/style/demand-dashboard.less';
import moment from 'moment';
import ReactECharts from 'echarts-for-react';
import { numToMoneyField } from '@/utils/store/func.js';
import is_compeleted_img from '@/locales/images/is_compeleted.png';
import is_online_img from '@/locales/images/is_online.png';

// import report from "@/assets/imgs/report.png";

// const checkOptions = ['我的', 'People', '货', '场', 'Others'];
// const defaultCheckedList = ['我的', 'People', '货', '场', 'Others'];
// const checkOptions = [{label: 'Mine',value:'Owner'}, {label: 'People',value:'People'}, {label: 'Product',value:'Product'}, {label: 'Place',value:'Place'}, {label: 'Others',value:'Others'}];
const defaultCheckedList = []; // ['Owner', 'People', 'Product', 'Place', 'Others'];
// const defaultCheckedList = [{label: '我的',value:'mine'}, {label: 'People',value:'people'}, {label: '货',value:'goods'}, {label: '场',value:'scene'}, {label: 'Others',value:'others'}];
const checkedValueForDevoloping = ['tableIndex', 'summary', 'requester', 'businessFunction', 'dataBp', 'timeSpent', 'requestedDate']; // ['demandName','demander','BU','dataBP','estimatedWorkload','date'];
// const checkedValueForScheduling = ['jiraLink'];
const dateFormat = 'YYYY-MM-DD';
function getCurrentYearFirstDay (toDay) {
    let l = toDay.split('-');
    return `${l[0]}-01-01`;
}
function getBeforeHalfYear (toDay) {
    let n = moment(toDay).valueOf();
    let f = n - 180 * 24 * 3600 * 1000;
    return moment(f).format(dateFormat);
}
let toDay = moment(Date.now()).format(dateFormat);
// let timeStart = getCurrentYearFirstDay(toDay); // moment(new Date('2022-01-01 00:00')).format(dateFormat);
let timeStart = getBeforeHalfYear(toDay);
const defaultDateRange = [timeStart, toDay];
const treeDataList = [{
    label: '全部',
    value: '0-0',
    key: '0-0',
    children: [
        {
            label: 'Child Node1',
            value: '0-0-0',
            key: '0-0-0',
        },
    ],
}]
const Dashboard = forwardRef((props, ref) => {
    const [loading, setLoading] = useState(false);
    const [lineBarLoading, setLineBarLoading] = useState(false);
    const [checkOptions, setCheckOptions] = useState([]);
    const [checkedList, setCheckedList] = useState(defaultCheckedList);
    // const [checkedValue, setCheckedValue] = useState('');
    const [indeterminate, setIndeterminate] = useState(false);
    const [checkAll, setCheckAll] = useState(true);
    const [chooseDate, setChooseDate] = useState(defaultDateRange);
    const [lineBar, setLineBar] = useState({
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            }
        },
        legend: {
            orient: 'vertical',
            right: 0,
            top: 0,
            data: ['全部需求', '已上线需求', '实际记录的工作量']
        },
        grid: {
            top: '10%',
            left: '3%',
            right: '150',
            bottom: '4%',
            containLabel: true,
        },
        xAxis: [
            {
                type: 'category',
                data: [],
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                axisLabel: {
                    formatter: '{value}'
                },
                splitLine: { show: false },
            },
            {
                type: 'value',
                axisLabel: {
                    formatter: '{value}'
                },
                splitLine: { show: false },
            }
        ],
        series: [
            {
                name: '全部需求',
                type: 'bar',
                itemStyle: {
                    normal: {
                        color: '#FFBC0D'
                    }
                },
                barGap: '0',
                yAxisIndex: 0,
                tooltip: {
                    valueFormatter: function (value) {
                        return value;
                    }
                },
                data: []
            },
            {
                name: '已上线需求',
                type: 'bar',
                itemStyle: {
                    normal: {
                        color: '#DB0007'
                    }
                },
                yAxisIndex: 0,
                barGap: '0',
                tooltip: {
                    valueFormatter: function (value) {
                        return value;
                    }
                },
                data: []
            },
            {
                name: '实际记录的工作量',
                type: 'line',
                itemStyle: {
                    normal: {
                        color: '#4EBE77'
                    }
                },
                yAxisIndex: 1,
                tooltip: {
                    valueFormatter: function (value) {
                        return value;
                    }
                },
                data: []
            }
        ]
    });

    const willSearchFilter = useRef();
    const [statusCount, setStatusCount] = useState({
        alreadySubmitDemandSum: 0,
        underDevelopmentDemandSum: 0,
        alreadyOnlineDemandSum: 0
    });
    const [commonColumn, setCommonColumn] = useState([
        { title: '序号', dataIndex: 'tableIndex', width: 70 },
        {
            title: '需求名称', dataIndex: 'summary', width: 300,
            align: 'left',
            ellipsis: true,
            render: (text, record) => (<Tooltip placement="topLeft" title={record.summary} key={record.id}><a onClick={() => goDeail(record)} style={{ cursor: 'pointer' }}>{record.summary}（{record.issueKey}）</a></Tooltip>)
        },
        { title: '需求提出人', dataIndex: 'requester', width: 150 },
        { title: 'BU', dataIndex: 'businessFunction', width: 100 },
        { title: 'Data BP', dataIndex: 'dataBp', width: 150 },
        { title: '预计工作量', dataIndex: 'estimatedWorkload', width: 100 },
        { title: '需求提出日期', dataIndex: 'requestedDate', width: 120, align: 'left' },
    ])
    const [devolopingColumn, setDevolopingColumn] = useState([
        { title: '序号', dataIndex: 'tableIndex', width: 70 },
        {
            title: '需求名称', dataIndex: 'summary', minWidth: 300,
            align: 'left',
            ellipsis: true,
            render: (text, record) => (<Tooltip placement="topLeft" title={record.summary} key={record.id}><a onClick={() => goDeail(record)} style={{ cursor: 'pointer' }}>{record.summary}（{record.issueKey}）</a></Tooltip>)
        },
        { title: '需求提出人', dataIndex: 'requester', width: 150 },
        { title: 'BU', dataIndex: 'businessFunction', width: 100 },
        { title: '产品经理', dataIndex: 'productManager', width: 150 },
        { title: 'Data BP', dataIndex: 'dataBp', width: 150 },
        { title: '需求状态', dataIndex: 'status', width: 150 },
        { title: '预计工作量', dataIndex: 'estimatedWorkload', width: 100 },
        { title: '需求提出日期', dataIndex: 'requestedDate', width: 120 },
        { title: '预计开始日期', dataIndex: 'estimatedStartDate', width: 120 },
        { title: '预计上线日期', dataIndex: 'expectedLaunchDate', width: 120, align: 'left' },
    ]);
    // const waittingColumn = [
    //     { title: '序号', dataIndex:'tableIndex', width: 80},
    //     { title: '需求名称', dataIndex:'summary', width: 350,
    //       align: 'left',
    //       ellipsis: true,
    //       render: (text, record) => (<Tooltip placement="topLeft" title={record.summary} key={record.id}><a onClick={() => goDeail(record)} style={{cursor: 'pointer'}}>{record.summary}</a></Tooltip>)
    //     },
    //     { title: '需求提出人', dataIndex:'requester', width: 150},
    //     { title: 'BU', dataIndex:'businessFunction', width: 150},
    //     { title: 'Data BP', dataIndex:'dataBp', width: 150},
    //     { title: '预计工作量', dataIndex:'timeSpent', width: 150},
    //     { title: '需求提出日期', dataIndex:'requestedDate', width: 150, align: 'left'},
    // ]
    useImperativeHandle(ref, () => ({
        getFullData
    }))
    const goDeail = (record) => {
        props.addNewTab(record.issueKey, 'edit');
    }
    // const [schedulingColumn, setSchedulingColumn] = useState([]);
    // const [onlineColumn, setOnlineColumn] = useState([]);
    // const [waittingColumn, setWaittingColumn] = useState([]);

    const [devolopingDataList, setDevolopingDataList] = useState([]);
    const [schedulingDataList, setSchedulingDataList] = useState([]);
    const [onlineDataList, setOnlineDataList] = useState([]);
    const [waittingDataList, setWaittingDataList] = useState([]);
    const [waittingDataListCopy, setWaittingDataListCopy] = useState([]);
    const [devolopingDataTitle, setDevolopingDataTitle] = useState('');
    const [schedulingDataTitle, setSchedulingDataTitle] = useState('');
    const [onlineDataTitle, setOnlineDataTitle] = useState('');
    const [waittingDataTitle, setWaittingDataTitle] = useState('');
    const [tableLoading, setTableLoading] = useState(false);
    const [tableLoading2, setTableLoading2] = useState(false);
    const dateRef = useRef();

    const onCheckAllChange = (e) => {
        let c_d = [];
        checkOptions.forEach(it => {
            c_d.push(it.value);
        })
        setCheckedList(e.target.checked ? c_d : []);
        setIndeterminate(false);
        setCheckAll(e.target.checked);
    };
    const onCheckAllChangeForSelect = (list) => {
        console.log(list);
        setCheckedList(list);
        setIndeterminate(!!list.length && list.length < checkOptions.length);
        setCheckAll(list.length === checkOptions.length);
    }
    const onChangeRadio = (e) => {
        setCheckedValue(e.target.value);
        console.log('target.value = ', e.target.value);
        console.log('checkedValue = ', checkedValue);
    }
    const onChangeSingle = (list) => {
        setCheckedList(list);
        setIndeterminate(!!list.length && list.length < checkOptions.length);
        setCheckAll(list.length === checkOptions.length);
    }
    const getLineBarData = () => {
        setLineBarLoading(true);
        let startTime = moment(chooseDate[0]).valueOf();
        let endTime = moment(chooseDate[1]).valueOf();
        let payload = {
            params: [...checkedList],
            // params: [checkedValue],
            demandCreatePeriods: [startTime, endTime],
        }
        getDemandBoardTop(payload).then(res => {
            let leftMax = 0, leftScale = 10;
            let rightMax = 0, rightScale = 10;
            let concat_arr = [...res.data.createDemandSumData, ...res.data.upDemandSumData];
            leftMax = Math.max.apply(null, concat_arr);
            rightMax = Math.max.apply(null, res.data.workloadRate);
            if (leftMax < 1) {
                leftMax = 10;
                leftScale = 2;
            } else {
                leftMax = Math.ceil(leftMax / 10) * 10;
                leftScale = Math.ceil(leftMax / 10);
            }
            if (rightMax < 1) {
                rightMax = 10;
                rightScale = 2;
            } else {
                rightMax = Math.ceil(rightMax / 10) * 10;
                rightScale = Math.ceil(leftMax / 10);
            }
            setStatusCount({
                alreadySubmitDemandSum: res.data.alreadySubmitDemandSum,
                underDevelopmentDemandSum: res.data.underDevelopmentDemandSum,
                alreadyOnlineDemandSum: res.data.alreadyOnlineDemandSum
            });
            setLineBar({
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        crossStyle: {
                            color: '#999'
                        }
                    }
                },
                legend: {
                    orient: 'vertical',
                    right: 0,
                    top: 0,
                    data: ['全部需求', '已上线需求', '实际记录的工作量']
                },
                grid: {
                    top: '10%',
                    left: '3%',
                    right: '150',
                    bottom: '4%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        data: [...res.data.xaxis], // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'End'],
                        axisPointer: {
                            type: 'shadow'
                        },
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        // name: '实际记录的工作量',
                        min: 0,
                        max: leftMax,
                        // interval: leftScale,
                        axisLabel: {
                            formatter: '{value}'
                        },
                        splitLine: { show: false },
                    },
                    {
                        type: 'value',
                        // name: '已完成/已提交需求',
                        min: 0,
                        max: rightMax,
                        // interval: rightScale,
                        axisLabel: {
                            formatter: '{value}'
                        },
                        splitLine: { show: false },
                    }
                ],
                series: [
                    {
                        name: '全部需求',
                        type: 'bar',
                        itemStyle: {
                            normal: {
                                color: '#FFBC0D'
                            }
                        },
                        yAxisIndex: 0,
                        tooltip: {
                            valueFormatter: function (value) {
                                return value;
                            }
                        },
                        data: [...res.data.createDemandSumData]
                    },
                    {
                        name: '已上线需求',
                        type: 'bar',
                        itemStyle: {
                            normal: {
                                color: '#DB0007'
                            }
                        },
                        yAxisIndex: 0,
                        barGap: '0',
                        tooltip: {
                            valueFormatter: function (value) {
                                return value;
                            }
                        },
                        data: [...res.data.upDemandSumData]
                    },
                    {
                        name: '实际记录的工作量',
                        type: 'line',
                        itemStyle: {
                            normal: {
                                color: '#4EBE77'
                            }
                        },
                        yAxisIndex: 1,
                        tooltip: {
                            valueFormatter: function (value) {
                                return value;
                            }
                        },
                        data: [...res.data.workloadRate]
                    }
                ]
            });
            setLineBarLoading(false);
        }).catch((err) => {
            err && message.error(err.msg)
            setLineBarLoading(false);
        })
    }
    const getTopCheckBox = () => {
        setLoading(true);
        getTopCheckOptions().then(res => {
            if (res && res.data.length) {
                setCheckOptions([...res.data]);
                // setCheckOptions([{
                //     label: '全部',
                //     value: 'everyone',
                //     key: 'everyone',
                //     children: [...res.data]
                // }])
                let d_c = [];
                res.data.forEach((it,index) => {
                    d_c.push(it.value);
                    // if (index < 1 && it.value) {
                    //     setCheckedValue(it.value);
                    // }
                })
                console.log('d_c = ', d_c);
                setCheckedList(d_c);
                setLoading(false);
            }
        }).catch((err) => {
            err && message.error(err.message)
            setLoading(false);
        }).finally(() => {
            setLoading(false);
        })
    }
    const getFourTableList = () => {
        setTableLoading(true);
        setTableLoading2(true);
        let startTime = moment(chooseDate[0]).valueOf();
        let endTime = moment(chooseDate[1]).valueOf();
        let payload = {
            params: [...checkedList],
            demandCreatePeriods: [startTime, endTime],
        }
        // getSpintList(payload).then(res => {
        //     if (res.data) {
        //         res.data?.underDevelopmentTable?.versionDate && setDevolopingDataTitle(res.data.underDevelopmentTable.versionDate);
        //         res.data?.onScheduleTable?.versionDate && setSchedulingDataTitle(res.data.onScheduleTable.versionDate);
        //         res.data?.alreadyOnlineTable?.versionDate && setOnlineDataTitle(res.data.alreadyOnlineTable.versionDate);
        //         res.data?.willDevelopedTable?.versionDate && setWaittingDataTitle(res.data.willDevelopedTable.versionDate);

        //         if (res.data?.underDevelopmentTable?.jiraIssueInfos) {
        //             let _underDevelopmentTable = res.data?.underDevelopmentTable?.jiraIssueInfos.map((it, i) => {
        //                 return {
        //                     ...it,
        //                     tableIndex: i + 1,
        //                     // timeSpent: numToMoneyField(it.timeSpent/28800,2)
        //                 }
        //             });
        //             setDevolopingDataList(_underDevelopmentTable);
        //         }
        //         if (res.data?.onScheduleTable?.jiraIssueInfos) {
        //             let _onScheduleTable = res.data?.onScheduleTable?.jiraIssueInfos.map((it, i) => {
        //                 return {
        //                     ...it,
        //                     tableIndex: i + 1,
        //                     // timeSpent: numToMoneyField(it.timeSpent/28800,2)
        //                 }
        //             });
        //             setSchedulingDataList(_onScheduleTable);
        //         }
        //         if (res.data?.alreadyOnlineTable?.jiraIssueInfos) {
        //             let _alreadyOnlineTable = res.data?.alreadyOnlineTable?.jiraIssueInfos.map((it, i) => {
        //                 return {
        //                     ...it,
        //                     tableIndex: i + 1,
        //                     // timeSpent: numToMoneyField(it.timeSpent/28800,2)
        //                 }
        //             });
        //             setOnlineDataList(_alreadyOnlineTable);
        //         }
        //         if (res.data?.willDevelopedTable?.jiraIssueInfos) {
        //             let _willDevelopedTable = res.data?.willDevelopedTable?.jiraIssueInfos.map((it, i) => {
        //                 return {
        //                     ...it,
        //                     tableIndex: i + 1,
        //                     // timeSpent: numToMoneyField(it.timeSpent/28800,2)
        //                 }
        //             });
        //             setWaittingDataList(_willDevelopedTable);
        //             setWaittingDataListCopy(_willDevelopedTable);
        //         }
        //     }
        // }).catch((err) => {
        //     err && message.error(err.msg)
        // }).finally(() => {
        //     setTableLoading(false);
        // })
        
        Promise.all([getTableListByType(0,payload),getTableListByType(1,payload),getTableListByType(2,payload),getTableListByType(3,payload)]).then((values) => {
            console.log('values = ', values);
            values.forEach((val,index) => {
                if (val && val.data && val.data.jiraIssueInfos) {
                    if (index === 0) {
                        val.data.versionDate && setDevolopingDataTitle(val.data.versionDate);
                        let _underDevelopmentTable = val.data.jiraIssueInfos.map((it, i) => {
                            return {
                                ...it,
                                tableIndex: i + 1,
                            }
                        });
                        setDevolopingDataList(_underDevelopmentTable);
                    } else if (index === 1) {
                        val.data.versionDate && setSchedulingDataTitle(val.data.versionDate);
                        let _onScheduleTable = val.data.jiraIssueInfos.map((it, i) => {
                            return {
                                ...it,
                                tableIndex: i + 1,
                            }
                        });
                        setSchedulingDataList(_onScheduleTable);
                    } else if (index === 2) {
                        val.data.versionDate && setOnlineDataTitle(val.data.versionDate);
                        let _alreadyOnlineTable = val.data.jiraIssueInfos.map((it, i) => {
                            return {
                                ...it,
                                tableIndex: i + 1,
                            }
                        });
                        setOnlineDataList(_alreadyOnlineTable);
                    } else if (index === 3) {
                        val.data.versionDate && setWaittingDataTitle(val.data.versionDate);
                        let _willDevelopedTable = val.data.jiraIssueInfos.map((it, i) => {
                            return {
                                ...it,
                                tableIndex: i + 1,
                            }
                        });
                        setWaittingDataList(_willDevelopedTable);
                    }
                }
            })
        }).catch((err) => {
            message.error(err || err.msg);
        }).finally(() => {
            setTableLoading(false);
            setTableLoading2(false);
        })
    }
    useEffect(() => {
        getTopCheckBox();
    }, []);
    useEffect(() => {
        setCommonColumn([
            { title: '序号', dataIndex: 'tableIndex', width: 70 },
            {
                title: '需求名称', dataIndex: 'summary', width: 300,
                align: 'left',
                ellipsis: true,
                render: (text, record) => (<Tooltip placement="topLeft" title={record.summary} key={record.id}><a onClick={() => goDeail(record)} style={{ cursor: 'pointer' }}>{record.summary}（{record.issueKey}）</a></Tooltip>)
            },
            { title: '需求提出人', dataIndex: 'requester', width: 150 },
            { title: 'BU', dataIndex: 'businessFunction', width: 100 },
            { title: 'Data BP', dataIndex: 'dataBp', width: 150 },
            { title: '预计工作量', dataIndex: 'estimatedWorkload', width: 100 },
            { title: '需求提出日期', dataIndex: 'requestedDate', width: 120, align: 'left' },
        ])
        setDevolopingColumn([
            { title: '序号', dataIndex: 'tableIndex', width: 70 },
            {
                title: '需求名称', dataIndex: 'summary', width: 300,
                align: 'left',
                ellipsis: true,
                render: (text, record) => (<Tooltip placement="topLeft" title={record.summary} key={record.id}><a onClick={() => goDeail(record)} style={{ cursor: 'pointer' }}>{record.summary}（{record.issueKey}）</a></Tooltip>)
            },
            { title: '需求提出人', dataIndex: 'requester', width: 150 },
            { title: 'BU', dataIndex: 'businessFunction', width: 100 },
            { title: '产品经理', dataIndex: 'productManager', width: 150 },
            { title: 'Data BP', dataIndex: 'dataBp', width: 150 },
            { title: '需求状态', dataIndex: 'status', width: 150 },
            { title: '预计工作量', dataIndex: 'estimatedWorkload', width: 100 },
            { title: '需求提出日期', dataIndex: 'requestedDate', width: 120 },
            { title: '预计开始日期', dataIndex: 'estimatedStartDate', width: 120 },
            { title: '预计上线日期', dataIndex: 'expectedLaunchDate', width: 120, align: 'left' },
        ]);
    }, [props])
    useEffect(() => {
        if (loading && checkedList.length) {
            getLineBarData();
            getFourTableList();
        }
    }, [checkedList]);
    // useEffect(() => {
    //     if (loading && checkedValue) {
    //         getLineBarData();
    //         getFourTableList();
    //     }
    // }, [checkedValue]);

    // const fetchDataList = () => {
    //     console.log('选完时间Form，该请求接口了');
    //     console.log('dateRef = ', dateRef.current)
    // }
    const onChangeDateRange = (timeList) => {
        // console.log('dateRef = ', dateRef.current.getFieldsValue());
        // let formData = dateRef.current.getFieldsValue();
        // console.log('formData = ', formData);
        if (timeList && timeList.length > 0) {
            let start_time = moment(timeList[0]).format(dateFormat);
            let end_time = moment(timeList[1]).format(dateFormat);
            setChooseDate([start_time, end_time]);
        } else {
            setChooseDate([]);
        }
    }
    const getFullData = () => {
        if (checkedList.length < 1) {
            return message.warning('请先选择需求标签')
        }
        if (chooseDate.length < 1) {
            return message.warning('请先选择日期区间')
        }
        getLineBarData();
        getFourTableList();
    }
    const getPartial = () => {
        if (checkedList.length < 1) {
            return message.warning('请先选择需求标签')
        }
        if (chooseDate.length < 1) {
            return message.warning('请先选择日期区间')
        }
        getLineBarData();
    }
    const createNewDemand = () => {
        props.addNewTab('', 'create');
    }
    const onFilterDemand = () => {
        setTableLoading2(true);
        let keyWords = willSearchFilter.current.input.value.toLowerCase().trim();
        // if (keyWords) {
        //     let newList = [];
        //     waittingDataList.forEach(it => {
        //         if ((`${it.summary}（${it.issueKey}）`).toLocaleLowerCase().trim().includes(keyWords)) {
        //             newList.push({
        //                 ...it,
        //                 tableIndex: newList.length + 1,
        //             })
        //         }
        //     });
        //     setWaittingDataList(newList);
        // } else {
        //     let newList = [...waittingDataListCopy];
        //     setWaittingDataList(newList);
        // }
        let startTime = moment(chooseDate[0]).valueOf();
        let endTime = moment(chooseDate[1]).valueOf();
        let payload = {
            params: [...checkedList],
            demandCreatePeriods: [startTime, endTime],
            demandName: '',
        }
        if (keyWords) {
            payload.demandName = keyWords;
        }
        getTableListByType(3,payload).then(res => {
            res.data.versionDate && setWaittingDataTitle(res.data.versionDate);
            let _willDevelopedTable = res.data.jiraIssueInfos.map((it, i) => {
                return {
                    ...it,
                    tableIndex: i + 1,
                }
            });
            setWaittingDataList(_willDevelopedTable);
        }).catch((err) => {
            message.error(err || err.msg);
        }).finally(() => {
            setTableLoading2(false);
        })
    }
    const onLinkToApply = () => {
        let pathname = "/oap/apply-auth", tabNameZh = '申请列表';
        sessionStorage.setItem('setDefaultApplyType', encodeURIComponent(JSON.stringify({
            applyType: 8,
        })))
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }
    return (<Spin spinning={loading}>
        <div className='demand-dashboard-tab'>
            {/* <div className='top-checkbox-group' style={{paddingBottom: '50px',whiteSpace: 'normal'}}>
                <Checkbox className='all-of-them' indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>全部</Checkbox>
                <Checkbox.Group options={checkOptions} value={checkedList} onChange={onChangeSingle}></Checkbox.Group>
            </div> */}
            <div className='top-checkbox-group' style={{ paddingBottom: '20px', whiteSpace: 'normal', position: 'relative' }}>
                {/* <Select
                    mode='multiple'
                    placeholder='请选择需求标签'
                    allowClear
                    style={{ width: 300, marginLeft: 16 }}
                    value={checkedList}
                    onChange={onCheckAllChangeForSelect}
                    maxTagCount='responsive'
                >{
                        checkOptions.map(check => {
                            return <Select.Option value={check.value} key={check.value}>{check.label}</Select.Option>
                        })
                    }
                </Select> */}
                {/* <TreeSelect
                    allowClear
                    showSearch
                    treeCheckable
                    placeholder='请选择需求标签'
                    showCheckedStrategy="SHOW_PARENT"
                    fieldNames={{
                        label: 'label',
                        value: 'value',
                        children: 'children',
                    }}
                    treeData={checkOptions}
                    value={checkedList}
                    style={{width: 300, marginLeft: 16}}
                    onChange={onCheckAllChangeForSelect}
                ></TreeSelect> */}
                {/* <Radio.Group options={checkOptions} onChange={onChangeRadio} value={checkedValue} /> */}
                <Checkbox style={{width: 100, fontWeight: 600, fontSize: '14px'}} className='all-of-them' indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>全部</Checkbox>
                <Checkbox.Group value={checkedList} onChange={onChangeSingle}>
                    {
                        checkOptions.map((cop => {
                            return (<Checkbox key={cop.value} style={{width: 100}} value={cop.value}>{cop.label}</Checkbox>)
                        }))
                    }
                </Checkbox.Group>
                <div style={{ position: 'absolute', top: '11px', left: '530px' }}>
                    <Button type="primary" onClick={getFullData} icon={<IconSearch />} className='search-for-your-checked' style={{ marginRight: '10px' }}>搜索</Button>
                    <Button onClick={createNewDemand} icon={<IconAddA />} className='create-new-demand-btn'>创建需求</Button>
                </div>
            </div>
            <div className='common-demand-title-h4' style={{ position: 'relative' }}>
                <div className='demand-title-item'>需求概览</div>
                <i className='left-icon'></i>
                {/* <div style={{position: 'absolute', top: '-48px', right: '0px'}}>
                    <Button type="primary" onClick={getFullData} icon={<IconSearch />} className='search-for-your-checked' style={{marginRight: '10px'}}>搜索</Button>
                    <Button onClick={createNewDemand} icon={<IconAddA />} className='create-new-demand-btn'>创建需求</Button>
                </div> */}
            </div>
            <div className='demand-main-container'>
                <Form
                    className='date-choose-area'
                    ref={dateRef}
                    layout="vertical"
                    size='middle'
                >
                    <div style={{ display: 'flex' }}>
                        <div>
                            <Form.Item name="date" label="需求创建时间">
                                <DatePicker.RangePicker
                                    style={{ width: 300 }}
                                    onChange={onChangeDateRange}
                                    format={dateFormat}
                                    defaultValue={[moment(chooseDate[0], dateFormat), moment(chooseDate[1], dateFormat)]}
                                    disabledDate={(currentDate) => {
                                        let now = Date.now();
                                        return now < currentDate ? true : false;
                                    }}
                                    suffixIcon={<IconDateA />}
                                />
                            </Form.Item>
                        </div>
                        <div style={{ position: 'relative', top: '30px' }}>
                            <Button type='primary' onClick={getPartial} icon={<IconSearch />} style={{ marginLeft: '10px' }}>搜索</Button>
                        </div>
                    </div>
                </Form>
                <Spin spinning={lineBarLoading}>
                    <div className='e-charts-some-info-for-demand'>
                        <div className='left-status-info'>
                            <div className='status-info-item'>
                                <div className='info-title' style={{ position: 'relative', left: 6 }}>
                                    {/* <span style={{width: '16px', height: '16px', marginRight: '8px',display:'inline-block'}}></span> */}
                                    <IconProductionCColorFill style={{ width: '16px', height: '16px' }} />
                                    <Tooltip placement="topLeft" title="创建时间在筛选期间，所选标签下的所有需求数"><span className='title-words'>全部需求</span></Tooltip>
                                </div>
                                <div className='info-count'>{numToMoneyField(statusCount.alreadySubmitDemandSum, 0)}</div>
                            </div>
                            <div className='status-info-item'>
                                <div className='info-title'>
                                    <img style={{ width: '16px', height: '16px', marginRight: '0px' }} src={is_compeleted_img} alt="" />
                                    {/* <IconProductionCColorFill /> */}
                                    <Tooltip placement="topLeft" title="创建时间在筛选期间，所选标签下需求状态为开发中的需求数"><span className='title-words'>开发中</span></Tooltip>
                                </div>
                                <div className='info-count'>{numToMoneyField(statusCount.underDevelopmentDemandSum, 0)}</div>
                            </div>
                            <div className='status-info-item'>
                                <div className='info-title'>
                                    <img style={{ width: '16px', height: '16px', marginRight: '0px' }} src={is_online_img} alt="" />
                                    {/* <IconProductionCColorFill /> */}
                                    <Tooltip placement="topLeft" title="创建时间在筛选期间，所选标签下需求状态为部署完成的需求数"><span className='title-words'>已上线</span></Tooltip>
                                </div>
                                <div className='info-count'>{numToMoneyField(statusCount.alreadyOnlineDemandSum, 0)}</div>
                            </div>
                        </div>
                        <div className='right-eCharts-info'>
                            <ReactECharts
                                option={lineBar}
                                style={{ height: 400 }}
                            />
                        </div>
                    </div>
                </Spin>
            </div>
            <div className='common-demand-title-h4'>
                <div className='demand-title-item'>Sprint 需求清单</div>
                <i className='left-icon'></i>
            </div>
            <div className='demand-main-container' style={{ marginBottom: '30px' }}>
                <div className='table-list-data-and-title-info'>
                    <div className='table-title-info'>开发中{devolopingDataTitle ? `（${devolopingDataTitle}上线）` : ''}</div>
                    <Table
                        rowKey="id"
                        tableKey='devoloping-demand-table'
                        loading={tableLoading}
                        columns={commonColumn}
                        dataSource={devolopingDataList}
                        allFilterColumns={checkedValueForDevoloping}
                        pagination={{ position: ['none'], pageSize: 100000 }}
                        scroll={{
                            y: 240,
                        }}
                    />
                </div>
                <div className='table-list-data-and-title-info'>
                    <div className='table-title-info'>排期中{schedulingDataTitle ? `（${schedulingDataTitle}上线）` : ''}</div>
                    <Table
                        rowKey="id"
                        tableKey='scheduling-demand-table'
                        loading={tableLoading}
                        columns={commonColumn}
                        dataSource={schedulingDataList}
                        allFilterColumns={checkedValueForDevoloping}
                        pagination={{ position: ['none'], pageSize: 100000 }}
                        scroll={{
                            y: 240,
                        }}
                    />
                </div>
                <div className='table-list-data-and-title-info'>
                    <div className='table-title-info'>已上线{onlineDataTitle ? `（${onlineDataTitle}已上线）` : ''}</div>
                    <Table
                        rowKey="id"
                        tableKey='online-demand-table'
                        loading={tableLoading}
                        columns={commonColumn}
                        dataSource={onlineDataList}
                        allFilterColumns={checkedValueForDevoloping}
                        pagination={{ position: ['none'], pageSize: 100000 }}
                        scroll={{
                            y: 240,
                        }}
                    />
                </div>
            </div>
            <div className='common-demand-title-h4'>
                <div className='demand-title-item'>审批通过待开发需求清单{waittingDataTitle ? `（${waittingDataTitle}）` : ''}</div>
                <i className='left-icon'></i>
            </div>
            <div className='demand-main-container' style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 16, zIndex: 99, display: 'flex' }}>
                    <Input allowClear placeholder='请输入需求名称' ref={willSearchFilter} style={{ width: 300 }} />
                    <Button onClick={onFilterDemand} style={{ marginLeft: 10, cursor: 'pointer' }} type="primary" icon={<IconSearch />}>搜索</Button>
                    {/* <Button onClick={onLinkToApply} style={{ marginLeft: 10, cursor: 'pointer' }} type="link">需求历史申请记录</Button> */}
                    <Tooltip title="已申请待审批需求请点击查看">
                        <Button onClick={onLinkToApply} style={{ marginLeft: 10, cursor: 'pointer' }} type="link">需求历史申请记录</Button>
                    </Tooltip>
                </div>
                <div className='table-list-data-and-title-info'>
                    <Table
                        rowKey="id"
                        tableKey='devoloping--table'
                        loading={tableLoading2}
                        columns={devolopingColumn}
                        dataSource={waittingDataList}
                        allFilterColumns={checkedValueForDevoloping}
                        pagination={{ position: ['none'], pageSize: 100000 }}
                        scroll={{
                            y: 240,
                        }}
                    />
                </div>
            </div>
        </div>
    </Spin>)
})

export default Dashboard;