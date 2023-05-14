export interface Constants {
  groupon: CGroupon;
}
declare type EnumItem = {
  value: any;
  label: string;
  color?: string;
};

type ColEums = {
  [any: string]: EnumItem;
};

interface CGroupon {
  status: ColEums;
  use_type: ColEums;
  code_type: ColEums;
  category_id: ColEums;
  valid_time_type: ColEums;
}

const constants: Constants = {
  groupon: {
    status: {
      ONLINE: {
        value: 1,
        label: "已上架",
        color: 'success'
      },
      AUDIT_IN_PROGRESS: {
        value: 2,
        label: "审核中",
        color: 'processing'
      },
      AUDIT_REJECTED: {
        value: 3,
        label: "审核失败",
        color: 'error'
      },
      OFFLINE: {
        value: 4,
        label: "已下架",
        color: 'gray'
      },
    },
    valid_time_type: {
      TIME_RANGE: {
        value: 1,
        label: "指定时间段",
      },
      DAYS: {
        value: 2,
        label: "购后天数",
      },
    },
    use_type: {
      VERIFIED_IN_STORE: {
        value: 1,
        label: "到店核销",
      },
    },
    code_type: {
      DOUYIN: {
        value: 1,
        label: "抖音码",
      },
      THIRD: {
        value: 2,
        label: "三方码",
      },
      RESERVED: {
        value: 3,
        label: "预留码",
      },
    },
    category_id: {
      BAKE: {
        value: "1014001",
        label: "面包烘焙",
      },
      SWEET: {
        value: "1014002",
        label: "甜品",
      },
      OTHER_BREAD_SWEET: {
        value: "1014003",
        label: "其他面包甜品",
      },
      COFFEE: {
        value: "1015001",
        label: "咖啡",
      },
      TEA: {
        value: "1015002",
        label: "茶馆",
      },
      TEA_AND_JUICE: {
        value: "1015003",
        label: "茶饮果汁",
      },
      ICECREAM_SOUR_MILK: {
        value: "1015004",
        label: "冰淇淋/酸奶",
      },
      OTHER_DRINKS: {
        value: "1015005",
        label: "其他饮品",
      },
      MUSIC_RESTAURANT: {
        value: "1016001",
        label: "音乐餐厅",
      },
      FAST_FOOD_AND_SNACK: {
        value: "1017001",
        label: "快餐小吃",
      },
      OTHER_DELICARY: {
        value: "1013001",
        label: "其他美食",
      },
    },
  },
};
export default constants;
