export const SHEET_FREQUENCY_LIST = [
    { value: 'all', label: '全部' },
    { value: 1, label: 'Yearly' },
    { value: 2, label: 'Monthly' },
    { value: 3, label: 'Daily' },
    { value: 4, label: '实时' },
    { value: 5, label: 'Manual' }
];

export const SHEET_TYPE_LIST = [
    { value: 'all', label: '全部' },
    { value: 1, label: '事实表' },
    { value: 2, label: '维度表' }
];

//权限状态
export const AUTH_STATUS_LIST = [
    { value: 'all', label: '全部' },
    { value: 0, label: '无权限' },
    { value: 1, label: '有权限' },
    { value: 2, label: '同步失败' }
];

//审批状态
export const APPLY_STATUS_LIST = [
    { value: 'all', label: '全部' },
    { value: 0, label: '审批中' },
    { value: 1, label: '已通过' },
    { value: 2, label: '已退回' },
    { value: 3, label: '已撤回' },
    { value: 9, label: '—' },
    { value: 10, label: '创建失败' },
];


//审批状态
export const APPLY_STATUS = {
    applying: 0, //审批中
    passed: 1, //已通过
    back: 2, //已退回
    withdrawn: 3, //已撤回
    stateless: 9, //未创建
    failed: 10 //创建失败
}

//权限状态
export const AUTH_STATUS = {
    noPermission: 0, //无权限
    havePermission: 1, //有权限
    syncFailed: 2, //同步失败
}

//申请类型
export const APPLY_TYPE_List = [
    { value: 'all', label: '全部', key: 'all' },
    { value: 1, label: '数据目录', key: 'data' },
    { value: 2, label: '分析场景', key: 'analysis' },
    { value: '3_1', label: '注册报告', key: 'reportBoard' },
    { value: '3', label: '在线报告', key: 'businessTime' },
    { value: 7, label: '数仓目录', key: 'database' },
    { value: 8, label: '需求提交', key: 'demandCommit' },
]

export const APPLY_TYPE = {
    data: '1',
    analysis: '2',
    report: '3',
    register: '3_1',
    database: '7',
    demandCode: '8',
}

//申请人类型
export const APPLICANT_TYPE_LIST = [
    { value: 'all', label: '全部' },
    { value: 1, label: '本人申请' },
    { value: 2, label: '为供应商申请' },
]

export const APPLICANT_TYPE = {
    self: 1, //本人
    others: 2, //他人
    system: 3 //系统
}

export const APPLYINFO_TYPE = {
    data: '1',
    selfhelp: '2_1',
    sql: '2_2'
}

export const GUILDE_TYPE_LIST = [
    { label: '全部', value: 'all' },
    { label: '自助取数', value: '2_1' },
    { label: 'SQL模板', value: '2_2' }
]

export const READ_WRITE_PERMISSION = [
    { label: '只读', value: 'select' },
    { label: '读写', value: 'all' }
];

export const APPLY_MAINDATA = {
    data: [
        { fieldName: 'employNumber', fieldValue: 'applyEmployeeNumber' },
        { fieldName: 'applyId', fieldValue: 'id' },
        { fieldName: 'authAdid', fieldValue: 'authAccounts', needTransform: true, labelKey: 'adid' },
        { fieldName: 'bussinessCategory', fieldValue: 'businessCategoryId' },
        { fieldName: 'bussinessCategoryName', fieldValue: 'businessCategoryName' },
        { fieldName: 'tableName', fieldValue: 'applyInfo', needTransform: true, labelKey: 'children' }
    ],
    analysis: [
        { fieldName: 'employNumber', fieldValue: 'applyEmployeeNumber' },
        { fieldName: 'applyId', fieldValue: 'id' },
        { fieldName: 'authAdid', fieldValue: 'authAccounts', needTransform: true, labelKey: 'adid' },
        { fieldName: 'bussinessCategory', fieldValue: 'businessCategoryId' },
        { fieldName: 'bussinessCategoryName', fieldValue: 'businessCategoryName' },
        { fieldName: 'analysisName', fieldValue: 'applyInfo', needTransform: true, labelKey: 'children' }
    ],
    report: [
        { fieldName: 'employNumber', fieldValue: 'employNumber' },
        { fieldName: 'applyId', fieldValue: 'id' },
        { fieldName: 'reportType', fieldValue: 'reportType', },//申请报告类型（在线报告）没有字段
        { fieldName: 'module', fieldValue: 'reportRangeModule.module' },
        { fieldName: 'reportRangeName', fieldValue: 'reportRangeName' },
        { fieldName: 'businessCategoryId', fieldValue: 'businessCategoryId', },
        { fieldName: 'businessCategoryName', fieldValue: 'businessCategoryName', },
        { fieldName: 'reportId', fieldValue: 'id', },
        { fieldName: 'reportName', fieldValue: 'reportName', },
    ],
    database: [
        { fieldName: 'employNumber', fieldValue: 'applyEmployeeNumber' },
        { fieldName: 'applyId', fieldValue: 'id' },
        { fieldName: 'authAdid', fieldValue: 'authAccounts', needTransform: true, labelKey: 'adid' },
        { fieldName: 'applyTarget', fieldValue: 'type', needFilterProp: true, labelKey: 'value', list: [{ label: '数据库', value: 'DATABASE' }, { label: '数据表', value: 'TABLE' }] },
        { fieldName: 'applyType', fieldValue: 'operation', needFilterProp: true, labelKey: 'value', list: READ_WRITE_PERMISSION },
        { fieldName: 'dataBaseName', fieldValue: 'databases', needTransform: true, labelKey: 'name' },
        { fieldName: 'tableName', fieldValue: 'tables', needTransform: true, labelKey: 'name' },
    ],
    demandCode: [
        { fieldName: 'employNumber', fieldValue: 'applyEmployeeNumber' }, // 申请人员工编号
        { fieldName: 'applyId', fieldValue: 'id' }, // 单据编码
        { fieldName: 'preAuditor', fieldValue: '' }, // 初审账户
        { fieldName: 'transferAuditor', fieldValue: '' }, // 转办账户
        { fieldName: 'requestName', fieldValue: '' }, // 需求名称
        { fieldName: 'businessFunction', fieldValue: '' }, // BU
        { fieldName: 'requestValue', fieldValue: '' }, // 需求价值
        { fieldName: 'requestContent', fieldValue: '' }, // 需求内容
        { fieldName: 'jiraLink', fieldValue: '' }, // Jira链接
    ]
}

