import React from "react";
import { Spin, Input, Space, Steps, Divider, Row, Col, Select, Button, DatePicker, TimePicker, Modal, message, Empty, InputNumber, Tooltip, Radio, Form as AurumForm } from '@aurum/pfe-ui';
import { Form } from '@mcd/portal-components';
import { IconAddA, IconAddB, IconReduceCircleB, IconClearUp, IconLoadingFill, IconInfoCircle } from '@aurum/icons';
import querystring from "query-string";
import {
    queryModelForCustom,
    saveCustomRulesList,
    getCustomRulesDetailInfo,
    updateCustomRulesList,
} from '@/api/oap/custom_rule.js';
import { prepareChart, getConditionConfig, queryCascadeFieldInfoList } from '@/api/oap/self_analysis.js';
import { getTicketAnalysisField } from '@/api/oap/ticket_analysis.js';
import { prepareChartTrino, getConditionConfigTrino } from '@/api/oap/trino.js';
import { uuid, getFileContent, optionFilterProp, formatTimeSeconds } from "@/utils/store/func";
import moment from 'moment';
import "@/style/custom.less";
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { TIME_SELECT_TYPE_LIST, RELATIVE_TIME_TYPE_LIST, RELATIVE_TIME_UNIT_LIST } from '@/constants';

export default class CustomRulesForm extends React.Component {
    constructor(props) {
        super(props);
        this.formStpesOneRef = React.createRef();
        this.formStpesTwoRef = React.createRef();
        this.formBatchRef = React.createRef();
        this.fileInput = React.createRef();
        this.logicalOptions = [
            {
                label: 'AND',
                value: 'AND'
            },
            {
                label: 'OR',
                value: 'OR'
            }
        ]
        this.groupParams = [
            {
                "logicalOperator": "",
                "conditionList": [
                    {
                        "logicalOperator": "",
                        "fieldId": '',
                        "compareOperator": "",
                        "comparator": [],
                        'timeType': ''
                    }
                ]
            }
        ]
        this.state = {
            isLoading: false,
            current: 0,
            steps: [
                {
                    title: '基本设置',
                },
                {
                    title: '规则配置',
                }
            ],
            customTypeList: [
                {
                    label: '自定义字段分组',
                    value: 0
                }, {
                    label: 'Ticket Analysis',
                    value: 1
                }
            ],
            formBasicInfo: {
                customType: 0
            },
            formGroup: {
                params: [
                    {
                        groupName: '',
                        groupParams: this.groupParams
                    }
                ]
            },
            chooseDataList: [],//选择数据列表
            fieldList: [],//维度列表
            editId: null,
            defBusinessId: null,
            visibleBatch: false,
            dateFieldList: [],//日期维度列表
            enumFieldList: [], //枚举值维度列表
            batchFieldIdList: [],
            overallDisabled: false,
            chooseDataListLoading: false,
            fieldListForTicket: [],
            calculationMethod: '1',
            batchAddType: 'date',
            formBatch: {
                addType: 'date',
                nameRule: 'positiveInteger',
                timeType: 'absolute'
            },
            isLoadingBatch: false,
            tableType: null
        }
    }

    async componentDidMount () {
        const { id } = querystring.parse(this.props.location.search);
        if (id) {
            this.setState({
                editId: id,
                isLoading: true,
            });
            await this.initEdit(id);
        } else {
            this.fetchChooseDataList(0);
        }
        this.setState({ isLoading: false })
    }

    //获取选择数据列表
    fetchChooseDataList = (val) => {
        this.setState({
            chooseDataListLoading: true,
            chooseDataList: []
        }, () => {
            queryModelForCustom({
                customType: val
            }).then(res => {
                this.setState({
                    chooseDataListLoading: false,
                    chooseDataList: res.data || [],
                })
            }).catch(err => {
                err.msg && message.error(err.msg);
            })
        })
    }

    initEdit = async (editId) => {
        try {
            const resInfo = await getCustomRulesDetailInfo(editId);
            const data = resInfo?.data || {};
            const formBasicInfo = {
                dimensionName: data?.dimensionName,
                description: data?.description,
                customType: data?.customType,
                businessId: data?.businessId,
            };
            this.fetchChooseDataList(data.customType);
            const formGroup = { params: [...data?.params] };
            this.formStpesOneRef.current.setFieldsValue(formBasicInfo)
            this.setState({
                formBasicInfo,
                formGroup,
                calculationMethod: '' + data?.calculationMethod,
                tableType: data.tableType
            })
        } catch (errorInfo) {
            console.log(400, errorInfo)
        }
    };

    //下一步
    handleStepsNext = () => {
        const { current } = this.state;
        if (current == 0) {
            this.formStpesOneRef.current.validateFields().then(values => {
                this.setState({
                    current: current + 1,
                    formBasicInfo: this.formStpesOneRef.current.getFieldsValue()
                }, async () => {
                    if (values.customType < 1) {
                        await this.getPrepareChart();
                    } else {
                        this.getTicketAnaysisOptions();
                    }
                })
            }).catch(errorInfo => { })
        }
    }

    handleUpdate = () => {
        const { formGroup, fieldList, fieldListForTicket } = this.state;
        formGroup.params.forEach((paramsItm, paramsIdx) => {
            paramsItm.groupParams.forEach((groupParamsItm, groupParamsIdx) => {
                groupParamsItm.conditionList.forEach((conditionItm, conditionIdx) => {
                    if (conditionItm.fieldId) {
                        if (this.state.formBasicInfo.customType > 0) {
                            if (fieldListForTicket.length) {
                                conditionItm.showDataType = optionFilterProp(fieldListForTicket, 'fieldId', conditionItm.fieldId)?.showDataType;
                            }
                        } else {
                            if (fieldList.length) {
                                conditionItm.showDataType = optionFilterProp(fieldList, 'id', conditionItm.fieldId)?.showDataType;
                                if (['Date', 'DateUnlimited'].includes(conditionItm.showDataType)) {
                                    console.log('121212dfadfa', conditionItm)
                                    if (((conditionItm.timeType ?? '') == '' || conditionItm?.timeType.toLowerCase() == 'absolute')) {
                                        if (conditionItm?.compareOperator.toLowerCase() == 'between') {
                                            conditionItm.comparator = conditionItm.comparator.map(comparatorItem => moment(Number(comparatorItem)))
                                        } else {
                                            conditionItm.comparator = moment(Number(conditionItm.comparator[0]));
                                        }
                                        conditionItm.timeType = conditionItm.timeType ? conditionItm.timeType : 'absolute';
                                    } else {
                                        conditionItm.relativeTypeStart = conditionItm.relativeInfo[0].relativeType;
                                        conditionItm.relativeValueStart = conditionItm.relativeInfo[0].relativeValue;
                                        conditionItm.comparatorStart = conditionItm.comparator[0];
                                        if (conditionItm?.compareOperator.toLowerCase() == 'between') {
                                            conditionItm.relativeTypeEnd = conditionItm.relativeInfo[1].relativeType;
                                            conditionItm.relativeValueEnd = conditionItm.relativeInfo[1].relativeValue;
                                            conditionItm.comparatorEnd = conditionItm.comparator[1];
                                        }
                                    }
                                } else if (conditionItm.showDataType == 'DateTime') {
                                    conditionItm.comparator = conditionItm.comparator.map(comparatorItem => moment(comparatorItem, 'HH:mm:ss'))
                                }
                            }
                        }
                        //this.handleConfig(conditionItm.fieldId, paramsIdx, groupParamsIdx, conditionIdx)
                    }
                })
            })
        })
    }

