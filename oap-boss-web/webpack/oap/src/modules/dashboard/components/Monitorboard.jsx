import React, {useState,useEffect} from 'react';
import {
  Spin, Row, Col, DatePicker, Empty, Table, Tooltip
} from '@aurum/pfe-ui';
import { IconDateA,IconQuestionCircle } from '@aurum/icons';
// import SalesTable from './components/SalesTable';
import SubjcectDomain from '@/modules/monitorBorad/components/SubjectDomain';
import ReactECharts from 'echarts-for-react';
import '@/style/monitor-borad.less';
import { getBoradData } from '@/api/oap/monitor_borad.js';
import { numToMoneyField } from '@/utils/store/func.js';
import moment from 'moment';
import * as echarts from 'echarts';

const now_time = Date.now(); // -2*24*60*60*1000;
const MonitorBorad = (props, ref) => {
  let radarDeault = [
    {name: '运算成本分数',key: 'computeCost',value: ''},
    {name: '流程规范分数', key: 'processStandard',value: ''},
    {name: '数据质量分数', key: 'dataQuality',value: ''},
    {name: '稳定性分数',key: 'stability',value: ''},
    {name: '复用度分数',key: 'reiteRate',value: ''},
  ]
  const radarDefaultName = ['computeCostAvgScore','processStandardAvgScore','dataQualityAvgScore','stabilityAvgScore','reuseRateAvgScore']
  const radarGroupDefaultName = ['computeCostScore','processStandardScore','dataQualityScore','stabilityScore','reuseRateScore'];
  const tableColumns = [
    {
      title: '中文表名',
      dataIndex: 'tableDesc',
      key: 0,
      ellipsis: true,
      render: (text, record) => {
        return {
          children: <Tooltip placement="topLeft" title={text}>{text}</Tooltip>,
          props: {
            rowSpan: record.rowSpan
          }
        };
      }
    },
    {
      title: '任务名称',
      dataIndex: 'taskDesc',
      key: 1,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '业务域',
      dataIndex: 'businessDomain',
      key: 2,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '主题域',
      dataIndex: 'subjectDomain',
      key: 3,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
  ]

  const [loading, setLoading] = useState(false);
  const [chooseDate, setChooseDate] = useState(now_time);
  const [twoNumber, setTwoNumber] = useState({
    publicTotalCount: 0, 
    publicTotalTaskCount: 0,
    gradOption: {
      label: {
        formatter: '{b}: {c}',
      },
      tooltip: {
        trigger: 'item',
      },
      series: [
        {
          name: '主题域',
          type: 'pie',
          radius : '55%',
          center: ['50%', '50%'],
          data: [],
          emptyCircleStyle: {
            color: '#FFBC0D'
          },
        //   itemStyle: {
        //     emphasis: {
        //       shadowBlur: 10,
        //       shadowOffsetX: 0,
        //       shadowColor: 'rgba(255, 188, 13, 0.5)'
        //     },
        //     normal: {
        //       color: function (colors) {
        //         var colorList = [
        //           '#FFBC0D',
        //           '#DB0007',
        //           '#FFE9E6',
        //         ];
        //         return colorList[colors.dataIndex];
        //       }
        //     }
        //   }
        }
      ]
    },
    totalAvgScore: '',
    radarOption: {
      radar: {
        indicator: [
          { name: '运算成本分数', max: 20},
          { name: '流程规范分数', max: 20},
          { name: '数据质量分数', max: 20},
          { name: '稳定性分数', max: 20},
          { name: '复用度分数', max: 20},
        ],
        splitArea: {
          show: false
        }
      },
      series: [{
        name: '分数',
        type: 'radar',
        itemStyle: {
          normal: {
            color: "#ffbc0d",
            // lineStyle: {
            //   color: "#ffbc0d"
            // }
          }
        },
        data : [
          {
            value : [],
            name : '暂无',
            label: {
              show: true,
              formatter: function (params) {
                return params.value;
              }
            },
            areaStyle: {
              color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
                {
                  color: 'rgba(255, 188, 13, 0.1)',
                  offset: 0
                },
                {
                  color: 'rgba(255, 188, 13, 0.7)',
                  offset: 1
                }
              ])
            }
          },
        ]
      }]
    },
    abnormalTaskCount: 0,
    abnormalTaskInfos: [],
    tableList: [],
    publicTaskInfos: [{
      curSubFinishedCount: '0',
      curSubPublicCount: '0',
      curSubPublicTaskTotalCount: '0',
      curSubRowQuantity: '0',
      curSubTotalAvgScore: '0.00',
      detailInfos: [
        {
          count: 0,
          dataList: [0,0,0,0,0],
          dwdOver: false,
          dwdOverString: '',
          dwdStartString: '未开始',
          odsOver: false,
          odsOverString: '',
          odsStartString: '未开始',
          publicOver: false,
          publicOverString: '',
          publicStartString: '未开始',
          title: '例子·预测未来1天天气表'
        },
        {
          count: 0,
          dataList: [0,0,0,0,0],
          dwdOver: false,
          dwdOverString: '',
          dwdStartString: '未开始',
          odsOver: false,
          odsOverString: '',
          odsStartString: '未开始',
          publicOver: false,
          publicOverString: '',
          publicStartString: '未开始',
          title: '例子·预测未来15天天气表'
        },
        {
          count: 0,
          dataList: [0,0,0,0,0],
          dwdOver: false,
          dwdOverString: '',
          dwdStartString: '未开始',
          odsOver: false,
          odsOverString: '',
          odsStartString: '未开始',
          publicOver: false,
          publicOverString: '',
          publicStartString: '未开始',
          title: '例子·实际每天天气表'
        }
      ]
    }],
  });
  const [interfaceNoData, setInterfaceNoData] = useState(false);

  const onChange = (date) => {
    if (date) {
      setInterfaceNoData(false);
      let timeStr = moment(date).format('x');
      setChooseDate(timeStr);
      fetchData(timeStr);
    }
  }
  const dealDataForGradMap = (infos={}) => {
    let result = [];
    for (let key in infos) {
      result.push({
        name: key,
        value: infos[key].curSubPublicCount || 0,
      })
    }
    return result;
  }
  const dealDataForRadarMap = (infos={}) => {
    let result = [];
    result = radarDefaultName.reduce((total, cur) => {
      if (Object.prototype.hasOwnProperty.call(infos, cur)) {
        total.push(infos[cur])
      }
      return total;
    }, []);
    return result;
  }
  const dealEveySmallRadar = (list) => {
    return list.reduce((total, cur) => {
      if (cur) {
        let dataList = radarGroupDefaultName.reduce((all, c) => {
          if (Object.prototype.hasOwnProperty.call(cur, c)) {
            all.push(cur[c])
          }
          return all;
        }, [])
        let odsOver = false,
          dwdOver = false,
          publicOver = false,
          odsStartString = '未开始',
          dwdStartString = '未开始',
          publicStartString = '未开始',
          odsOverString = '',
          dwdOverString = '',
          publicOverString = '';
        /**
         * 正推---取消
        if (cur.odsStartTime) {
          if (cur.odsFinishTime) {
            odsOver = true;
            odsOverString = `${cur.odsFinishTime.split(' ').pop()}完成`;
          } else {
            odsStartString = `${cur.odsStartTime.split(' ').pop()}开始\r\n预计${cur.odsEstimatedTime}完成`
          }
          if (cur.dwdFinishTime) {
            dwdOver = true;
            dwdOverString = `${cur.dwdFinishTime.split(' ').pop()}完成`;
          } else {
            dwdStartString = cur.dwdStartTime ? `${cur.dwdStartTime.split(' ').pop()}开始\r\n预计${cur.dwdEstimatedTime.split(' ').pop()}完成`:`预计${cur.dwdEstimatedTime.split(' ').pop()}完成`;
          }
          if (cur.publicFinishTime) {
            publicOver = true;
            publicOverString = `${cur.publicFinishTime.split(' ').pop()}完成`;
          } else {
            publicStartString = cur.publicStartTime ? `${cur.publicStartTime.split(' ').pop()}开始\r\n预计 ${cur.publicEstimatedTime.split(' ').pop()}完成`:`预计${cur.publicEstimatedTime.split(' ').pop()}完成`;
          }
        } else {
          odsStartString = `未开始`;
          dwdStartString = `未开始`;
          publicStartString = '未开始';
        }
        */

        /**
         * 反推 
        */
        if (cur.publicFinishTime || cur.publicStartTime) {
          odsOver = true;
          dwdOver = true;
          odsOverString = cur.odsFinishTime ? `${cur.odsFinishTime.split(' ').pop()}完成`: `完成`;
          dwdOverString = cur.dwdFinishTime ? `${cur.dwdFinishTime.split(' ').pop()}完成`: `完成`;
          if (cur.publicFinishTime) {
            publicOver = true;
            publicOverString = `${cur.publicFinishTime.split(' ').pop()}完成`;
          } else {
            publicStartString = cur.publicStartTime ? `${cur.publicStartTime.split(' ').pop()}开始\r\n预计 ${cur.publicEstimatedTime.split(' ').pop()}完成`:`预计${cur.publicEstimatedTime.split(' ').pop()}完成`;
          }
        } else {
          publicStartString = `未开始`;
          if (cur.dwdFinishTime || cur.dwdStartTime) {
            odsOver = true;
            odsOverString = cur.odsFinishTime ? `${cur.odsFinishTime.split(' ').pop()}完成`: `完成`;
            if (cur.dwdFinishTime) {
              dwdOver = true;
              dwdOverString = `${cur.dwdFinishTime.split(' ').pop()}完成`;
            } else {
              dwdStartString = cur.dwdStartTime ? `${cur.dwdStartTime.split(' ').pop()}开始\r\n预计${cur.dwdEstimatedTime.split(' ').pop()}完成`:`预计${cur.dwdEstimatedTime.split(' ').pop()}完成`;
            }
          } else {
            dwdStartString = `未开始`;
            if (cur.odsFinishTime || cur.odsStartTime) {
              if (cur.odsFinishTime) {
                odsOver = true;
                odsOverString = `${cur.odsFinishTime.split(' ').pop()}完成`;
              } else {
                odsStartString = cur.odsStartTime ? `${cur.odsStartTime.split(' ').pop()}开始\r\n预计${cur.odsEstimatedTime}完成`: `完成`;
              }
            } else {
              odsStartString = `未开始`;
            }
          }
        }
        total.push({
          count: cur.totalScore,
          odsOver: odsOver,
          dwdOver: dwdOver,
          publicOver: publicOver,
          odsStartString: odsStartString,
          dwdStartString: dwdStartString,
          publicStartString: publicStartString,
          odsOverString: odsOverString,
          dwdOverString: dwdOverString,
          publicOverString: publicOverString,
          dataList: dataList,
          title: cur.tableDesc
        })
      }
      return total;
    }, [])
  }
  const dealDataForRadarMapGroup = (infos={}) => {
    // 订单、卡券、产品、社群
    const priorityKey = ['订单','卡券','产品','社群'];
    let result = [];
    priorityKey.forEach(key => {
      if(infos[key] && Object.keys(infos[key]).length > 0) {
        let detailInfos_ = dealEveySmallRadar(infos[key].detailInfos);
        result.push({
          title: key,
          curSubFinishedCount: numToMoneyField(infos[key].curSubFinishedCount,0),
          curSubPublicCount: numToMoneyField(infos[key].curSubPublicCount,0),
          curSubPublicTaskTotalCount: numToMoneyField(infos[key].curSubPublicTaskTotalCount,0),
          curSubRowQuantity: numToMoneyField(infos[key].curSubRowQuantity,0),
          curSubTotalAvgScore: numToMoneyField(infos[key].curSubTotalAvgScore,2),
          detailInfos: detailInfos_
        })
      }
    })
    for(let key in infos) {
      if (!priorityKey.includes(key)) {
        let detailInfos_ = dealEveySmallRadar(infos[key].detailInfos);
        result.push({
          title: key,
          curSubFinishedCount: numToMoneyField(infos[key].curSubFinishedCount,0),
          curSubPublicCount: numToMoneyField(infos[key].curSubPublicCount,0),
          curSubPublicTaskTotalCount: numToMoneyField(infos[key].curSubPublicTaskTotalCount,0),
          curSubRowQuantity: numToMoneyField(infos[key].curSubRowQuantity,0),
          curSubTotalAvgScore: numToMoneyField(infos[key].curSubTotalAvgScore,2),
          detailInfos: detailInfos_
        })
      }
    }
    return result;
  }
  const fetchData = (topicDate) => {
    topicDate = topicDate || now_time;
    setLoading(true);
    getBoradData(topicDate).then(res => {
      console.log('res = ', res);
      if (res?.data) {
       let gradDataList = dealDataForGradMap(res.data.publicTaskInfos);
       gradDataList.sort((b,a)=> a.value-b.value);
       let radarDataList = dealDataForRadarMap(res.data.publicGradeInfo);
       let domainDataList = dealDataForRadarMapGroup(res.data.publicTaskInfos);
       console.log('gradDataList = ', gradDataList);
       console.log('radarDataList = ', radarDataList);
       console.log('domainDataList = ', domainDataList);
       let tableList = createNewArr(res.data.abnormalResult.abnormalTaskInfos, 'tableDesc');
       console.log('tableList = ', tableList);
        setTwoNumber({
          publicTotalCount: numToMoneyField(res.data.publicTotalCount,0), 
          publicTotalTaskCount: numToMoneyField(res.data.publicTotalTaskCount,0),
          gradOption: {
            label: {
              formatter: '{b}: {c}',
            },
            tooltip: {
              trigger: 'item',
            },
            series: [
              {
                name: '主题域',
                type: 'pie',
                radius : '55%',
                center: ['50%', '50%'],
                emptyCircleStyle: {
                    color: '#FFBC0D'
                },
                data: [...gradDataList],
                // itemStyle: {
                //   emphasis: {
                //     shadowBlur: 10,
                //     shadowOffsetX: 0,
                //     shadowColor: 'rgba(255, 188, 13, 0.5)'
                //   },
                //   normal: {
                //     color: function (colors) {
                //       var colorList = [
                //         '#fc8251',
                //         '#5470c6',
                //         '#91cd77',
                //         '#ef6567',
                //         '#f9c956',
                //         '#75bedc'
                //       ];
                //       return colorList[colors.dataIndex];
                //     }
                //   }
                // }
              }
            ]
          },
          totalAvgScore: numToMoneyField(res.data.publicGradeInfo.totalAvgScore,2),
          radarOption: {
            radar: {
              indicator: [
                { name: '运算成本分数', max: 20},
                { name: '流程规范分数', max: 20},
                { name: '数据质量分数', max: 20},
                { name: '稳定性分数', max: 20},
                { name: '复用度分数', max: 20},
              ],
              splitArea: {
                show: false
              }
            },
            series: [{
              name: '分数',
              type: 'radar',
              itemStyle: {
                normal: {
                  color: "#ffbc0d",
                //   lineStyle: {
                //     color: "#ffbc0d"
                //   }
                }
              },
              data : [
                {
                  value : [...radarDataList],
                  name : '暂无',
                  label: {
                    show: true,
                    formatter: function (params) {
                      return params.value;
                    }
                  },
                  areaStyle: {
                    color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
                      {
                        color: 'rgba(255, 188, 13, 0.1)',
                        offset: 0
                      },
                      {
                        color: 'rgba(255, 188, 13, 0.7)',
                        offset: 1
                      }
                    ])
                  }
                },
              ]
            }]
          },
          abnormalTaskCount: res.data.abnormalResult.abnormalTaskCount,
          abnormalTaskInfos: [...res.data.abnormalResult.abnormalTaskInfos],
          tableList: [...tableList],
          publicTaskInfos: [...domainDataList],
        });
        if (Object.keys(res.data.publicTaskInfos).length < 1) {
          setInterfaceNoData(true);
        } else {
          setInterfaceNoData(false);
        }
      }
    }).catch(() => {
      console.log('查询数据失败！');
    }).finally(() => {
      setLoading(false);
    })
  }
  useEffect(() => {
    let todayStr = `${now_time}`; // '1666145133169';
    console.log('进来了, 今天 = ', todayStr);
    fetchData(todayStr);
  }, []);
  const createManyDomain = () => {
    let ele = twoNumber.publicTaskInfos.map((info,key) => {
      return (<SubjcectDomain infoSource={info} key={key}></SubjcectDomain>);
    })
    return ele;
  }
  const createNewArr = (data, key) => {
    return data
    .reduce((result, item) => {
      //首先将key字段作为新数组result取出
      if (result.indexOf(item[key]) < 0) {
        result.push(item[key]);
      }
      return result;
    }, [])
    .reduce((result, value, rownum) => {
      //将key相同的数据作为新数组取出，并在其内部添加新字段**rowSpan**
      const children = data.filter((item) => item[key] === value);
      result = result.concat(
        children.map((item, index) => ({
          ...item,
          rowSpan: index === 0 ? children.length : 0, //将第一行数据添加rowSpan字段
          rownum: rownum + 1
        }))
      );
      return result;
    }, []);
  }
  const handleDataSource = (arr) => {
    const list = [];
    arr.forEach()
  }
  return (<Spin spinning={loading}>
    <div className='oap-public-monitor-borad'>
      <div className='oap-container'>
        <div className={`${twoNumber.publicTotalCount > 0 ? '': 'bg-fff'} borad-body`}>
          <div className='borad'>
            <Row>
              <Col span={12}> 
                <div className='common-demand-title-h4'>
                    <div className='demand-title-item'>看板概览</div>
                    <i className='left-icon'></i>
                </div>
                <div className='time-line bg-fff'>
                    <span className='label'>日期</span>
                    <DatePicker
                        style={{ width: 362, height: 36, position: 'relative', top: 12 }}
                        onChange={onChange}
                        format="YYYY-MM-DD"
                        defaultValue={moment(chooseDate)}
                        disabledDate={(currentDate) => {
                        let now = Date.now();
                        return now < currentDate ? true: false;
                        }}
                        suffixIcon={<IconDateA />}
                    />
                </div>
              </Col>
            </Row>
            {/* <Row>
              <Col span={12}>
                <h4 className='title-line'>大数据平台公共层监控看板</h4>
              </Col>
            </Row> */}
          </div>
          {!interfaceNoData ? <Row gutter={12} style={{marginBottom: '12px'}}>
              <Col span={4}>
                <div className='show-group'>
                  <div className='show-head'>
                    <div className='head-item mr-6'>
                      <div className='title'>公共层</div>
                      <div className='count'>{twoNumber.publicTotalCount}</div>
                    </div>
                    <div className='head-item ml-6'>
                      <div className='title'>任务数</div>
                      <div className='count'>{twoNumber.publicTotalTaskCount}</div>
                    </div>
                  </div>
                  <div className='show-circle bg-fff'>
                    <ReactECharts
                      option={twoNumber.gradOption}
                      style={{ height: 346 }}
                    />
                  </div>
                </div>
              </Col>
              <Col span={4}>
                <div className='radar-chart bg-fff'>
                  <div className='unusual-task-count'>
                    <span className='title'>总平均分：</span>
                    <span className='count'>{twoNumber.totalAvgScore}</span>
                  </div>
                  <div className='radar-chart-container'>
                    <ReactECharts 
                      option={twoNumber.radarOption}
                      style={{ height: 300, position: 'relative', top: 68 }} 
                    />
                  </div>
                </div>
              </Col>
              <Col span={4}>
                <div className='table-item bg-fff equal-height-to-radar-and-grad'>
                  <div className='unusual-task-count'>
                    <span className='title'>异常任务：</span>
                    <span className='count'>{twoNumber.abnormalTaskCount}</span>
                  </div>
                  {/* <SalesTable columns={tableColumns} dataSource={twoNumber.abnormalTaskInfos} /> */}
                  <Table
                    bordered
                    dataSource={twoNumber.tableList}
                    columns={tableColumns}
                    rowKey="unusual_abnormal_task_info"
                    pagination={{position : ['none']}}
                    scroll={{
                      y: 350,
                    }}
                  />
                </div>
              </Col>
            </Row>: null
          }
          {
            // createManyDomain()
          }
          {
            !interfaceNoData ? createManyDomain(): <Empty  style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
            }}/>
          }
        </div>
      </div>
    </div>
  </Spin>)
}

export default MonitorBorad;