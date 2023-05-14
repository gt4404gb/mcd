import React from 'react';
import { Spin, Space, Modal, Form, Row, Col, Button, Input, message, Collapse, Tooltip, Table } from '@aurum/pfe-ui';
import { IconClose, IconEditA, IconSetupA } from '@aurum/icons';
import SetCondition from './SetCondition';
import ShowDragContion from '@/components/showDragCondition';
import SetCategory from './SetCategroy';
import AutoNotice from '@/components/autoNotice';
import { ReactSortable } from "react-sortablejs";
import {
    prepareChartForTicket,
    viewChartForTicket,
    saveChartForTicket,
    getRunResultForTicket,
    downloadResultForTicket
} from '@/api/oap/ticket_analysis.js';
import moment from 'moment';
import { numToMoneyField, clearComma, uuid, optionFilterProp } from '@/utils/store/func';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import ExploreEmailModal from '@/components/ExploreEmailModal';
import { getCurrentUserIsStaff } from '@/api/oap/commonApi.js';
import SearchInput from '@/components/SearchInput';

class Index extends React.Component {
    constructor(props) {
        super(props);
        this.paramRequest = {}
        this.formRef = React.createRef()
        this.formRefBasicInfo = React.createRef()
        this.baseCategories = React.createRef();
        this.attachCategories = React.createRef();
        this.queryKeyWords = React.createRef();
        this.timer = null;
        this.defDragList = [
            {
                label: 'filters',
                classify: ['dimensions:filterable', 'dimensions:filterable:groupby'],
                iconName: 'filter',
                flag: 'dragFilter',
                title: '筛选',
                children: []
            },
            {
                label: 'dimensions',
                classify: ['dimensions:groupby', 'dimensions:filterable:groupby'],
                iconName: 'dimensions',
                flag: 'dragDimensions',
                title: '维度',
                children: [],
            },
            {
                label: 'indexes',
                classify: ['indexes'],
                iconName: 'indexes',
                flag: 'dragIndexes',
                title: '指标',
                children: [],
            },
        ]
        this.defDragListConditions = {
            filters: [],
            indexes: [],
            //   sorts:[],
            dimensions: []
        }
        this.categories = {
            baseCategories: [],
            attachCategories: []
        }
        this.state = {
            isLoading: false,
            filterOptions: [],
            checkedValue: [],
            defcolumns: [],
            columns: [],
            dataList: [],
            tableLoading: false,
            pageSize: 10,
            pageNo: 1,
            activeCollapse: [],
            defCollapseList: [],
            collapseList: [],
            dragList: JSON.parse(JSON.stringify(this.defDragList)),
            visibleConditon: false,
            dragListConditions: JSON.parse(JSON.stringify(this.defDragListConditions)),
            categories: JSON.parse(JSON.stringify(this.categories)),
            productOptions: JSON.parse(JSON.stringify(this.categories)),
            itemConditon: {},
            runDataParams: {},
            basicInfo: {},
            visibleBasicInfo: false,
            dragFromClassify: '',
            dragItemId: null,
            currentModelId: null,
            tableHeight: '',
            childCondition: [],
            currentConditionIndex: null,
            bigBoxId: `bigBox${uuid()}`,
            leftBoxId: `leftBox${uuid()}`,
            resizeBox1Id: `resizeBox1${uuid()}`,
            middleBoxId: `middleBox${uuid()}`,
            resizeBox2Id: `resizeBox2${uuid()}`,
            rightBoxId: `rightBox${uuid()}`,
            emailModalData: {
                isStaff: false,
                mcdEmail: '',
                visibleEmailInfo: false,
                isLoading: false,
            },
            noticeData: {
                visible: false,
                defaultOpen: false,
                auto: true
            }
        }
    }

    componentDidMount () {
        //modelId用来查询preCharts接口，无论何种情况，均存在
        //有modelId,跳过选择数据  （从【首页】引导页过来的）
        console.log(this.props)
        if (!this.props?.sliceId) {
            this.setState({
                isLoading: true
            }, () => {
                this.getPrepareChartForTicket();
            })
            // }else if (!this.props?.sliceId){ //如果sliceId无值，就是新增页面 (从【自助取数】“创建分析”按钮过来)
            // this.switchData();
        } else { //如果sliceId有值，就是编辑页面 (从【自助取数】列表过来) 或者 复制查询条件
            this.setState({
                currentModelId: this.props?.modelId,
            }, () => {
                this.initAsync(this.props?.sliceId);
            })
        }
        getCurrentUserIsStaff().then(res => {
            console.log('res = ', res);
            this.setState(state => ({
                ...state,
                emailModalData: {
                    ...state.emailModalData,
                    isStaff: res.data ?? false,
                }
            }))
        }).catch(() => {

        })
    }

    componentWillUnmount () {
        clearTimeout(this.timer)
    }

    resetColumns = () => {
        this.setState({
            columns: this.state.defcolumns,
            checkedValue: this.state.filterOptions.map((it) => it.value)
        })
    }

    onPageChange = (pageNo, pageSize) => {
        this.setState({
            pageNo: pageNo,
            pageSize: pageSize
        }, () => {
            this.getData(this.props?.sliceId);
        });
    }