    //上一步
    handleStepsPrev = () => {
        const { current } = this.state;
        if (current == 1) {
            this.setState({
                current: current - 1
            })
        }
    }

    //获取ck维度字段列表
    getPrepareChart = async () => {
        this.setState({
            isLoading: true
        })
        try {
            const prepareChartApi = this.state.tableType == 0 ? prepareChart : prepareChartTrino;
            let resPrepareChart = await prepareChartApi({ modelId: this.state.formBasicInfo.businessId, vizType: 'TABLE' });
            const modelInfo = resPrepareChart.data?.modelInfo || {};
            this.setState({
                fieldList: modelInfo?.dimensions.length ? modelInfo?.dimensions.filter(item => item.filterable) : [],
                dateFieldList: modelInfo?.dimensions.length ? modelInfo?.dimensions.filter(item => item.filterable && ['Date', 'DateUnlimited'].includes(item.showDataType)) : [],
                enumFieldList: modelInfo?.dimensions.length ? modelInfo?.dimensions.filter(item => item.filterable && ['Select', 'SelectMulti'].includes(item.showDataType)) : [],
                isLoading: false
            }, () => {
                if (this.state.editId) this.handleUpdate();
            })
        } catch (err) {
            err.msg && message.error(err.msg);
            this.setState({
                isLoading: false,
                overallDisabled: true
            })
        };
    }

    getTicketAnaysisOptions = () => {
        this.setState({
            isLoading: true,
        }, async () => {
            let resTicket = await getTicketAnalysisField();
            this.setState({
                fieldListForTicket: [...resTicket?.data],
                isLoading: false,
            }, () => {
                if (this.state.editId) this.handleUpdate();
            })
        })
    }

