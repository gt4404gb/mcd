const constants: any = {
  btb: {
    merchant: {
      availableFlag: {
        DISABLED: {
          value: 0,
          label: '关闭',
          color: 'error',
        },
        ENABLED: {
          value: 1,
          label: '启用',
          color: 'success',
        },
      },
      contactType: {
        AGENT: {
          value: 1,
          label: '客户代表',
          color: 'success',
        },
        MANAGER: {
          value: 2,
          label: '客户经理',
          color: 'success',
        },
        FINANCE_PAYER: {
          value: 3,
          label: '财务(支付)',
          color: 'success',
        },
        FINANCE_AUDITER: {
          value: 4,
          label: '财务(对账)',
          color: 'success',
        },
      },
      type: {
        DISTRIBUTOR: {
          value: 0,
          label: '分销商',
        },
        SUPPLIER: {
          value: 1,
          label: '供应商',
        },
        SERVICE_PROVIDER: {
          value: 2,
          label: '服务商',
        },
      },
    },
    merchantAudit: {
      cooperationType: {
        GROUP_MEAL: {
          value: 1,
          label: '团餐',
        },
        CROP_MEAL: {
          value: 2,
          label: '企业点餐',
        },
        COUPON: {
          value: 3,
          label: '卡券',
        },
        API_BUDDY: {
          value: 4,
          label: 'API对接',
        },
      },
      refuseType: {
        OTHER: {
          value: 0,
          label: '其他',
        },
        REFUSED: {
          value: 1,
          label: '暂不合作',
        },
        INVALID: {
          value: 2,
          label: '无效申请',
        },
      },
      approvalStatus: {
        PENDING: {
          value: 0,
          label: '未审核',
          color: 'default',
        },
        PASSED: {
          value: 1,
          label: '通过',
          color: 'success',
        },
        REJECTED: {
          value: 2,
          label: '驳回',
          color: 'error',
        },
      },
    },
    order: {
      status: {
        NOT_PAID: {
          value: 1,
          label: '待支付',
          color: 'processing',
        },
        PAID: {
          value: 2,
          label: '支付成功',
          color: 'Aquamarine',
        },
        IN_AUDIT: {
          value: 4,
          label: '支付待审核',
          color: 'purple',
        },
        PRICE_AMEND: {
          value: 5,
          label: '改价待审核',
          color: 'blue',
        },
        TO_GRAND: {
          value: 11,
          label: '发放中',
          color: 'DodgerBlue',
        },
        COMPLETED: {
          value: 30,
          label: '已完成',
          color: 'success',
        },
        EXPIRE_CLOSED: {
          value: 31,
          label: '超时关闭',
          color: 'LightSkyBlue',
        },
        CANCELED: {
          value: 32,
          label: '已取消',
          color: 'error',
        },
        TO_BE_REFUND: {
          value: 40,
          label: '待退款',
          color: 'pink',
        },
        ALL_REFUND: {
          value: 41,
          label: '全部退款',
          color: '#DB0007',
        },
        PART_REFUND: {
          value: 42,
          label: '部分退款',
          color: 'CadetBlue',
        },
      },
      payType: {
        BY_ONLINE: {
          value: 98,
          label: '虚拟支付(T+n结算)',
          color: 'processing',
        },
        BY_OFFLINE: {
          value: 99,
          label: '转账汇款',
          color: 'success',
        },
      },
      billType: {
        BY_ONLINE: {
          value: 1,
          label: '在线开票',
          color: 'processing',
        },
        BY_OFFLINE: {
          value: 2,
          label: '线下开票',
          color: 'success',
        },
      },
      sendType: {
        CODES_GEN: {
          value: 1,
          label: '产码',
          color: 'processing',
        },
        BINDING: {
          value: 2,
          label: '绑定',
          color: 'success',
        },
      },
      auditType: {
        PENDING: {
          value: 0,
          label: '待审核',
          color: 'processing',
        },
        PASSED: {
          value: 1,
          label: '已审核',
          color: 'success',
        },
        REJECTED: {
          value: 2,
          label: '已驳回',
          color: 'error',
        },
      },
      remarkType: {
        PLACE_ORDER: {
          value: 0,
          label: '下单',
        },
        PRIMCE_AMEND_APPLY: {
          value: 1,
          label: '改价申请',
        },
        PRIMCE_AMEND_AUDIT: {
          value: 2,
          label: '改价审核',
        },
        THIRD_PRICE_AMEND: {
          value: 3,
          label: '三方金额改价',
        },
        REFUND: {
          value: 4,
          label: '退款',
        },
        ADD_REMARK: {
          value: 5,
          label: '添加备注',
        },
      },
    },
    invoice: {
      status: {
        IN_PROGRESS: {
          value: 0,
          label: '开票中',
          color: 'processing',
        },
        SUCCESS: {
          value: 1,
          label: '已开具',
          color: 'success',
        },
        SUCCESS_HC: {
          value: 2,
          label: '红冲成功',
          color: 'blue',
        },
        FAILED: {
          value: 3,
          label: '开票失败',
          color: 'error',
        },
      },
      type: {
        FOR_COMPANY: {
          value: 1,
          label: '个人/非企业单位',
        },
        FOR_PERSONAL: {
          value: 2,
          label: '企业单位',
        },
      },
    },
    coupon: {
      status: {
        PENDING: {
          value: 0,
          label: '待使用',
          color: 'processing',
        },
        BIND: {
          value: 1,
          label: '已绑定',
          color: 'success',
        },
        PAID: {
          value: 2,
          label: '已核销',
          color: 'Aquamarine',
        },
        IN_AUDIT: {
          value: 4,
          label: '已作废',
          color: 'error',
        },
        PRICE_AMEND: {
          value: 5,
          label: '已过期 ',
          color: 'gray',
        },
      },
    },
    voucherTemplate: {
      state: {
        TO_SUBMIT: {
          value: 0,
          label: '待提交',
          color: 'processing',
        },
        TO_PUBLISH: {
          value: 1,
          label: '待生效',
          color: 'Aquamarine',
        },
        ONLINE: {
          value: 2,
          label: '已生效',
          color: 'success',
        },
        OFFLINE_M: {
          value: 3,
          label: '手动下架',
          color: 'error',
        },
        OFFLINE_A: {
          value: 4,
          label: '自动下架 ',
          color: 'error',
        },
      },
    },
    voucherOrder: {
      status: {
        COMPLETED: {
          value: 0,
          label: '已完成',
          color: 'success',
        },
        IN_PROGRESS: {
          value: 1,
          label: '产码中',
          color: 'processing',
        },
        FAILED: {
          value: 2,
          label: '产码失败',
          color: 'error',
        },
        SENDING: {
          value: 3,
          label: '已过期',
          color: 'gray',
        },
        SENT: {
          value: 4,
          label: '已发放',
          color: 'success',
        },
      },
      sendType: {
        MANUAL: {
          value: 1,
          label: '发码',
        },
        BATCH: {
          value: 2,
          label: '批采产码',
        },
      },
    },
    voucherCode: {
      status: {
        PENDING: {
          value: 0,
          label: '未兑换',
          color: 'processing',
        },
        COMPLETED: {
          value: 1,
          label: '已兑换',
          color: 'success',
        },
        CANCELED: {
          value: 2,
          label: '已作废 ',
          color: 'error',
        },
        EXPIRED: {
          value: 3,
          label: '已过期',
          color: 'gray',
        },
        SENT: {
          value: 4,
          label: '已发放',
          color: 'lightgreen',
        },
      },

      codeType: {
        PLATFORM: {
          value: 0,
          label: '平台生成',
        },
        THIRD_PARTY: {
          value: 1,
          label: '三方导入',
        },
      },
    },
  },
};
export default constants;
