import React from 'react';
// import {Modal,Row,Col,Button,Input,Select,DatePicker,Spin,Empty,Tooltip,message,TimePicker} from '@mcd/portal-components';
import { Space, Modal, Row, Col, Button, Input, Select, DatePicker, Spin, Empty, Tooltip, message, TimePicker } from '@aurum/pfe-ui';
import { Form } from 'antd'; //form的tooltip 属性在boss里不生效
import { PlusOutlined, DeleteOutlined, LoadingOutlined, CloudUploadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { IconAddA, IconReduceCircleB, IconClearUp, IconLoadingFill, IconUpload, IconInfoCircle } from '@aurum/icons';
import moment from 'moment';
import { getConditionConfig, queryCascadeFieldInfoList, queryFieldCascadeList, getCustomRulesDetailInfo, getSegmentList } from '@/api/oap/self_analysis.js';
import { getFileContent, formatTimeSeconds, optionFilterProp } from '@/utils/store/func';
import '@/style/condition.less';
import { TIME_SELECT_TYPE_LIST, RELATIVE_TIME_TYPE_LIST, RELATIVE_TIME_UNIT_LIST } from '@/constants';

export default class SetCondition extends React.Component {
    constructor(props) {
        super(props);
        this.formRef = React.createRef()
        this.fileInput = React.createRef()
        this.formSelectMulti = React.createRef()
        this.flag = '';
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
        this.state = {
            columns: [],
            form: {},
            spinLoading: false,
            fieldCascadeList: [],
            operates: [], //逻辑关系列表
            selectInputVoList: [], //枚举值列表
            uploadIndex: null,
            addONSelectInputVoList: {},//addON的枚举值
            formLayout: 'horizontal',
            footerModal: [],
            modalTitle: '',
        }
    }

    componentWillReceiveProps (nextProps) {
        if (nextProps.visible && !this.props.visible) this.getCloumns(nextProps)
    }

    getCloumns = async (props) => {
        const { classify, item } = props
        const columnName = {
            label: '字段名',
            key: 'showName',
            initValue: item.showName,
            disabled: true
        }
        const logic = {
            label: '关联逻辑',
            key: 'logicalOperator',
            initValue: item.logicalOperator || 'AND',
            element: 'select',
            options: this.logicalOptions
        }
        const footerModalC = [
            <div key="center">
                <Space>
                    <Button key="cancel" onClick={() => this.cancelModal('cancel')}>取消</Button>
                    <Button key="ok" type="primary" disabled={this.state.spinLoading} onClick={() => this.cancelModal('ok')}>确定</Button>
                </Space>
            </div>
        ];
        const footerModalLR = [
            <div key="left">
                <Space>
                    <Button key="create" type="primary" onClick={this.linkToSegmentForm}>创建人群包</Button>
                    <Button key="refresh" type="primary" onClick={this.handleSegmentConfig}>刷新</Button>
                </Space>
            </div>,
            ...footerModalC
        ];
        let columns = [], formObj = {};
        this.setState({
            formLayout: 'horizontal',
            footerModal: item.isSegment == 1 && ['filters', 'dimensions'].includes(classify) ? footerModalLR : footerModalC,
        })
        console.log(0, item)
        switch (classify) {
            case 'filters':
                this.setState({ modalTitle: '设置条件' })
                //级联
                if (item.isCascade) {
                    columns = [logic];
                    this.handleFieldCascadeList(item, columns);
                    return;
                }
                let initValue = (item.filterValues && item.filterValues.length) ? item.filterValues.map(value => {
                    let comparatorTypeOfArray = Object.prototype.toString.call(value.comparator) === '[object Array]', tempComparator = [];
                    if (['Date', 'DateUnlimited'].includes(item.showDataType) && comparatorTypeOfArray) {
                        if (((value.timeType ?? '') == '' || value?.timeType.toLowerCase() == 'absolute')) {
                            if (value?.compareOperator.toLowerCase() == 'between') {
                                tempComparator = value.comparator.map(comparatorItem => moment(Number(comparatorItem)))
                            } else {
                                tempComparator = moment(Number(value.comparator[0]))
                            }
                            value.timeType = 'absolute';
                        } else {
                            value.relativeTypeStart = value.relativeInfo[0].relativeType;
                            value.relativeValueStart = value.relativeInfo[0].relativeValue;
                            value.comparatorStart = value.comparator[0];
                            if (value?.compareOperator.toLowerCase() == 'between') {
                                value.relativeTypeEnd = value.relativeInfo[1].relativeType;
                                value.relativeValueEnd = value.relativeInfo[1].relativeValue;
                                value.comparatorEnd = value.comparator[1];
                            }
                        }
                    } else if (item.showDataType == 'DateTime') {
                        tempComparator = value.comparator.map(comparatorItem => moment(comparatorItem, 'HH:mm:ss'))
                    } else {
                        tempComparator = [...value.comparator]
                    }
                    return {
                        ...value,
                        comparator: tempComparator
                    }
                }) : [{
                    compareOperator: '', //比较操作符
                    comparator: ['Date', 'DateUnlimited'].includes(item.showDataType) ? null : [],//比较值
                    timeType: ['Date', 'DateUnlimited'].includes(item.showDataType) ? 'absolute' : '',
                    logicalOperator: 'AND', //逻辑运算符 And / or
                }];
                //获取逻辑关系、枚举值等相关配置
                item.isCustomDimension == 1 ? this.handleCustomConfig(item.id) : (item.isSegment == 1 ? this.handleSegmentConfig(item, initValue, classify) : this.handleConfig(item.id));
                //人群包失效数据处理
                let tempInitValue = initValue;
                // if(this.state.selectInputVoList.length && item.isSegment == 1){
                //     const arrId = this.state.selectInputVoList.map(itm => itm.value)
                //     initValue.forEach((filterItm,filterIdx) => {
                //         filterItm.comparator.forEach((initIdItem,initIdIdx) => {
                //             if(initIdItem.split(')')[0] != '(已失效' && !arrId.includes(initIdItem)) tempInitValue[filterIdx].comparator[initIdIdx] = `(已失效)${optionFilterProp(item?.forShowList,'value',initIdItem)?.label}`;
                //         })
                //     })
                // }
                columns = [
                    logic,
                    columnName,
                    {
                        label: '条件格式',
                        key: 'filterValues',
                        element: 'list',
                        initValue: item.isSegment == 1 ? tempInitValue : initValue,
                        logicalOptions: this.logicalOptions,
                    }
                ]
                if (props.currentIndex == 0) {
                    columns.shift();
                    columns[1].initValue[0].logicalOperator = '';
                } else {
                    columns[2].initValue[0].logicalOperator = '';
                }
                columns.forEach(column => {
                    if (!formObj[column.key]) formObj[column.key] = column.initValue || []
                })
                break;
            case 'dimensions':
                this.setState({ formLayout: item.isSegment == 1 ? 'vertical' : 'horizontal', modalTitle: '维度设置' })
                let initValueDimensions = item?.segmentList || [];
                if (item.isSegment == 1) this.handleSegmentConfig(item, initValueDimensions, classify);
                //人群包失效数据处理
                let tempInitValueDimensions = initValueDimensions;
                // if(this.state.selectInputVoList.length){
                //     const arrIds = this.state.selectInputVoList.map(itm => itm.value)
                //     initValueDimensions.forEach((filterItm,filterIdx) => {
                //         if(filterItm.label.split(')')[0] != '(已失效' && !arrIds.includes(filterItm.value)) tempInitValueDimensions[filterIdx].label = `(已失效)${filterItm.label}`;
                //     })
                // }
                columns = [
                    {
                        label: '选择人群包',
                        key: 'segmentList',
                        tooltip: {
                            title: '仅可使用已计算完成的人群包，点击刷新可重新加载人群列表',
                            icon: <IconInfoCircle className='common-icon-style' />,
                        },
                        element: 'segment',
                        mode: 'multiple',
                        initValue: tempInitValueDimensions,
                        rules: [
                            {
                                validator: (rule, value, callback) => {
                                    let isJudge = value.some(valueItm => valueItm.label.split(')')[0] == '(已失效')
                                    if (!value.length) {
                                        callback('请选择')
                                    } else if (isJudge) {
                                        callback('请先去除已失效的人群包')
                                    } else {
                                        callback()
                                    }
                                }
                            }
                        ]
                    }
                ];
                columns.forEach(cloumn => {
                    if (!formObj[cloumn.key]) {
                        formObj[cloumn.key] = cloumn.initValue || ''
                    }
                })
                break;
            case 'indexes':
                this.setState({ modalTitle: '指标设置' })
                let initValueIndexes = item.conditions ? item.conditions.map(value => {
                    let comparatorTypeOf = Object.prototype.toString.call(value.comparator) === '[object Array]'
                    return {
                        ...value,
                        comparator: item.showDataType == 'Date' && comparatorTypeOf ?
                            (value?.compareOperator.toLowerCase() == 'between' ? value.comparator.map(comparatorItem => moment(Number(comparatorItem))) : moment(Number(value.comparator[0]))) : value.comparator
                    }
                }) : [];
                if (initValueIndexes.length) this.handleAddONConfig(initValueIndexes); //获取逻辑关系、枚举值等相关配置
                columns = [
                    columnName,
                    {
                        label: '条件格式',
                        key: 'conditions',
                        element: 'list',
                        initValue: initValueIndexes,
                        flag: 'Addon',
                        logicalOptions: this.logicalOptions,
                    }
                ]
                columns.forEach(column => {
                    if (!formObj[column.key]) formObj[column.key] = column.initValue || []
                })
                break;
            case 'sorts':
                this.setState({ modalTitle: '排序设置' })
                columns = [
                    columnName,
                    {
                        label: '排序方向',
                        key: 'direction',
                        element: 'select',
                        initValue: item?.direction || 'desc',
                        options: [
                            {
                                value: 'asc',
                                label: '升序',
                            },
                            {
                                value: 'desc',
                                label: '降序'
                            }
                        ]
                    }
                ]
                columns.forEach(cloumn => {
                    if (!formObj[cloumn.key]) {
                        formObj[cloumn.key] = cloumn.initValue || ''
                    }
                })
                break;
        }
        this.setState({
            columns,
            form: formObj
        }, () => {
            this.formRef.current.setFieldsValue(formObj)
        })
    }

    cancelModal = (type) => {
        if (type == 'ok') {
            this.formRef.current.validateFields().then(formData => {
                let tempFormData = formData, tempForShowList = [];
                if (this.props.classify == 'filters' && this.props.item?.isCascade) { //级联
                    //校验
                    this.formRef.current.validateFields().then(values => {
                        let tempFormDataCascade = {
                            conditionalFormat: []
                        };
                        this.state.fieldCascadeList.forEach(fieldCascade => {
                            //去除未填写完整的
                            if (tempFormData[fieldCascade.fieldName].length) {
                                tempFormDataCascade.conditionalFormat.push({
                                    ...fieldCascade,
                                    condition: tempFormData[fieldCascade.fieldName],
                                    logicalOperator: tempFormData.logicalOperator
                                })
                            }
                        })
                        this.props.completeSet({ form: { ...tempFormDataCascade, id: this.props.item.id, name: this.props.item.name }, classify: this.props.classify, isCascade: this.props.item.isCascade })
                        this.props.changeVisible(false)
                    }).catch(errorInfo => { });
                    return;
                } else if (this.props.classify == 'filters' || (this.props.classify == 'indexes' && this.props.item?.hasCondition)) { //addON
                    let showDataType = this.props.item.showDataType, resultArr = [];
                    if (this.props.item.hasCondition) { //addON
                        resultArr = tempFormData.conditions;
                    } else {
                        resultArr = tempFormData.filterValues;
                    }
                    let resultArrFormat = resultArr.map(value => {
                        let comparator = value.comparator;
                        let comparatorTypeOf = Object.prototype.toString.call(value.comparator);
                        if (this.props.item.hasCondition) showDataType = value.showDataType;
                        switch (showDataType) {
                            case 'Date': case 'DateUnlimited':
                                if (value.timeType == TIME_SELECT_TYPE_LIST[1].value) { //相对时间
                                    if (value.compareOperator.toLowerCase() == 'between') {
                                        value.relativeInfo = [
                                            {
                                                relativeType: value.relativeTypeStart,
                                                relativeValue: value.relativeValueStart,
                                            },
                                            {
                                                relativeType: value.relativeTypeEnd,
                                                relativeValue: value.relativeValueEnd
                                            }
                                        ]
                                        comparator = [value.comparatorStart, value.comparatorEnd];
                                    } else {
                                        value.relativeInfo = [
                                            {
                                                relativeType: value.relativeTypeStart,
                                                relativeValue: value.relativeValueStart,
                                            }
                                        ]
                                        comparator = [value.comparatorStart];
                                    }
                                } else {
                                    if (comparatorTypeOf !== '[object Array]') {
                                        comparator = [formatTimeSeconds(value.comparator, true)];
                                    } else {
                                        comparator = [formatTimeSeconds(value.comparator[0], true), formatTimeSeconds(value.comparator[1], false)];
                                    }
                                }
                                break;
                            case 'DateTime':
                                comparator = value.comparator.map(comparatorItem => moment(Number(comparatorItem)).format('HH:mm:ss'));
                                break;
                            case 'Select':
                                if (comparatorTypeOf !== '[object Array]') {
                                    comparator = [value.comparator];
                                }
                                tempForShowList = comparator.reduce((total, cur) => {
                                    let hasValue = this.state.selectInputVoList.find(listItem => listItem.value === cur)
                                    total.push(hasValue)
                                    return total
                                }, tempForShowList)
                                break;
                            case 'SelectMulti':
                                comparator = value.comparator;
                                tempForShowList = comparator.reduce((total, cur) => {
                                    let hasValue = optionFilterProp(this.state.selectInputVoList, 'value', cur)
                                    //人群失效数据的特殊处理
                                    if (this.props.classify == 'filters' && this.props.item?.isSegment) {
                                        if (hasValue == undefined) {
                                            hasValue = optionFilterProp(this.props.item?.forShowList, 'label', cur.split(')')[1])
                                        }
                                    }
                                    total.push(hasValue)
                                    return total
                                }, tempForShowList)
                                break;
                            case 'Input':
                                if (comparatorTypeOf === '[object String]') {
                                    if (value.compareOperator && ['IN', 'NOT IN'].includes(value.compareOperator.toUpperCase())) {
                                        comparator = value.comparator.split(',');
                                    } else {
                                        comparator = value.comparator == '' ? [] : [value.comparator];
                                    }
                                }
                                break;
                            case 'Upload':
                                if (comparatorTypeOf === '[object String]') {
                                    comparator = value.comparator.split(',');
                                } else if (comparatorTypeOf === '[object Array]') {
                                    comparator = value.comparator;
                                }
                                break;
                        }
                        return {
                            ...value,
                            comparator
                        }
                    })
                    tempFormData = { ...tempFormData, [this.props.classify == 'filters' ? 'filterValues' : 'conditions']: resultArrFormat };
                } else if (this.props.classify == 'dimensions' && this.props.item?.isSegment) { //人群
                    this.props.completeSet({ form: { ...this.props.item, ...tempFormData }, classify: this.props.classify, isSegment: this.props.item?.isSegment })
                    this.props.changeVisible(false)
                    return;
                }
                this.props.completeSet({ form: { ...tempFormData, id: this.props.item.id, name: this.props.item.name, forShowList: tempForShowList }, classify: this.props.classify, isCascade: this.props.item?.isCascade })
                this.props.changeVisible(false)
            }).catch(errorInfo => {
                console.log('errorInfo', errorInfo)
            })
        } else {
            this.props.changeVisible(false)
        }
    };

    //选择比较符
    handleOperatorChange = (value, index) => {
        const { item } = this.props;
        let filterValues = this.formRef.current?.getFieldValue('filterValues');
        let tempfilterValues = [...filterValues];
        if (['Date', 'DateUnlimited'].includes(item.showDataType)) {
            if (filterValues[index].timeType == 'absolute') {
                if (filterValues[index].compareOperator.toLowerCase() == 'between') {
                    tempfilterValues[index].comparator = [];
                } else {
                    tempfilterValues[index].comparator = null;
                }
            } else {
                if (filterValues[index].compareOperator.toLowerCase() == 'between') {
                    tempfilterValues[index].relativeTypeEnd = tempfilterValues[index].relativeTypeEnd ? tempfilterValues[index].relativeTypeEnd : -1;
                    tempfilterValues[index].relativeValueEnd = tempfilterValues[index].relativeValueEnd ? tempfilterValues[index].relativeValueEnd : 'day';
                    tempfilterValues[index].comparatorEnd = tempfilterValues[index].comparatorEnd ? tempfilterValues[index].comparatorEnd : '';
                }
            }
            this.formRef.current?.setFieldsValue({ filterValues: tempfilterValues });
        }
    }

    //获取级联字段的列表
    handleFieldCascadeList = async (currentItem, columns) => {
        this.setState({ spinLoading: true, columns: [], form: {} });
        let resFieldCascade = await queryFieldCascadeList({ groupName: currentItem.groupName });
        if (resFieldCascade.data) {
            let fieldCascadeList = resFieldCascade.data?.fieldCascadeList || [],
                formObj = {},
                tempColumns = [...columns];
            fieldCascadeList.forEach((field, index) => {
                let initValue = []
                if (this.props.childCondition) {
                    initValue = this.props.childCondition.find(child => {
                        return field.id === child.id && child.condition && child.condition.length
                    })
                }
                tempColumns.push({
                    label: field.showName,
                    key: field.fieldName,
                    element: 'selectCascade',
                    initValue: initValue ? initValue?.condition : [],
                    options: [],
                    mode: 'multiple',
                    loading: false,
                    onChange: (value) => this.handleCascadeChange(value, field)
                })
            })
            if (this.props.currentIndex == 0) tempColumns.shift();
            tempColumns.forEach(column => {
                if (!formObj[column.key]) formObj[column.key] = column.initValue || []
            })
            this.formRef.current?.setFieldsValue(formObj); //!!!改变表单值
            this.setState({
                columns: tempColumns,
                form: formObj,
                fieldCascadeList
            }, () => {
                this.handleCascadeInit(0);//从顶层开始查询list
            })
        }
    }

    //查询级联列表---从startIdx层级开始
    handleCascadeInit = async (startIdx) => {
        console.log('init', startIdx)
        if (!this.props.visible) return;
        let promiseAll = [], formData = this.formRef.current?.getFieldsValue(), addIdx = 0;
        if (this.props.currentIndex != 0) addIdx = 1;
        const { columns, fieldCascadeList } = this.state;
        fieldCascadeList.forEach((field, fieldIdx) => {
            if (fieldIdx >= startIdx) {
                let conditionInfo = {};
                field.extendIds.forEach((extendIdsItm, extendIdsIdx) => {
                    if (extendIdsIdx < fieldIdx) {
                        let fieldObj = fieldCascadeList.find(tempFieldItem => tempFieldItem.id == extendIdsItm)
                        conditionInfo = {
                            ...conditionInfo,
                            [extendIdsItm]: fieldObj ? [...formData[fieldObj?.fieldName]] : []
                        }
                    }
                })
                promiseAll.push(queryCascadeFieldInfoList({
                    groupName: field.groupName,
                    fieldId: field.id,//当前查询层的id
                    conditionInfo
                }));
            }
        })
        const promiseAllList = await Promise.all(promiseAll);
        if (!this.props.visible) return;
        promiseAllList.forEach((listItem, listIdx) => {
            if (listItem.data) {
                columns[startIdx + listIdx + addIdx] = {
                    ...columns[startIdx + listIdx + addIdx],
                    options: listItem.data?.dictList ? listItem.data.dictList.map(dict => {
                        return { value: dict.value, label: dict.name }
                    }) : [],
                    loading: false
                }
            }
        })
        this.setState({
            spinLoading: false,
            columns
        })
    }

    //选择级联后
    handleCascadeChange = async (value, field) => {
        console.log('change', value, field)
        if (!this.props.visible) return;
        //当前数据所在的层级
        let index = field.extendIds.findIndex(extendIdsItem => extendIdsItem === field.id);
        //若当前层级是最后一层
        if (index == field.extendIds.length - 1) return;
        let { columns } = this.state, addIdx = 1, formObj = {};
        if (this.props.currentIndex != 0) addIdx = 2;
        columns.forEach((column, columnIndex) => {
            if (columnIndex >= index + addIdx) {
                columns[columnIndex] = {
                    ...columns[columnIndex],
                    loading: true,
                    options: []
                }
                if (!formObj[column.key]) formObj[column.key] = []
            }
        })
        this.formRef.current?.setFieldsValue(formObj); //!!!改变表单值
        this.setState({ columns, form: formObj });
        await this.handleCascadeInit(index + 1);
    }

    //获取逻辑关系、枚举值等相关配置
    handleConfig = async (id) => {
        this.setState({
            spinLoading: true,
            operates: [],
            selectInputVoList: [],
        })
        try {
            const resConfig = await getConditionConfig({ fieldId: id });
            this.setState({
                operates: resConfig.data.fieldOperates ? resConfig.data.fieldOperates.map(operate => {
                    return { label: operate, value: operate }
                }) : [],
                selectInputVoList: resConfig.data.fieldValues ? resConfig.data.fieldValues.map(select => {
                    return { label: select.name, value: select.value }
                }) : [],
                spinLoading: false,
            }, () => {
                //默认选择第一个运算符和第一个枚举值
                let filterValues = this.formRef.current?.getFieldValue('filterValues');
                if (filterValues == undefined) return;
                let tempfilterValues = [...filterValues];
                if ((tempfilterValues[0].compareOperator ?? '') === '') {
                    this.formRef.current?.setFieldsValue({
                        filterValues: tempfilterValues.map(filterValueItem => {
                            return {
                                ...filterValueItem,
                                compareOperator: resConfig.data.fieldOperates && resConfig.data.fieldOperates.length ? resConfig.data.fieldOperates[0] : '',
                                comparator: this.props.item.showDataType == 'Date' ? null : (
                                    resConfig.data.fieldValues ? (resConfig.data.fieldValues.length ? [resConfig.data.fieldValues[0].value] : []) : []
                                ),
                            }
                        })
                    });
                }
            })
        } catch (err) {
            this.setState({
                spinLoading: false
            })
        }
    }

    //获取自定义维度的逻辑关系、枚举值等相关配置
    handleCustomConfig = async (id) => {
        try {
            const resInfo = await getCustomRulesDetailInfo(id);
            const data = resInfo?.data || {};
            this.setState({
                operates: [{ label: 'in', value: 'in' }, { label: 'not in', value: 'not in' }],
                selectInputVoList: data.params ? data.params.map(select => {
                    return { label: select.groupName, value: select.groupId }
                }) : [],
                spinLoading: false,
            })
        } catch (errorInfo) {
            console.log(400, errorInfo)
        }
    }

    //获取AddON的枚举值
    handleAddONConfig = async (arr) => {
        this.setState({
            spinLoading: true,
            addONSelectInputVoList: []
        })
        let promiseAll = [], promiseAllIndex = [], promiseAllSelectInputVoList = [], addONSelectInputVoList = {};
        arr.forEach((arrItem, arrIndex) => {
            if (['Select', 'SelectMulti'].includes(arrItem.showDataType)) {
                promiseAll.push(getConditionConfig({ fieldId: arrItem.id }));
                promiseAllIndex.push(arrIndex);
            }
        })
        const promiseAllList = await Promise.all(promiseAll);
        promiseAllList.forEach(listItem => {
            if (listItem.data) {
                promiseAllSelectInputVoList.push(listItem.data.fieldValues ? listItem.data.fieldValues.map(select => {
                    return { label: select.name, value: select.value }
                }) : []);
            }
        })
        promiseAllIndex.forEach((i, j) => {
            addONSelectInputVoList[i] = promiseAllSelectInputVoList[j];
        })
        this.setState({
            addONSelectInputVoList,
            spinLoading: false
        })
    }

    handleSelectFile = (index, flag) => {
        this.fileInput.current.value = null;
        this.fileInput.current.click();
        this.flag = flag;
        this.setState({ uploadIndex: index });
    }

    //上传
    handleFileChange = (ev) => {
        const formData = this.formRef.current.getFieldsValue(); //!!!
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
                    if (this.flag == 'Addon') {
                        formData.conditions[this.state.uploadIndex].comparator = tempItemCodeList;
                    } else {
                        formData.filterValues[this.state.uploadIndex].comparator = tempItemCodeList;
                    }
                    this.formRef.current?.setFieldsValue(formData); //!!!改变表单值
                }
            }
        }).catch((error) => {
            message.error(error || '无法读取文件内容');
        });

    }

    //人群包的逻辑关系、枚举值等相关配置
    handleSegmentConfig = async (item = {}, initValue = [], classify = '') => {
        this.setState({ spinLoading: true })
        try {
            const resInfo = await getSegmentList();
            this.setState({
                operates: [{ label: 'in', value: 'in' }, { label: 'not in', value: 'not in' }],
                selectInputVoList: resInfo?.data || [],
                spinLoading: false
            }, () => {
                if (classify == '') return;
                //let initValue = this.formRef.current?.getFieldsValue()?.filterValues;
                //人群包失效数据处理
                let tempInitValue = initValue;
                if (this.state.selectInputVoList.length) {
                    const arrId = this.state.selectInputVoList.map(itm => itm.value)
                    initValue.forEach((filterItm, filterIdx) => {
                        if (classify == 'dimensions') {
                            if (filterItm.label.split(')')[0] != '(已失效' && !arrId.includes(filterItm.value)) tempInitValue[filterIdx].label = `(已失效)${filterItm.label}`;
                        } else {
                            filterItm.comparator.forEach((initIdItem, initIdIdx) => {
                                if (initIdItem.split(')')[0] != '(已失效' && !arrId.includes(initIdItem)) tempInitValue[filterIdx].comparator[initIdIdx] = `(已失效)${optionFilterProp(item?.forShowList, 'value', initIdItem)?.label}`;
                            })
                        }
                    })
                }
                this.formRef.current.setFieldsValue({
                    filterValues: tempInitValue
                })
            })
        } catch (errorInfo) {
            this.setState({ spinLoading: false })
        }
    }

    //去人群包页面
    linkToSegmentForm = () => {
        this.props.changeVisible(false);
        this.props.saveTabActive();
        let pathname = "/imp/segment/create", tabNameZh = '人群圈选';
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }

    //修改绝对、相对时间
    handleTimeTypeChange = (value, index) => {
        let filterValues = this.formRef.current?.getFieldValue('filterValues');
        let tempfilterValues = [...filterValues];
        if (filterValues[index].timeType == 'relative') {
            if (filterValues[index].compareOperator.toLowerCase() == 'between') {
                tempfilterValues[index].relativeTypeStart = tempfilterValues[index].relativeTypeStart ? tempfilterValues[index].relativeTypeStart : -1;
                tempfilterValues[index].relativeValueStart = tempfilterValues[index].relativeValueStart ? tempfilterValues[index].relativeValueStart : 'day';
                tempfilterValues[index].comparatorStart = tempfilterValues[index].comparatorStart ? tempfilterValues[index].comparatorStart : '';
                tempfilterValues[index].relativeTypeEnd = tempfilterValues[index].relativeTypeEnd ? tempfilterValues[index].relativeTypeEnd : -1;
                tempfilterValues[index].relativeValueEnd = tempfilterValues[index].relativeValueEnd ? tempfilterValues[index].relativeValueEnd : 'day';
                tempfilterValues[index].comparatorEnd = tempfilterValues[index].comparatorEnd ? tempfilterValues[index].comparatorEnd : '';
            } else {
                tempfilterValues[index].relativeTypeStart = tempfilterValues[index].relativeTypeStart ? tempfilterValues[index].relativeTypeStart : -1;
                tempfilterValues[index].relativeValueStart = tempfilterValues[index].relativeValueStart ? tempfilterValues[index].relativeValueStart : 'day';
                tempfilterValues[index].comparatorStart = tempfilterValues[index].comparatorStart ? tempfilterValues[index].comparatorStart : '';
            }
        } else {
            if (filterValues[index].compareOperator.toLowerCase() == 'between') {
                tempfilterValues[index].comparator = []
            } else {
                tempfilterValues[index].comparator = null
            }
        }
        this.formRef.current?.setFieldsValue({ filterValues: tempfilterValues });
    }

    renderFormItem = (item) => {
        if (!this.props.visible) return
        let itemElement, that = this;
        switch (item.element) {
            case 'select':
                itemElement = <Select options={item.options}></Select>
                break;
            case 'list':
                const disabledDate = (current) => {
                    return current && current >= moment().endOf('day');
                }
                itemElement = (<Form.List name={item.key}>
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map((field, index) => {
                                return <Row gutter={12} key={field.key}>
                                    <Col flex="82px">
                                        {index != 0 ?
                                            <Form.Item
                                                {...field}
                                                name={[field.name, 'logicalOperator']}
                                                fieldKey={[field.fieldKey, 'logicalOperator']}
                                                rules={[{ required: true, message: '请选择' }]}>
                                                <Select options={item.logicalOptions} disabled={item?.flag && item.flag == 'Addon' ? true : false}></Select>
                                            </Form.Item> :
                                            <div style={{ padding: '0 0px' }}></div>}
                                    </Col>
                                    {item?.flag && item.flag == 'Addon' ? <Col flex="82px">
                                        <Form.Item
                                            {...field}
                                            name={[field.name, 'showName']}
                                            fieldKey={[field.fieldKey, 'showName']}
                                            rules={[{ required: true, message: '请选择' }]}>
                                            <Select disabled={item?.flag && item.flag == 'Addon' ? true : false}></Select>
                                        </Form.Item>
                                    </Col> : null}
                                    <Form.Item shouldUpdate noStyle>
                                        {({ getFieldValue }) => getFieldValue(item.key)[index]?.isCustom == 1 ? null : <Col flex="100px">
                                            <Form.Item
                                                {...field}
                                                name={[field.name, 'compareOperator']}
                                                fieldKey={[field.fieldKey, 'compareOperator']}
                                                rules={[{ required: true, message: '请选择' }]}>
                                                <Select
                                                    disabled={item?.flag && item.flag == 'Addon' ? true : false}
                                                    options={this.state.operates}
                                                    onChange={(value) => this.handleOperatorChange(value, index)}></Select>
                                            </Form.Item>
                                        </Col>}
                                    </Form.Item>
                                    <Col flex="1">
                                        <Form.Item shouldUpdate noStyle>
                                            {({ getFieldValue }) => {
                                                const showDataType = item?.flag && item.flag == 'Addon' ? getFieldValue(item.key)[index]?.showDataType : that.props.item.showDataType;
                                                let formItemElement;
                                                switch (showDataType) {
                                                    case 'Date': case 'DateUnlimited':
                                                        if (getFieldValue(item.key)[index]?.compareOperator.toLowerCase() == 'between') {
                                                            formItemElement = <Row gutter={6}>
                                                                <Col flex="96px">
                                                                    <Form.Item
                                                                        {...field}
                                                                        name={[field.name, 'timeType']}
                                                                        fieldKey={[field.fieldKey, 'timeType']}
                                                                        rules={[{ required: true, message: '请选择' }]}>
                                                                        <Select
                                                                            options={TIME_SELECT_TYPE_LIST}
                                                                            onChange={(value) => this.handleTimeTypeChange(value, index)}>
                                                                        </Select>
                                                                    </Form.Item>
                                                                </Col>
                                                                {getFieldValue(item.key)[index]?.timeType.toLowerCase() == 'absolute' ? <Col flex="1">
                                                                    <Form.Item
                                                                        {...field}
                                                                        name={[field.name, 'comparator']}
                                                                        fieldKey={[field.fieldKey, 'comparator']}
                                                                        rules={[{ required: true, message: '请选择' }]}>
                                                                        <DatePicker.RangePicker disabledDate={showDataType == 'DateUnlimited' ? false : disabledDate} allowClear={false} />
                                                                    </Form.Item>
                                                                </Col> : <Col flex="1">
                                                                    <Row>
                                                                        <Col flex="64px">
                                                                            <Form.Item
                                                                                {...field}
                                                                                name={[field.name, 'relativeTypeStart']}
                                                                                fieldKey={[field.fieldKey, 'relativeTypeStart']}
                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                <Select
                                                                                    options={RELATIVE_TIME_TYPE_LIST}>
                                                                                </Select>
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="1">
                                                                            <Form.Item
                                                                                {...field}
                                                                                name={[field.name, 'comparatorStart']}
                                                                                fieldKey={[field.fieldKey, 'comparatorStart']}
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
                                                                                {...field}
                                                                                name={[field.name, 'relativeValueStart']}
                                                                                fieldKey={[field.fieldKey, 'relativeValueStart']}
                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                <Select
                                                                                    options={RELATIVE_TIME_UNIT_LIST}>
                                                                                </Select>
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col>
                                                                            <span style={{
                                                                                lineHeight: '30px',
                                                                                display: 'inline-block',
                                                                                marginLeft: 6,
                                                                                marginRight: 6
                                                                            }}>至</span>
                                                                        </Col>
                                                                        <Col flex="64px">
                                                                            <Form.Item
                                                                                {...field}
                                                                                name={[field.name, 'relativeTypeEnd']}
                                                                                fieldKey={[field.fieldKey, 'relativeTypeEnd']}
                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                <Select
                                                                                    options={RELATIVE_TIME_TYPE_LIST}>
                                                                                </Select>
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="1">
                                                                            <Form.Item
                                                                                {...field}
                                                                                name={[field.name, 'comparatorEnd']}
                                                                                fieldKey={[field.fieldKey, 'comparatorEnd']}
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
                                                                                {...field}
                                                                                name={[field.name, 'relativeValueEnd']}
                                                                                fieldKey={[field.fieldKey, 'relativeValueEnd']}
                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                <Select
                                                                                    options={RELATIVE_TIME_UNIT_LIST}>
                                                                                </Select>
                                                                            </Form.Item>
                                                                        </Col>
                                                                    </Row>
                                                                </Col>}
                                                            </Row>
                                                        } else {
                                                            formItemElement = <Row gutter={6}>
                                                                <Col flex="96px">
                                                                    <Form.Item
                                                                        {...field}
                                                                        name={[field.name, 'timeType']}
                                                                        fieldKey={[field.fieldKey, 'timeType']}
                                                                        rules={[{ required: true, message: '请选择' }]}>
                                                                        <Select
                                                                            options={TIME_SELECT_TYPE_LIST}
                                                                            onChange={(value) => this.handleTimeTypeChange(value, index)}>
                                                                        </Select>
                                                                    </Form.Item>
                                                                </Col>
                                                                {getFieldValue(item.key)[index]?.timeType.toLowerCase() == 'absolute' ? <Col flex="1">
                                                                    <Form.Item
                                                                        {...field}
                                                                        name={[field.name, 'comparator']}
                                                                        fieldKey={[field.fieldKey, 'comparator']}
                                                                        rules={[{ required: true, message: '请选择' }]}>
                                                                        <DatePicker disabledDate={showDataType == 'DateUnlimited' ? false : disabledDate} allowClear={false}></DatePicker>
                                                                    </Form.Item>
                                                                </Col> : <Col flex="1">
                                                                    <Row>
                                                                        <Col flex="64px">
                                                                            <Form.Item
                                                                                {...field}
                                                                                name={[field.name, 'relativeTypeStart']}
                                                                                fieldKey={[field.fieldKey, 'relativeTypeStart']}
                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                <Select
                                                                                    options={RELATIVE_TIME_TYPE_LIST}>
                                                                                </Select>
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="1">
                                                                            <Form.Item
                                                                                {...field}
                                                                                name={[field.name, 'comparatorStart']}
                                                                                fieldKey={[field.fieldKey, 'comparatorStart']}
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
                                                                                {...field}
                                                                                name={[field.name, 'relativeValueStart']}
                                                                                fieldKey={[field.fieldKey, 'relativeValueStart']}
                                                                                rules={[{ required: true, message: '请选择' }]}>
                                                                                <Select
                                                                                    options={RELATIVE_TIME_UNIT_LIST}>
                                                                                </Select>
                                                                            </Form.Item>
                                                                        </Col>
                                                                    </Row>
                                                                </Col>}
                                                            </Row>
                                                        }
                                                        break;
                                                    case 'Select':
                                                        formItemElement = <Form.Item
                                                            {...field}
                                                            name={[field.name, 'comparator']}
                                                            fieldKey={[field.fieldKey, 'comparator']}
                                                            rules={[{ required: true, message: '请选择' }]}>
                                                            <Select
                                                                options={item?.flag && item.flag == 'Addon' ? this.state.addONSelectInputVoList[index] : this.state.selectInputVoList}
                                                                showSearch
                                                                filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}>
                                                            </Select>
                                                        </Form.Item>;
                                                        break;
                                                    case 'SelectMulti':
                                                        let rules = [{ required: true, message: '请选择' }]
                                                        //人群包
                                                        if (that.props.item.isSegment == 1) {
                                                            rules.push({
                                                                validator: (rule, value, callback) => {
                                                                    let isJudge = value.some(valueItm => valueItm.split(')')[0] == '(已失效')
                                                                    if (isJudge) {
                                                                        callback('请先去除已失效的人群包')
                                                                    } else {
                                                                        callback()
                                                                    }
                                                                }
                                                            })
                                                        }
                                                        formItemElement = <Form.Item
                                                            {...field}
                                                            name={[field.name, 'comparator']}
                                                            fieldKey={[field.fieldKey, 'comparator']}
                                                            rules={rules}>
                                                            <Select
                                                                mode="multiple"
                                                                allowClear
                                                                options={item?.flag && item.flag == 'Addon' ? this.state.addONSelectInputVoList[index] : this.state.selectInputVoList}
                                                                maxTagTextLength={8}
                                                                showSearch
                                                                filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}>
                                                            </Select>
                                                        </Form.Item>;
                                                        break;
                                                    case 'DateTime':
                                                        formItemElement = <Form.Item
                                                            {...field}
                                                            name={[field.name, 'comparator']}
                                                            fieldKey={[field.fieldKey, 'comparator']}
                                                            rules={[{ required: true, message: '请输入' }]}>
                                                            <TimePicker.RangePicker allowClear={false} />
                                                        </Form.Item>;
                                                        break;
                                                    case 'DateRange':
                                                        formItemElement = <Form.Item
                                                            {...field}
                                                            name={[field.name, 'comparator']}
                                                            fieldKey={[field.fieldKey, 'comparator']}
                                                            rules={[{ required: true, message: '请输入' }]}>
                                                            <DatePicker.RangePicker disabledDate={disabledDate} allowClear={false} />
                                                        </Form.Item>;
                                                        break;
                                                    case 'Input':
                                                        formItemElement = <Form.Item
                                                            {...field}
                                                            name={[field.name, 'comparator']}
                                                            fieldKey={[field.fieldKey, 'comparator']}
                                                            rules={[{ required: true, message: '请输入' }]}>
                                                            <Input allowClear />
                                                        </Form.Item>
                                                        break;
                                                    case 'Upload':
                                                        formItemElement = <Row gutter={12}>
                                                            <Col flex="1">
                                                                <Form.Item
                                                                    {...field}
                                                                    name={[field.name, 'comparator']}
                                                                    fieldKey={[field.fieldKey, 'comparator']}
                                                                    rules={[{ required: true, message: '请输入' }]}>
                                                                    <Input allowClear />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col>
                                                                <Button type="primary" icon={<IconUpload />} onClick={() => this.handleSelectFile(index, item?.flag || '')}>上传文件</Button>
                                                                <input type="file" style={{ display: 'none' }} ref={this.fileInput} onChange={(ev) => this.handleFileChange(ev)} />
                                                            </Col>
                                                            <Col>
                                                                <Tooltip title='支持.csv导入'>
                                                                    <IconInfoCircle className='common-icon-style' />
                                                                </Tooltip>
                                                            </Col>
                                                        </Row>
                                                        break;
                                                }
                                                return formItemElement;
                                            }}
                                        </Form.Item>
                                    </Col>
                                    {item?.flag && item.flag == 'Addon' ? null : <Col flex="40px">
                                        {index == (fields.length - 1) ?
                                            // <Button type="primary" icon={<IconAddA />} onClick={() =>
                                            <IconAddA className="common-icon-style" onClick={() =>
                                                add({
                                                    'logicalOperator': 'AND',
                                                    'compareOperator': this.state.operates.length ? this.state.operates[0].label : '',
                                                    'comparator': that.props.item.showDataType == 'Date' ? (this.state.selectInputVoList.length ? this.state.selectInputVoList[0].label : null) : [],
                                                    'timeType': ['Date', 'DateUnlimited'].includes(that.props.item.showDataType) ? 'absolute' : ''
                                                })
                                            } /> : ''}
                                    </Col>}
                                    {item?.flag && item.flag == 'link' ? null : <Col flex="40px">
                                        {/* {fields.length == 1 ? '':<Button type="primary" icon={<IconClearUp />} onClick={() => {remove(index)}}/>} */}
                                        {fields.length == 1 ? '' : <IconClearUp className="common-icon-style" onClick={() => { remove(index) }} />}
                                    </Col>}
                                </Row>
                            })}
                        </>
                    )}
                </Form.List>)
                break;
            case 'selectCascade':
                itemElement = <Select
                    mode={item?.mode}
                    loading={item?.loading}
                    options={item.options}
                    notFoundContent={item.loading ? <IconLoadingFill spin className='common-icon-style' /> : (<Empty></Empty>)}
                    onChange={(value) => item?.onChange(value)}></Select>
                break;
            case 'segment':
                itemElement = <Select
                    mode={item?.mode}
                    loading={this.state.spinLoading}
                    notFoundContent={this.state.spinLoading ? <IconLoadingFill spin className='common-icon-style' /> : (<Empty></Empty>)}
                    labelInValue
                    options={this.state.selectInputVoList}
                    showSearch
                    filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
                    allowClear></Select>
                break;
            default:
                itemElement = <Input disabled={item.disabled} />
        }
        return itemElement;
    }

    render () {
        const { visible, item, classify } = this.props
        return <Modal
            className={["data-container oap-conditionModal", this.state.footerModal.length > 1 ? 'oap-conditionModal-multi' : ''].join(' ')}
            width={880}
            title={this.state.modalTitle}
            visible={visible}
            onCancel={() => this.cancelModal('cancel')}
            footer={this.state.footerModal}
            bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px 20px 0' }}>
            <Spin spinning={this.state.spinLoading}>
                <div className="common-edit">
                    <Form
                        labelCol={item?.isCascade ? { span: 4 } : ((item.isSegment == 1 || item.isTag == 1) && ['dimensions'].includes(classify) ? { span: 24 } : { flex: '72px' })}
                        layout={this.state.formLayout}
                        className="edit-form"
                        ref={this.formRef}
                        initialValues={this.state.form || {}}
                        size="middle">
                        {this.state.columns.map(column => {
                            return <Form.Item
                                name={column.key}
                                label={`${column.label}`}
                                tooltip={column?.tooltip}
                                key={column.key}
                                rules={column?.rules}>
                                {this.renderFormItem(column)}
                            </Form.Item>
                        })}
                    </Form>
                </div>
            </Spin>
        </Modal>
    }
}