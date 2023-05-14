const constants: any = {
  merchant: {
    merchantType: {
      SERIVICE: {
        value: 1,
        label: "麦中服务商",
      },
      SIMILAR: {
        value: 2,
        label: "同业销售",
      },
      DIFFERNET: {
        value: 3,
        label: "异业合作",
      },
    },
    status: {
      PENDING: {
        value: 1,
        label: "提交待审核",
        color: "gray",
      },
      PASSED: {
        value: 2,
        label: "审核通过",
        color: "success",
      },
      FAILED: {
        value: 3,
        label: "审核拒绝",
        color: "error",
      },
    },
    isAvaliable: {
      YES: {
        value: 1,
        label: "开启",
        color: "success",
      },
      NO: {
        value: 0,
        label: "关闭",
        color: "error",
      },
    },
  },
  app: {
    isAvaliable: {
      YES: {
        value: 1,
        label: "开启",
        color: "success",
      },
      NO: {
        value: 0,
        label: "关闭",
        color: "error",
      },
    },
    status: {
      PENDING: {
        value: 1,
        label: "待审核",
        color: "processing",
      },
      PASSED: {
        value: 2,
        label: "已审核",
        color: "success",
      },
      REJECTED: {
        value: 3,
        label: "驳回",
        color: "error",
      },
    },
  },
  api: {
    isAvaliable: {
      YES: {
        value: 1,
        label: "开启",
        color: "success",
      },
      NO: {
        value: 0,
        label: "关闭",
        color: "error",
      },
    },
    isPublish: {
      YES: {
        value: 1,
        label: "已发布",
        color: "success",
      },
      NO: {
        value: -1,
        label: "未发布",
        color: "error",
      },
      UNKNOWN: {
        value: 0,
        label: "未设置",
        color: "gray",
      },
    },
    status: {
      PENDING: { value: 0, label: "待提交" },
      IN_PROGRESS: { value: 1, label: "已提交" },
      APPROVED: { value: 2, label: "已审核" },
      REJECTED: { value: 3, label: "已驳回" },
    },
    requestMethod: {
      POST: { value: "POST", label: "POST" },
      GET: { value: "GET", label: "GET" },
      PUT: { value: "PUT", label: "PUT" },
      PATCH: { value: "PATCH", label: "PATCH" },
      DELETE: { value: "DELETE", label: "DELETE" },
      OPTIONS: { value: "OPTIONS", label: "OPTIONS" },
      TRACE: { value: "TRACE", label: "TRACE" },
    },
  },
};
export default constants;