export const SORT = {
    ascend: 'asc',
    descend: 'desc'
}

//发布状态
export const PUBLISH_STATUS_LIST = [
    { value: 'all', label: '全部' },
    { value: '1', label: '已发布' },
    { value: '2', label: '未发布' }
]

//上线状态
export const ONLINE_STATUS_LIST = [
    { value: 'all', label: '全部' },
    { value: '1', label: '上线' },
    { value: '2', label: '下线' }
]

//共享类型
export const TEMPLATE_LIST = [
    { value: 'all', label: '全部' },
    { value: '1', label: '本人创建' },
    { value: '2', label: '与我共享' }
]

export const PERIOD_TYPE_LIST = [
    { label: '每日', value: 'daily' },
    { label: '每周', value: 'weekly' },
    { label: '每两周', value: 'biWeekly' },
    { label: '每月', value: 'monthly' }
];

export const PERIOD_WEEK_LIST = [
    { label: '星期一', value: 'MON' },
    { label: '星期二', value: 'TUE' },
    { label: '星期三', value: 'WED' },
    { label: '星期四', value: 'THU' },
    { label: '星期五', value: 'FRI' },
    { label: '星期六', value: 'SAT' },
    { label: '星期日', value: 'SUN' }
];

export const PERIOD_MONTH_LIST = (function () {
    let result = [];
    for (let i = 1; i < 32; i++) {
        let label = i + '号';
        if (i < 10) {
            label = '0' + label;
        }
        result.push({ label: label, value: i });
    }
    return result;
})();

export const PERIOD_DATE_LIST = (function () {
    let result = [];
    for (let i = 0; i < 24; i++) {
        let label = i + ':00';
        let label2 = i + ':30';
        if (i < 10) {
            label = '0' + label;
            label2 = '0' + label2;
        }
        result.push({ label: label, value: label });
        result.push({ label: label2, value: label2 });

    }
    return result;
})();

export const TASK_TYPE_LIST = [
    { label: 'SQL查询', value: 1 },
    { label: '自助取数', value: 2 },
    { label: '自助取数', value: 3 }
]

export const RUNNING_STATUS_LIST = [
    { label: '正常', value: 1 },
    { label: '已失效', value: 2 }
]

export const SCHEDULE_STATUS_LIST = [
    { label: 'Failed', value: 2 },
    { label: 'Finish', value: 1 },
    { label: 'Processing', value: 3 },
    { label: '—', value: 4 }
]

export const SQL_LIMITS_LIST = [
    { label: 100, value: 100 },
    { label: 1000, value: 1000 },
    { label: 10000, value: 10000 },
    { label: 100000, value: 100000 }
]

export const TIME_SELECT_TYPE_LIST = [
    {
        value: 'absolute',
        label: '绝对时间'
    },
    {
        value: 'relative',
        label: '相对时间'
    }
];

export const RELATIVE_TIME_TYPE_LIST = [
    {
        value: -1,
        label: '过去'
    },
    {
        value: 1,
        label: '将来'
    }
];

export const RELATIVE_TIME_UNIT_LIST = [
    {
        value: 'day',
        label: '天'
    },
    {
        value: 'week',
        label: '周'
    },
    {
        value: 'month',
        label: '月'
    },
    {
        value: 'year',
        label: '年'
    }
];

export const UPDATE_TYPE_LIST = [
    { value: '1', label: '增量更新' },
    { value: '2', label: '全量更新' }
];

export const TABLE_TYPE_LIST = [
    { value: '1', label: '新建表' },
    { value: '2', label: '更新表' }
]

export const UPLOAD_TABLE_TYPE = {
    create: '1',
    update: '2'
}

export const UPLOAD_TYPE_LIST = [
    { label: '数据表', value: '1' },
    { label: '页面嵌入', value: '2' }
];

export const REPORT_UPLOAD_TYPE = {
    dataSheet: '1',
    pageEmbedding: '2'
}

export const FIELD_INPUT_TYPE = [
    { label: '下拉单选', value: '2' },
    { label: '下拉多选', value: '1' },
    { label: '文本', value: '3' }
]

export const FIELD_NAMES_DEFAULT = {
    title: 'name',
    key: 'id',
    children: 'children'
}

export const TABLE_TYPE = {
    ck: 0,
    kylin: 1,
    trino: 2
}

export const OAP_VERSION = 'oapv=1.0.48';