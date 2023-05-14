import React, { useState, useRef, useEffect } from 'react';
import { Spin, Button, Form, DatePicker, Table, Tooltip, message } from '@aurum/pfe-ui';
import { IconDateA, IconProductionCColorFill, IconSearch } from '@aurum/icons';
import { getReportHome } from '@/api/oap/registration_report';
import '@/style/demand-dashboard.less';
import moment from 'moment';
import ReactECharts from 'echarts-for-react';
import is_compeleted_img from '@/locales/images/is_compeleted.png';
import is_online_img from '@/locales/images/is_online.png';

function getCurrentYearFirstDay (toDay) {
    let l = toDay.split('-');
    return `${l[0]}-01-01`;
}
const checkedValueForReport = ['demandName', 'demander', 'BU', 'dataBP', 'estimatedWorkload', 'date'];

const dateFormat = 'YYYY-MM-DD';
let toDay = moment(Date.now()).format(dateFormat);
let timeStart = getCurrentYearFirstDay(toDay);

//const defaultDateRange = [timeStart, toDay];
const defaultDateRange = [moment().subtract(6, 'months').format(dateFormat), moment().format('YYYY-MM-DD HH:mm:ss')];
const Report = (props, ref) => {
    const [loading, setLoading] = useState(false);
    const [lineBarLoading, setLineBarLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
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
            data: ['报告数', '投入产出比']
        },
        grid: {
            top: '10%',
            left: '3%',
            right: '12%',
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
                name: '报告数',
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
                name: '投入产出比',
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
    const [devolopingColumn, setDevolopingColumn] = useState([
        { title: '序号', dataIndex: 'reportCode', width: 150, fixed: "left", },
        {
            title: '报告名称', dataIndex: 'reportName', width: 200,
            align: 'left',
            fixed: "left",
            ellipsis: true,
        },
        {
            title: '说明', dataIndex: 'description', width: 210,
            align: 'left',
            ellipsis: true,
        },
        {
            title: '业务域', dataIndex: 'businessCategoryId', width: 150,
            render: (text, record) => (<div>{record.businessCategory?.name}</div>)
        },
        {
            title: '主题', dataIndex: 'businessCategoryId', width: 150,
            render: (text, record) => (<div>{record.businessCategory?.name}</div>)
        },
        {
            title: '更行频率', dataIndex: 'timeSpent', width: 150,
            ellipsis: true,
            render: (text, record) => (
                <Tooltip placement="topLeft" title={record.updateFrequency + (record.updateTime ?? '')}>
                    {record.updateFrequency}
                    {record.updateTime}
                </Tooltip>
            ),
        },
        { title: '访问次数', dataIndex: 'visitCount', width: 150, align: 'left' },
    ]);
    const [dailyTop, setDailyTop] = useState([])
    const [dailyBottom, setDailyBottom] = useState([])
    const [weeklyAndMonthlyTop, setWeeklyAndMonthlyTop] = useState([])
    const [weeklyAndMonthlyBottom, setWeeklyAndMonthlyBottom] = useState([])
    const [reportCount, setReportCount] = useState(0)
    const [reportTotalRoi, setReportTotalRoi] = useState(0)
    const [reportVisitCount, setReportVisitCount] = useState(0)
    const dateRef = useRef();
    useEffect(() => {
        getLineBarList()
    }, []);
    const getLineBarList = () => {
        setLineBarLoading(true)
        setTableLoading(true)
        getReportHome({
            startTime: new Date(chooseDate[0]).getTime(),
            endTime: new Date(chooseDate[1]).getTime(),
            subjectType: 1
        }).then(res => {
            let businessCategoryNameList = [];
            let reportCountList = [];
            let reportVisitCountList = [];
            let roiList = []
            let reportVisitNumber = 0
            let reportNumber = 0
            res.data.businessCategoryMsg.forEach(item => {
                businessCategoryNameList.push(item.businessCategoryName)
                reportCountList.push(item.reportCount)
                reportNumber += Number(item.reportCount)
                reportVisitCountList.push(item.reportVisitCount)
                reportVisitNumber += Number(item.reportVisitCount)
                roiList.push(item.roi)
            })
            //setReportCount(reportNumber)
            setReportCount(res.data?.reportTotalCount)
            setReportTotalRoi(res.data?.reportTotalRoi)
            setReportVisitCount(reportVisitNumber)
            setDailyTop(res.data.DailyTop20)
            setDailyBottom(res.data.DailyBottom20)
            setWeeklyAndMonthlyTop(res.data.WeeklyAndMonthlyTop20)
            setWeeklyAndMonthlyBottom(res.data.WeeklyAndMonthlyBottom20)
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
                    data: ['报告数', '每日访问次数']
                },
                grid: {
                    top: '10%',
                    left: '3%',
                    right: '12%',
                    bottom: '4%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        data: businessCategoryNameList,
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
                        name: '报告数',
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
                        data: reportCountList
                    },
                    {
                        name: '每日访问次数',
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
                        data: roiList
                    }
                ]
            })
            setLoading(false)
            setLineBarLoading(false)
            setTableLoading(false)
        }).catch(errInfo => {
            console.log(errInfo);
            setLoading(false)
            setLineBarLoading(false)
            setTableLoading(false)
        })
    }
    const onChangeDateRange = (timeList) => {
        if (timeList && timeList.length > 0) {
            let start_time = moment(timeList[0]).format(dateFormat);
            let end_time = moment(timeList[1]).format(dateFormat);
            setChooseDate([start_time, end_time]);
        } else {
            setChooseDate([]);
        }
    }
    const getPartial = () => {
        if (chooseDate.length < 1) {
            return message.warning('请先选择日期区间')
        }
        getLineBarList()
    }
    return (<Spin spinning={loading}>
        <div className='report-dashboard-tab-new'>
            <div className='report-dashboard-main-container'>
                <Form
                    className='date-choose-area'
                    ref={dateRef}
                    layout="vertical"
                    size='middle'
                >
                    <Form.Item name="date" label="报告访问时间" style={{ display: 'inline-block' }}>
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
                    <Button type='primary' onClick={getPartial} icon={<IconSearch />} style={{ position: 'relative', left: 10, top: 30 }}>搜索</Button>
                </Form>
                <div className='common-report-title-h4'>
                    <div className='report-title-item'>报告概览</div>
                    <i className='left-icon'></i>
                </div>
                <Spin spinning={lineBarLoading}>
                    <div className='e-charts-some-info-for-report'>
                        <div className='left-status-info'>
                            <div className='status-info-item'>
                                <div className='info-title'>
                                    <IconProductionCColorFill style={{ width: '16px', height: '16px' }} />
                                    <span className='title-words'>Report</span>
                                </div>
                                <div className='info-count'>{reportCount}</div>
                            </div>
                            <div className='status-info-item'>
                                <div className='info-title'>
                                    <img style={{ width: '16px', height: '16px', marginRight: '0px' }} src={is_compeleted_img} alt="" />
                                    <span className='title-words'>报告访问次数</span>
                                </div>
                                <div className='info-count'>{reportVisitCount}</div>
                            </div>
                            <div className='status-info-item'>
                                <div className='info-title'>
                                    <img style={{ width: '16px', height: '16px', marginRight: '0px' }} src={is_online_img} alt="" />
                                    <span className='title-words'>每日访问次数</span>
                                </div>
                                <div className='info-count'>
                                    {reportTotalRoi}
                                    {/* {reportVisitCount + reportCount === 0 ? '0' : Math.ceil(reportVisitCount / reportCount)} */}
                                </div>
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
            <div className='common-report-title-h4'>
                <div className='report-title-item'>Top Report</div>
                <i className='left-icon'></i>
            </div>
            <div className='report-dashboard-main-container'>
                <div className='table-list-data-and-title-info'>
                    <div className='table-title-info'>Daily TOP 20</div>
                    <Table
                        rowKey="id"
                        tableKey='daily-top-20-report-table'
                        loading={tableLoading}
                        columns={devolopingColumn}
                        dataSource={dailyTop}
                        scroll={{ x: "100%" }}
                        allFilterColumns={checkedValueForReport}
                        pagination={{ position: ['none'], pageSize: 100000 }}
                    />
                </div>
                <div className='table-list-data-and-title-info'>
                    <div className='table-title-info'>Weekly/Monthly TOP 20</div>
                    <Table
                        rowKey="id"
                        tableKey='weekly-top-20-report-table'
                        loading={tableLoading}
                        columns={devolopingColumn}
                        dataSource={weeklyAndMonthlyTop}
                        allFilterColumns={checkedValueForReport}
                        scroll={{ x: "100%" }}
                        pagination={{ position: ['none'], pageSize: 100000 }}
                    />
                </div>
            </div>
            <div className='common-report-title-h4'>
                <div className='report-title-item'>Bottom Report</div>
                <i className='left-icon'></i>
            </div>
            <div className='report-dashboard-main-container'>
                <div className='table-list-data-and-title-info'>
                    <div className='table-title-info'>Daily Bottom 20</div>
                    <Table
                        rowKey="id"
                        tableKey='daily-bottom-20-report-table'
                        loading={tableLoading}
                        columns={devolopingColumn}
                        dataSource={dailyBottom}
                        scroll={{ x: "100%" }}
                        allFilterColumns={checkedValueForReport}
                        pagination={{ position: ['none'], pageSize: 100000 }}
                    />
                </div>
                <div className='table-list-data-and-title-info'>
                    <div className='table-title-info'>Weekly/Monthly Bottom 20</div>
                    <Table
                        rowKey="id"
                        tableKey='weekly-bottom-20-report-table'
                        loading={tableLoading}
                        columns={devolopingColumn}
                        scroll={{ x: "100%" }}
                        dataSource={weeklyAndMonthlyBottom}
                        allFilterColumns={checkedValueForReport}
                        pagination={{ position: ['none'], pageSize: 100000 }}
                    />
                </div>
            </div>
        </div>
    </Spin>)
}
export default Report;