    //异步
    initAsync = async (id) => {
        this.setState({
            isLoading: true,
            collapseList: [],
            ///activeCollapse:[],
            defCollapseList: [],
            runDataParams: {},
        })
        try {
            const promiseAllRequest = ['edit'].includes(this.props.type) ? [
                viewChartForTicket(id),
                prepareChartForTicket(),
                getRunResultForTicket({
                    id,
                    size: this.state.pageSize,
                    page: this.state.pageNo - 1
                })
            ] : [
                viewChartForTicket(id),
                prepareChartForTicket()
            ]
            const promiseAllList = await Promise.all(promiseAllRequest);
            let resOpenChart = promiseAllList[0].data,//获取拖拽数据的详情
                resPrepareChart = promiseAllList[1].data,
                resgetRunResultForTicket = {},
                collapseList = [
                    {
                        label: 'dimensions',
                        title: '维度',
                        children: []
                    },
                    {
                        label: 'indexes',
                        title: '指标',
                        children: []
                    }
                ],
                activeCollapse = [],
                filterOptions = [],
                checkedValue = [],
                cloumns = [],
                tableCloumns = [],
                name = '',
                tempRecords = [],
                modelInfo = resPrepareChart.modelInfo || {};
            let productObj = {
                baseCategories: modelInfo.baseCategories,
                attachCategories: modelInfo.attachCategories,
            }
            let categoryObj = {
                baseCategories: resOpenChart.params.baseCategories,
                attachCategories: resOpenChart.params.attachCategories,
            }
            if (promiseAllList.length == 3) resgetRunResultForTicket = promiseAllList[2];
            collapseList.forEach(collapse => {
                const arr = modelInfo[collapse.label] || []
                collapse.children = arr.reduce((total, cur) => {
                    let hasValue = total.findIndex(current => {
                        return cur.columnType != 'INDEX' && current.title === cur.decorationName
                    })
                    if (cur.columnType != 'INDEX') {
                        hasValue == -1 && total.push({
                            title: cur.decorationName,
                            list: [cur]
                        }) && activeCollapse.push(cur.decorationName)
                        hasValue != -1 && total[hasValue].list.push(cur)
                    } else {
                        total.push(cur)
                    }
                    return total
                }, [])
            });
            //自定义维度-暂无
            // collapseList[0].children.push({
            //   title:'自定义维度',
            //   icon:<SettingFilled onClick={this.gotoCustomPage}/>,
            //   list:modelInfo['customDimensions']
            // })
            //人群包
            if (modelInfo.hasSegment) {
                collapseList[0].children.push({
                    title: 'Tag/人群包',
                    icon: <IconSetupA onClick={this.gotoSegmentPage} />,
                    list: [modelInfo?.segmentModelVo || {}]
                })
            }
            let runDataParams = {
                datasourceId: resPrepareChart.modelId,
                datasourceName: modelInfo.name,
                tableName: modelInfo.tableName,
                vizType: "TABLE",
                params: {},
                queryContext: ""
            };
            if (promiseAllList.length == 3) {
                cloumns = resgetRunResultForTicket?.data.columns || [];
                tempRecords = resgetRunResultForTicket?.data.records || [];
                for (let j = 0; j < cloumns.length; j++) {
                    name = cloumns[j].showName;
                    tempRecords.forEach(record => {
                        //   record[name] = cloumns[j].columnType === 'INDEX' && cloumns[j].isItThousands == 1 ? numToMoneyField(record[name],cloumns[j].precisions):record[name];
                        if (cloumns[j].columnType === 'INDEX') {
                            let precisions = +cloumns[j].precisions;
                            if (cloumns[j].dataType === 'percentage') {
                                record[name] = Number(+record[name] * 100).toFixed(precisions) + '%';
                            } else if (cloumns[j].dataType === 'number') {
                                record[name] = cloumns[j].isItThousands == 1 ? numToMoneyField(record[name], precisions) : record[name];
                            }
                        }
                    })
                    const sortableFn = (key, columnType) => {
                        return (a, b) => {
                            return columnType == 'INDEX' ? (clearComma(a[key]) - clearComma(b[key])) : (a[key].length - b[key].length)
                        }
                    }
                    tableCloumns[j] = {
                        //   title: (<span onClick={e => { 
                        //     if(e.target.closest(".ant-tooltip")) 
                        //     {e.stopPropagation}
                        //   }}>
                        //     <Tooltip title={name}>{name}</Tooltip>
                        //   </span>),
                        title: name,
                        dataIndex: name,
                        width: 200,
                        align: 'left',
                        ellipsis: true,
                        sorter: sortableFn(name, cloumns[j].columnType),
                    }
                }
                filterOptions = tableCloumns.map(it => ({
                    label: it.title,
                    value: it.dataIndex
                }))
                checkedValue = filterOptions.map(it => it.value);
                console.log('checkedValue = ', checkedValue);
            }
            this.setState({
                basicInfo: {
                    ...this.state.basicInfo,
                    sliceName: ['edit'].includes(this.props.type) ? resOpenChart.sliceName : '',
                    description: ['edit'].includes(this.props.type) ? resOpenChart.description : '',
                    id: ['edit'].includes(this.props.type) ? resOpenChart.id : '',
                    subjectName: modelInfo.name,
                    name: `【${modelInfo.name}】${modelInfo.queryName}`,
                    lastModifyAt: moment(modelInfo.updateDataTime).format('YYYY-MM-DD HH:mm:ss'),
                    queryStatus: ['edit'].includes(this.props.type) ? resOpenChart?.queryStatus : '',
                },
                currentModelId: this.props?.modelId,
                collapseList,
                //activeCollapse:[],
                defCollapseList: collapseList,
                runDataParams,
                columns: tableCloumns,
                defcolumns: tableCloumns,
                filterOptions: promiseAllList.length == 3 ? filterOptions : [],
                checkedValue: promiseAllList.length == 3 ? checkedValue : [],
                subjectId: resPrepareChart?.subjectId || '',//业务域ID
                isSegmentRequired: modelInfo?.isSegmentRequired,//是否筛选必选人群 0 不必选，1必选
                dataList: tempRecords.map((record, index) => {
                    return { ...record, key: index }
                }),
                pageNo: promiseAllList.length == 3 ? resgetRunResultForTicket?.data.page + 1 : null,
                total: promiseAllList.length == 3 ? resgetRunResultForTicket?.data.totalCount : null,
                isLoading: false,
                productOptions: productObj,
                categories: categoryObj,
                noticeData: {
                    visible: resPrepareChart?.hasMessage == 1,
                    defaultOpen: resPrepareChart?.hasMessage == 1 && resPrepareChart?.isShow == 1,
                    auto: resPrepareChart?.isShow == 1
                },
            }, () => {
                if (resgetRunResultForTicket?.data?.isOver == 1) {
                    message.warning('此数据已超过100000条，最多显示100000条')
                }
                this.timer = setTimeout(() => {
                    this.setState((state) => ({
                        noticeData: {
                            ...state.noticeData,
                            defaultOpen: false
                        }
                    }))
                }, 5000);
            })
            const queryContext = resOpenChart.queryContext || '{}'
            const params = resOpenChart.params || {}
            this.feedbackDragList(params, queryContext);
        } catch (err) {
            err.msg && message.error(err.msg);
            this.setState({
                isLoading: false
            })
        }
    }
    //去自定义规则页面
    gotoCustomPage = () => {
        let pathname = "/oap/customRules", tabNameZh = '自定义规则';
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        this.saveTabActive();
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }

    //去人群包页面
    gotoSegmentPage = () => {
        let pathname = "/imp/segment/create", tabNameZh = '人群圈选';
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }

    saveTabActive = () => {
        sessionStorage.setItem('oapHomeActiveTab', encodeURIComponent(JSON.stringify({
            activeTab: ['edit'].includes(this.props.type) ? this.state.basicInfo?.id : this.props.activeKey,
        })))
    }