    //选择字段
    handleSelectFieldId = (value, fieldsIdx, index, fieldIndex) => {
        // 如果前面选择的类型是小票分析，则条件的options为小票分析的字段
        const optionFilter = this.state.formBasicInfo.customType > 0 ? optionFilterProp(this.state.fieldListForTicket, 'fieldId', value) || {} : optionFilterProp(this.state.fieldList, 'id', value) || {};
        const showDataType = optionFilter?.showDataType;
        const formGroup = this.formStpesTwoRef.current.getFieldsValue();
        formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex].showDataType = showDataType;
        formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex].fieldId = value;
        console.log(23232323, showDataType, formGroup)
        //清除逻辑关系、枚举值
        if (['Date', 'DateUnlimited'].includes(showDataType)) {
            formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex].comparator = null;
            formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex].timeType = 'absolute';
        } else {
            formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex].comparator = [];
            formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex].timeType = '';
        }
        formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex].isCascade = 0;
        formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex].compareOperator = '';
        this.formStpesTwoRef.current.setFieldsValue({ 'params': formGroup.params });//!!!改变表单值
        //如果是级联，单独处理
        optionFilter?.isCascade ? this.handleCascadeList(optionFilter, fieldsIdx, index, fieldIndex) : this.handleConfig(value, fieldsIdx, index, fieldIndex);//获取逻辑关系、枚举值等相关配置
    }

    //获取逻辑关系、枚举值等相关配置
    handleConfig = async (id, fieldsIdx, index, fieldIndex) => {
        console.log('handleConfig 0')
        const formGroup = this.formStpesTwoRef.current.getFieldsValue(true);
        const conditionItem = formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex];
        conditionItem.operates = [];
        conditionItem.selectInputVoList = [];
        this.formStpesTwoRef.current.setFieldsValue({ 'params': formGroup.params });//!!!改变表单值
        try {
            const prepareChartApi = this.state.tableType == 0 ? getConditionConfig : getConditionConfigTrino;
            const resConfig = await prepareChartApi({ fieldId: id });
            console.log('handleConfig', resConfig)
            const operates = resConfig.data.fieldOperates ? resConfig.data.fieldOperates.map(operate => {
                return { label: operate, value: operate }
            }) : [];
            const selectInputVoList = resConfig.data.fieldValues ? resConfig.data.fieldValues.map(select => {
                return { label: select.name, value: select.value }
            }) : [];
            conditionItem.operates = operates;
            conditionItem.selectInputVoList = selectInputVoList;
            if ((this.state.editId ?? '') == '') {
                conditionItem.compareOperator = operates.length ? operates[0].value : '';
                conditionItem.comparator = ['Date', 'DateUnlimited'].includes(conditionItem.showDataType) ? null : (
                    selectInputVoList.length ? [selectInputVoList[0].value] : []
                )
            }
            this.formStpesTwoRef.current.setFieldsValue({ 'params': formGroup.params });//!!!改变表单值
        } catch (err) {
            this.setState({
                //spinLoading:false
            })
        }
    }

    //选择比较符
    handleOperatorChange = (value, fieldsIdx, index, fieldIndex) => {
        const formGroup = this.formStpesTwoRef.current.getFieldsValue();
        const conditionItem = formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex];
        if (['Date', 'DateUnlimited'].includes(conditionItem?.showDataType)) {
            if (conditionItem?.timeType.toLowerCase() == 'absolute') {
                if (conditionItem?.compareOperator.toLowerCase() == 'between') {
                    conditionItem.comparator = [];
                } else {
                    conditionItem.comparator = null;
                }
            } else {
                if (conditionItem?.compareOperator.toLowerCase() == 'between') {
                    conditionItem.relativeTypeEnd = conditionItem.relativeTypeEnd ? conditionItem.relativeTypeEnd : -1;
                    conditionItem.relativeValueEnd = conditionItem.relativeValueEnd ? conditionItem.relativeValueEnd : 'day';
                    conditionItem.comparatorEnd = conditionItem.comparatorEnd ? conditionItem.comparatorEnd : '';
                    //conditionItem.comparator = [];
                }
            }
            this.formStpesTwoRef.current.setFieldsValue({ 'params': formGroup.params });//!!!改变表单值
        }
    }

    handleSelectFile = () => {
        this.fileInput.current.value = null;
        this.fileInput.current.click();
    }

    //上传
    handleFileChange = (ev, fieldsIdx, index, fieldIndex) => {
        const formData = this.formStpesTwoRef.current.getFieldsValue()?.params; //!!!
        const files = ev.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const fileTypes = ['text/csv', 'application/vnd.ms-excel'];
        if (!fileTypes.includes(file.type)) {
            message.warning('暂不支持解析' + file.type + '类型的文件');
            return false;
        }

        getFileContent(file).then((content) => {
            if (content) {
                // let tempItemCodeList = content.split('\r\n');
                let regExp = /\r\n|\r|\n/g;
                let newContent = content.replace(regExp, ',');
                let tempItemCodeList = newContent.split(',');
                tempItemCodeList = tempItemCodeList.filter((item) => {
                    return !['item_code', 'item code', 'uscode'].includes(item.toLowerCase()) && item !== '';
                });
                if (tempItemCodeList.length > 0) {
                    formData[fieldsIdx].groupParams[index].conditionList[fieldIndex].comparator = tempItemCodeList;
                    this.formStpesTwoRef.current.setFieldsValue({ 'params': formData });//!!!改变表单值
                }
            }
        }).catch((error) => {
            message.error(error || '无法读取文件内容');
        });
    }

    //获取级联字段的枚举值等相关配置
    handleCascadeList = async (currentItem, fieldsIdx, index, fieldIndex) => {
        const formGroup = this.formStpesTwoRef.current.getFieldsValue();
        const conditionItem = formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex];
        conditionItem.operates = [];
        conditionItem.selectInputVoList = [];
        this.formStpesTwoRef.current.setFieldsValue({ 'params': formGroup.params });//!!!改变表单值
        try {
            const resConfig = await queryCascadeFieldInfoList({ groupName: currentItem.groupName, fieldId: currentItem.id });
            const selectInputVoList = resConfig.data.dictList ? resConfig.data.dictList.map(dict => {
                return { value: dict.value, label: dict.name }
            }) : [];
            conditionItem.operates = [{ label: 'in', value: 'in' }];
            conditionItem.isCascade = 1;
            conditionItem.selectInputVoList = selectInputVoList;
            this.formStpesTwoRef.current.setFieldsValue({ 'params': formGroup.params });//!!!改变表单值
        } catch (err) {
            this.setState({
                //spinLoading:false
            })
        }
    }

    //保存
    handleSave = async () => {
        const that = this;
        try {
            const values = await this.formStpesTwoRef.current.validateFields();
            this.setState({
                isLoading: true,
            }, () => {
                let valusFormat = JSON.parse(JSON.stringify(values)); //!!!!
                valusFormat.params.forEach(paramsItm => {
                    paramsItm.groupParams.forEach((groupParamsItm, groupParamsIdx) => {
                        groupParamsItm.conditionList.forEach((conditionItm, conditionIdx) => {
                            const comparatorTypeOf = Object.prototype.toString.call(conditionItm.comparator);
                            switch (conditionItm?.showDataType) {
                                case 'Date': case 'DateUnlimited':
                                    if (conditionItm.timeType == TIME_SELECT_TYPE_LIST[1].value) { //相对时间
                                        if (conditionItm.compareOperator.toLowerCase() == 'between') {
                                            conditionItm.relativeInfo = [
                                                {
                                                    relativeType: conditionItm.relativeTypeStart,
                                                    relativeValue: conditionItm.relativeValueStart,
                                                },
                                                {
                                                    relativeType: conditionItm.relativeTypeEnd,
                                                    relativeValue: conditionItm.relativeValueEnd
                                                }
                                            ]
                                            conditionItm.comparator = [conditionItm.comparatorStart, conditionItm.comparatorEnd];
                                        } else {
                                            conditionItm.relativeInfo = [
                                                {
                                                    relativeType: conditionItm.relativeTypeStart,
                                                    relativeValue: conditionItm.relativeValueStart,
                                                }
                                            ]
                                            conditionItm.comparator = [conditionItm.comparatorStart];
                                        }
                                    } else {
                                        if (comparatorTypeOf !== '[object Array]') {
                                            conditionItm.comparator = [formatTimeSeconds(conditionItm.comparator, true)];
                                        } else {
                                            conditionItm.comparator = [formatTimeSeconds(conditionItm.comparator[0], true), formatTimeSeconds(conditionItm.comparator[1], false)];
                                        }
                                    }
                                    break;
                                case 'DateTime':
                                    conditionItm.comparator = conditionItm.comparator.map(compItem => moment(moment(compItem).format()).format('HH:mm:ss'));
                                    break;
                                case 'Select':
                                    if (comparatorTypeOf !== '[object Array]') conditionItm.comparator = [conditionItm.comparator];
                                    break;
                                case 'Input':
                                    if (['IN', 'NOT IN'].includes(conditionItm.compareOperator.toUpperCase())) {
                                        if (comparatorTypeOf === '[object String]') conditionItm.comparator = conditionItm.comparator.split(',');
                                    } else {
                                        if (comparatorTypeOf === '[object Array]') {
                                            if (conditionItm.comparator.length > 1) conditionItm.comparator = [conditionItm.comparator.join(',')];
                                        } else {
                                            conditionItm.comparator = [conditionItm.comparator];
                                        }
                                    }
                                    break;
                                case 'Upload':
                                    if (comparatorTypeOf === '[object String]') conditionItm.comparator = conditionItm.comparator.split(',');
                                    break;
                            }
                            if (conditionIdx == 0) conditionItm.logicalOperator = '';
                            delete conditionItm.operates;
                            delete conditionItm.selectInputVoList;
                        })
                        if (groupParamsIdx == 0) groupParamsItm.logicalOperator = '';
                    })
                })
                let commitParams = { ...this.state.formBasicInfo, ...valusFormat, calculationMethod: this.state.calculationMethod }, requestApi = saveCustomRulesList;
                if (this.state.editId) {
                    commitParams = { ...commitParams, id: this.state.editId };
                    requestApi = updateCustomRulesList;
                }
                console.log('save', commitParams)
                //return
                requestApi(commitParams).then(res => {
                    if (res.msg == 'success') {
                        message.success('保存成功', 3, function () {
                            that.props.history.push({ pathname: "/oap/customRules" });
                            that.setState({ isLoading: false });
                        })
                    }
                }).catch(err => {
                    err.msg && message.error(err.msg);
                    this.setState({ isLoading: false });
                })
            })
        } catch (errorInfo) {
            console.log('Failed:', errorInfo);
        }
    }

    //修改
    handleBusinessId = (value) => {
        console.log('handleBusinessId', value)
        let { formGroup, defBusinessId } = this.state, tableType;
        if (defBusinessId != value) {
            formGroup = {
                params: [{ groupName: '', groupParams: this.groupParams }]
            }
            let curOption = this.state.chooseDataList.find(it => it.id == value)
            console.log(12, curOption)
            if (curOption) tableType = curOption.tableType;
            this.setState({ formGroup, defBusinessId: value, tableType })
        }
    }

    //返回
    goBackList = () => {
        Modal.confirm({
            title: "离开此页面？",
            content: <span>离开将丢失已编辑内容，请确认是否离开？</span>,
            onOk: () => {
                this.props.history.push({ pathname: "/oap/customRules" });
            }
        });
    }

    changeBatchFieldId = (value, option) => {
        const formData = this.formBatchRef.current.getFieldsValue();
        if (formData.addType == 'date') {
            this.formBatchRef.current.setFieldsValue({ 'showDataType': option.data, dateRange: [] });
            if (option.data == 'DateUnlimited') {
                this.setState({ batchDisabledDate: false })
            } else {
                const batchDisabledDate = (current) => {
                    return current && current >= moment().endOf('day');
                }
                this.setState({ batchDisabledDate })
            }
        } else {
            this.formBatchRef.current.setFieldsValue({ 'showDataType': option.data });
        }
    }

    handleBatchModal = (action) => {
        if (action == 'ok') {
            this.formBatchRef.current.validateFields().then(async (values) => {
                this.setState({ isLoadingBatch: true })
                const prepareChartApi = this.state.tableType == 0 ? getConditionConfig : getConditionConfigTrino;
                const resConfig = await prepareChartApi({ fieldId: values.fieldId });
                const operates = resConfig.data.fieldOperates ? resConfig.data.fieldOperates.map(operate => {
                    return { label: operate, value: operate }
                }) : [];
                const fieldValues = resConfig.data?.fieldValues ? resConfig.data.fieldValues.map(select => {
                    return { label: select.name, value: select.value }
                }) : [];

                let formGroup;
                if (values.addType == 'date') {
                    formGroup = this.handleBatchFormGroupByDate(operates)
                } else {
                    formGroup = this.handleBatchFormGroupByEnum(operates, fieldValues)
                }
                this.setState({ formGroup, isLoadingBatch: false })
                this.formStpesTwoRef.current.setFieldsValue(formGroup);
                this.initFormBatch()
            }).catch(errorInfo => {
                console.log('Failed:', errorInfo);
            })
        } else {
            this.initFormBatch()
        }
    }

    //初始化form
    initFormBatch = () => {
        const { dateFieldList } = this.state;
        this.setState({
            visibleBatch: false,
            formBatch: {
                addType: 'date',
                nameRule: 'positiveInteger',
                timeType: 'absolute',
                fieldId: undefined,
                name: undefined,
                dateRange: [],
                groupInterval: null,
                repeatTime: null,
            },
            batchAddType: 'date',
            batchFieldIdList: dateFieldList,
            isLoadingBatch: false
        })
        this.formBatchRef.current.setFieldsValue({
            addType: 'date',
            nameRule: 'positiveInteger',
            timeType: 'absolute',
            fieldId: undefined,
            name: undefined,
            dateRange: [],
            groupInterval: null,
            repeatTime: null,
        });
    }

    //按日期
    handleBatchFormGroupByDate = (operates) => {
        const formData = this.formBatchRef.current.getFieldsValue(true);
        const formGroup = this.formStpesTwoRef.current.getFieldsValue(true);
        let result = [];
        for (let i = 0; i < formData.repeatTime; i++) {
            let comparatorArr = this.handleBatchDate(formData.dateRange, formData.groupInterval, i);
            result.push({
                groupName: `${formData.name}${i + 1}`,
                groupParams: [
                    {
                        logicalOperator: '',
                        conditionList: [
                            {
                                comparator: comparatorArr[0],
                                compareOperator: '>=',
                                fieldId: formData.fieldId,
                                logicalOperator: "",
                                showDataType: formData?.showDataType,
                                operates,
                                timeType: formData.timeType
                            },
                            {
                                comparator: comparatorArr[1],
                                compareOperator: '<=',
                                fieldId: formData.fieldId,
                                logicalOperator: "AND",
                                showDataType: formData?.showDataType,
                                operates,
                                timeType: formData.timeType
                            }
                        ]
                    }
                ]
            })
        }
        //判断是否已经有分筒
        let original = formGroup.params.reduce((cur, nxt) => {
            const hasValue = nxt.groupParams.findIndex(current => {
                const hasConditionValue = current.conditionList.findIndex(itm => {
                    const hasComparator = (itm.timeType ?? '') !== '' ? itm.comparatorStart : itm.comparator;
                    return (itm.fieldId ?? '') !== '' || (itm.compareOperator ?? '') !== '' || hasComparator?.length
                })
                return (current.logicalOperator ?? '') !== '' || (hasConditionValue != -1)
            })
            if ((nxt.groupName ?? '') !== '' || (hasValue != -1)) {
                cur.push(nxt)
            }
            return cur
        }, [])
        return { params: [...original, ...result] }
    }

    //按枚举值
    handleBatchFormGroupByEnum = (operates, fieldValues) => {
        const formData = this.formBatchRef.current.getFieldsValue(true);
        const formGroup = this.formStpesTwoRef.current.getFieldsValue(true);
        let result = [], max = 99, exceedMax = fieldValues.slice(max), tempGroupName = '', groupName = '';
        for (let i = 0; i < fieldValues.length; i++) {
            if (i <= max) {
                tempGroupName = i < max ? fieldValues[i].label : `${fieldValues[max].label}等`;
                if (tempGroupName.length > 30) {
                    groupName = tempGroupName.slice(0, 30)
                } else {
                    groupName = tempGroupName;
                }
                result.push({
                    groupName: groupName,
                    groupParams: [
                        {
                            logicalOperator: '',
                            conditionList: [
                                {
                                    comparator: i < max ? [fieldValues[i].value] : exceedMax.map(it => it.value),
                                    compareOperator: operates[0].value,
                                    fieldId: formData.fieldId,
                                    logicalOperator: "",
                                    showDataType: formData?.showDataType,
                                    operates,
                                    selectInputVoList: fieldValues,
                                    timeType: '',
                                    isCascade: 0
                                }
                            ]
                        }
                    ]
                })
            }
        }
        //判断是否已经有分筒
        let original = formGroup.params.reduce((cur, nxt) => {
            const hasValue = nxt.groupParams.findIndex(current => {
                const hasConditionValue = current.conditionList.findIndex(itm => {
                    const hasComparator = (itm.timeType ?? '') !== '' ? itm.comparatorStart : itm.comparator;
                    return (itm.fieldId ?? '') !== '' || (itm.compareOperator ?? '') !== '' || hasComparator?.length
                })
                return (current.logicalOperator ?? '') !== '' || (hasConditionValue != -1)
            })
            if ((nxt.groupName ?? '') !== '' || (hasValue != -1)) {
                cur.push(nxt)
            }
            return cur
        }, [])
        return { params: [...original, ...result] }
    }

    handleBatchDate = (dateRange, interval, i) => {
        let startDate = moment(dateRange[0]).add((i * interval), 'd');
        let endDate = moment(dateRange[0]).add(((i + 1) * interval - 1), 'd');
        if (endDate.diff(moment(dateRange[1])) > 0) {
            endDate = moment(dateRange[1])
        }
        return [startDate, endDate];
    }

    // 切换类型
    handleCustomTypeChange = (val) => {
        this.fetchChooseDataList(val);
        let formData = this.formStpesOneRef.current.getFieldsValue();
        formData.businessId = '';
        this.formStpesOneRef.current.setFieldsValue(formData);
    }

    //修改绝对、相对时间
    handleTimeTypeChange = (value, fieldsIdx, index, fieldIndex) => {
        const formGroup = this.formStpesTwoRef.current.getFieldsValue();
        const conditionItem = formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex];
        if (conditionItem.timeType == 'relative') {
            if (conditionItem.compareOperator.toLowerCase() == 'between') {
                conditionItem.relativeTypeStart = conditionItem.relativeTypeStart ? conditionItem.relativeTypeStart : -1;
                conditionItem.relativeValueStart = conditionItem.relativeValueStart ? conditionItem.relativeValueStart : 'day';
                conditionItem.comparatorStart = conditionItem.comparatorStart ? conditionItem.comparatorStart : '';
                conditionItem.relativeTypeEnd = conditionItem.relativeTypeEnd ? conditionItem.relativeTypeEnd : -1;
                conditionItem.relativeValueEnd = conditionItem.relativeValueEnd ? conditionItem.relativeValueEnd : 'day';
                conditionItem.comparatorEnd = conditionItem.comparatorEnd ? conditionItem.comparatorEnd : '';
            } else {
                conditionItem.relativeTypeStart = conditionItem.relativeTypeStart ? conditionItem.relativeTypeStart : -1;
                conditionItem.relativeValueStart = conditionItem.relativeValueStart ? conditionItem.relativeValueStart : 'day';
                conditionItem.comparatorStart = conditionItem.comparatorStart ? conditionItem.comparatorStart : '';
            }
            this.formStpesTwoRef.current.setFieldsValue({ 'params': formGroup.params });//!!!改变表单值
        } else {
            if (conditionItem.compareOperator.toLowerCase() == 'between') {
                conditionItem.comparator = []
            } else {
                conditionItem.comparator = null
            }
        }
    }

    handleCalculationMethod = (event) => {
        this.setState({ calculationMethod: event.target.value })
    }

    changeBatchAddType = (value, option) => {
        const { dateFieldList, enumFieldList } = this.state;
        this.setState({
            batchAddType: value,
            batchFieldIdList: value == 'date' ? dateFieldList : enumFieldList
        })
        this.formBatchRef.current.setFieldsValue({ 'fieldId': undefined });
    }

    onDropdownVisibleChange = async (open, id, fieldsIdx, index, fieldIndex) => {
        console.log(11111111111111, open)
        if ((this.state.editId ?? '') == '') return;
        if (open) {
            const formGroup = this.formStpesTwoRef.current.getFieldsValue(true);
            const conditionItem = formGroup.params[fieldsIdx].groupParams[index].conditionList[fieldIndex];
            conditionItem.operates = [];
            conditionItem.selectInputVoList = [];
            const resConfig = await getConditionConfig({ fieldId: id });
            const operates = resConfig.data.fieldOperates ? resConfig.data.fieldOperates.map(operate => {
                return { label: operate, value: operate }
            }) : [];
            const selectInputVoList = resConfig.data.fieldValues ? resConfig.data.fieldValues.map(select => {
                return { label: select.name, value: select.value }
            }) : [];
            conditionItem.operates = operates;
            conditionItem.selectInputVoList = selectInputVoList;
            this.formStpesTwoRef.current.setFields([{
                name: ['params', fieldIndex, 'selectInputVoList'],
                value: selectInputVoList
            }, {
                name: ['params', fieldIndex, 'operates'],
                value: operates
            }]);//!!!改变表单值 ???
        }
    }

    render () {
        const { formGroup, overallDisabled, chooseDataListLoading, batchAddType, batchFieldIdList, formBatch, dateFieldList } = this.state;
        const disabledDate = (current) => {
            return current && current >= moment().endOf('day');
        }
        return <Spin spinning={this.state.isLoading}>
            <div className="common-edit oap-customRules" style={{ padding: '20px 10px' }}>
                <Steps current={this.state.current}>
                    {this.state.steps.map(item => (
                        <Steps.Step key={item.title} title={item.title} />
                    ))}
                </Steps>
                <Divider />
                {this.state.current == 0 && <Form
                    ref={this.formStpesOneRef}
                    initialValues={this.state.formBasicInfo}
                    labelCol={{ style: { width: '88px' } }}>
                    <Row>
                        <Col span={4}>
                            <Form.Item name="dimensionName" label="维度名称：" rules={[{ required: true, message: '请输入' }]}>
                                <Input placeholder="请输入名称" maxLength="30" allowClear showCount />
                            </Form.Item>
                        </Col>
                        <Col span={8}></Col>
                        <Col span={6}>
                            <Form.Item name="description" label="说明：">
                                <Input.TextArea placeholder="请输入说明" rows={8} maxLength="500" showCount />
                            </Form.Item>
                        </Col>
                        <Col span={6}></Col>
                        <Col span={4}>
                            <Form.Item name="customType" label="自定义类型：" rules={[{ required: true, message: '请输入' }]}>
                                <Select placeholder='请选择' onChange={this.handleCustomTypeChange}>
                                    {this.state.customTypeList.map(model => {
                                        return <Select.Option value={model.value} key={model.value}>{model.label}</Select.Option>
                                    })}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}></Col>
                        <Col span={4}>
                            <Spin spinning={chooseDataListLoading}>
                                <Form.Item name="businessId" label="选择数据：" rules={[{ required: true, message: '请输入' }]}>
                                    <Select placeholder='请选择' onChange={this.handleBusinessId}>
                                        {this.state.chooseDataList.map(model => {
                                            return <Select.Option value={model.id} key={uuid()}>{model.businessName}</Select.Option>
                                        })}
                                    </Select>
                                </Form.Item>
                            </Spin>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            <Space>
                                <Button type="primary" onClick={this.handleStepsNext}>下一步</Button>
                                <Button onClick={this.goBackList}>取消</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>}
                {this.state.current == 1 && <Form
                    ref={this.formStpesTwoRef}
                    initialValues={formGroup}>
                    <Form.List name="params">
                        {(fieldParams, { add, remove }) => (<>
                            {fieldParams.map((fields, fieldsIdx) => {
                                return <Row gutter={6} key={uuid()}>
                                    <Col span={2}>
                                        <Form.Item
                                            label={`分组${fieldsIdx + 1}：`}
                                            {...fields}
                                            name={[fields.name, 'groupName']}
                                            fieldKey={[fields.fieldKey, 'groupName']}
                                            rules={[
                                                { required: true, message: '请输入' },
                                                { pattern: /^((?!<|>|\\|\/|"|'|\?|\？|\*|\<|\>|\$|\|).)*$/, message: '请输入名称（不包含特殊字符）' }
                                            ]}>
                                            <Input.TextArea placeholder="请输入分组名称" rows={3} maxLength="30" showCount />
                                        </Form.Item>
                                    </Col>
                                    <Col flex="1">
                                        <Form.List
                                            {...fields}
                                            name={[fields.name, 'groupParams']}
                                            fieldKey={[fields.fieldKey, 'groupParams']}>
                                            {(fields, { add, remove }) => (<>
                                                {fields.map((field, index) => {
                                                    return <div key={uuid()}>
                                                        <div style={{ width: '100px' }}>
                                                            {index != 0 ? <Form.Item
                                                                {...field}
                                                                name={[field.name, 'logicalOperator']}
                                                                fieldKey={[field.fieldKey, 'logicalOperator']}
                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                <Select options={this.logicalOptions}></Select>
                                                            </Form.Item> : null}
                                                        </div>
                                                        <Row>
                                                            <Col flex="1">
                                                                <div className="oap-customForm-conditionList">
                                                                    <Form.List name={[field.name, 'conditionList']} fieldKey={[field.fieldKey, 'conditionList']}>
                                                                        {(field, { add, remove }) => (<>
                                                                            <div>条件组{index + 1}</div>
                                                                            {field.map((fieldItem, fieldIndex) => {
                                                                                return <Row gutter={6} key={uuid()}>
                                                                                    <Col flex="74px">
                                                                                        {fieldIndex != 0 ?
                                                                                            <Form.Item
                                                                                                {...fieldItem}
                                                                                                name={[fieldItem.name, 'logicalOperator']}
                                                                                                fieldKey={[fieldItem.fieldKey, 'logicalOperator']}
                                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                                <Select options={this.logicalOptions}></Select>
                                                                                            </Form.Item> : null}
                                                                                    </Col>
                                                                                    <Col flex="130px">
                                                                                        <Form.Item
                                                                                            {...fieldItem}
                                                                                            name={[fieldItem.name, 'fieldId']}
                                                                                            fieldKey={[fieldItem.fieldKey, 'fieldId']}
                                                                                            rules={[{ required: true, message: '请选择' }]}>
                                                                                            <Select
                                                                                                placeholder='请选择'
                                                                                                showSearch
                                                                                                filterOption={(input, option) => (option?.children.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
                                                                                                onChange={(value) => this.handleSelectFieldId(value, fieldsIdx, index, fieldIndex)}>
                                                                                                {
                                                                                                    this.state.formBasicInfo.customType > 0 ? this.state.fieldListForTicket.map(model => {
                                                                                                        return <Select.Option value={model.fieldId} key={uuid()}>{model.showName}</Select.Option>
                                                                                                    })
                                                                                                        : this.state.fieldList.map(model => {
                                                                                                            return <Select.Option value={model.id} key={uuid()}>{model.showName}</Select.Option>
                                                                                                        })
                                                                                                }
                                                                                            </Select>
                                                                                        </Form.Item>
                                                                                    </Col>
                                                                                    <Form.Item shouldUpdate noStyle>
                                                                                        {({ getFieldValue }) => {
                                                                                            const operates = getFieldValue().params[fieldsIdx].groupParams[index].conditionList[fieldIndex]?.operates || [];
                                                                                            const conditionItem = getFieldValue().params[fieldsIdx].groupParams[index].conditionList[fieldIndex];
                                                                                            return <Col flex="96px">
                                                                                                <Form.Item
                                                                                                    {...fieldItem}
                                                                                                    name={[fieldItem.name, 'compareOperator']}
                                                                                                    fieldKey={[fieldItem.fieldKey, 'compareOperator']}
                                                                                                    rules={[{ required: true, message: '请选择' }]}>
                                                                                                    <Select
                                                                                                        options={operates}
                                                                                                        disabled={(this.state.editId ?? '') == '' && !operates?.length}
                                                                                                        onDropdownVisibleChange={(open) => this.onDropdownVisibleChange(open, conditionItem.fieldId, fieldsIdx, index, fieldIndex)}
                                                                                                        onChange={(value) => this.handleOperatorChange(value, fieldsIdx, index, fieldIndex)}></Select>
                                                                                                </Form.Item>
                                                                                            </Col>
                                                                                        }}
                                                                                    </Form.Item>
                                                                                    <Col flex="1">
                                                                                        <Form.Item shouldUpdate noStyle>
                                                                                            {({ getFieldValue }) => {
                                                                                                const conditionItem = getFieldValue().params[fieldsIdx].groupParams[index].conditionList[fieldIndex];
                                                                                                let showDataType = conditionItem?.showDataType || 'Input',
                                                                                                    selectInputVoList = conditionItem?.selectInputVoList || [],
                                                                                                    isCascade = conditionItem?.isCascade || '';
                                                                                                if (isCascade) {
                                                                                                    return <Form.Item
                                                                                                        {...fieldItem}
                                                                                                        name={[fieldItem.name, 'comparator']}
                                                                                                        fieldKey={[fieldItem.fieldKey, 'comparator']}>
                                                                                                        <Select
                                                                                                            mode="multiple"
                                                                                                            options={selectInputVoList}
                                                                                                            disabled={!selectInputVoList?.length}
                                                                                                            notFoundContent={selectInputVoList.length ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                                                                                                            onDropdownVisibleChange={(open) => this.onDropdownVisibleChange(open, conditionItem.fieldId, fieldsIdx, index, fieldIndex)}>
                                                                                                        </Select>
                                                                                                    </Form.Item>
                                                                                                }
                                                                                                let formItemElement;
                                                                                                switch (showDataType) {
                                                                                                    case 'Date': case 'DateUnlimited':
                                                                                                        const compareOperatorTemp = conditionItem?.compareOperator;
                                                                                                        if (compareOperatorTemp.toLowerCase() == 'between') {
                                                                                                            formItemElement = <Row gutter={6}>
                                                                                                                <Col flex="88px">
                                                                                                                    <Form.Item
                                                                                                                        {...fieldItem}
                                                                                                                        name={[fieldItem.name, 'timeType']}
                                                                                                                        fieldKey={[fieldItem.fieldKey, 'timeType']}
                                                                                                                        rules={[{ required: true, message: '请选择' }]}>
                                                                                                                        <Select
                                                                                                                            options={TIME_SELECT_TYPE_LIST}
                                                                                                                            onChange={(value) => this.handleTimeTypeChange(value, fieldsIdx, index, fieldIndex)}>
                                                                                                                        </Select>
                                                                                                                    </Form.Item>
                                                                                                                </Col>
                                                                                                                {conditionItem?.timeType.toLowerCase() == 'absolute' ? <Col flex="1">
                                                                                                                    <Form.Item
                                                                                                                        {...fieldItem}
                                                                                                                        name={[fieldItem.name, 'comparator']}
                                                                                                                        fieldKey={[fieldItem.fieldKey, 'comparator']}
                                                                                                                        rules={[{ required: true, message: '请选择' }]}>
                                                                                                                        <DatePicker.RangePicker disabledDate={showDataType == 'DateUnlimited' ? false : disabledDate} allowClear={false} />
                                                                                                                    </Form.Item>
                                                                                                                </Col> : <Col flex="1">
                                                                                                                    <Row>
                                                                                                                        <Col flex="64px">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'relativeTypeStart']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'relativeTypeStart']}
                                                                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                                                                <Select
                                                                                                                                    options={RELATIVE_TIME_TYPE_LIST}>
                                                                                                                                </Select>
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                        <Col flex="1">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'comparatorStart']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'comparatorStart']}
                                                                                                                                rules={[
                                                                                                                                    {
                                                                                                                                        validator: (rule, value, callback) => {
                                                                                                                                            if ((value ?? '') !== '') {
                                                                                                                                                if (/^[0-9]+$/.test(value)) {
                                                                                                                                                    callback()
                                                                                                                                                } else {
                                                                                                                                                    callback('请输入正整数')
                                                                                                                                                }
                                                                                                                                            } else {
                                                                                                                                                callback('请输入')
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                ]}>
                                                                                                                                <Input allowClear />
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                        <Col flex="52px">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'relativeValueStart']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'relativeValueStart']}
                                                                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                                                                <Select
                                                                                                                                    options={RELATIVE_TIME_UNIT_LIST}>
                                                                                                                                </Select>
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                        <Col>
                                                                                                                            <span style={{
                                                                                                                                lineHeight: '40px',
                                                                                                                                display: 'inline-block',
                                                                                                                                marginLeft: 6,
                                                                                                                                marginRight: 6
                                                                                                                            }}>至</span>
                                                                                                                        </Col>
                                                                                                                        <Col flex="64px">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'relativeTypeEnd']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'relativeTypeEnd']}
                                                                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                                                                <Select
                                                                                                                                    options={RELATIVE_TIME_TYPE_LIST}>
                                                                                                                                </Select>
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                        <Col flex="1">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'comparatorEnd']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'comparatorEnd']}
                                                                                                                                rules={[
                                                                                                                                    {
                                                                                                                                        validator: (rule, value, callback) => {
                                                                                                                                            if ((value ?? '') !== '') {
                                                                                                                                                if (/^[0-9]+$/.test(value)) {
                                                                                                                                                    callback()
                                                                                                                                                } else {
                                                                                                                                                    callback('请输入正整数')
                                                                                                                                                }
                                                                                                                                            } else {
                                                                                                                                                callback('请输入')
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                ]}>
                                                                                                                                <Input allowClear />
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                        <Col flex="52px">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'relativeValueEnd']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'relativeValueEnd']}
                                                                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                                                                <Select options={RELATIVE_TIME_UNIT_LIST}></Select>
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                    </Row>
                                                                                                                </Col>}
                                                                                                            </Row>
                                                                                                        } else {
                                                                                                            formItemElement = <Row gutter={6}>
                                                                                                                <Col flex="88px">
                                                                                                                    <Form.Item
                                                                                                                        {...fieldItem}
                                                                                                                        name={[fieldItem.name, 'timeType']}
                                                                                                                        fieldKey={[fieldItem.fieldKey, 'timeType']}
                                                                                                                        rules={[{ required: true, message: '请选择' }]}>
                                                                                                                        <Select
                                                                                                                            options={TIME_SELECT_TYPE_LIST}
                                                                                                                            onChange={(value) => this.handleTimeTypeChange(value, fieldsIdx, index, fieldIndex)}>
                                                                                                                        </Select>
                                                                                                                    </Form.Item>
                                                                                                                </Col>
                                                                                                                {conditionItem?.timeType.toLowerCase() == 'absolute' ? <Col flex="1">
                                                                                                                    <Form.Item
                                                                                                                        {...fieldItem}
                                                                                                                        name={[fieldItem.name, 'comparator']}
                                                                                                                        fieldKey={[fieldItem.fieldKey, 'comparator']}
                                                                                                                        rules={[{ required: true, message: '请选择' }]}>
                                                                                                                        <DatePicker disabledDate={showDataType == 'DateUnlimited' ? false : disabledDate}></DatePicker>
                                                                                                                    </Form.Item>
                                                                                                                </Col> : <Col flex="1">
                                                                                                                    <Row>
                                                                                                                        <Col flex="64px">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'relativeTypeStart']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'relativeTypeStart']}
                                                                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                                                                <Select options={RELATIVE_TIME_TYPE_LIST}></Select>
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                        <Col flex="1">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'comparatorStart']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'comparatorStart']}
                                                                                                                                rules={[
                                                                                                                                    {
                                                                                                                                        validator: (rule, value, callback) => {
                                                                                                                                            if ((value ?? '') !== '') {
                                                                                                                                                if (/^[0-9]+$/.test(value)) {
                                                                                                                                                    callback()
                                                                                                                                                } else {
                                                                                                                                                    callback('请输入正整数')
                                                                                                                                                }
                                                                                                                                            } else {
                                                                                                                                                callback('请输入')
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                ]}>
                                                                                                                                <Input allowClear />
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                        <Col flex="52px">
                                                                                                                            <Form.Item
                                                                                                                                {...fieldItem}
                                                                                                                                name={[fieldItem.name, 'relativeValueStart']}
                                                                                                                                fieldKey={[fieldItem.fieldKey, 'relativeValueStart']}
                                                                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                                                                <Select options={RELATIVE_TIME_UNIT_LIST}></Select>
                                                                                                                            </Form.Item>
                                                                                                                        </Col>
                                                                                                                    </Row>
                                                                                                                </Col>}
                                                                                                            </Row>
                                                                                                        }
                                                                                                        break;
                                                                                                    case 'Select':
                                                                                                        formItemElement = <Form.Item
                                                                                                            {...fieldItem}
                                                                                                            name={[fieldItem.name, 'comparator']}
                                                                                                            fieldKey={[fieldItem.fieldKey, 'comparator']}
                                                                                                            rules={[{ required: true, message: '请选择' }]}>
                                                                                                            <Select
                                                                                                                options={selectInputVoList}
                                                                                                                showSearch
                                                                                                                notFoundContent={selectInputVoList.length ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                                                                                                                filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
                                                                                                                onDropdownVisibleChange={(open) => this.onDropdownVisibleChange(open, conditionItem.fieldId, fieldsIdx, index, fieldIndex)}>
                                                                                                            </Select>
                                                                                                        </Form.Item>;
                                                                                                        break;
                                                                                                    case 'SelectMulti':
                                                                                                        formItemElement = <Form.Item
                                                                                                            {...fieldItem}
                                                                                                            name={[fieldItem.name, 'comparator']}
                                                                                                            fieldKey={[fieldItem.fieldKey, 'comparator']}
                                                                                                            rules={[{ required: true, message: '请选择' }]}>
                                                                                                            <Select
                                                                                                                mode="multiple"
                                                                                                                allowClear
                                                                                                                options={selectInputVoList}
                                                                                                                notFoundContent={selectInputVoList.length ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                                                                                                                onDropdownVisibleChange={(open) => this.onDropdownVisibleChange(open, conditionItem.fieldId, fieldsIdx, index, fieldIndex)}>
                                                                                                            </Select>
                                                                                                        </Form.Item>;
                                                                                                        break;
                                                                                                    case 'DateTime':
                                                                                                        formItemElement = <Form.Item
                                                                                                            {...fieldItem}
                                                                                                            name={[fieldItem.name, 'comparator']}
                                                                                                            fieldKey={[fieldItem.fieldKey, 'comparator']}
                                                                                                            rules={[{ required: true, message: '请选择' }]}>
                                                                                                            <TimePicker.RangePicker allowClear={false} />
                                                                                                        </Form.Item>;
                                                                                                        break;
                                                                                                    case 'DateRange':
                                                                                                        formItemElement = <Form.Item
                                                                                                            {...fieldItem}
                                                                                                            name={[fieldItem.name, 'comparator']}
                                                                                                            fieldKey={[fieldItem.fieldKey, 'comparator']}
                                                                                                            rules={[{ required: true, message: '请输入' }]}>
                                                                                                            <DatePicker.RangePicker disabledDate={disabledDate} />
                                                                                                        </Form.Item>;
                                                                                                        break;
                                                                                                    case 'Input':
                                                                                                        formItemElement = <Form.Item
                                                                                                            {...fieldItem}
                                                                                                            name={[fieldItem.name, 'comparator']}
                                                                                                            fieldKey={[fieldItem.fieldKey, 'comparator']}
                                                                                                            rules={[{ required: true, message: '请输入' }]}>
                                                                                                            <Input allowClear />
                                                                                                        </Form.Item>
                                                                                                        break;
                                                                                                    case 'Upload':
                                                                                                        formItemElement = <Row gutter={6}>
                                                                                                            <Col flex="1">
                                                                                                                <Form.Item
                                                                                                                    {...fieldItem}
                                                                                                                    name={[fieldItem.name, 'comparator']}
                                                                                                                    fieldKey={[fieldItem.fieldKey, 'comparator']}
                                                                                                                    rules={[{ required: true, message: '请输入' }]}>
                                                                                                                    <Input allowClear />
                                                                                                                </Form.Item>
                                                                                                            </Col>
                                                                                                            <Col>
                                                                                                                <Button type="primary" style={{ marginRight: '0', padding: '4px', minWidth: 'auto' }} onClick={this.handleSelectFile}>上传文件</Button>
                                                                                                                <input type="file" style={{ display: 'none' }} ref={this.fileInput} onChange={(ev) => this.handleFileChange(ev, fieldsIdx, index, fieldIndex)} />
                                                                                                            </Col>
                                                                                                        </Row>
                                                                                                        break;
                                                                                                }
                                                                                                return formItemElement;
                                                                                            }}
                                                                                        </Form.Item>
                                                                                    </Col>
                                                                                    <Col flex="22px">
                                                                                        {fieldIndex == (field.length - 1) ? <IconAddB style={{ fontSize: '16px', lineHeight: '40px' }} onClick={() =>
                                                                                            add({
                                                                                                'logicalOperator': 'AND',
                                                                                                'compareOperator': '',
                                                                                                'fieldId': '',
                                                                                                'comparator': [],
                                                                                                //'timeType':['Date', 'DateUnlimited'].includes(that.props.item.showDataType) ? 'absolute':''
                                                                                                'timeType': ''
                                                                                            })
                                                                                        } /> : null}
                                                                                    </Col>
                                                                                    <Col flex="22px">
                                                                                        {field.length == 1 ? '' : <IconReduceCircleB style={{ fontSize: '16px', lineHeight: '40px' }} onClick={() => remove(fieldIndex)} />}
                                                                                    </Col>
                                                                                </Row>
                                                                            })}
                                                                        </>)}
                                                                    </Form.List>
                                                                </div>
                                                            </Col>
                                                            <Col flex="22px">
                                                                {fields.length == 1 ? null : <IconReduceCircleB style={{ fontSize: '16px' }} onClick={() => remove(index)} />}
                                                            </Col>
                                                        </Row>
                                                        {index == fields.length - 1 ? <Button type="link" icon={<IconAddB />} onClick={() => add(
                                                            { ...this.groupParams[0] }
                                                        )}>新增条件组</Button> : null}
                                                    </div>
                                                })}
                                            </>)}
                                        </Form.List>
                                    </Col>
                                    <Col flex="28px" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {fieldParams.length == 1 ? null : <IconClearUp style={{ fontSize: '24px' }} onClick={() => remove(fieldsIdx)} />}
                                    </Col>
                                    <Col span={12}><Divider style={{ margin: '10px 0' }} /></Col>
                                </Row>
                            })}
                            <Col span={12} style={{ marginBottom: '6px' }}>
                                <Space>
                                    <Button type="link" icon={<IconAddA />} disabled={overallDisabled} onClick={() => { add({ groupName: '', groupParams: this.groupParams }); }}>添加分组</Button>
                                    {this.state.formBasicInfo.customType > 0 ? null : <Button type="link" icon={<IconAddA />} disabled={overallDisabled} onClick={() => this.setState({ visibleBatch: true, batchFieldIdList: dateFieldList })} style={{ marginLeft: '16px' }}>批量添加</Button>}
                                </Space>
                            </Col>
                        </>)}
                    </Form.List>
                    <Row>
                        <Col flex="74px">
                            <span className="form-item-label" style={{ lineHeight: '32px' }}><i>*</i>分组方式：</span>
                        </Col>
                        <Col flex={1}>
                            <Radio.Group buttonStyle="solid" defaultValue={this.state.calculationMethod} onChange={this.handleCalculationMethod}>
                                <Radio.Button value="1" style={{ marginRight: 0 }}>分组条件关联</Radio.Button>
                                <Radio.Button value="0">分组条件独立</Radio.Button>
                            </Radio.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col flex="74px"></Col>
                        <Col flex="1">
                            <div className="oap-custom-explain">
                                <div className="title">说明：</div>
                                <div className="explain-item">1）分组条件关联：使用case when方式创建分组条件，被排序靠前的条件所包含的数据，将不会再出现在后续条件中</div>
                                <div className="explain-item">2）分组条件独立：使用union all方式创建分组条件，各分组之间规则条件互不影响，某条数据满足两个分组条件时，会同时出现在两个分组内</div>
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            <Space>
                                <Button disabled={overallDisabled} onClick={this.handleStepsPrev}>上一步</Button>
                                {checkMyPermission('oap:customRules:save') ? <Button type="primary" disabled={overallDisabled} loading={this.state.isLoading} onClick={this.handleSave}>保存</Button> : null}
                                <Button onClick={this.goBackList}>取消</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>}
            </div>
            <Modal
                width={710}
                centered
                title="批量添加"
                visible={this.state.visibleBatch}
                cancelText="取消"
                okText="确定"
                confirmLoading={this.state.isLoadingBatch}
                onCancel={() => this.handleBatchModal('cancel')}
                onOk={() => this.handleBatchModal('ok')}
                bodyStyle={{ maxHeight: '60vh' }}>
                <AurumForm
                    ref={this.formBatchRef}
                    labelCol={{ style: { width: '82px' } }}
                    initialValues={formBatch}>
                    <AurumForm.Item label="添加方式" name="addType" rules={[{ required: true, message: '请选择' }]} className="oap-form-labelBold">
                        <Select style={{ width: '200px' }} onChange={this.changeBatchAddType}>
                            <Select.Option value="date">按日期</Select.Option>
                            <Select.Option value="enum">按枚举值</Select.Option>
                        </Select>
                    </AurumForm.Item>
                    <AurumForm.Item label="条件字段" className="oap-form-labelBold" required>
                        <AurumForm.Item name="fieldId" noStyle rules={[{ required: true, message: '请选择' }]}>
                            <Select style={{ width: '200px', marginRight: '8px' }} onChange={this.changeBatchFieldId}>
                                {batchFieldIdList.map(model => {
                                    return <Select.Option value={model.id} key={uuid()} data={model.showDataType}>{model.showName}</Select.Option>
                                })}
                            </Select>
                        </AurumForm.Item>
                        <span className="ant-form-text">
                            <Tooltip title={batchAddType == 'date' ? '目前仅支持日期类型字段' : '按所选字段的枚举值创建分组，不超过100个，超过的枚举值将统一放在第100个分组内'}>
                                <IconInfoCircle />
                            </Tooltip>
                        </span>
                    </AurumForm.Item>
                    {batchAddType == 'date' && <>
                        <AurumForm.Item label={<span className="form-item-label"><i>*</i>命名规则</span>} className="oap-form-labelBold">
                            <AurumForm.Item
                                name="name"
                                noStyle
                                rules={[
                                    { required: true, message: '请输入名称（不包含特殊字符）' },
                                    { pattern: /^((?!<|>|\\|\/|"|'|\?|\？|\*|\<|\>|\$|\|).)*$/, message: '请输入名称（不包含特殊字符）' }
                                ]}
                                style={{ width: '50%' }}>
                                <Input placeholder="请输入名称" allowClear style={{ width: '176px' }} maxLength="28" showCount />
                            </AurumForm.Item>
                            <AurumForm.Item name="nameRule" noStyle rules={[{ required: true, message: '请选择' }]}>
                                <Select style={{ width: '84px', margin: '0 8px' }}>
                                    <Select.Option value="positiveInteger">正整数</Select.Option>
                                </Select>
                            </AurumForm.Item>
                            <span className="ant-form-text" style={{ paddingRight: '0' }}>示例：2021week1，2021week2，2021week3...</span>
                        </AurumForm.Item>
                        <AurumForm.Item label={<span className="form-item-label"><i>*</i>起止日期</span>} className="oap-form-labelBold">
                            <AurumForm.Item name="dateRange" noStyle rules={[{ required: true, message: '请选择' }]}>
                                <DatePicker.RangePicker disabledDate={this.state.batchDisabledDate} style={{ width: '340px' }} />
                            </AurumForm.Item>
                            <AurumForm.Item name="timeType" noStyle rules={[{ required: true, message: '请选择' }]}>
                                <Select style={{ width: '98px', marginLeft: '8px' }}>
                                    <Select.Option value="absolute">绝对时间</Select.Option>
                                </Select>
                            </AurumForm.Item>
                        </AurumForm.Item>
                        <AurumForm.Item label={<span className="form-item-label"><i>*</i>分组间隔</span>} className="oap-form-labelBold">
                            <AurumForm.Item name="groupInterval" noStyle rules={[{ required: true, message: '请输入' }]}>
                                <InputNumber min={1} />
                            </AurumForm.Item>
                            <span className="ant-form-text">&nbsp;天&nbsp;&nbsp;（每个分组的日期天数，包含起始日期）</span>
                        </AurumForm.Item>
                        <AurumForm.Item label={<span className="form-item-label"><i>*</i>重复次数</span>} className="oap-form-labelBold">
                            <AurumForm.Item
                                name="repeatTime"
                                noStyle
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator (rule, value) {
                                            console.log(1212, getFieldValue('dateRange'))
                                            if (getFieldValue('dateRange') == undefined) {
                                                return Promise.reject(new Error(`请输入`))
                                            } else {
                                                const range = Number(moment(getFieldValue('dateRange')[1]).diff(moment(getFieldValue('dateRange')[0]), 'day')),
                                                    interval = Number(getFieldValue('groupInterval'));
                                                const max = Math.ceil((range + 1) / interval);
                                                if (Number(value) <= max) {
                                                    return Promise.resolve()
                                                }
                                                return Promise.reject(new Error(`按您选择的起止日期范围可分组次数，最大为${max}`))
                                            }
                                        }
                                    })
                                ]}>
                                <InputNumber min={1} max={54} />
                            </AurumForm.Item>
                            <span className="ant-form-text">&nbsp;次&nbsp;&nbsp;（实际结果按起止日期范围可分组次数，最多54次）</span>
                        </AurumForm.Item>
                    </>}
                </AurumForm>
            </Modal>
        </Spin>
    }
}