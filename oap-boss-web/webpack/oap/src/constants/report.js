// 报告审批状态 0.审批中 1.已发布 2.已驳回 3.已撤回
export const REPORT_APPLY_STATUS_LIST = [
  { value: 'all', label: '全部' },
  { value: 0, label: '审批中' },
  { value: 1, label: '已发布' },
  { value: 2, label: '已驳回' },
  { value: 3, label: '已撤回' },
  { value: 4, label: '已发布(编辑审批中)' },
  { value: 5, label: '已发布(编辑已退回)' },
  { value: 6, label: '已发布(编辑已撤回)' },
  { value: 9, label: '—' },
  { value: 10, label: '创建失败' },
];

export const BUILDER_TOOL_LIST = [
  { value: 'all', label: '全部' },
  { label: 'Guandata', value: 'Guandata' },
  { label: 'Biee', value: 'Biee' },
  { label: 'Tableau', value: 'Tableau' },
  { label: 'Xbuilder', value: 'Xbuilder' }
]

export const REPORT_UPDATE_TYPE = [
  { label: "全部", value: 'all' },
  { label: "实时", value: "0" },
  { label: "Daily", value: "1" },
  { label: "Weekly", value: "2" },
  { label: "Monthly", value: "3" }
]

export const SCOPE_LIST = [
  { value: '全部', key: 'all' },
  { value: 'MCD Boss', key: 1 },
  { value: 'RGM Boss', key: 2 }
]

export const REPORT_AREA = [
  { label: "全部", value: "all" },
  { label: "MDS", value: "1" },
  { label: "BSC", value: "2" },
  { label: "CTC", value: "3" },
  { label: "OPS", value: "4" }
]

export const EVERY_TIME = [
  [
    {
      label: "每时",
      value: "1",
    },
    {
      label: "每分",
      value: "2",
    }
  ],
  [
    {
      label: "每日",
      value: "1",
    },
    {
      label: "Manual",
      value: "4",
    }
  ],
  [
    {
      label: "每周",
      value: "2",
    }
  ],
  [
    {
      label: "每月",
      value: "3",
    }
  ]
];