    //最左侧——维度、指标列表
    getPrepareChartForTicket = async (id) => {
        this.setState({
            collapseList: [],
            ///activeCollapse:[],
            defCollapseList: [],
            runDataParams: {}
        })
        try {
            let resPrepareChart = await prepareChartForTicket();
            const modelInfo = resPrepareChart.data?.modelInfo || {};
            let basicInfo = {
                ...this.state.basicInfo,
                subjectName: modelInfo.name,
                name: `【${modelInfo.name}】${modelInfo.queryName}`,
                lastModifyAt: moment(modelInfo.updateDataTime).format('YYYY-MM-DD HH:mm:ss')
            },
                activeCollapse = [],
                collapseList = [
                    {
                        label: 'dimensions',
                        title: '维度',
                        children: []
                    },
                    {
                        label: 'indexes',
                        title: '指标',
                        children: []
                    }
                ];
            collapseList.forEach(collapse => {
                const arr = modelInfo[collapse.label] || []
                collapse.children = arr.reduce((total, cur) => {
                    let hasValue = total.findIndex(current => {
                        return cur.columnType != 'INDEX' && current.title === cur.decorationName
                    })
                    if (cur.columnType != 'INDEX') {
                        hasValue == -1 && total.push({
                            title: cur.decorationName,
                            list: [cur]
                        }) && activeCollapse.push(cur.decorationName)
                        hasValue != -1 && total[hasValue].list.push(cur)
                    } else {
                        total.push(cur)
                    }
                    return total
                }, [])
            });
            //自定义维度
            // collapseList[0].children.push({
            //     title:'自定义维度',
            //     icon:<SettingFilled onClick={this.gotoCustomPage}/>,
            //     list:modelInfo['customDimensions']
            // })
            //人群包
            if (modelInfo.hasSegment) {
                collapseList[0].children.push({
                    title: 'Tag/人群包',
                    icon: <IconSetupA onClick={this.gotoSegmentPage} />,
                    list: [modelInfo?.segmentModelVo || {}]
                })
            }
            // 新增页面时，需要回显
            if (!this.props?.sliceId && modelInfo.filters) {
                this.feedbackDragList({ filters: modelInfo.filters }, '{}')
            }
            let productObj = {
                baseCategories: modelInfo.baseCategories,
                attachCategories: modelInfo.attachCategories,
            }
            console.log('productObj = ', productObj);
            this.setState({
                collapseList,
                //activeCollapse:[],
                defCollapseList: collapseList,
                basicInfo,
                runDataParams: {
                    datasourceId: resPrepareChart.data?.modelId,
                    datasourceName: modelInfo?.name,
                    tableName: modelInfo?.tableName,
                    vizType: "TABLE",
                    params: {},
                    queryContext: ""
                },
                currentModelId: resPrepareChart.data?.modelId || '',
                subjectId: resPrepareChart.data?.subjectId || '',//业务域ID
                isSegmentRequired: modelInfo?.isSegmentRequired,//是否筛选必选人群 0 不必选，1必选
                isLoading: false,
                productOptions: productObj,
                noticeData: {
                    visible: resPrepareChart.data?.hasMessage == 1,
                    defaultOpen: resPrepareChart.data?.hasMessage == 1 && resPrepareChart.data?.isShow == 1,
                    auto: resPrepareChart.data?.isShow == 1
                },
            }, () => {
                this.timer = setTimeout(() => {
                    this.setState((state) => ({
                        noticeData: {
                            ...state.noticeData,
                            defaultOpen: false
                        }
                    }))
                }, 5000);
            })
        } catch (err) {
            this.setState({
                isLoading: false
            })
        };
    }

    setSortStart = (classify, target) => {
        let dragFromClassify = classify;
        // filterable 是否可以拖动至filters , groupby 是否可以拖动至dimensions
        if (classify === 'dimensions' && target.item.dataset?.filterable === 'true') dragFromClassify = `${dragFromClassify}:filterable`;
        if (classify === 'dimensions' && target.item.dataset?.groupby === 'true') dragFromClassify = `${dragFromClassify}:groupby`;
        this.setState({
            dragFromClassify,
            dragItemId: target.item?.dataset.id
        })
    }

    setDragBoxSortStart = (boxIndex, target) => {
        this.setState({
            dragFromClassify: target.item?.dataset.classify,
            dragFromIndex: boxIndex,
            dragItemId: null
        })
    }

    // 拖拽
    setSortableList = (newState, index) => {
        let { dragList, dragListConditions } = this.state;
        let item = dragList[index],
            copyNewState = JSON.parse(JSON.stringify(newState)),
            noRepeatObj = {};
        //判断是否是组内拖动
        if (this.state.dragItemId == null) {
            if (this.state.dragFromIndex != index) return; //禁止组间拖动
            item.children = [...newState];
            dragListConditions[item.label] = [...newState];
            this.setState({ dragList, dragListConditions })
            return;
        }
        //是否有权限
        if (!this.hasRightLegal(item)) return;
        //级联，一拖三
        if (item.label == 'filters') {
            newState.forEach((child, childIdx) => {
                if (child.isCascade && child.cascadeField) {
                    let cascadeFieldArr = [...child.cascadeField]
                    cascadeFieldArr.reverse().forEach(field => {
                        copyNewState.splice(childIdx, 0, field)
                    })
                }
            })
        }
        //去重
        let noRepeatNewState = copyNewState.reduce((cur, next) => {
            if (!noRepeatObj[next.id]) {
                noRepeatObj[next.id] = true;
                cur.push(next);
            } else {
                if (next.filterValues || next.condition || next.segmentList) {
                    cur[cur.findIndex(p => p.id == next.id)] = next;
                }
            }
            return cur
        }, []);
        let visibleConditon = false;
        if (['filters', 'sorts'].includes(item.label)) {
            visibleConditon = true;
        } else {
            let tempItemObj = noRepeatNewState.find(item => item.id == this.state.dragItemId)
            if (['indexes'].includes(item.label) && tempItemObj && tempItemObj?.hasCondition) {
                visibleConditon = true;
            } else if (['dimensions'].includes(item.label) && tempItemObj && tempItemObj?.isSegment) {
                visibleConditon = true;
            } else {
                item.children = [...noRepeatNewState];
                dragListConditions[item.label] = [...noRepeatNewState];
            }
        }
        this.setState({
            dragList,
            dragListConditions,
            visibleConditon,
            classifyConditon: item.label,
            itemConditon: noRepeatNewState.find(item => item.id == this.state.dragItemId),
            childCondition: noRepeatNewState,
            currentConditionIndex: noRepeatNewState.findIndex(item => {
                return item.id == this.state.dragItemId
            })
        })
    }

    hasRightLegal = (item) => {
        const rightLegal = item.classify
        const leftLegal = this.state.dragFromClassify
        if (rightLegal.includes(leftLegal)) {
            return true
        }
        return false
    }

    handleEdit = (classify, id, index) => {
        this.setState({
            visibleConditon: true,
            classifyConditon: classify,
            itemConditon: this.state.dragListConditions[classify].find((condition) => condition.id == id),
            childCondition: this.state.dragListConditions[classify],
            currentConditionIndex: index,
        })
    }

