import React from 'react';
import { Modal, Row, Col, Button, Input, Select, DatePicker, Spin, Empty, Tooltip, message, TimePicker, TreeSelect } from '@aurum/pfe-ui';
import { Form } from 'antd'; //form的tooltip 属性在boss里不生效
import { IconAddA, IconClearUp, IconLoadingFill, IconUpload, IconInfoCircle } from '@aurum/icons';
import moment from 'moment';
import {
    getConditionConfig,
    queryCascadeFieldInfoList,
    queryFieldCascadeList,
    getCustomRulesDetailInfo,
    getSegmentList,
    getTagList,
    getCustomList,
    getUserTagList,
    getUserTagVersionList,
    getUserTagEnumList
} from '@/api/oap/self_analysis.js';
import { getConditionConfigTrino } from '@/api/oap/trino.js';
import { getFileContent, formatTimeSeconds, optionFilterProp } from '@/utils/store/func';
import { TIME_SELECT_TYPE_LIST, RELATIVE_TIME_TYPE_LIST, RELATIVE_TIME_UNIT_LIST } from '@/constants';
import '@/style/condition.less';

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
            customInputVoList: [],
            customInputVoListTree: [],
            userTagInputVoList: [], //用户标签:列表
            userTagVersionList: [], //用户标签:版本列表
            userTagEnumList: [], //用户标签:枚举值
            userTagEnumListTree: [], //用户标签:枚举值
            modalTips: '',
            isShowModalTips: false,
            selectInputVoListTree: [{
                label: '全部',
                value: 'all',
                children: [
                    {
                        label: 'mock1',
                        value: 'daizi',
                    },
                    {
                        label: 'mock2',
                        value: 'shazi',
                    },
                ]
            }],
            addONSelectInputVoListTree: {},
            treeSearchValue: '',
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
                <Button key="cancel" onClick={() => this.cancelModal('cancel')}>取消</Button>
                <Button key="ok" type="primary" disabled={this.state.spinLoading} onClick={() => this.cancelModal('ok')}>确定</Button>
            </div>
        ];
        let columns = [], formObj = {}, footerModal = footerModalC;
        if (item.isSegment == 1 && ['filters', 'dimensions'].includes(classify)) {
            footerModal = [
                <div key="left">
                    <Button key="create" type="primary" onClick={() => this.linkToSegmentTagForm('/imp/segment/create', '人群圈选')}>创建人群包</Button>
                    <Button key="refresh" type="primary" onClick={this.handleSegmentConfig}>刷新</Button>
                </div>,
                ...footerModalC
            ];
        } else if (item.isTag == 1) {
            footerModal = [
                <div key="left">
                    <Button key="create" type="primary" onClick={() => this.linkToSegmentTagForm('/imp/nre-segment/create', 'NRE人群')}>创建顾客标签</Button>
                    <Button key="refresh" type="primary" onClick={this.handleTagConfig}>刷新</Button>
                </div>,
                ...footerModalC
            ];
        } else if (item.isCustomDimension == 1 && ['filters', 'dimensions'].includes(classify)) {
            footerModal = [
                <div key="left">
                    <Button key="create" type="primary" onClick={() => this.linkToSegmentTagForm('/oap/customRules/form', '自定义维度')}>创建自定义维度标签</Button>
                    <Button key="refresh" type="primary" onClick={() => this.handleCustomDimensionList('', '', classify)}>刷新</Button>
                </div>,
                ...footerModalC
            ];
        }
        this.setState({
            formLayout: 'horizontal',
            footerModal,
            modalTips: item.isUserTag == 1 ? '选择分群标签' : '',
            isShowModalTips: classify == 'dimensions' && item.isUserTag == 1
        })
        console.log('getCloumns', item, classify)
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
                    compareOperator: null, //比较操作符
                    comparator: ['Date', 'DateUnlimited'].includes(item.showDataType) ? null : [],//比较值
                    timeType: ['Date', 'DateUnlimited'].includes(item.showDataType) ? 'absolute' : '',
                    logicalOperator: 'AND', //逻辑运算符 And / or
                }];
                //获取逻辑关系、枚举值等相关配置
                //item.isCustomDimension == 1 ? this.handleCustomDimensionList('customInputVoList', item.id) : (item.isSegment == 1 ? this.handleSegmentConfig(item, initValue, classify) : this.handleConfig(item.id));
                let tempInitValue = initValue;
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
                if (item.isCustomDimension == 1) {
                    columns[1] = {
                        ...columns[1],
                        element: 'custom',
                        showSearch: true,
                        initValue: item.filterValues ? { label: item?.showName, value: item?.id } : '',
                        disabled: false,
                        rules: [
                            { required: true, message: '请选择' },
                            {
                                validator: (rule, value, callback) => {
                                    if (Object.prototype.toString.call(value) == '[object String]' && value.split(')')[0] == '(已失效') {
                                        callback('请先去除已失效的自定义维度')
                                    } else {
                                        callback()
                                    }
                                }
                            }
                        ]
                    }
                    this.handleCustomDimensionList('customInputVoList', item.id); //获取逻辑关系、枚举值等相关配置
                } else if (item.isUserTag == 1) {
                    columns[1] = {
                        ...columns[1],
                        element: 'usertag',
                        showSearch: true,
                        initValue: item.filterValues ? {
                            label: item.userTag?.tagName,
                            value: item.userTag?.tagId,
                            id: item?.id,
                            tagId: item.userTag.tagId,
                            tagCode: item.userTag.tagCode,
                            tagName: item.userTag.tagName,
                            logicTable: item.userTag.logicTable,
                        } : '',
                        disabled: false,
                        rules: [
                            { required: true, message: '请选择' },
                            {
                                validator: (rule, value, callback) => {
                                    if (Object.prototype.toString.call(value) == '[object String]' && value.split(')')[0] == '(已失效') {
                                        callback('请先去除已失效的用户标签')
                                    } else {
                                        callback()
                                    }
                                }
                            }
                        ]
                    }
                    columns[2] = { ...columns[2], isUserTag: item.isUserTag };
                    columns[2].initValue.forEach((it, idx) => {
                        it.version = (item.filterValues && item.filterValues.length) ? item.filterValues[idx].version : null
                    });
                    this.handleUserTagList(); //获取逻辑关系、枚举值等相关配置
                } else if (item.isSegment == 1) {
                    this.handleSegmentConfig(item, initValue, classify);//获取逻辑关系、枚举值等相关配置
                } else {
                    this.handleConfig(item.id);//获取逻辑关系、枚举值等相关配置
                }
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
                this.setState({ formLayout: item.isSegment == 1 || item.isTag == 1 || item.isCustomDimension == 1 ? 'vertical' : 'horizontal', modalTitle: '维度设置' })
                let initValueDimensions = [];
                if (item.isSegment == 1) {
                    initValueDimensions = item?.segmentList || [];
                    this.handleSegmentConfig(item, initValueDimensions, classify);
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
                            showSearch: true,
                            initValue: initValueDimensions,
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
                } else if (item.isTag == 1) {
                    this.handleTagConfig();
                    columns = [
                        {
                            label: item.showName,
                            key: 'tagSelected',
                            element: 'segment',
                            showSearch: true,
                            initValue: [],
                            rules: [{ required: true, message: '请选择' }]
                        }
                    ];
                } else if (item.isCustomDimension == 1) {
                    this.handleCustomDimensionList();
                    columns = [
                        {
                            label: item.showName,
                            key: 'tagSelected',
                            element: 'segment',
                            showSearch: true,
                            initValue: [],
                            rules: [{ required: true, message: '请选择' }]
                        }
                    ];
                } else if (item.isUserTag == 1) {
                    columns = [
                        {
                            label: '字段名',
                            key: 'showName',
                            element: 'usertag',
                            showSearch: true,
                            initValue: item.userTag ? {
                                label: item.userTag?.tagName,
                                value: item.userTag?.tagId,
                                id: item?.id,
                                tagId: item.userTag.tagId,
                                tagCode: item.userTag.tagCode,
                                tagName: item.userTag.tagName,
                                logicTable: item.userTag.logicTable,
                            } : '',
                            disabled: false,
                            rules: [
                                { required: true, message: '请选择' },
                                {
                                    validator: (rule, value, callback) => {
                                        if (Object.prototype.toString.call(value) == '[object String]' && value.split(')')[0] == '(已失效') {
                                            callback('请先去除已失效的用户标签')
                                        } else {
                                            callback()
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            label: '条件格式',
                            key: 'usertagValues',
                            element: 'usertagDimensions',
                            showSearch: true,
                            initValue: item.userTag && item.userTag.values ? [{
                                comparator: item.userTag.values || [],
                                version: item.userTag?.version
                            }] : [{
                                comparator: [],
                                version: null
                            }]
                        }
                    ];
                    this.handleUserTagList();
                }
                columns.forEach(cloumn => {
                    if (!formObj[cloumn.key]) {
                        formObj[cloumn.key] = cloumn.initValue || ''
                    }
                })
                break;
            case 'indexes':
                this.setState({ modalTitle: '指标设置' })
                let initValueIndexes = item.conditions ? item.conditions.map(value => {
                    let comparatorTypeOfArray2 = Object.prototype.toString.call(value.comparator) === '[object Array]'
                    return {
                        ...value,
                        comparator: ['Date', 'DateUnlimited'].includes(item.showDataType) && comparatorTypeOfArray2 ?
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
                if (item.isCustomDimension == 1) {
                    this.handleCustomDimensionList('customInputVoList')
                    columns[0] = {
                        ...columns[0],
                        element: 'custom',
                        showSearch: true,
                        initValue: item.name ? { label: item?.showName, value: item?.id } : '',
                        disabled: false,
                        rules: [
                            { required: true, message: '请选择' },
                            {
                                validator: (rule, value, callback) => {
                                    if (Object.prototype.toString.call(value) == '[object String]' && value.split(')')[0] == '(已失效') {
                                        callback('请先去除已失效的自定义维度')
                                    } else {
                                        callback()
                                    }
                                }
                            }
                        ]
                    }
                }
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
            this.formRef.current?.setFieldsValue(formObj)
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
                                    condition: tempFormData[fieldCascade.fieldName].map(it => it.value),
                                    logicalOperator: tempFormData.logicalOperator
                                })
                            }
                        })
                        this.props.completeSet({ form: { ...tempFormDataCascade, id: this.props.item.id, name: this.props.item.name }, classify: this.props.classify, isCascade: this.props.item.isCascade })
                        this.props.changeVisible(false)
                    }).catch(errorInfo => { });
                    return;
                } else if (this.props.classify == 'filters' || (this.props.classify == 'indexes' && this.props.item?.hasCondition) || (this.props.classify == 'dimensions' && this.props.item?.isUserTag == 1)) { //addON
                    let showDataType = this.props.item.showDataType, resultArr = [];
                    if (this.props.item.hasCondition) { //addON
                        resultArr = tempFormData.conditions;
                    } else if (this.props.classify == 'dimensions' && this.props.item?.isUserTag) {  //用户标签
                        resultArr = tempFormData.usertagValues;
                    } else {
                        resultArr = tempFormData.filterValues;
                    }
                    let resultArrFormat = resultArr.map((value, resultIdx) => {
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
                                    let hasValue = {};
                                    if (this.props.item?.isUserTag) {
                                        hasValue = optionFilterProp(this.state.userTagEnumListTree[resultIdx][0].children, 'value', cur)
                                        if (hasValue == undefined) {
                                            hasValue = optionFilterProp(this.props.item?.forShowList, 'label', cur.split(')')[1])
                                        }
                                    } else {
                                        hasValue = optionFilterProp(this.state.selectInputVoList, 'value', cur)
                                        //人群 失效数据的特殊处理
                                        if (this.props.classify == 'filters' && this.props.item?.isSegment) {
                                            if (hasValue == undefined) {
                                                hasValue = optionFilterProp(this.props.item?.forShowList, 'label', cur.split(')')[1])
                                            }
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
                    if (this.props.item?.isCustomDimension == 1) {
                        this.props.completeSet({
                            form: {
                                ...this.props.item,
                                ...tempFormData,
                                name: tempFormData.showName.label,
                                forShowList: tempForShowList
                            },
                            classify: this.props.classify,
                            isCustomDimension: 1
                        })
                        this.props.changeVisible(false)
                        return;
                    } else if (this.props.item?.isUserTag == 1) {
                        this.props.completeSet({
                            form: {
                                ...this.props.item,
                                ...tempFormData,
                                name: tempFormData.showName.label,
                                forShowList: tempForShowList,
                            },
                            classify: this.props.classify,
                            isUserTag: 1,
                            userTag: this.props.classify == 'filters' ? tempFormData.showName : {
                                tagId: tempFormData.showName.tagId,
                                tagCode: tempFormData.showName.tagCode,
                                tagName: tempFormData.showName.tagName,
                                logicTable: tempFormData.showName.logicTable,
                                version: tempFormData.usertagValues[0].version,
                                values: tempFormData.usertagValues[0].comparator
                            }
                        })
                        this.props.changeVisible(false)
                        return
                    } else {
                        tempFormData = { ...tempFormData, [this.props.classify == 'filters' ? 'filterValues' : 'conditions']: resultArrFormat };
                    }
                } else if (this.props.classify == 'dimensions' && (this.props.item?.isSegment || this.props.item?.isTag || this.props.item?.isCustomDimension)) { //人群/tag
                    if (this.props.item?.isSegment) {
                        let len = tempFormData.segmentList.length;
                        if (len > 5) {
                            message.warning('最多可选择5个人群包')
                            return;
                        }
                    }
                    this.props.completeSet({
                        form: { ...this.props.item, ...tempFormData },
                        classify: this.props.classify,
                        tagSegment: this.props.item?.isSegment ? 'segment' : (this.props.item?.isTag ? 'tag' : 'custom')
                    })
                    this.props.changeVisible(false)
                    return;
                } else if (this.props.classify == 'sorts' && this.props.item?.isCustomDimension) {
                    this.props.completeSet({
                        form: {
                            ...this.props.item,
                            ...tempFormData,
                            id: tempFormData.showName.value,
                            name: tempFormData.showName.label,
                            showName: tempFormData.showName.label,
                        },
                        classify: this.props.classify,
                        isCustomDimension: 1
                    })
                    this.props.changeVisible(false)
                    return;
                }
                //return
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
            this.formRef.current?.setFieldsValue({ 'filterValues': tempfilterValues });
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
                    initValue: initValue ? initValue?.condition.map(it => ({ label: it, value: it })) : [],
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
                        if (fieldObj) {
                            let arr = [];
                            if (formData[fieldObj?.fieldName] instanceof Array) {
                                let type_str = Object.prototype.toString.call(formData[fieldObj?.fieldName][0]);
                                if (type_str.includes('Object]')) {
                                    formData[fieldObj?.fieldName].forEach(f => {
                                        if (f.value) {
                                            arr.push(f.value);
                                        }
                                    })
                                } else if (type_str.includes('String]')) {
                                    arr = [...formData[fieldObj?.fieldName]]
                                }
                            }
                            conditionInfo = {
                                ...conditionInfo,
                                // [extendIdsItm]: fieldObj ? [...formData[fieldObj?.fieldName]] : []
                                [extendIdsItm]: arr
                            }
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
            const getConditionConfigApi = this.props.tableType == 0 ? getConditionConfig : getConditionConfigTrino;
            const resConfig = await getConditionConfigApi({ fieldId: id });
            let optOptions_ = resConfig.data.fieldOperates ? resConfig.data.fieldOperates.map(operate => {
                return { label: operate, value: operate }
            }) : [];
            let valOptions_ = resConfig.data.fieldValues ? resConfig.data.fieldValues.map(select => {
                return { label: select.name, value: select.value }
            }) : [];
            this.setState({
                operates: optOptions_,
                selectInputVoList: valOptions_,
                selectInputVoListTree: resConfig.data.fieldValues ? [{
                    label: '全部',
                    value: '',
                    children: valOptions_,
                }] : [],
                spinLoading: false,
            }, () => {
                //默认选择第一个运算符和第一个枚举值
                let filterValues = this.formRef.current?.getFieldValue('filterValues');
                //console.log('handleConfig', filterValues, tempfilterValues)
                if (filterValues == undefined) return;
                let tempfilterValues = [...filterValues];
                if ((tempfilterValues[0].compareOperator ?? '') === '') {
                    this.formRef.current?.setFieldsValue({
                        filterValues: tempfilterValues.map(filterValueItem => {
                            return {
                                ...filterValueItem,
                                compareOperator: resConfig.data.fieldOperates && resConfig.data.fieldOperates.length ? resConfig.data.fieldOperates[0] : '',
                                comparator: ['Date', 'DateUnlimited'].includes(this.props.item.showDataType) ? null : (
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
    handleCustomConfig = async (id, action = '') => {
        if (id == undefined) return
        try {
            if (action == 'changeShowName' && this.props.classify == 'filters') {
                const formValues = this.formRef.current?.getFieldsValue();
                formValues.filterValues.forEach(valueItm => {
                    valueItm.comparator = []
                })
                this.formRef.current.setFieldsValue(formValues)
            }
            const resInfo = await getCustomRulesDetailInfo(id);
            const data = resInfo?.data || {};
            let selOptions_ = data.params ? data.params.map(select => {
                return { label: select.groupName, value: select.groupId }
            }) : [];
            this.setState({
                operates: [{ label: 'in', value: 'in' }, { label: 'not in', value: 'not in' }],
                selectInputVoList: selOptions_,
                selectInputVoListTree: [{
                    label: '全部',
                    value: '',
                    children: selOptions_,
                }],
                spinLoading: false,
            }, () => {
                //失效数据处理
                if (!this.props.item.name) return
                let tempFilterValues = [...this.props.item.filterValues];
                if (this.state.selectInputVoList.length) {
                    const arrId = this.state.selectInputVoList.map(itm => itm.value)
                    tempFilterValues.forEach((filterItm, filterIdx) => {
                        if (this.props.classify == 'dimensions') {
                            if (filterItm.label.split(')')[0] != '(已失效' && !arrId.includes(filterItm.value)) tempFilterValues[filterIdx].label = `(已失效)${filterItm.label}`;
                        } else {
                            filterItm.comparator.forEach((initIdItem, initIdIdx) => {
                                if (initIdItem.split(')')[0] != '(已失效' && !arrId.includes(initIdItem)) tempFilterValues[filterIdx].comparator[initIdIdx] = `(已失效)${optionFilterProp(this.props.item?.forShowList, 'value', initIdItem)?.label}`;
                            })
                        }
                    })
                }
                this.formRef.current?.setFieldsValue({
                    filterValues: tempFilterValues
                })
            })
        } catch (errorInfo) {
            console.log(400, errorInfo)
        }
    }

    //获取AddON的枚举值
    handleAddONConfig = async (arr) => {
        this.setState({
            spinLoading: true,
            addONSelectInputVoList: {},
            addONSelectInputVoListTree: {},
        })
        const getConditionConfigApi = this.props.tableType == 0 ? getConditionConfig : getConditionConfigTrino;
        let promiseAll = [], promiseAllIndex = [], promiseAllSelectInputVoList = [], addONSelectInputVoList = {}, addONSelectInputVoListTree = {};
        arr.forEach((arrItem, arrIndex) => {
            if (['Select', 'SelectMulti'].includes(arrItem.showDataType)) {
                promiseAll.push(getConditionConfigApi({ fieldId: arrItem.id }));
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
            addONSelectInputVoListTree[i] = [{
                label: '全部',
                value: '',
                children: promiseAllSelectInputVoList[j]
            }]
        })
        this.setState({
            addONSelectInputVoList,
            addONSelectInputVoListTree,
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
        const formData = this.formRef.current?.getFieldsValue(); //!!!
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
        this.setState({ spinLoading: true, operates: [], selectInputVoList: [] })
        let tempInitValue = initValue;
        try {
            const resInfo = await getSegmentList();
            let children = resInfo?.data || [];
            console.log('handleSegmentConfig', tempInitValue)
            if (tempInitValue.length >= 5) {
                const arrId = tempInitValue.map(itm => itm.value);
                children.forEach(it => {
                    it.disabled = false;
                    if (!arrId.includes(it.value)) {
                        it.disabled = true;
                    }
                })
            }
            this.setState({
                operates: [{ label: 'in', value: 'in' }, { label: 'not in', value: 'not in' }],
                selectInputVoList: children,
                selectInputVoListTree: [{
                    label: '全部',
                    value: '',
                    children
                }],
                spinLoading: false
            }, () => {
                if (classify == '') return;
                //人群包失效数据处理
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
                this.formRef.current?.setFieldsValue({
                    filterValues: tempInitValue
                })
            })
        } catch (errorInfo) {
            this.setState({ spinLoading: false })
        }
    }

    //tag的枚举值等相关配置
    handleTagConfig = async () => {
        this.setState({ spinLoading: true, selectInputVoList: [], selectInputVoListTree: [] })
        try {
            const resInfo = await getTagList();
            this.setState({
                selectInputVoList: resInfo?.data || [],
                selectInputVoListTree: [{
                    label: '全部',
                    value: '',
                    children: resInfo?.data || [],
                }],
                spinLoading: false
            })
        } catch (errorInfo) {
            this.setState({ spinLoading: false })
        }
    }

    //自定义维度的列表
    handleCustomDimensionList = async (key = '', id = null, classify) => {
        this.setState({ spinLoading: true, selectInputVoList: [] })
        console.log('handleCustomDimensionList', key, classify)
        try {
            const resInfo = await getCustomList({ modelId: this.props.currentModelId });
            let listKey = 'selectInputVoList';
            if ((key ?? '') == '') {
                if (classify == 'filters') {
                    listKey = 'customInputVoList';
                    const formValues = this.formRef.current?.getFieldsValue();
                    console.log('h', formValues)
                    if (formValues.showName?.value) this.handleCustomConfig(formValues.showName.value, 'changeShowName');
                }
                this.setState({
                    [listKey]: resInfo?.data ? resInfo.data.map(itm => {
                        return { label: itm.showName, value: itm.id }
                    }) : [],
                    spinLoading: false
                })
            } else {
                this.setState({
                    [key]: resInfo?.data ? resInfo.data.map(itm => {
                        return { label: itm.showName, value: itm.id }
                    }) : [],
                    selectInputVoList: [],
                    selectInputVoListTree: [],
                    spinLoading: false
                }, () => {
                    //失效数据处理
                    if (!this.props.item.name) return;
                    let showName = this.props.item.showName
                    const hasValid = this.state[key].findIndex(itt => itt.value == this.props.item.id)
                    if (hasValid == -1 && showName.split(')')[0] != '(已失效') {
                        showName = `(已失效)${showName}`;
                    }
                    if (hasValid != -1 && (id ?? '') != '') this.handleCustomConfig(id)
                    this.formRef.current?.setFieldsValue({ showName: { label: showName, value: this.props.item.id } })
                })
            }
        } catch (errorInfo) {
            message.error(errorInfo?.msg)
            this.setState({ spinLoading: false })
        }
    }

    //用户标签列表
    handleUserTagList = async () => {
        this.setState({ spinLoading: true, userTagInputVoList: [], userTagVersionList: [], userTagEnumListTree: [] })
        try {
            const resInfo = await getUserTagList();
            this.setState({
                userTagInputVoList: resInfo?.data ? resInfo.data.map(itm => {
                    return { ...itm, label: itm.tagName, value: itm.tagId }
                }) : [],
                spinLoading: false
            }, () => {
                //失效数据处理
                if (!this.props.item.name) return;
                let showName = this.props.item.showName;
                const hasValid = this.state.userTagInputVoList.findIndex(itt => itt.tagId == this.props.item.userTag.tagId)
                if (hasValid == -1 && showName.split(')')[0] != '(已失效') {
                    showName = `(已失效)${showName}`;
                }
                console.log(24323, hasValid, this.props.item, this.state.userTagInputVoList)
                if (hasValid != -1) this.handleUserTagVersion(this.props.item.userTag)
            })
        } catch (errorInfo) {
            message.error(errorInfo?.msg || '获取用户标签列表失败')
            this.setState({ spinLoading: false })
        }
    }

    //获取用户标签的版本
    handleUserTagVersion = async (option, action = '') => {
        if (!Object.keys(option).length) return
        this.setState({ spinLoading: true, userTagVersionList: [], userTagEnumListTree: [] })
        let keyName = this.props.classify == 'filters' ? 'filterValues' : 'usertagValues';
        const formValues = this.formRef.current?.getFieldsValue();
        try {
            if (action == 'changeShowName') { //&& this.props.classify == 'filters'
                formValues[keyName].forEach(valueItm => {
                    valueItm.comparator = [];
                    valueItm.version = null;
                })
                formValues.showName = { ...option, value: option.tagId, label: option.tagName };
                this.formRef.current.setFieldsValue(formValues)
            }
            const resInfo = await getUserTagVersionList({ tagCode: option.tagCode });
            const data = resInfo?.data || [];
            this.setState({
                operates: [{ label: 'in', value: 'in' }, { label: 'not in', value: 'not in' }],
                userTagVersionList: data,
                spinLoading: false,
            }, () => {
                //失效数据处理
                if (!this.props.item.name) return
                let tempFilterValues = formValues[keyName];
                if (this.state.userTagVersionList.length) {
                    const arrId = this.state.userTagVersionList.map(itm => itm.value)
                    tempFilterValues.forEach((filterItm, filterIdx) => {
                        if ((filterItm.version ?? '') == '') return
                        if (filterItm.version.split(')')[0] != '(已失效' && !arrId.includes(filterItm.version)) filterItm.version = `(已失效)${filterItm.version}`;
                        this.handleUserTagConfig(filterItm.version, filterIdx)
                    })
                }
                this.formRef.current?.setFieldsValue({
                    [keyName]: tempFilterValues
                })
            })
        } catch (errorInfo) {
            message.error(errorInfo?.msg || '获取用户标签版本列表失败')
            this.setState({ spinLoading: false })
        }
    }

    //获取用户标签的枚举值
    handleUserTagConfig = async (version, index, action = '') => {
        if (version == undefined) return;
        this.setState({ spinLoading: true })
        let keyName = this.props.classify == 'filters' ? 'filterValues' : 'usertagValues';
        try {
            let formValues = this.formRef.current?.getFieldsValue();
            if (action == 'change') {
                formValues[keyName][index].comparator = [];
                this.formRef.current.setFieldsValue(formValues)
            }
            const resInfo = await getUserTagEnumList({ tagCode: formValues.showName.tagCode, version });
            let userTagEnumListTemp = [...this.state.userTagEnumListTree];
            userTagEnumListTemp[index] = [{
                label: '全部',
                value: '',
                children: resInfo?.data || []
            }];
            this.setState({
                userTagEnumListTree: userTagEnumListTemp,
                spinLoading: false
            }, () => {
                //失效数据处理
                //return
                if (!this.props.item.name) return
                let tempFilterValues = formValues[keyName];
                if (this.state.userTagEnumListTree[index][0]?.children?.length) {
                    const arrId = this.state.userTagEnumListTree[index][0].children.map(itm => itm.value)
                    if (!tempFilterValues[index].comparator.length) return;
                    tempFilterValues[index].comparator.forEach((initIdItem, initIdIdx) => {
                        if (initIdItem.split(')')[0] != '(已失效' && !arrId.includes(initIdItem)) initIdItem[initIdIdx] = `(已失效)${optionFilterProp(this.props.item?.forShowList, 'value', initIdItem)?.label}`;
                    })
                }
                this.formRef.current?.setFieldsValue({
                    [keyName]: tempFilterValues
                })
            })
        } catch (errorInfo) {
            message.error(errorInfo?.msg || '获取用户标签的枚举值失败')
            this.setState({ spinLoading: false })
        }
    }

    onTreeSelect = (value, extra, index = 0) => {
        if (this.props.item.isSegment) {
            let comparatorArr, formValues = this.formRef.current?.getFieldsValue(), { selectInputVoListTree } = this.state;
            if (this.props.classify == 'dimensions') {
                if (value.length == selectInputVoListTree[0].children.length) {
                    message.warning('最多可选择5个人群包');
                    this.formRef.current?.setFieldsValue({ segmentList: [] })
                    return;
                }
                comparatorArr = formValues.segmentList;
                //【维度】中的，人群包 最多拖拽5个
                if (comparatorArr.length >= 5) {
                    message.warning('最多可选择5个人群包');
                }
                const arrId = comparatorArr.map(itm => itm.value);
                selectInputVoListTree[0].children.forEach(it => {
                    it.disabled = false;
                    if (!arrId.includes(it.value) && extra.checked && comparatorArr.length >= 5) {
                        it.disabled = true;
                    }
                })
            }
        }
    }

    //去人群包页面
    linkToSegmentTagForm = (pathname, tabNameZh) => {
        this.props.changeVisible(false);
        this.props.saveTabActive();
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
        let { classify } = this.props;
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
                                return <Row gutter={6} key={field.key}>
                                    <Col flex="76px">
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
                                    {item.isUserTag && item.isUserTag == 1 ? <Col flex="124px">
                                        <Form.Item
                                            {...field}
                                            name={[field.name, 'version']}
                                            fieldKey={[field.fieldKey, 'version']}
                                            rules={[
                                                {
                                                    validator: (rule, value, callback) => {
                                                        if (!value) {
                                                            callback('请选择')
                                                        } else if (value.split(')')[0] == '(已失效') {
                                                            callback('请去除已失效的标签版本号')
                                                        } else {
                                                            callback()
                                                        }
                                                    }
                                                }
                                            ]}>
                                            <Select
                                                placeholder="请选择"
                                                options={this.state.userTagVersionList}
                                                onChange={(value) => this.handleUserTagConfig(value, index, 'change')}></Select>
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
                                                        if (getFieldValue(item.key)[index]?.compareOperator && getFieldValue(item.key)[index]?.compareOperator.toLowerCase() == 'between') {
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
                                                                {getFieldValue(item.key)[index]?.timeType && getFieldValue(item.key)[index]?.timeType.toLowerCase() == 'absolute' ? <Col flex="1">
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
                                                                                lineHeight: '40px',
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
                                                                {getFieldValue(item.key)[index]?.timeType && getFieldValue(item.key)[index]?.timeType.toLowerCase() == 'absolute' ? <Col flex="1">
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
                                                        //人群包、自定义维度、用户标签
                                                        if (that.props.item.isSegment == 1 || that.props.item.isCustomDimension == 1 || that.props.item.isUserTag == 1) {
                                                            rules.push({
                                                                validator: (rule, value, callback) => {
                                                                    let isJudge = value.some(valueItm => valueItm.split(')')[0] == '(已失效')
                                                                    let name = that.props.item.isSegment == 1 ? '人群包' : (that.props.item.isCustomDimension == 1 ? '自定义维度' : '标签枚举值')
                                                                    if (isJudge) {
                                                                        callback(`请去除已失效的${name}`)
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
                                                            {/* <Select
                                                                mode="multiple"
                                                                allowClear
                                                                options={item?.flag && item.flag == 'Addon' ? this.state.addONSelectInputVoList[index] : (item.isUserTag && item.isUserTag == 1 ? this.state.userTagEnumList[index] : this.state.selectInputVoList)}
                                                                maxTagTextLength={8}
                                                                filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}>
                                                            </Select> */}
                                                            <TreeSelect
                                                                showSearch
                                                                treeCheckable
                                                                treeNodeFilterProp='label'
                                                                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                                                                style={{ width: '100%' }}
                                                                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                                                // treeData={this.state.userTagEnumListTree}
                                                                treeData={item?.flag && item.flag == 'Addon' ? this.state.addONSelectInputVoListTree[index] : (item.isUserTag && item.isUserTag == 1 ? this.state.userTagEnumListTree[index] : this.state.selectInputVoListTree)}
                                                                placeholder="请选择"
                                                                allowClear
                                                                treeDefaultExpandAll
                                                                onInputKeyDown={(e) => this.onPressEnter(e, index, classify, item?.flag && item.flag == 'Addon' ? this.state.addONSelectInputVoListTree[index] : (item.isUserTag && item.isUserTag == 1 ? this.state.userTagEnumListTree[index] : this.state.selectInputVoListTree))}
                                                                onSearch={(val) => this.onPressEnterSearch(val, index)}
                                                            />
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
                                                        formItemElement = <Row gutter={6}>
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
                                            <IconAddA className="common-icon-style" onClick={() =>
                                                //<Button icon={<IconAddA />} onClick={() =>
                                                add({
                                                    'logicalOperator': 'AND',
                                                    'compareOperator': this.state.operates.length ? this.state.operates[0].label : '',
                                                    'comparator': ['Date', 'DateUnlimited'].includes(that.props.item.showDataType) ? (this.state.selectInputVoList.length ? this.state.selectInputVoList[0].label : null) : [],
                                                    'timeType': ['Date', 'DateUnlimited'].includes(that.props.item.showDataType) ? 'absolute' : ''
                                                })
                                            } /> : ''}
                                    </Col>}
                                    {item?.flag && item.flag == 'Addon' ? null : <Col flex="40px">
                                        {fields.length == 1 ? '' : <IconClearUp className="common-icon-style" onClick={() => { remove(index) }} />}
                                    </Col>}
                                </Row>
                            })}
                        </>
                    )}
                </Form.List>)
                break;
            case 'selectCascade':
                if (item?.mode == 'multiple') {
                    let treeData_cas = [{
                        label: '全部',
                        value: '',
                        children: item.options
                    }]
                    itemElement = <TreeSelect
                        showSearch
                        treeCheckable
                        treeNodeFilterProp='label'
                        showCheckedStrategy={TreeSelect.SHOW_CHILD}
                        style={{ width: '100%' }}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        notFoundContent={this.state.loading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                        treeData={treeData_cas}
                        labelInValue
                        placeholder="请选择"
                        allowClear
                        treeDefaultExpandAll
                        onInputKeyDown={(e) => this.onPressEnter_special(e, 0, item.key, treeData_cas)}
                        onSearch={(val) => this.onPressEnterSearch_special(val)}
                        onChange={(valList) => item?.onChange(valList)}
                    />
                } else {
                    itemElement = <Select
                        mode={item?.mode}
                        loading={item?.loading}
                        options={item.options}
                        notFoundContent={item.loading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                        onChange={(value) => item?.onChange(value)}>
                    </Select>
                }
                break;
            case 'segment':
                if (item?.mode == 'multiple') {
                    itemElement = <TreeSelect
                        showSearch
                        treeCheckable
                        treeNodeFilterProp='label'
                        showCheckedStrategy={TreeSelect.SHOW_CHILD}
                        style={{ width: '100%' }}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        notFoundContent={this.state.spinLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                        treeData={this.state.selectInputVoListTree}
                        labelInValue
                        placeholder="请选择"
                        allowClear
                        treeDefaultExpandAll
                        onInputKeyDown={(e) => this.onPressEnter_special(e, 0, item.key, this.state.selectInputVoListTree)}
                        onSearch={(val) => this.onPressEnterSearch_special(val)}
                        onChange={(val, label, extra) => this.onTreeSelect(val, extra)}
                    />
                    // filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
                } else {
                    itemElement = <Select
                        mode={item?.mode || '-'}
                        loading={this.state.spinLoading}
                        notFoundContent={this.state.spinLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                        labelInValue
                        options={this.state.selectInputVoList}
                        allowClear
                        showSearch={item?.showSearch || false}
                        filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}></Select>
                }
                break;
            case 'custom':
                if (item?.mode == 'multiple') {
                    itemElement = <TreeSelect
                        showSearch
                        treeCheckable
                        treeNodeFilterProp='label'
                        showCheckedStrategy={TreeSelect.SHOW_CHILD}
                        style={{ width: '100%' }}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        notFoundContent={this.state.spinLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                        treeData={this.state.customInputVoListTree}
                        labelInValue
                        placeholder="请选择"
                        allowClear
                        treeDefaultExpandAll
                        onInputKeyDown={(e) => this.onPressEnter_special(e, 0, item.key, this.state.customInputVoListTree)}
                        onSearch={(val) => this.onPressEnterSearch_special(val)}
                    />
                } else {
                    itemElement = <Select
                        mode={item?.mode || '-'}
                        loading={this.state.spinLoading}
                        notFoundContent={this.state.spinLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                        labelInValue
                        options={this.state.customInputVoList}
                        allowClear
                        showSearch={item?.showSearch || false}
                        filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
                        onChange={(value) => this.handleCustomConfig(value?.value, 'changeShowName')}>
                    </Select>
                }
                break;
            case 'usertag':
                if (item?.mode == 'multiple') {

                } else {
                    itemElement = <Select
                        mode={item?.mode || '-'}
                        placeholder="请选择"
                        loading={this.state.spinLoading}
                        notFoundContent={this.state.spinLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                        labelInValue
                        options={this.state.userTagInputVoList}
                        allowClear
                        showSearch={item?.showSearch || false}
                        filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}
                        onChange={(value, option) => this.handleUserTagVersion(option, 'changeShowName')}>
                    </Select>
                }

                break;
            case 'usertagDimensions':
                itemElement = <Form.List name={item.key}>
                    {(fields) => (<>
                        {fields.map((field, index) => {
                            return <Row gutter={6} key={index}>
                                <Col flex="124px">
                                    <Form.Item
                                        {...field}
                                        name={[field.name, 'version']}
                                        fieldKey={[field.fieldKey, 'version']}
                                        rules={[{ required: true, message: '请选择' }]}>
                                        <Select
                                            placeholder="请选择"
                                            options={this.state.userTagVersionList}
                                            onChange={(value) => this.handleUserTagConfig(value, index, 'change')}></Select>
                                    </Form.Item>
                                </Col>
                                <Col flex="1">
                                    <Form.Item
                                        {...field}
                                        name={[field.name, 'comparator']}
                                        fieldKey={[field.fieldKey, 'comparator']}
                                        rules={[{ required: true, message: '请选择' }]}>
                                        {/* <Select
                                            mode="multiple"
                                            allowClear
                                            options={this.state.userTagEnumListTree[0]?.children || []}
                                            maxTagTextLength={8}
                                            filterOption={(input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}>
                                        </Select> */}
                                        <TreeSelect
                                            showSearch
                                            treeCheckable
                                            treeNodeFilterProp='label'
                                            showCheckedStrategy={TreeSelect.SHOW_CHILD}
                                            style={{ width: '100%' }}
                                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                            notFoundContent={this.state.spinLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
                                            treeData={this.state.userTagEnumListTree[0]}
                                            placeholder="请选择"
                                            allowClear
                                            treeDefaultExpandAll
                                            onInputKeyDown={(e) => this.onPressEnter_special(e, 0, item.key, this.state.customInputVoListTree)}
                                            onSearch={(val) => this.onPressEnterSearch_special(val)}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        })}
                    </>)}
                </Form.List>
                break;
            default:
                itemElement = <Input disabled={item.disabled} />
        }
        return itemElement;
    }

    filterTreeNodeOptions = (inputVal, node) => {
        // (input, option) => (option?.label.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)
        let list = node.children.filter(it => it.label.toLowerCase().includes(inputVal.trim().toLowerCase()));
        console.log('list = ', list);
        if (list.length > 0) {
            // return node?.children.toLowerCase().includes(inputVal.trim().toLowerCase());
            return true;
        } else {
            return false;
        }
    }

    onPressEnter_special = (e, index, field_key, list) => {
        if (e.keyCode === 13) {
            console.log('onPressEnter_special', list[index])
            let filterList = list[index].children.filter(dim => {
                return dim.label.trim().toUpperCase().includes(this.state.treeSearchValue.trim().toUpperCase());
            })
            console.log('filterList = ', filterList);
            if (filterList.length > 0 && this.state.treeSearchValue) {
                console.log('要给对应的form提供')
                let filter_members = [];

                console.log('要给对应的form提供')
                let formRef = this.formRef.current;
                let formData = formRef.getFieldsValue();
                console.log('formData = ', formData);
                filter_members = _.uniqWith([...formData[field_key], ...filterList], _.isEqual);
                if (field_key == 'segmentList' && filter_members.length > 5) { // 人群包，限制5个上限
                    filter_members.splice(5);
                }
                formData[field_key] = filter_members;
                formRef.setFieldsValue(formData);
            }
        }
    }

    onPressEnterSearch_special = (val) => {
        this.setState({
            treeSearchValue: val
        })
    }

    onPressEnter = (e, index, classify, list) => {
        console.log('你按键了！ = ', e);
        // treeData={item?.flag && item.flag == 'Addon' ? this.state.addONSelectInputVoListTree[index] : (item.isUserTag && item.isUserTag == 1 ? this.state.userTagEnumListTree[index] : this.state.selectInputVoListTree)}
        if (e.keyCode === 13) {
            console.log('这个键是回车键！ = ');
            let filterList = list[index].children.filter(dim => {
                return dim.label.trim().toUpperCase().includes(this.state.treeSearchValue.trim().toUpperCase());
            })
            console.log('filterList = ', filterList);
            if (filterList.length > 0 && this.state.treeSearchValue) {
                let filter_members = [];
                filterList.forEach(ele => {
                    filter_members.push(ele.value);
                })
                console.log('要给对应的form提供')
                let formRef = this.formRef.current;
                let formData = formRef.getFieldsValue();
                if (classify === 'indexes') {
                    filter_members = _.uniq([...formData.conditions[index].comparator, ...filter_members]);
                    formData.conditions[index].comparator = filter_members;
                } else {
                    filter_members = _.uniq([...formData.filterValues[index].comparator, ...filter_members]);
                    formData.filterValues[index].comparator = filter_members;
                }
                console.log('formRef = ', formRef);
                formRef.setFieldsValue(formData);
            }
        }
    }

    onPressEnterSearch = (val, index) => {
        this.setState({
            treeSearchValue: val
        })
    }

    render () {
        const { visible, item, classify } = this.props
        return <Modal
            className={["oap-conditionModal", this.state.footerModal.length > 1 ? 'oap-conditionModal-multi' : ''].join(' ')}
            width={880}
            title={this.state.modalTitle}
            visible={visible}
            onCancel={() => this.cancelModal('cancel')}
            footer={this.state.footerModal}
            bodyStyle={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px 20px 0' }}>
            <Spin spinning={this.state.spinLoading}>
                {this.state.isShowModalTips ? <div style={{ paddingLeft: '20px', height: '38px', lineHeight: '38px', fontWeight: 'bold' }}>{this.state.modalTips}</div> : ''}
                <div className="common-edit">
                    <Form
                        labelCol={item?.isCascade ? { span: 2 } : ((item.isSegment == 1 || item.isTag == 1 || item.isCustomDimension == 1) && ['dimensions'].includes(classify) ? { span: 12 } : { flex: '72px' })}
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