    handleDelete = (dragIdx, listIdx) => {
        const that = this
        let dragList = [...that.state.dragList],
            dragListConditions = { ...that.state.dragListConditions },
            cascadeUpThanThisLayer = []; //级联时，本层及下层的id
        if (dragList[dragIdx].label === 'filters' && dragList[dragIdx].children[listIdx].isCascade) {
            let hasIndex = dragList[dragIdx].children[listIdx].extendIds.findIndex(extendIdsItem => extendIdsItem === dragList[dragIdx].children[listIdx].id);
            if (hasIndex != -1) {
                cascadeUpThanThisLayer = dragList[dragIdx].children[listIdx].extendIds.filter((extendIdsItem, extendIdsIndex) => extendIdsIndex >= hasIndex)
            }
        }
        let tempArr = dragListConditions[dragList[dragIdx].label].filter(item => {
            //如果是级联且是筛选，删除的是本层及下层
            if (dragList[dragIdx].label === 'filters' && item.isCascade) {
                if (cascadeUpThanThisLayer.length) {
                    return !cascadeUpThanThisLayer.includes(item.id)
                }
            }
            return item.id != dragList[dragIdx].children[listIdx].id
        })
        if (dragList[dragIdx].label === 'filters' && dragList[dragIdx].children[listIdx].isCascade) {
            dragList[dragIdx].children = [...tempArr];
        } else {
            dragList[dragIdx].children.splice(listIdx, 1)
        }
        that.setState({
            dragList,
            dragListConditions: {
                ...dragListConditions,
                [dragList[dragIdx].label]: tempArr
            },
            classifyConditon: '',
            itemConditon: {},
            childCondition: []
        })
    }

    changeSetConditionVisible = (visible) => {
        this.setState({
            visibleConditon: visible,
        })
    }

    handCompleteSet = (data) => {
        let { childCondition, dragList, dragListConditions } = this.state;
        let tempChild = childCondition.reduce((total, cur) => {
            if (cur?.id === data.form?.id && data.isSegment) {
                total.push({ ...cur, ...data.form })
            } else if (cur?.id === data.form?.id && !data.isCascade) {
                total.push({
                    ...cur,
                    ...data.form
                })
            } else if (data.isCascade && cur.isCascade) {
                if (data.classify === 'filters') {
                    data.form['conditionalFormat'].forEach(cascadeItem => {
                        let totalFind = total.find(totalItem => totalItem.id === cascadeItem.id)
                        if (!totalFind) {
                            total.push(cascadeItem)
                        }
                    })
                } else if (data.classify === 'sorts') {
                    total.push(data.form);
                }
            } else {
                total.push(cur);
            }
            return total;
        }, [])
        dragList.forEach(dragItem => {
            if (dragItem.label === data.classify) {
                dragItem.children = [...tempChild];
            }
        })
        dragListConditions[data.classify] = [...tempChild];
        //人群包:人群包维度添加后，自动在筛选范围内增加人群包的筛选条件
        if (data.isSegment) {
            const isExistInDe = dragList[1].children.some(child => child.isSegment)
            const isExistInFil = dragList[0].children.some(child => child.isSegment)
            const segmentChild = {
                ...data.form,
                filterValues: [{
                    compareOperator: 'in',
                    comparator: data.form.segmentList.map(i => i.value),
                    logicalOperator: 'AND'
                }],
                forShowList: data.form.segmentList,
                columnName: data.form.showName,
                isSegment: data.isSegment
            }
            if (data.classify == "dimensions" && isExistInDe && !isExistInFil) {
                dragList[0].children.push(segmentChild);
                dragListConditions['filters'].push(segmentChild);
            }
        }
        this.setState({
            dragList,
            dragListConditions
        })
    }

    handleAnalysisEdit = () => {
        this.setState({
            visibleBasicInfo: true
        })
    }

    handleParams = () => {
        let params = {}, category = {},
            queryContext = { filters: [], indexes: [], sorts: [], dimensions: [] };
        for (let key in this.state.dragListConditions) {
            params[key] = this.state.dragListConditions[key];
            if (key == 'filters') {
                let temp = params[key].reduce((total, child) => {
                    //去除未填写完整的条件
                    if (child.isCascade) {
                        total.push(child)
                    } else {
                        if (child.filterValues && child.filterValues.length) {
                            let temp = child.filterValues.filter(condition => {
                                return (condition.comparator ?? '') !== '' && (condition.compareOperator ?? '') !== '' && condition.comparator.length != 0
                            })
                            temp.length && total.push({
                                ...child,
                                filterValues: temp.map((tempItem, tempIdx) => {
                                    return tempIdx == 0 ? {
                                        ...tempItem,
                                        logicalOperator: ''
                                    } : { ...tempItem }
                                })
                            })
                        }
                    }
                    return total
                }, [])
                params[key] = [...temp]
            } else if (key === 'sorts') {
                params[key] = params[key].map(item => {
                    return {
                        direction: item?.direction || 'desc',
                        id: item.id,
                        showName: item.showName
                    }
                })
            }
        }
        let baseCategories = [];
        this.baseCategories.current.categories.forEach(cate => {
            baseCategories.push({
                fieldId: cate.fieldId,
                name: cate.name,
                showName: cate.showName,
                forShowList: [...cate.forShowList],
                valuesList: [...cate.valueList],
                isCustomDimension: cate.isCustom,
            })
        })
        let attachCategories = [];
        this.attachCategories.current.categories.forEach(cate => {
            attachCategories.push({
                fieldId: cate.fieldId,
                name: cate.name,
                showName: cate.showName,
                forShowList: [...cate.forShowList],
                valuesList: [...cate.valueList],
                isCustomDimension: cate.isCustom,
            })
        })
        params.baseCategories = baseCategories;
        params.attachCategories = attachCategories;
        return {
            ...this.state.runDataParams,
            params,
            // queryContext:JSON.stringify(queryContext)
        }
    }

    //运行按钮
    handleExplore = () => {
        // 判断是否拖拽过
        const hasDraged = this.state.dragList.some(dragItem => {
            return dragItem.children.length
        })
        if (!hasDraged) {
            message.warning('请先完成拖拽')
            return
        }
        let commitParams = this.handleParams();
        //排序字段需存在于维度中
        // let result = [];
        // if (commitParams.params.sorts.length) {
        //     result = this.isExistArr(commitParams.params.sorts,commitParams.params.dimensions,'id')
        // }
        // if (result.length){
        //     message.warning('所有排序需存在于维度中') 
        //     return;
        // }
        //指标必填---0325增加校验
        if (!this.state.dragList[2].children.length) {
            message.warning('请至少选择一个指标')
            return
        }
        // Base Categories 必填一个
        if (commitParams.params.baseCategories.length < 1) {
            message.warning('Base Categories至少选择一个产品')
            return
        }
        //人群包
        if (this.state.isSegmentRequired) {
            const judgeSegmentRequired = this.state.dragList[0].children.some(child => child.isSegment)
            if (!judgeSegmentRequired) {
                message.warning('人群包必选，请拖动【人群包】至筛选中')
                return
            }
        }
        //如果是新增页面 或者 复制查询条件
        if (['create', 'copy'].includes(this.props.type)) {
            this.setState({
                visibleBasicInfo: true
            })
            return;
        }
        Modal.confirm({
            title: '提示',
            content: (<>重新运行会覆盖原数据结果</>),
            cancelText: "取消",
            okText: "继续",
            onOk: () => {
                this.handleBasicInfoAsync('edit')
            }
        });
    }

    //过滤维度、指标
    handleSearch = (str) => {
        let collapseList = [...this.state.defCollapseList],
            keyWords = str || ''; // this.queryKeyWords.current.input.value.trim();
        if (!keyWords) {
            this.setState({
                collapseList
            })
            return;
        }
        let arr = collapseList.reduce((total, collapse) => {
            if (collapse.label == 'indexes') {
                let tempIndex = collapse.children.filter(item => {
                    return item.showName.toLowerCase().includes(keyWords.toLowerCase())
                })
                tempIndex.length && total.push({
                    ...collapse,
                    children: [...tempIndex]
                })
            } else {
                let temp = collapse.children.reduce((cur, next) => {
                    let temList = next.list.filter(item => {
                        let name = item.showName;
                        return name.toLowerCase().includes(keyWords.toLowerCase())
                    })
                    temList.length && cur.push({
                        ...next,
                        list: [...temList]
                    })
                    return cur
                }, [])
                temp.length && total.push({
                    ...collapse,
                    children: [...temp]
                })
            }
            return total
        }, [])
        this.setState({
            collapseList: arr,
            activeCollapse: arr.length && arr[0].children[0]?.title
        }, () => {
            console.log(232323, arr, this.state.activeCollapse)
        })
    }

    //已分析过的数据回显
    feedbackDragList = (params, queryContext) => {
        let dragList = [...this.state.dragList],
            initQueryContext = JSON.parse(queryContext),
            obj = JSON.parse(JSON.stringify(this.state.dragListConditions))
        // categorObj = JSON.parse(JSON.stringify(this.state.categories))
        for (let key in params) {
            switch (key) {
                case 'dimensions':
                    obj['dimensions'] = params[key].reduce((total, paramsItem) => {
                        // let hasValue = initQueryContext[key].findIndex(current => {
                        //     return current.id == paramsItem.id
                        // })
                        // hasValue != -1 && total.push({
                        //     ...paramsItem,
                        //     queryContext:initQueryContext[key][hasValue]
                        // })
                        // hasValue == -1 && total.push({
                        //     ...paramsItem
                        // })
                        total.push({
                            ...paramsItem
                        })
                        return total
                    }, [])
                    dragList[1].children = [...params[key]]
                    break;
                case 'indexes':
                    obj['indexes'] = params[key].reduce((total, paramsItem) => {
                        // let hasValue = initQueryContext[key].findIndex(current => {
                        //     return current.id == paramsItem.id
                        // })
                        // hasValue != -1 && total.push({
                        //     ...paramsItem,
                        //     queryContext:initQueryContext[key][hasValue],
                        //     runDataParams:{
                        //         aggregate: paramsItem.aggregate,
                        //         columnName: paramsItem.name
                        //     }
                        // })
                        // hasValue == -1 && total.push({
                        //     ...paramsItem
                        // })
                        total.push({
                            ...paramsItem
                        })
                        return total
                    }, [])
                    dragList[2].children = [...obj['indexes']]
                    break;
                case 'filters':
                    obj['filters'] = params[key].reduce((total, paramsItem) => {
                        // let hasValue = initQueryContext[key] ? initQueryContext[key].findIndex(current => {
                        //     return current.id == paramsItem.id
                        // }) : -1
                        // let tempObj = {...paramsItem};
                        // hasValue != -1 && total.push({
                        //     ...tempObj,
                        //     //queryContext:initQueryContext[key][hasValue]
                        // })
                        // hasValue == -1 && total.push(tempObj)
                        total.push({
                            ...paramsItem
                        })
                        return total
                    }, [])
                    dragList[0].children = [...obj.filters]
                    break;
                case 'sorts':
                    obj['sorts'] = params[key].reduce((total, paramsItem) => {
                        let hasValue = initQueryContext[key] ? initQueryContext[key].findIndex(current => {
                            return current.id == paramsItem.id
                        }) : -1
                        hasValue != -1 && total.push({
                            ...paramsItem,
                            queryContext: initQueryContext[key][hasValue]
                        })
                        hasValue == -1 && total.push(paramsItem)
                        return total
                    }, [])
                    dragList[3].children = [...obj.sorts]
                    break;
                // case 'attachCategories': 
                //     categorObj['attachCategories'] = params[key].reduce((pre, cur) => {
                //         pre.push({
                //             ...cur,
                //         })
                //         return pre;
                //     }, [])
                //     break;
                // case 'baseCategories':
                //     categorObj['baseCategories'] = params[key].reduce((pre, cur) => {
                //         pre.push({
                //             ...cur,
                //         })
                //         return pre;
                //     }, [])
                //     break;
            }
        }
        // console.log('categorObj = ', categorObj);
        this.setState({
            dragListConditions: obj,
            dragList,
            // categories: categorObj,
        })
    }

    // 左右拽-改变宽度
    darggableWidth = (e, idName) => {
        let resize = document.getElementById(idName);
        let leftBox = document.getElementById(this.state.leftBoxId);
        let middleBox = document.getElementById(this.state.middleBoxId);
        let rightBox = document.getElementById(this.state.rightBoxId);
        let bigBox = document.getElementById(this.state.bigBoxId);
        let startX = e.clientX;
        resize.left = resize.offsetLeft;
        document.onmousemove = function (e) {
            let endX = idName.includes('resizeBox1') ? e.clientX + 3 : e.clientX - 13;
            let moveLen = idName.includes('resizeBox1') ? resize.left + (endX - startX) : resize.left + (endX - startX) - leftBox.offsetWidth;
            let maxT = idName.includes('resizeBox1') ? bigBox.clientWidth - middleBox.offsetWidth - resize.offsetWidth : bigBox.clientWidth - leftBox.offsetWidth - resize.offsetWidth;
            if (moveLen < 160) moveLen = 160;
            if (moveLen > maxT - 160) moveLen = maxT - 160;
            resize.style.left = moveLen;
            if (idName.includes('resizeBox1')) {
                leftBox.style.width = (moveLen - 3) + "px";
                rightBox.style.width = (bigBox.clientWidth - moveLen - middleBox.offsetWidth - 32) + "px";
            } else {
                middleBox.style.width = (moveLen - 3) + "px";
                rightBox.style.width = (bigBox.clientWidth - moveLen - leftBox.offsetWidth - 32) + "px";
            }
        }
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resize.releaseCapture && resize.releaseCapture();
        }
        resize.setCapture && resize.setCapture();
        return false;
    }

    // 上下拽-改变高度
    darggableHeight = (e, index) => {
        let resize = document.getElementById(`midResizeBox${index}`), that = this;
        let top = document.getElementById(`analysisDrag${index}`);
        let startY = e.clientY, topY = top.offsetTop;
        resize.top = resize.offsetTop;
        document.onmousemove = function (e) {
            let endY = e.clientY;
            let moveLen = resize.top + (endY - startY) - topY;
            if (moveLen > 500) moveLen = 500;
            resize.style.top = moveLen;
            top.style.height = moveLen + 'px';
            if (index == 3) document.getElementsByClassName('ant-tabs-content ant-tabs-content-top')[1].scrollTop = document.getElementsByClassName('ant-tabs-content ant-tabs-content-top')[1].scrollHeight;
        }
        document.onmouseup = function (evt) {
            document.onmousemove = null;
            document.onmouseup = null;
            resize.releaseCapture && resize.releaseCapture();
        }
        resize.setCapture && resize.setCapture();
        return false;
    }

    //基础信息弹框的保存与取消
    handleBasicModal = (btnTxt) => {
        if (btnTxt == 'ok') {
            this.formRefBasicInfo.current.validateFields().then(values => {
                if (['edit'].includes(this.props.type)) {
                    Modal.confirm({
                        title: '提示',
                        content: (<>重新运行会覆盖原数据结果</>),
                        cancelText: "取消",
                        okText: "继续",
                        zIndex: 1200,
                        onOk: () => {
                            this.handleBasicInfoAsync()
                        }
                    });
                } else {
                    this.handleBasicInfoAsync();
                }
            }).catch(errorInfo => {
                console.log('Failed:', errorInfo);
            })
            return;
        }
        this.setState({
            visibleBasicInfo: false
        })
    }

    //异步：保存并运行
    handleBasicInfoAsync = async (flag = '') => {
        try {
            const values = flag == '' && await this.formRefBasicInfo.current.validateFields();
            let commitParams = this.handleParams()
            commitParams = {
                ...commitParams,
                sliceName: values?.sliceName || this.state.basicInfo?.sliceName,
                description: values.description || this.state.basicInfo?.description || '',
                id: this.state.basicInfo.id || null,
                subjectId: this.state.subjectId,
            }
            console.log('saveChart', commitParams)
            //return
            this.setState({
                exploreLoading: true,
                isLoading: true,
            }, () => {
                saveChartForTicket(commitParams).then(res => {
                    const that = this;
                    if (res.msg == 'success') {
                        this.setState({
                            visibleBasicInfo: false,
                            exploreLoading: false,
                            //isLoading:false
                        }, () => {
                            message.success('保存成功', 2, function () {
                                that.props.onBack();
                            })
                        })
                    }
                }).catch(err => {
                    err.msg && message.error(err.msg);
                    this.setState({
                        visibleBasicInfo: false,
                        exploreLoading: false,
                        isLoading: false
                    })
                })
            })
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
        }
    }

    isExistArr = (arr1, arr2, key) => {
        let result = [];
        arr1.forEach(arr1Item => {
            if (arr2.findIndex(arr2Item => arr2Item[key] === arr1Item[key]) == -1) {
                result.push(arr1Item)
            }
        })
        return result;
    }

    //异步：下载
    downloadResultForTicket = () => {
        this.setState((state) => ({
            ...state,
            emailModalData: {
                ...state.emailModalData,
                visibleEmailInfo: true,
                downLoadApi: downloadResultForTicket,
                downLoadParams: {
                    id: this.props?.sliceId
                }
            }
        }))
    }

    getData = async (id) => {
        this.setState({ isLoading: true })
        try {
            let resData = await getRunResultForTicket({ id, size: this.state.pageSize, page: this.state.pageNo - 1 });
            let cloumns = resData?.data.columns || [],
                tableCloumns = [],
                name = '',
                tempRecords = resData?.data.records || [];
            for (let j = 0; j < cloumns.length; j++) {
                name = cloumns[j].showName;
                tempRecords.forEach(record => {
                    //   record[name] = cloumns[j].columnType === 'INDEX' && cloumns[j].isItThousands == 1 ? numToMoneyField(record[name],cloumns[j].precisions):record[name];
                    if (cloumns[j].columnType === 'INDEX') {
                        let precisions = +cloumns[j].precisions;
                        if (cloumns[j].dataType === 'percentage') {
                            record[name] = Number(+record[name] * 100).toFixed(precisions) + '%';
                        } else if (cloumns[j].dataType === 'number') {
                            record[name] = cloumns[j].isItThousands == 1 ? numToMoneyField(record[name], precisions) : record[name];
                        }
                    }
                })
                const sortableFn = (key, columnType) => {
                    return (a, b) => {
                        return columnType == 'INDEX' ? (clearComma(a[key]) - clearComma(b[key])) : (a[key].length - b[key].length)
                    }
                }
                tableCloumns[j] = {
                    title: name,
                    // title: (<span onClick={e => { 
                    //     if(e.target.closest(".ant-tooltip")) 
                    //     {e.stopPropagation}
                    // }}>
                    // <Tooltip title={name}>{name}</Tooltip>
                    // </span>),
                    dataIndex: name,
                    width: 200,
                    align: 'left',
                    ellipsis: true,
                    sorter: sortableFn(name, cloumns[j].columnType)
                }
            }
            const filterOptions = tableCloumns.map(it => ({
                label: it.title,
                value: it.dataIndex
            }))
            const checkedValue = filterOptions.map(it => it.value);
            console.log('checkedValue = ', checkedValue);
            this.setState({
                columns: tableCloumns,
                defcolumns: tableCloumns,
                filterOptions,
                checkedValue,
                dataList: tempRecords.map((record, index) => {
                    return { ...record, key: index }
                }),
                pageNo: resData?.data.page + 1,
                total: resData?.data.totalCount,
                isLoading: false
            })
        } catch (err) {
            err.msg && message.error(err.msg);
            this.setState({
                isLoading: false
            })
        }
    }

    //复制查询条件
    handleCopy = () => {
        this.props.onCreate('copy', { ...this.props });
    }

    handleExploreForDownloadData = (data) => {
        if (data.operation === 'ok') {
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
            this.setState((state) => ({
                ...state,
                isLoading: false,
                emailModalData: {
                    ...state.emailModalData,
                    visibleEmailInfo: false,
                    isLoading: false,
                }
            }))
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

    handleExploreForDownloadData2 = (data) => {
        if (data.operation === 'ok') {
            if (this.state.emailModalData.isStaff) {
                console.log('雇员取当前用户的邮箱，非雇员才取输入的邮箱')
            }
            console.log(data.emailStr);
            this.setState((state) => ({
                ...state,
                isLoading: true,
                emailModalData: {
                    ...state.emailModalData,
                    isLoading: true,
                }
            }), () => {
                const downObj = {
                    id: this.props?.sliceId,
                    email: data.emailStr ?? '',
                }
                downloadResultForTicket(downObj).then(res => {
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

    openChange = (newOpen, auto) => {
        const { noticeData } = this.state;
        this.setState({
            noticeData: {
                ...noticeData,
                defaultOpen: newOpen,
                auto
            }
        })
    }

    render () {
        const { basicInfo, currentModelId, categories, productOptions } = this.state;
        return <Spin spinning={this.state.isLoading}>
            <div className="oap-container" style={{ padding: '0 16px 16px' }}>
                <Row id={this.state.bigBoxId} className="oap-row">
                    <Col id={this.state.leftBoxId} className="oap-analysis-col-flex" style={{ width: '182px' }}>
                        <div className="oap-card">
                            <div className="oap-flex-between content-title">
                                <span>数据信息</span>
                                {/* <img src={require('@/locales/images/chooseData.png')} alt="change" width={24} className="oap-switch" onClick={this.switchData}/> */}
                                <AutoNotice noticeData={this.state.noticeData} modelId={currentModelId} openChange={this.openChange} />
                            </div>
                            <div className="oap-update-time">
                                <Tooltip placement="topLeft" title={basicInfo.name}>
                                    <p className="title ellipsis">{basicInfo.name || '--'}</p>
                                </Tooltip>
                                <p className="font-gray">数据更新时间:</p>
                                <p>{basicInfo.lastModifyAt || '----'}</p>
                            </div>
                        </div>
                        <SearchInput placeholder="搜索维度/指标" btnWidth={56} onSearch={(str) => this.handleSearch(str)} />
                        <div className="oap-card padnone oap-analysis-leftList">
                            {this.state.collapseList.length ? this.state.collapseList.map(collapse => {
                                return <div className="oap-Collapse-area" key={collapse.title}>
                                    <div className="content-title">{collapse.title}</div>
                                    {collapse.label == "indexes" ? <ReactSortable
                                        list={collapse.children}
                                        setList={(newState) => { }}
                                        animation={150}
                                        group={{ name: "disable-group-name", pull: "clone", put: false }}
                                        clone={item => ({ ...item })}
                                        sort={false}
                                        chosenClass="sortable-drag"
                                        onStart={(target) => this.setSortStart(collapse.label, target)}
                                        onEnd={() => this.setState({ dragFromClassify: '', dragItemId: null })}>
                                        {collapse.children && collapse.children.map(listItem => {
                                            return <div key={listItem.id} data-filterable={listItem?.filterable} data-groupby={listItem?.groupby}>
                                                <Tooltip title={`${listItem.showName}: ${listItem?.description}`} trigger="click">
                                                    <div className="oap-drag-item ellipsis">{listItem.showName}</div>
                                                </Tooltip>
                                            </div>
                                        })}
                                    </ReactSortable> : <Collapse activeKey={this.state.activeCollapse} accordion expandIconPosition="end" ghost onChange={(key) => this.setState({ activeCollapse: key })}>
                                        {collapse.children.map(child => {
                                            return <Collapse.Panel header={<div><Tooltip title={child.title} trigger="click">{child.title}&nbsp;&nbsp;{child.icon ? child.icon : null}</Tooltip></div>} key={child.title}>
                                                <ReactSortable
                                                    list={child.list}
                                                    setList={(newState) => { }}
                                                    animation={150}
                                                    group={{ name: "disable-group-name", pull: "clone", put: false }}
                                                    clone={item => ({ ...item })}
                                                    sort={false}
                                                    chosenClass="sortable-drag"
                                                    onStart={(target) => this.setSortStart(collapse.label, target)}
                                                    onEnd={() => this.setState({ dragFromClassify: '', dragItemId: null })}>
                                                    {child.list && child?.list.map(listItem => {
                                                        return <div key={listItem.id} data-filterable={listItem?.filterable} data-groupby={listItem?.groupby}>
                                                            <Tooltip title={`${listItem.showName}: ${listItem?.description}`} trigger="click">
                                                                <div className="oap-drag-item ellipsis">{listItem.showName}</div>
                                                            </Tooltip>
                                                        </div>
                                                    })}
                                                </ReactSortable>
                                            </Collapse.Panel>
                                        })}
                                    </Collapse>}
                                </div>
                            }) : <div className="oap-flex-between">暂无数据</div>}
                        </div>
                    </Col>
                    <Col id={this.state.resizeBox1Id}>
                        <div style={{ width: '16px', height: '100%', cursor: 'ew-resize' }} onMouseDown={(e) => this.darggableWidth(e, this.state.resizeBox1Id)}></div>
                    </Col>
                    <Col id={this.state.middleBoxId} style={{ width: '182px', overflowY: 'auto' }}>
                        {this.state.dragList.map((dragBox, boxIndex) => {
                            return <div className="oap-card oap-drag-containBox" key={dragBox.title} id={`analysisDrag${boxIndex}`}>
                                <div className="oap-drag-container">
                                    <div className="content-title">
                                        <img src={require(`@/locales/images/${dragBox.iconName}.png`)} alt="icon" width={20} />
                                        <span className="label">{dragBox.title}</span>
                                    </div>
                                    <ReactSortable
                                        list={dragBox.children}
                                        setList={(newState) => this.setSortableList(newState, boxIndex)}
                                        animation={150}
                                        group={{ name: "disable-group-name", pull: "clone" }}
                                        chosenClass="sortable-drag"
                                        onStart={(target) => this.setDragBoxSortStart(boxIndex, target)}
                                        className={['drag-toContent', dragBox.classify.includes(this.state.dragFromClassify) ? 'drag-able-content' : ''].join(' ')}>
                                        {dragBox.children.map((child, childIdx) => {
                                            return <div className="oap-flex-between oap-drag-item" key={child.id} data-classify={dragBox.flag}>
                                                <div className="name ellipsis">{child?.showName}</div>
                                                <div className="oap-drag-item-action">
                                                    {(dragBox.label === 'dimensions' && child.isSegment != 1) || (dragBox.label === 'indexes' && child.hasCondition != 1) ? null : <IconEditA onClick={() => this.handleEdit(dragBox.label, child.id, childIdx)} />}
                                                    {dragBox.label === 'filters' && child?.deleteFlag ? null : <IconClose onClick={() => this.handleDelete(boxIndex, childIdx)} />}
                                                </div>
                                            </div>
                                        })}
                                    </ReactSortable>
                                </div>
                                <div id={`midResizeBox${boxIndex}`} style={{ width: '100%', height: '0px', cursor: 'ns-resize' }}></div>
                            </div>
                        })}
                    </Col>
                    <Col id={this.state.resizeBox2Id}>
                        <div style={{ width: '16px', height: '100%', cursor: 'ew-resize' }} onMouseDown={(e) => this.darggableWidth(e, this.state.resizeBox2Id)}></div>
                    </Col>
                    <Col id={this.state.rightBoxId} className="oap-ananlysis-right">
                        <div className="table-container oap-card oap-analysisList" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
                            <div className="oap-card-top">
                                <Row className="oap-row" justify="space-between">
                                    <Col style={{ minWidth: '452px', width: '62%' }}>
                                        {basicInfo.sliceName ? <div className="oap-card-top-title">
                                            <Tooltip title={basicInfo.sliceName} className="oap-flex-row oap-flex-row-align">
                                                <div className="title ellipsis" style={{ maxWidth: '90%' }}>
                                                    <span>{basicInfo.sliceName}</span>
                                                </div>
                                                <IconEditA onClick={this.handleAnalysisEdit} />
                                            </Tooltip>
                                            <Tooltip title={basicInfo.description}>
                                                <div className="ellipsis">{basicInfo.description}</div>
                                            </Tooltip>
                                        </div> : ''}
                                    </Col>
                                    {checkMyPermission('oap:ticketAnalysis:saveChart') ? <Col flex={['edit'].includes(this.props.type) ? '200px' : '80px'}>
                                        <Space>
                                            <Button type="primary" onClick={() => this.props.onCreate('create', {})}>创建分析</Button>
                                            {['edit'].includes(this.props.type) && <Button onClick={this.handleCopy}>复制查询条件</Button>}
                                        </Space>
                                    </Col> : null}
                                </Row>
                            </div>
                            <div className='oap-set-category-container'>
                                <Row gutter={12} warp='false' justify='space-between'>
                                    <Col span={6}>
                                        <SetCategory
                                            ref={this.baseCategories}
                                            title="Base Categories"
                                            isBase={true}
                                            productData={productOptions.baseCategories}
                                            categoryData={categories.baseCategories}
                                            type={this.props.type}
                                        ></SetCategory>
                                    </Col>
                                    <Col span={6}>
                                        <SetCategory
                                            ref={this.attachCategories}
                                            title="Attached Categories"
                                            isBase={false}
                                            productData={productOptions.attachCategories}
                                            categoryData={categories.attachCategories}
                                            type={this.props.type}
                                        ></SetCategory>
                                    </Col>
                                </Row>
                            </div>
                            <ShowDragContion conditionList={this.state.dragListConditions['filters']}></ShowDragContion>
                            <div className="table-top-wrap" style={{ paddingTop: this.state.checkedValue.length ? '32px' : '68px' }}>
                                <div className="table-top-btn" style={{ top: '16px' }}>
                                    <Space>
                                        {checkMyPermission('oap:ticketAnalysis:saveChart') ? <Button type="primary" onClick={() => this.handleExplore()} disabled={currentModelId == null} loading={this.state.exploreLoading}>保存并运行</Button> : null}
                                        {checkMyPermission('oap:ticketAnalysis:download') ? <Button disabled={['create', 'copy'].includes(this.props.type) || (basicInfo.queryStatus && basicInfo.queryStatus.toLowerCase() != 'finish')} onClick={this.downloadResultForTicket}>导出CSV</Button> : null}
                                    </Space>
                                </div>
                                <Table
                                    rowsKey="id"
                                    tableKey={`oapTicketResultList_${Date.now()}`}
                                    columns={this.state.columns}
                                    dataSource={this.state.dataList}
                                    loading={this.state.tableLoading}
                                    allFilterColumns={this.state.checkedValue}
                                    pagination={{
                                        showQuickJumper: true,
                                        showSizeChanger: true,
                                        pageSize: this.state.pageSize,
                                        current: this.state.pageNo,
                                        total: this.state.total,
                                        onChange: (pageNo, pageSize) => this.onPageChange(pageNo, pageSize)
                                    }}
                                    scroll={{ x: '100%' }}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
            <SetCondition
                visible={this.state.visibleConditon}
                item={this.state.itemConditon}
                childCondition={this.state.childCondition}
                classify={this.state.classifyConditon}
                currentIndex={this.state.currentConditionIndex}
                changeVisible={this.changeSetConditionVisible}
                completeSet={this.handCompleteSet}
                saveTabActive={this.saveTabActive}></SetCondition>
            <Modal
                title={!this.props?.sliceId ? '基础信息创建' : '基础信息修改'}
                visible={this.state.visibleBasicInfo}
                className="basicInfo"
                zIndex={1030}
                cancelText="取消"
                okText="确定"
                confirmLoading={this.state.exploreLoading}
                onCancel={() => this.handleBasicModal('cancel')}
                onOk={() => this.handleBasicModal('ok')}>
                <div className="table-container">
                    <Form
                        ref={this.formRefBasicInfo}
                        layout="vertical"
                        size="middle"
                        initialValues={this.state.basicInfo}>
                        <div>
                            <Row gutter={12}>
                                {/* <Col span={12}>
                                    <Form.Item name="subjectName" label="业务域名称：">
                                        <Select placeholder="全部" disabled>
                                            {this.props.subjectModelList.length && this.props.subjectModelList.map(model => {
                                                return <Select.Option value={model.name} key={model.id}>{model.name}</Select.Option>
                                            })}
                                        </Select>
                                    </Form.Item>
                                </Col> */}
                                <Col span={12}>
                                    <Form.Item
                                        name="sliceName"
                                        label="查询名称："
                                        rules={[
                                            {
                                                validator: (rule, value, callback) => {
                                                    if ((value ?? '') !== '') {
                                                        if (value.replace(/\s+/g, "").length == 0) {
                                                            callback('您输入的全部是空格，请重新输入')
                                                        } else {
                                                            callback()
                                                        }
                                                    } else {
                                                        callback("请输入查询名称")
                                                    }
                                                }
                                            }
                                        ]}>
                                        <Input
                                            placeholder="请输入查询名称"
                                            maxLength="255"
                                            allowClear />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="description" label="详情：">
                                        <Input.TextArea rows={6} maxLength="255" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    </Form>
                </div>
            </Modal>
            <ExploreEmailModal onExplored={this.handleExploreForDownloadData} {...this.state.emailModalData} />
        </Spin>
    }
}

export default Index;