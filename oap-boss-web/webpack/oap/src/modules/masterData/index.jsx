import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Spin, Tabs, Form, Row, Col, Button, Input, Table, Empty, message, Select, Space, DatePicker, IconFont, Modal, Checkbox } from '@aurum/pfe-ui';
import { IconLoadingFill } from '@aurum/icons';
import { getPageSize } from '@mcd/portal-components/dist/utils/table';
import {
	getAppMarketList,
	getProductMarketList,
	getTicketList,
	getCampaignList,
	getMasterDataMeta,
	getStoreList,
	getBEList,
	getPromotionList,
	getStoreLevelQuery,
	getPromotionLevelQuery,
	downloadMasterdata
} from '@/api/oap/master_data';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';
import { uuid, whetherConversion, judgeIsStaff } from '@/utils/store/func';
import moment from 'moment';
import ExploreEmailModal from '@/components/ExploreEmailModal';

const masterDataList = forwardRef((props, ref) => {
	const ticketTab = {
		value: '1',
		label: '卡券主数据',
		type: 'ticket',
		columns: [
			{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
			{ title: "活动发起方（部门）", dataIndex: 'businessOwner', ellipsis: true, width: 148, nameEn: 'business_owner' },
			{ title: "活动发起方-子类别发起方归属", dataIndex: 'businessOwnerType', ellipsis: true, width: 150, nameEn: 'business_owner_type' },
			{ title: "活动Owner某个人", dataIndex: 'campaignOwner', ellipsis: true, width: 140, nameEn: 'campaign_owner' },
			{ title: "活动id", dataIndex: 'campaignId', ellipsis: true, width: 120, nameEn: 'campaign_id' },
			{ title: "活动大类编码", dataIndex: 'campaignCategory', ellipsis: true, width: 140, nameEn: 'campaign_category' },
			{ title: "活动大类", dataIndex: 'campaignType', ellipsis: true, width: 120, nameEn: 'campaign_type' },
			{ title: "活动名称", dataIndex: 'campaignName', ellipsis: true, width: 140, nameEn: 'campaign_name' },
			{ title: "活动开始时间", dataIndex: 'campaignStartDate', ellipsis: true, width: 120, nameEn: 'campaign_start_date' },
			{ title: "活动结束时间", dataIndex: 'campaignEndDate', ellipsis: true, width: 120, nameEn: 'campaign_end_date' },
			{ title: "BE类型", dataIndex: 'beType', ellipsis: true, width: 120, nameEn: 'be_type' },
			{ title: "促销ID", dataIndex: 'promotionId', ellipsis: true, width: 120, nameEn: 'promotion_id' },
			{ title: "促销名称", dataIndex: 'promotionName', ellipsis: true, width: 120, nameEn: 'promotion_name' },
			{ title: "eCP Promotion ID", dataIndex: 'ecpPromotionId', ellipsis: true, width: 148, nameEn: 'ecp_promotion_id' },
			{ title: "券类型", dataIndex: 'couponType', ellipsis: true, width: 140, nameEn: 'coupon_type' },
			{ title: "卡券名称", dataIndex: 'couponName', ellipsis: true, width: 140, nameEn: 'coupon_name' },
			{ title: "获取类型", dataIndex: 'couponCardType', ellipsis: true, width: 120, nameEn: 'coupon_card_type' },
			{ title: "券码", dataIndex: 'couponId', ellipsis: true, width: 120, nameEn: 'coupon_id' },
			{ title: "18位码", dataIndex: 'coupon18Code', ellipsis: true, width: 140, nameEn: 'coupon_18_code' },
			{ title: "券码开始投放时间", dataIndex: 'couponReceiveStartTime', ellipsis: true, width: 140, nameEn: 'coupon_receive_start_time' },
			{ title: "券码结束投放时间", dataIndex: 'couponReceiveEndTime', ellipsis: true, width: 140, nameEn: 'coupon_receive_end_time' },
			{ title: "券码开始核销时间", dataIndex: 'couponRedeemStartTime', ellipsis: true, width: 140, nameEn: 'coupon_redeem_start_time' },
			{ title: "券码结束核销时间", dataIndex: 'couponRedeemEndTime', ellipsis: true, width: 140, nameEn: 'coupon_redeem_end_time' },
			{ title: "券码有效期类型", dataIndex: 'couponAvailablePeriodType', ellipsis: true, width: 130, nameEn: 'coupon_available_period_type' },
			{ title: "券码动态有效期", dataIndex: 'couponAvailablePeriodDuration', ellipsis: true, width: 126, nameEn: 'coupon_available_period_duration' },
			{ title: "卡券领取/售卖价格", dataIndex: 'couponPrice', ellipsis: true, width: 140, nameEn: 'coupon_price' },
			{ title: "非码活动码active_code", dataIndex: 'couponFmCode', ellipsis: true, width: 140, nameEn: 'coupon_fm_code' },
			{ title: "趋佳活动码card_id", dataIndex: 'couponQjCode', ellipsis: true, width: 140, nameEn: 'coupon_qj_code' },
			{ title: "CRM Campaign ID", dataIndex: 'couponTzCode', ellipsis: true, width: 148, nameEn: 'coupon_tz_code' },
			{ title: "发码方", dataIndex: 'couponCreator', ellipsis: true, width: 140, nameEn: 'coupon_creator' },
			{ title: "权益卡编号", dataIndex: 'cardId', ellipsis: true, width: 140, nameEn: 'card_id' },
			{ title: "Card Type", dataIndex: 'cardType', ellipsis: true, width: 140, nameEn: 'card_type' },
			{ title: "权益卡名称", dataIndex: 'cardName', ellipsis: true, width: 140, nameEn: 'card_name' },
			{ title: "原键位", dataIndex: 'baseItemCode', ellipsis: true, width: 140, nameEn: 'base_item_code' },
			{ title: "新键位", dataIndex: 'newItemCode', ellipsis: true, width: 140, nameEn: 'new_item_code' },
			{ title: "支付类型", dataIndex: 'paymentType', ellipsis: true, width: 140, nameEn: 'payment_type' },
			{ title: "支付宝券id", dataIndex: 'aliPayCouponId', ellipsis: true, width: 140, nameEn: 'ali_pay_coupon_id' },
			{ title: "微信券id", dataIndex: 'wechatPayCouponId', ellipsis: true, width: 140, nameEn: 'wechat_pay_coupon_id' },
			{ title: "是否主券", dataIndex: 'isShowNob', ellipsis: true, width: 140, nameEn: 'is_show_nob' },
			{ title: "商品id", dataIndex: 'productId', ellipsis: true, width: 140, nameEn: 'product_id' },
			{ title: "权益名称", dataIndex: 'interestsName', ellipsis: true, width: 140, nameEn: 'interests_name' },
			{ title: "产品原价", dataIndex: 'itemOriginalPrice', ellipsis: true, width: 140, nameEn: 'item_original_price' },
			{ title: "产品现价", dataIndex: 'itemPresentPrice', ellipsis: true, width: 140, nameEn: 'item_present_price' },
		]
	}
	const productTab = {
		value: '2',
		label: '产品主数据',
		type: 'product',
		columns: [
			{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
			{ title: "产品编码", dataIndex: 'baseId', ellipsis: true, width: 140, nameEn: 'base_id' },
			{ title: "产品类别", dataIndex: 'codeType', ellipsis: true, width: 130, nameEn: 'code_type' },
			{ title: "产品Item Code", dataIndex: 'itemCode', ellipsis: true, width: 130, nameEn: 'item_code' },
			{ title: "相同产品母店真实键位", dataIndex: 'fcBaseCode', ellipsis: true, width: 160, nameEn: 'fc_base_code' },
			{ title: "相同产品MDS真实键位", dataIndex: 'mdsBaseCode', ellipsis: true, width: 166, nameEn: 'mds_base_code' },
			{ title: "产品名称-英文", dataIndex: 'itemNameEn', ellipsis: true, width: 140, nameEn: 'item_name_en' },
			{ title: "产品名称-中文", dataIndex: 'itemNameCn', ellipsis: true, width: 140, nameEn: 'item_name_cn' },
			{ title: "产品一级类目英文名称", dataIndex: 'categoryLevel1En', ellipsis: true, width: 160, nameEn: 'category_level_1_en' },
			{ title: "产品一级类目中文名称", dataIndex: 'categoryLevel1Cn', ellipsis: true, width: 160, nameEn: 'category_level_1_cn' },
			{ title: "产品二级类目英文名称", dataIndex: 'categoryLevel2En', ellipsis: true, width: 160, nameEn: 'category_level_2_en' },
			{ title: "产品二级类目中文名称", dataIndex: 'categoryLevel2Cn', ellipsis: true, width: 160, nameEn: 'category_level_2_cn' },
			{ title: "产品三级类目英文名称", dataIndex: 'categoryLevel3En', ellipsis: true, width: 160, nameEn: 'category_level_3_en' },
			{ title: "产品三级类目中文名称", dataIndex: 'categoryLevel3Cn', ellipsis: true, width: 160, nameEn: 'category_level_3_cn' },
			{ title: "是否mds", dataIndex: 'isMds', ellipsis: true, width: 90, nameEn: 'is_mds' },
			{ title: "产品风味", dataIndex: 'flavor', ellipsis: true, width: 120, nameEn: 'flavor' },
			{ title: "产品所含蛋白质", dataIndex: 'protein', ellipsis: true, width: 140, nameEn: 'protein' },
			{ title: "产品温度", dataIndex: 'temperature', ellipsis: true, width: 120, nameEn: 'temperature' },
			{ title: "产品大小", dataIndex: 'size', ellipsis: true, width: 120, nameEn: 'size' },
			{ title: "是否lto", dataIndex: 'isLto', ellipsis: true, width: 80, nameEn: 'is_lto' },
			{ title: "是否经典产品", dataIndex: 'isIconic', ellipsis: true, width: 114, nameEn: 'is_iconic' },
			{ title: "经典产品类型", dataIndex: 'iconicType', ellipsis: true, width: 140, nameEn: 'iconic_type' },
			{ title: "产品价值", dataIndex: 'positioning', ellipsis: true, width: 140, nameEn: 'positioning' },
			{ title: "产品归属方1", dataIndex: 'bu', ellipsis: true, width: 140, nameEn: 'bu' },
			{ title: "产品归属方2", dataIndex: 'daypart', ellipsis: true, width: 140, nameEn: 'daypart' },
			{ title: "是否桶", dataIndex: 'isBucket', ellipsis: true, width: 80, nameEn: 'is_bucket' },
			{ title: "几人餐", dataIndex: 'groupSize', ellipsis: true, width: 80, nameEn: 'group_size' },
			{ title: "几件套", dataIndex: 'comboSize', ellipsis: true, width: 80, nameEn: 'combo_size' },
			{ title: "是否开心乐园餐", dataIndex: 'isHappyMeal', ellipsis: true, width: 128, nameEn: 'is_happy_meal' },
			{ title: "套餐是否为麦咖啡饮料+非饮料食品", dataIndex: 'isFoodPairing', ellipsis: true, width: 180, nameEn: 'is_food_pairing' },
			{ title: "是否固定搭配", dataIndex: 'isMccafeSet', ellipsis: true, width: 114, nameEn: 'is_mccafe_set' },
			{ title: "是否常规套餐", dataIndex: 'isEvm', ellipsis: true, width: 114, nameEn: 'is_evm' },
			{ title: "是否随心配", dataIndex: 'isBa', ellipsis: true, width: 100, nameEn: 'is_ba' },
			{ title: "是否dynamic combo", dataIndex: 'iDynamicCombo', ellipsis: true, width: 140, nameEn: 'is_dynamic_combo' },
			{ title: "产品单位", dataIndex: 'piece', ellipsis: true, width: 100, nameEn: 'piece' },
		]
	}
	const campaignTab = {
		value: '3',
		label: '活动主数据',
		type: 'campaign',
		columns: [
			{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
			{ title: "促销主数据唯一主键", dataIndex: 'uniquePromoId', ellipsis: true, width: 180, nameEn: 'unique_promo_id' },
			{ title: "活动ID", dataIndex: 'campaignId', ellipsis: true, width: 130, nameEn: 'campaign_id' },
			{ title: "活动名称", dataIndex: 'campaignName', ellipsis: true, width: 140, nameEn: 'campaign_name' },
			{ title: "活动类型", dataIndex: 'campaignBeType', ellipsis: true, width: 120, nameEn: 'campaign_be_type' },
			{ title: "活动类目1", dataIndex: 'campaignCategoryLevel1', ellipsis: true, width: 120, nameEn: 'campaign_category_level_1' },
			{ title: "活动类目2", dataIndex: 'campaignCategoryLevel2', ellipsis: true, width: 120, nameEn: 'campaign_category_level_2' },
			{ title: "活动类目3", dataIndex: 'campaignCategoryLevel3', ellipsis: true, width: 120, nameEn: 'campaign_category_level_3' },
			{ title: "活动类目4", dataIndex: 'campaignCategoryLevel4', ellipsis: true, width: 120, nameEn: 'campaign_category_level_4' },
			{ title: "活动状态", dataIndex: 'campaignStatus', ellipsis: true, width: 90, nameEn: 'campaign_status' },
			{ title: "活动开始时间", dataIndex: 'campaignStartDate', ellipsis: true, width: 120, nameEn: 'campaign_start_date' },
			{ title: "活动结束时间", dataIndex: 'campaignEndDate', ellipsis: true, width: 120, nameEn: 'campaign_end_date' },
			{ title: "活动时长", dataIndex: 'campaignPeriod', ellipsis: true, width: 90, nameEn: 'campaign_period' },
			{ title: "活动主题", dataIndex: 'campaignTheme', ellipsis: true, width: 140, nameEn: 'campaign_theme' },
			{ title: "活动主产品名称", dataIndex: 'leadProduct', ellipsis: true, width: 140, nameEn: 'lead_product' },
			{ title: "活动负责人", dataIndex: 'campaignLead', ellipsis: true, width: 120, nameEn: 'campaign_lead' },
			{ title: "活动范围", dataIndex: 'campaignRange', ellipsis: true, width: 100, nameEn: 'campaign_range' },
			{ title: "产品最外层的编码,真实键位", dataIndex: 'itemTopCode', ellipsis: true, width: 140, nameEn: 'item_top_code' },
			{ title: "产品英文名", dataIndex: 'itemNameEn', ellipsis: true, width: 140, nameEn: 'item_name_en' },
			{ title: "产品中文名", dataIndex: 'itemNameCn', ellipsis: true, width: 140, nameEn: 'item_name_cn' },
			{ title: "活动类型", dataIndex: 'campaignType', ellipsis: true, width: 100, nameEn: 'campaign_type' },
			{ title: "促销系统生成的真实ID", dataIndex: 'promotionId', ellipsis: true, width: 140, nameEn: 'promotion_id' },
			{ title: "促销名称", dataIndex: 'promotionName', ellipsis: true, width: 100, nameEn: 'promotion_name' },
			{ title: "卡券核销开始日期", dataIndex: 'couponRedeemStartDate', ellipsis: true, width: 138, nameEn: 'coupon_redeem_start_date' },
			{ title: "卡券核销结束日期", dataIndex: 'couponRedeemEndDate', ellipsis: true, width: 138, nameEn: 'coupon_redeem_end_date' },
			{ title: "促销适用平台", dataIndex: 'promotionBeType', ellipsis: true, width: 120, nameEn: 'promotion_be_type' },
			{ title: "促销可核销渠道", dataIndex: 'couponRedeemPlatform', ellipsis: true, width: 130, nameEn: 'coupon_redeem_platform' },
			{ title: "产品一级类目", dataIndex: 'productCategoryLevel1', ellipsis: true, width: 116, nameEn: 'product_category_level_1' },
			{ title: "产品二级类目", dataIndex: 'productCategoryLevel2', ellipsis: true, width: 116, nameEn: 'product_category_level_2' },
			{ title: "促销机制", dataIndex: 'communicationType', ellipsis: true, width: 100, nameEn: 'communication_type' },
			{ title: "促销形式", dataIndex: 'discountType', ellipsis: true, width: 100, nameEn: 'discount_type' },
			{ title: "产品菜单价格", dataIndex: 'itemOriginalUnitPrice', ellipsis: true, width: 120, nameEn: 'item_original_unit_price' },
			{ title: "产品真实售卖价格, 不含订单级别折扣", dataIndex: 'itemSellingPrice', ellipsis: true, width: 140, nameEn: 'item_selling_price' },
			{ title: "产品折扣率", dataIndex: 'itemDiscountRate', ellipsis: true, width: 110, nameEn: 'item_discount_rate' },
			{ title: "卡ID", dataIndex: 'cardId', ellipsis: true, width: 130, nameEn: 'card_id' },
			{ title: "卡类型", dataIndex: 'cardType', ellipsis: true, width: 100, nameEn: 'card_type' },
			{ title: "券ID", dataIndex: 'couponId', ellipsis: true, width: 130, nameEn: 'coupon_id' },
			{ title: "优惠券名称", dataIndex: 'couponName', ellipsis: true, width: 140, nameEn: 'coupon_name' },
			{ title: "是否为预付券", dataIndex: 'couponIsPrepaid', ellipsis: true, width: 120, nameEn: 'coupon_is_prepaid	' },
			{ title: "是否为个性化券", dataIndex: 'couponIsPersonalized', ellipsis: true, width: 128, nameEn: 'coupon_is_personalized' },
			{ title: "个性化券类型", dataIndex: 'couponPersonalizedType', ellipsis: true, width: 120, nameEn: 'coupon_personalized_type' },
			{ title: "发券平台类目一", dataIndex: 'couponProvidePlatformLevel1', ellipsis: true, width: 130, nameEn: 'coupon_provide_platform_level_1' },
			{ title: "发券平台类目二", dataIndex: 'couponProvidePlatformLevel2', ellipsis: true, width: 130, nameEn: 'coupon_provide_platform_level_2' },
			{ title: "促销开始时间", dataIndex: 'promotionStartDate', ellipsis: true, width: 116, nameEn: 'promotion_start_date' },
			{ title: "促销结束时间", dataIndex: 'promotionEndDate', ellipsis: true, width: 116, nameEn: 'promotion_end_date' },
			{ title: "券码开始投放时间", dataIndex: 'couponReceiveStartTime', ellipsis: true, width: 136, nameEn: 'coupon_receive_start_time' },
			{ title: "券码结束投放时间", dataIndex: 'couponReceiveEndTime', ellipsis: true, width: 136, nameEn: 'coupon_receive_end_time' },
			{ title: "券码有效期类型", dataIndex: 'couponAvailablePeriodType', ellipsis: true, width: 126, nameEn: 'coupon_available_period_type' },
			{ title: "券码动态有效期", dataIndex: 'couponAvailablePeriodDuration', ellipsis: true, width: 126, nameEn: 'coupon_available_period_duration' },
		]
	}
	const appTab = {
		value: '4',
		label: '应用市场主数据',
		type: 'app',
		columns: [
			{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
			{ title: "id", dataIndex: 'id', ellipsis: true, width: 140, nameEn: 'id' },
			{ title: "操作系统", dataIndex: 'operatingSystem', ellipsis: true, width: 120, nameEn: 'operating_system' },
			{ title: "app市场", dataIndex: 'appMarket', ellipsis: true, width: 140, nameEn: 'app_market' },
			{ title: "创建时间", dataIndex: 'createDate', ellipsis: true, width: 150, nameEn: 'create_date' }
		]
	}
	const storeTab = {
		value: '5',
		label: '餐厅主数据',
		type: 'store',
		columns: [
			{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
			{ title: "餐厅编码", dataIndex: 'usCode', ellipsis: true, width: 120, nameEn: 'us_code' },
			{ title: "餐厅中文名", dataIndex: 'storeNameCn', ellipsis: true, width: 120, nameEn: 'store_name_cn' },
			{ title: "餐厅英文名", dataIndex: 'storeNameEn', ellipsis: true, width: 140, nameEn: 'store_name_en' },
			{ title: "门店地址", dataIndex: 'address', ellipsis: true, width: 140, nameEn: 'address' },
			{ title: "开业时间", dataIndex: 'storeOpenDate', ellipsis: true, width: 120, nameEn: 'store_open_date' },
			{ title: "闭店时间", dataIndex: 'storeCloseDate', ellipsis: true, width: 120, nameEn: 'store_close_date' },
			{ title: "营业状态", dataIndex: 'status', ellipsis: true, width: 100, nameEn: 'status' },
			{ title: "门店类型（正常-normal，测试-test）", dataIndex: 'useType', ellipsis: true, width: 140, nameEn: 'use_type' },
			{ title: "portfolio类型", dataIndex: 'portfolioType', ellipsis: true, width: 120, nameEn: 'portfolio_type' },
			{ title: "LBS门店类型", dataIndex: 'lbsLabel', ellipsis: true, width: 90, nameEn: 'lbs_label' },
			{ title: "商圈类型", dataIndex: 'taType', ellipsis: true, width: 110, nameEn: 'ta_type' },
			{ title: "商圈编码", dataIndex: 'taCode', ellipsis: true, width: 110, nameEn: 'ta_code' },
			{ title: "商圈面积", dataIndex: 'taSize', ellipsis: true, width: 100, nameEn: 'ta_size' },
			{ title: "价格组", dataIndex: 'priceTier', ellipsis: true, width: 80, nameEn: 'price_tier' },
			{ title: "营运市场名称", dataIndex: 'opsMarketEn', ellipsis: true, width: 130, nameEn: 'ops_market_en' },
			{ title: "团餐开始日期", dataIndex: 'groupMealStartDay', ellipsis: true, width: 120, nameEn: 'group_meal_start_day' },
			{ title: "团餐关闭日期", dataIndex: 'groupMealCloseDay', ellipsis: true, width: 120, nameEn: 'group_meal_close_day' },
			{ title: "社群开始时间", dataIndex: 'communityStartDate', ellipsis: true, width: 120, nameEn: 'community_start_date' },
			{ title: "纬度", dataIndex: 'latitude', ellipsis: true, width: 120, nameEn: 'latitude' },
			{ title: "经度", dataIndex: 'longitude', ellipsis: true, width: 120, nameEn: 'longitude' },
			{ title: "营业面积", dataIndex: 'operationsize', ellipsis: true, width: 100, nameEn: 'operationsize' },
			{ title: "所有权类型", dataIndex: 'ownership', ellipsis: true, width: 110, nameEn: 'ownership' },
			{ title: "所有权类型缩写", dataIndex: 'ownershipType', ellipsis: true, width: 90, nameEn: 'ownership_type' },
			{ title: "餐厅经理EID", dataIndex: 'rgmEid', ellipsis: true, width: 120, nameEn: 'rgm_eid' },
			{ title: "持牌人EID", dataIndex: 'ownereid', ellipsis: true, width: 120, nameEn: 'ownereid' },
			//{ title: "国家编码",dataIndex: 'nationCode', ellipsis: true, width: 100,nameEn:'nation_name_cn'},
			{ title: "国家中文名", dataIndex: 'nationNameCn', ellipsis: true, width: 120, nameEn: 'nation_name_cn' },
			{ title: "国家英文名", dataIndex: 'nationNameEn', ellipsis: true, width: 130, nameEn: 'nation_name_en' },
			//{ title: "大区编码",dataIndex: 'regionCode', ellipsis: true, width: 90,nameEn:'region_name_cn'},
			{ title: "大区中文名", dataIndex: 'regionNameCn', ellipsis: true, width: 110, nameEn: 'region_name_cn' },
			{ title: "大区英文名", dataIndex: 'regionNameEn', ellipsis: true, width: 110, nameEn: 'region_name_en' },
			//{ title: "省份编码",dataIndex: 'provinceCode', ellipsis: true, width: 100,nameEn:'us_code'},
			{ title: "省份中文名", dataIndex: 'provinceNameCn', ellipsis: true, width: 110, nameEn: 'province_name_cn' },
			{ title: "省份英文名", dataIndex: 'provinceNameEn', ellipsis: true, width: 110, nameEn: 'province_name_en' },
			//{ title: "城市编码",dataIndex: 'cityCode', ellipsis: true, width: 100,nameEn:'us_code'},
			{ title: "城市中文名", dataIndex: 'cityNameCn', ellipsis: true, width: 110, nameEn: 'city_name_cn' },
			{ title: "城市英文名", dataIndex: 'cityNameEn', ellipsis: true, width: 110, nameEn: 'city_name_en' },
			{ title: "城市等级", dataIndex: 'cityRankType', ellipsis: true, width: 100, nameEn: 'city_rank_type' },
			{ title: "县区等级", dataIndex: 'countyTier', ellipsis: true, width: 100, nameEn: 'county_tier' },
			{ title: "县区等级分组", dataIndex: 'countyTierGroup', ellipsis: true, width: 110, nameEn: 'county_tier_group' },
			//{ title: "县区编码",dataIndex: 'countycitycode', ellipsis: true, width: 100,nameEn:'us_code'},
			{ title: "县区中文名", dataIndex: 'countycitynameCn', ellipsis: true, width: 110, nameEn: 'countycityname_cn' },
			{ title: "县区英文名", dataIndex: 'countycitynameEn', ellipsis: true, width: 110, nameEn: 'countycityname_en' },
			//{ title: "地区编码",dataIndex: 'districtNameCn', ellipsis: true, width: 100,nameEn:'us_code'},
			{ title: "地区中文名", dataIndex: 'opsMarketEn', ellipsis: true, width: 110, nameEn: 'district_name_cn' },
			{ title: "地区英文名", dataIndex: 'districtNameEn', ellipsis: true, width: 110, nameEn: 'district_name_en' },
			//{ title: "公司编码",dataIndex: 'companyCode', ellipsis: true, width: 90,nameEn:'us_code'},
			{ title: "公司中文名称", dataIndex: 'companyNameCn', ellipsis: true, width: 120, nameEn: 'company_name_cn' },
			{ title: "公司英文名称", dataIndex: 'companyNameEn', ellipsis: true, width: 120, nameEn: 'company_name_en' },
			{ title: "纳税人识别号", dataIndex: 'taxcode', ellipsis: true, width: 150, nameEn: 'taxcode' },
			{ title: "交税地区", dataIndex: 'taxarea', ellipsis: true, width: 100, nameEn: 'taxarea' },
			{ title: "tis编码", dataIndex: 'tisTaxCollectionCode', ellipsis: true, width: 90, nameEn: 'tis_tax_collection_code' },
			{ title: "tis名称", dataIndex: 'tisTaxCollectionName', ellipsis: true, width: 120, nameEn: 'tis_tax_collection_name' },
			{ title: "tis支付ID", dataIndex: 'tisTaxpayerId', ellipsis: true, width: 120, nameEn: 'tis_taxpayer_id' },
			{ title: "公司编码ICSS", dataIndex: 'companyCodeIcss', ellipsis: true, width: 100, nameEn: 'company_code_icss' },
			{ title: "公司名称ICSS", dataIndex: 'companyNameIcss', ellipsis: true, width: 150, nameEn: 'company_name_icss' },
			{ title: "运营1级编码", dataIndex: 'opsLevel1Code', ellipsis: true, width: 100, nameEn: 'ops_level_1_code' },
			{ title: "运营2级编码", dataIndex: 'opsLevel2Code', ellipsis: true, width: 100, nameEn: 'ops_level_2_code' },
			{ title: "运营3级编码", dataIndex: 'opsLevel3Code', ellipsis: true, width: 100, nameEn: 'ops_level_3_code' },
			{ title: "运营4级编码", dataIndex: 'opsLevel4Code', ellipsis: true, width: 100, nameEn: 'ops_level_4_code' },
			{ title: "运营5级编码", dataIndex: 'opsLevel5Code', ellipsis: true, width: 100, nameEn: 'ops_level_5_code' },
			{ title: "运营6级编码", dataIndex: 'opsLevel6Code', ellipsis: true, width: 100, nameEn: 'ops_level_6_code' },
			{ title: "运营1级名称", dataIndex: 'ops1DisplayName', ellipsis: true, width: 120, nameEn: 'ops_1_display_name' },
			{ title: "运营2级名称", dataIndex: 'ops2DisplayName', ellipsis: true, width: 120, nameEn: 'ops_2_display_name' },
			{ title: "运营3级名称", dataIndex: 'ops3DisplayName', ellipsis: true, width: 120, nameEn: 'ops_3_display_name' },
			{ title: "运营4级名称", dataIndex: 'ops4DisplayName', ellipsis: true, width: 120, nameEn: 'ops_4_display_name' },
			{ title: "运营5级名称", dataIndex: 'ops5DisplayName', ellipsis: true, width: 120, nameEn: 'ops_5_display_name' },
			{ title: "运营6级名称", dataIndex: 'ops6DisplayName', ellipsis: true, width: 120, nameEn: 'ops_6_display_name' },
			{ title: "FC周一开店时间", dataIndex: 'hoursFcMonOpen', ellipsis: true, width: 100, nameEn: 'hours_fc_mon_open' },
			{ title: "FC周一关店时间", dataIndex: 'hoursFcMonClose', ellipsis: true, width: 100, nameEn: 'hours_fc_mon_close' },
			{ title: "FC周二开店时间", dataIndex: 'hoursFcTueOpen', ellipsis: true, width: 100, nameEn: 'hours_fc_tue_open' },
			{ title: "FC周二关店时间", dataIndex: 'hoursFcTueClose', ellipsis: true, width: 100, nameEn: 'hours_fc_tue_close' },
			{ title: "FC周三开店时间", dataIndex: 'hoursFcWedOpen', ellipsis: true, width: 100, nameEn: 'hours_fc_wed_open' },
			{ title: "FC周三关店时间", dataIndex: 'hoursFcWedClose', ellipsis: true, width: 100, nameEn: 'hours_fc_wed_close' },
			{ title: "FC周四开店时间", dataIndex: 'hoursFcThuOpen', ellipsis: true, width: 100, nameEn: 'hours_fc_thu_open' },
			{ title: "FC周四关店时间", dataIndex: 'hoursFcThuClose', ellipsis: true, width: 100, nameEn: 'hours_fc_thu_close' },
			{ title: "FC周五开店时间", dataIndex: 'hoursFcFriOpen', ellipsis: true, width: 100, nameEn: 'hours_fc_fri_open' },
			{ title: "FC周五关店时间", dataIndex: 'hoursFcFriClose', ellipsis: true, width: 100, nameEn: 'hours_fc_fri_close' },
			{ title: "FC周六开店时间", dataIndex: 'hoursFcSatOpen', ellipsis: true, width: 100, nameEn: 'hours_fc_sat_open' },
			{ title: "FC周六关店时间", dataIndex: 'hoursFcSatClose', ellipsis: true, width: 100, nameEn: 'hours_fc_sat_close' },
			{ title: "FC周日开店时间", dataIndex: 'hoursFcSunOpen', ellipsis: true, width: 100, nameEn: 'hours_fc_sun_open' },
			{ title: "FC周日关店时间", dataIndex: 'hoursFcSunClose', ellipsis: true, width: 100, nameEn: 'hours_fc_sun_close' },
			{ title: "是否得来速餐厅", dataIndex: 'isDt', ellipsis: true, width: 100, nameEn: 'is_dt' },
			{ title: "是否麦乐送餐厅", dataIndex: 'isMds', ellipsis: true, width: 100, nameEn: 'is_mds' },
			{ title: "是否麦咖啡餐厅", dataIndex: 'isMccafe', ellipsis: true, width: 100, nameEn: 'is_mccafe' },
			{ title: "是否甜品站餐厅", dataIndex: 'isKiosk', ellipsis: true, width: 100, nameEn: 'is_kiosk' },
			{ title: "是否支持早餐", dataIndex: 'isBreakfast', ellipsis: true, width: 80, nameEn: 'is_breakfast' },
			{ title: "是否社群", dataIndex: 'isCommunity', ellipsis: true, width: 60, nameEn: 'is_community' },
			{ title: "是否24小时", dataIndex: 'is24h', ellipsis: true, width: 80, nameEn: 'is_24h' },
			{ title: "是否24小时FC", dataIndex: 'is24hFc', ellipsis: true, width: 80, nameEn: 'is_24h_fc' },
			{ title: "是否24小时DT", dataIndex: 'is24hDt', ellipsis: true, width: 80, nameEn: 'is_24h_dt' },
			{ title: "是否24小时MDS", dataIndex: 'is24hMds', ellipsis: true, width: 100, nameEn: 'is_24h_mds' },
			{ title: "是否24小时麦咖啡", dataIndex: 'is24hMccafe', ellipsis: true, width: 100, nameEn: 'is_24h_mccafe' },
			{ title: "是否支持团餐", dataIndex: 'isGroupMeal', ellipsis: true, width: 80, nameEn: 'is_group_meal' },
			{ title: "餐厅类型-是否dps", dataIndex: 'isDps', ellipsis: true, width: 80, nameEn: 'is_dps' },
			{ title: "是否支持WiFi", dataIndex: 'isWifi', ellipsis: true, width: 80, nameEn: 'is_wifi' },
			{ title: "是否有游乐场", dataIndex: 'isPlayplace', ellipsis: true, width: 70, nameEn: 'is_playplace' },
			{ title: "是否家庭餐厅", dataIndex: 'isFamily', ellipsis: true, width: 80, nameEn: 'is_family' },
			{ title: "是否有电视", dataIndex: 'isTvSupport', ellipsis: true, width: 70, nameEn: 'is_tv_support' },
			{ title: "是否提供报纸", dataIndex: 'isNewspaperDelivery', ellipsis: true, width: 80, nameEn: 'is_newspaper_delivery' },
			{ title: "是否支持SOK", dataIndex: 'isSok', ellipsis: true, width: 80, nameEn: 'is_sok' },
			{ title: "是否送餐到桌", dataIndex: 'isTableservice', ellipsis: true, width: 80, nameEn: 'is_tableservice' },
			{ title: "室内餐椅数量", dataIndex: 'insideseats', ellipsis: true, width: 90, nameEn: 'insideseats' },
			{ title: "麦咖啡数量", dataIndex: 'mccafeNum', ellipsis: true, width: 80, nameEn: 'mccafe_num' },
			{ title: "甜品站数量", dataIndex: 'kioskNum', ellipsis: true, width: 80, nameEn: 'kiosk_num' },
			{ title: "离甜数量", dataIndex: 'remoteKioskNum', ellipsis: true, width: 80, nameEn: 'remote_kiosk_num' },
			{ title: "SOK数量", dataIndex: 'sokNum', ellipsis: true, width: 80, nameEn: 'sok_num' },
			{ title: "可达性名称", dataIndex: 'desirability', ellipsis: true, width: 100, nameEn: 'desirability' },
			{ title: "位置评分名称", dataIndex: 'locationrating', ellipsis: true, width: 90, nameEn: 'locationrating' },
			{ title: "设计风格名称", dataIndex: 'designtype', ellipsis: true, width: 90, nameEn: 'designtype' },
			{ title: "运营市场", dataIndex: 'doCity', ellipsis: true, width: 100, nameEn: 'do_city' },
			{ title: "数据处理时间", dataIndex: 'etlTime', ellipsis: true, width: 130, nameEn: 'etl_time' },
			{ title: "母店分群", dataIndex: 'fcCluster', ellipsis: true, width: 80, nameEn: 'fc_cluster' },
			{ title: "mds分群", dataIndex: 'mdsCluster', ellipsis: true, width: 90, nameEn: 'mds_cluster' },
		]
	}
	const beTab = {
		value: '6',
		label: 'BE主数据',
		type: 'be',
		columns: [
			{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
			{ title: '餐厅号', dataIndex: 'usCode', ellipsis: true, width: 100, nameEn: 'us_code' },
			{ title: 'be号', dataIndex: 'beCode', ellipsis: true, width: 110, nameEn: 'be_code' },
			{ title: 'be类型', dataIndex: 'beType', ellipsis: true, width: 80, nameEn: 'be_type' },
			{ title: 'be名称', dataIndex: 'beName', ellipsis: true, width: 120, nameEn: 'be_name' },
			{ title: 'be大类', dataIndex: 'beTypeLevel1', ellipsis: true, width: 120, nameEn: 'be_type_level_1' },
			{ title: 'be小类', dataIndex: 'beTypeLevel2', ellipsis: true, width: 80, nameEn: 'be_type_level_2' },
			{ title: 'be明细类型', dataIndex: 'beTypeLevel3', ellipsis: true, width: 110, nameEn: 'be_type_level_3' },
			{ title: '星期一开始营业时间', dataIndex: 'monStartHour', ellipsis: true, width: 96, nameEn: 'mon_start_hour' },
			{ title: '星期一结束营业时间', dataIndex: 'monEndHour', ellipsis: true, width: 96, nameEn: 'mon_end_hour' },
			{ title: '星期二开始营业时间', dataIndex: 'tueStartHour', ellipsis: true, width: 96, nameEn: 'tue_start_hour' },
			{ title: '星期二结束营业时间', dataIndex: 'tueEndHour', ellipsis: true, width: 96, nameEn: 'tue_end_hour' },
			{ title: '星期三开始营业时间', dataIndex: 'wedStartHour', ellipsis: true, width: 96, nameEn: 'wed_start_hour' },
			{ title: '星期三结束营业时间', dataIndex: 'wedEndHour', ellipsis: true, width: 96, nameEn: 'wed_end_hour' },
			{ title: '星期四开始营业时间', dataIndex: 'thurStartHour', ellipsis: true, width: 96, nameEn: 'thur_start_hour' },
			{ title: '星期四结束营业时间', dataIndex: 'thurEndHour', ellipsis: true, width: 96, nameEn: 'thur_end_hour' },
			{ title: '星期五开始营业时间', dataIndex: 'friStartHour', ellipsis: true, width: 96, nameEn: 'fri_start_hour' },
			{ title: '星期五结束营业时间', dataIndex: 'friEndHour', ellipsis: true, width: 96, nameEn: 'fri_end_hour' },
			{ title: '星期六开始营业时间', dataIndex: 'satStartHour', ellipsis: true, width: 96, nameEn: 'sat_start_hour' },
			{ title: '星期六结束营业时间', dataIndex: 'satEndHour', ellipsis: true, width: 96, nameEn: 'sat_end_hour' },
			{ title: '星期日开始营业时间', dataIndex: 'sunStartHour', ellipsis: true, width: 96, nameEn: 'sun_start_hour' },
			{ title: '星期日结束营业时间', dataIndex: 'sunEndHour', ellipsis: true, width: 96, nameEn: 'sun_end_hour' },
			{ title: 'Kiosk', dataIndex: 'kioskType', ellipsis: true, width: 80, nameEn: 'kiosk_type' },
			{ title: 'MDS', dataIndex: 'mdsType', ellipsis: true, width: 80, nameEn: 'mds_type' },
			{ title: 'Mccafe', dataIndex: 'mccafeType', ellipsis: true, width: 90, nameEn: 'mccafe_type' },
			{ title: '开店日期', dataIndex: 'beBusinessStartDay', ellipsis: true, width: 120, nameEn: 'be_business_start_day' },
			{ title: '关店日期', dataIndex: 'beBusinessCloseDay', ellipsis: true, width: 120, nameEn: 'be_business_close_day' },
			{ title: '价格组', dataIndex: 'bePriceTier', ellipsis: true, width: 100, nameEn: 'be_price_tier' },
			{ title: 'POS机开始编号', dataIndex: 'posNumberFrom', ellipsis: true, width: 80, nameEn: 'pos_number_from' },
			{ title: 'POS机结束编号', dataIndex: 'posNumberTo', ellipsis: true, width: 80, nameEn: 'pos_number_to' },
			{ title: '小程序下单虚拟机', dataIndex: 'extPos', ellipsis: true, width: 96, nameEn: 'ext_pos' },
			{ title: '收银机联网类型', dataIndex: 'isOnline', ellipsis: true, width: 96, nameEn: 'is_online' },
			{ title: '开关状态', dataIndex: 'status', ellipsis: true, width: 90, nameEn: 'status' },
			{ title: 'be排序号', dataIndex: 'rankNum', ellipsis: true, width: 90, nameEn: 'rank_num' },
			{ title: '版本号', dataIndex: 'version', ellipsis: true, width: 80, nameEn: 'version' }
		]
	}
	const promotionTab = {
		value: '7',
		label: '促销主数据',
		type: 'promotion',
		columns: [
			{ title: '序号', dataIndex: 'tableIndex', fixed: 'left', width: 80 },
			{ title: "促销id", dataIndex: 'promotionId', ellipsis: true, width: 110, nameEn: 'promotion_id' },
			{ title: "促销名称", dataIndex: 'promotionName', ellipsis: true, width: 120, nameEn: 'promotion_name' },
			{ title: "促销类型", dataIndex: 'type', ellipsis: true, width: 110, nameEn: 'type' },
			{ title: "促销子类型", dataIndex: 'promotionType', ellipsis: true, width: 110, nameEn: 'promotion_type' },
			{ title: '促销支持的BE', dataIndex: 'beTypes', ellipsis: true, width: 90, nameEn: 'be_types' },
			{ title: '促销支持的商品', dataIndex: 'includeProduct', ellipsis: true, width: 90, nameEn: 'include_product' },
			{ title: '促销不支持的商品', dataIndex: 'excludeProduct', ellipsis: true, width: 100, nameEn: 'exclude_product' },
			{ title: '促销支持的渠道', dataIndex: 'includeChannel', ellipsis: true, width: 90, nameEn: 'include_channel' },
			{ title: '促销开始时间', dataIndex: 'startTime', ellipsis: true, width: 160, nameEn: 'start_time' },
			{ title: '促销结束时间', dataIndex: 'endTime', ellipsis: true, width: 160, nameEn: 'end_time' },
			{ title: '卡券id', dataIndex: 'couponId', ellipsis: true, width: 100, nameEn: 'coupon_id' },
			{ title: '卡券名称', dataIndex: 'couponName', ellipsis: true, width: 110, nameEn: 'coupon_name' },
			{ title: '活动编号', dataIndex: 'campaignCode', ellipsis: true, width: 100, nameEn: 'campaign_code' },
			{ title: '活动名称', dataIndex: 'campaignName', ellipsis: true, width: 110, nameEn: 'campaign_name' },
			{ title: '活动开始时间', dataIndex: 'campaignStartDate', ellipsis: true, width: 120, nameEn: 'campaign_start_date' },
			{ title: '活动结束时间', dataIndex: 'campaignEndDate', ellipsis: true, width: 120, nameEn: 'campaign_end_date' },
			{ title: '活动大类', dataIndex: 'campaignType', ellipsis: true, width: 80, nameEn: 'campaign_type' },
			{ title: '活动类别', dataIndex: 'campaignCategory', ellipsis: true, width: 80, nameEn: 'campaign_category' }
		]
	}
	const [masterDataList, setMasterDataList] = useState([]);
	const [defaultActiveKey, setActiveKey] = useState('ticket');
	const [fields, setFields] = useState([]);
	const [isStaff, setIsStaff] = useState(false);

	const handleChange = (activeKey) => {
		setActiveKey(activeKey)
		initFields(activeKey)
	}

	const initFields = (activeKey) => {
		const contrast = {
			'ticket': ticketTab,
			'product': productTab,
			'campaign': campaignTab,
			'app': appTab,
			'store': storeTab,
			'be': beTab,
			'promotion': promotionTab
		}
		let columnsArr = contrast[activeKey].columns;
		// if (activeKey == 'store') columnsArr.push({ title: "lbs门店类型", dataIndex: 'lbsLabel', nameEn: 'lbs_label' })
		let fields = columnsArr.slice(1).map(item => {
			return { nameEn: item?.nameEn, name: `${item?.nameEn}(${item.title})`, checked: true }
		})
		setFields(fields)
	}

	useEffect(() => {
		let arr = [];
		if (checkMyPermission('oap:masterdata:ticket:list')) {
			arr.push(ticketTab)
		}
		if (checkMyPermission('oap:masterdata:productmaster:list')) {
			arr.push(productTab)
		}
		if (checkMyPermission('oap:masterdata:campaign:list')) {
			arr.push(campaignTab)
		}
		if (checkMyPermission('oap:masterdata:appmaster:list')) {
			arr.push(appTab)
		}
		if (checkMyPermission('oap:masterdata:store:list')) {
			arr.push(storeTab)
		}
		if (checkMyPermission('oap:masterdata:be:list')) {
			arr.push(beTab)
		}
		if (checkMyPermission('oap:masterdata:promotion:list')) {
			arr.push(promotionTab)
		}
		setMasterDataList(arr);
		initFields(defaultActiveKey);
		judgeIsStaff().then(res => {
			console.log('judgeIsStaff', res)
			setIsStaff(res.data)
		}).catch(error => {
			error.msg && message.error(error.msg);
		})
	}, []);

	return <div className="oap-tabs-container">
		{masterDataList.length ? <Tabs activeKey={defaultActiveKey} type="card" className="oap-tabss" onChange={handleChange}>
			{masterDataList.map(item => {
				return <Tabs.TabPane tab={item.label} key={item.type}>
					<TabPaneContent tabsItem={item} activeKey={defaultActiveKey} fields={fields} isStaff={isStaff} />
				</Tabs.TabPane>
			})}
		</Tabs> : <Empty description="您暂无权限查看，如需查看，请联系管理人员" style={{ paddingTop: '10vh' }} />}
	</div>
})

const TabPaneContent = forwardRef((props, ref) => {
	const { tabsItem, activeKey, fields, isStaff } = props;
	const [isLoading, setLoading] = useState(false);
	const [columns, setColumns] = useState(() => [...tabsItem.columns]);
	const [dataList, setDataList] = useState([]);
	const [tablePagenation, setTablePagenation] = useState({
		pageSize: 20,
		pageNo: 1,
		total: null,
	})
	const [campaignTypeList, setCampaignTypeList] = useState([]);
	const [cardTypeList, setCardTypeList] = useState([]);
	const [couponCreatorList, setCouponCreatorList] = useState([]);
	const [beTypeList, setBeTypeList] = useState([]);
	const [campaignIdList, setCampaignIdList] = useState([]);
	const [campaignBeTypeList, setCampaignBeTypeList] = useState([]);
	const [ownershipList, setOwnershipList] = useState([]);
	const [statusList, setStatusList] = useState([]);
	const [opsMarketList, setOpsMarketList] = useState([]);
	const [ops2DisplayNameList, setOps2DisplayNameList] = useState([]);
	const [ops3DisplayNameList, setOps3DisplayNameList] = useState([]);
	const [ops4DisplayNameList, setOps4DisplayNameList] = useState([]);
	const [ops5DisplayNameList, setOps5DisplayNameList] = useState([]);
	const [ops6DisplayNameList, setOps6DisplayNameList] = useState([]);
	const [storeLoading, setStoreLoading] = useState({
		ops2DisplayNameLoading: false,
		ops3DisplayNameLoading: false,
		ops4DisplayNameLoading: false,
		ops5DisplayNameLoading: false,
		ops6DisplayNameLoading: false
	});
	const [BEBeTypeList, setBEBeTypeList] = useState([]);
	const [BEBeTypeLevel1List, setBEBeTypeLevel1List] = useState([]);
	const [BEBeTypeLevel2List, setBEBeTypeLevel2List] = useState([]);
	const [BEBeTypeLevel3List, setBEBeTypeLevel3List] = useState([]);
	const [BEBeStatusList, setBEBeStatusList] = useState([]);
	const [emailModalData, setEmailModalData] = useState({
		isStaff,
		mcdEmail: '',
		visibleEmailInfo: false,
		isLoading: false,
	})
	const [promotionLoading, setPromotionLoading] = useState({
		typeLoading: false,
		campaignTypeLoading: false
	});
	const [promoTypeList, setPromoTypeList] = useState([]);
	const [promoCampTypeList, setPromoCampTypeList] = useState([]);
	const [promoSubtypeList, setPromoSubtypeList] = useState([]);
	const [promoCampCategoryList, setPromoCampCategoryList] = useState([]);
	const [fieldInfoVisible, setFieldInfoVisible] = useState(false);
	const [downloadFields, setDownloadFields] = useState([...fields]);
	//复选框
	const [checkedList, setCheckedList] = useState(() => {
		return [...fields].map(fildItem => fildItem.nameEn)
	});
	const [showCheckedList, setShowCheckedList] = useState([...fields]);
	const [indeterminate, setIndeterminate] = useState(false);
	const [checkAll, setCheckAll] = useState(true);
	const [isLoadingFields, setIsLoadingFields] = useState(false);
	const formMasterListRef = useRef();

	const onReset = () => {
		formMasterListRef.current.resetFields();
		setOps3DisplayNameList([]);
		setOps4DisplayNameList([]);
		setOps5DisplayNameList([]);
		setOps6DisplayNameList([]);
	}

	const onPageChange = (pageNo, pageSize) => {
		setTablePagenation((preState) => ({
			...preState,
			pageNo: pageNo,
			pageSize: pageSize,
		}))
		formMasterListRef.current.submit();
	}

	const fetchDataList = async () => {
		let requestApi, whetherArr = [];
		let params = formMasterListRef.current?.getFieldsValue() || {};
		let commitParams = Object.assign({
			size: tablePagenation.pageSize,
			page: tablePagenation.pageNo - 1,
		}, params);
		switch (activeKey) {
			case 'ticket':
				requestApi = getTicketList;
				whetherArr = ['isShowNob'];
				break;
			case 'product':
				requestApi = getProductMarketList;
				whetherArr = ['isMds', 'isLto', 'isIconic', 'isBucket', 'isHappyMeal', 'isFoodPairing', 'isMccafeSet', 'isEvm', 'isBa', 'iDynamicCombo'];
				break;
			case 'campaign':
				requestApi = getCampaignList;
				break;
			case 'app':
				requestApi = getAppMarketList;
				break;
			case 'store':
				requestApi = getStoreList;
				whetherArr = ['isDt', 'isMds', 'isMccafe', 'isKiosk', 'isBreakfast', 'isCommunity', 'is24h', 'is24hFc', 'is24hDt', 'is24hMds', 'is24hMccafe', 'isGroupMeal', 'isDps', 'isWifi', 'isPlayplace', 'isFamily', 'isTvSupport', 'isNewspaperDelivery', 'isSok', 'isTableservice']
				commitParams = {
					...commitParams,
					storeOpenDateStartTime: commitParams['storeOpenDate'] && commitParams['storeOpenDate'][0] ? moment(commitParams['storeOpenDate'][0]).valueOf() : '',
					storeOpenDateEndTime: commitParams['storeOpenDate'] && commitParams['storeOpenDate'][1] ? moment(commitParams['storeOpenDate'][1]).valueOf() : '',
					storeCloseDateStartTime: commitParams['storeCloseDate'] && commitParams['storeCloseDate'][0] ? moment(commitParams['storeCloseDate'][0]).valueOf() : '',
					storeCloseDateEndTime: commitParams['storeCloseDate'] && commitParams['storeCloseDate'][1] ? moment(commitParams['storeCloseDate'][1]).valueOf() : '',
				}
				delete commitParams.storeOpenDate
				delete commitParams.storeCloseDate
				break;
			case 'be':
				requestApi = getBEList;
				commitParams = {
					...commitParams,
					beStartDayStartTime: commitParams['beBusinessStartDay'] && commitParams['beBusinessStartDay'][0] ? moment(commitParams['beBusinessStartDay'][0]).valueOf() : '',
					beStartDayEndTime: commitParams['beBusinessStartDay'] && commitParams['beBusinessStartDay'][1] ? moment(commitParams['beBusinessStartDay'][1]).valueOf() : '',
					beCloseDayStartTime: commitParams['beBusinessCloseDay'] && commitParams['beBusinessCloseDay'][0] ? moment(commitParams['beBusinessCloseDay'][0]).valueOf() : '',
					beCloseDayEndTime: commitParams['beBusinessCloseDay'] && commitParams['beBusinessCloseDay'][1] ? moment(commitParams['beBusinessCloseDay'][1]).valueOf() : '',
				}
				delete commitParams.beBusinessStartDay
				delete commitParams.beBusinessCloseDay
				break;
			case 'promotion':
				requestApi = getPromotionList;
				break;
		}
		setDataList([]);
		setTablePagenation({
			...tablePagenation,
			total: 0
		})
		setLoading(true);
		requestApi(commitParams).then(res => {
			let dataList = res.data.items || [];
			dataList.forEach((item, index) => {
				item.customIdd = uuid();
				item.tableIndex = (tablePagenation.pageNo - 1) * tablePagenation.pageSize + index + 1;
				if (item.storeCloseDate) item.storeCloseDate = moment(item.storeCloseDate).format('YYYY-MM-DD');
				if (item.storeOpenDate) item.storeOpenDate = moment(item.storeOpenDate).format('YYYY-MM-DD');
				if (item.etlTime) item.etlTime = moment(item.etlTime).format('YYYY-MM-DD HH:mm:ss');
				if (whetherArr.length) {
					whetherArr.forEach(key => {
						item[key] = whetherConversion(item[key])
					})
				}
			})
			setDataList([...dataList]);
			setTablePagenation({
				...tablePagenation,
				total: res.data?.total
			})
		}).catch((err) => {
			err.msg && message.error(err.msg);
		}).finally(() => {
			setLoading(false);
		})
	}

	//初始化
	const initMeta = async () => {
		setLoading(true)
		try {
			let promiseAllRequest = [], res = {};
			switch (activeKey) {
				case 'ticket':
					promiseAllRequest = ['campaign_type', 'card_type', 'coupon_creator', 'be_type'].map(item => {
						return getMasterDataMeta({ type: 1, column: item })
					})
					res = await Promise.all(promiseAllRequest)
					if (res[0] && res[0].data) setCampaignTypeList(res[0].data.map(itm => ({ id: itm, name: itm })))
					if (res[1] && res[1].data) setCardTypeList(res[1].data.map(itm => ({ id: itm, name: itm })))
					if (res[2] && res[2].data) setCouponCreatorList(res[2].data.map(itm => ({ id: itm, name: itm })))
					if (res[3] && res[3].data) setBeTypeList(res[3].data.map(itm => ({ id: itm, name: itm })))
					break;
				case 'campaign':
					promiseAllRequest = ['campaign_id', 'campaign_be_type'].map(item => {
						return getMasterDataMeta({ type: 2, column: item })
					})
					res = await Promise.all(promiseAllRequest);
					if (res[0] && res[0].data) setCampaignIdList(res[0].data.map(itm => ({ id: itm, name: itm })))
					if (res[1] && res[1].data) setCampaignBeTypeList(res[1].data.map(itm => ({ id: itm, name: itm })))
					break;
				case 'store':
					setStoreLoading({ ...storeLoading, ops2DisplayNameLoading: true })
					promiseAllRequest = ['ownership', 'status', 'ops_market_en', 'ops_2_display_name'].map(item => {
						return getMasterDataMeta({ type: 3, column: item })
					})
					res = await Promise.all(promiseAllRequest)
					if (res[0] && res[0].data) setOwnershipList(res[0].data.map(itm => ({ id: itm, name: itm })))
					if (res[1] && res[1].data) setStatusList(res[1].data.map(itm => ({ id: itm, name: itm })))
					if (res[2] && res[2].data) setOpsMarketList(res[2].data.map(itm => ({ id: itm, name: itm })))
					if (res[3] && res[3].data) {
						setOps2DisplayNameList(res[3].data.map(itm => ({ id: itm, name: itm })))
						setStoreLoading({ ...storeLoading, ops2DisplayNameLoading: false })
					}
					break;
				case 'be':
					promiseAllRequest = ['be_type', 'be_type_level_1', 'be_type_level_2', 'be_type_level_3', 'status'].map(item => {
						return getMasterDataMeta({ type: 4, column: item })
					})
					res = await Promise.all(promiseAllRequest)
					if (res[0] && res[0].data) setBEBeTypeList(res[0].data.map(itm => ({ id: itm, name: itm })))
					if (res[1] && res[1].data) setBEBeTypeLevel1List(res[1].data.map(itm => ({ id: itm, name: itm })))
					if (res[2] && res[2].data) setBEBeTypeLevel2List(res[2].data.map(itm => ({ id: itm, name: itm })))
					if (res[3] && res[3].data) setBEBeTypeLevel3List(res[3].data.map(itm => ({ id: itm, name: itm })))
					if (res[4] && res[4].data) setBEBeStatusList(res[4].data.map(itm => ({ id: itm, name: itm })))
					break;
				case 'promotion':
					promiseAllRequest = ['type', 'campaign_type'].map(item => {
						return getMasterDataMeta({ type: 5, column: item })
					})
					res = await Promise.all(promiseAllRequest)
					if (res[0] && res[0].data) setPromoTypeList(res[0].data.map(itm => ({ id: itm, name: itm })))
					if (res[1] && res[1].data) setPromoCampTypeList(res[1].data.map(itm => ({ id: itm, name: itm })))
					break;
			}
			fetchDataList()
		} catch (errInfo) {
			setLoading(false)
		}
	}

	const renderForm = () => {
		if (tabsItem.type != activeKey) return
		let result;
		switch (tabsItem.type) {
			case 'ticket':
				result = renderFormTicket()
				break;
			case 'product':
				result = renderFormProduct()
				break;
			case 'campaign':
				result = renderFormCampaign()
				break;
			case 'app':
				result = renderFormApp()
				break;
			case 'store':
				result = renderFormStore()
				break;
			case 'be':
				result = renderFormBE()
				break;
			case 'promotion':
				result = renderFormPromotion()
				break;
		}
		return result;
	}

	const renderFormTicket = () => {
		return <Row gutter={32}>
			<Col span={3}>
				<Form.Item name="campaignType" label="活动大类">
					<Select
						showSearch
						placeholder='请选择'
						allowClear
						option-filter-prop="children"
						filterOption={(input, option) => (option?.children.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}>
						{campaignTypeList.length && campaignTypeList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="campaignName" label="活动名称">
					<Input placeholder="查询活动名称" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="promotionId" label="促销ID">
					<Input placeholder="查询促销ID" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="couponId" label="券码">
					<Input placeholder="查询券码" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="coupon18Code" label="18位码">
					<Input placeholder="查询18位码" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="couponName" label="卡券名称">
					<Input placeholder="查询卡券" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="cardType" label="Card Type">
					<Select
						placeholder='请选择'
						allowClear
						showSearch
						option-filter-prop="children"
						filterOption={(input, option) => (option?.children.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}>
						{cardTypeList.length && cardTypeList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="couponCreator" label="发码方">
					<Select
						placeholder='请选择'
						allowClear
						showSearch
						option-filter-prop="children"
						filterOption={(input, option) => (option?.children.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}>
						{couponCreatorList.length && couponCreatorList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="beType" label="BE类型">
					<Select
						placeholder='请选择'
						allowClear
						showSearch
						option-filter-prop="children"
						filterOption={(input, option) => (option?.children.toLowerCase().indexOf(input.trim().toLowerCase()) >= 0)}>
						{beTypeList.length && beTypeList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
		</Row>
	}

	const renderFormProduct = () => {
		return <Row gutter={32}>
			<Col span={3}>
				<Form.Item name="baseId" label="产品编码">
					<Input placeholder="查询产品编码" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="codeType" label="产品类别">
					<Input placeholder="查询产品类别" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="itemCode" label="产品Item Code">
					<Input placeholder="查询产品Item Code" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="itemName" label="产品名称">
					<Input placeholder="查询产品名称" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="categoryLevel1" label="一级类目名称">
					<Input placeholder="查询一级类目名称" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="categoryLevel2" label="二级类目名称">
					<Input placeholder="查询二级类目名称" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="categoryLevel3" label="三级类目名称">
					<Input placeholder="查询三级类目名称" allowClear />
				</Form.Item>
			</Col>
		</Row>
	}

	const renderFormCampaign = () => {
		return <Row gutter={32}>
			<Col span={3}>
				<Form.Item name="campaignId" label="活动ID">
					<Select placeholder='请选择' allowClear>
						{campaignIdList.length && campaignIdList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="campaignName" label="活动名称">
					<Input placeholder="查询活动名称" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="campaignBeType" label="活动类型">
					<Select placeholder='请选择' allowClear>
						{campaignBeTypeList.length && campaignBeTypeList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="campaignCategoryLevel" label="活动类目">
					<Input placeholder="查询活动类目" allowClear />
				</Form.Item>
			</Col>
		</Row>
	}

	const renderFormApp = () => {
		return <Row gutter={32}>
			<Col span={3}>
				<Form.Item name="operatingSystem" label="操作系统">
					<Input placeholder="查询操作系统" allowClear />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="appMarket" label="app市场">
					<Input placeholder="查询app市场" allowClear />
				</Form.Item>
			</Col>
		</Row>
	}

	const renderFormStore = () => {
		return <Row gutter={32}>
			<Col span={3}>
				<Form.Item name="usCode" label="餐厅编码">
					<Input placeholder="查询餐厅编码" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="storeNameCn" label="餐厅中文名">
					<Input placeholder="查询餐厅中文名" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="storeNameEn" label="餐厅英文名">
					<Input placeholder="查询餐厅英文名" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="storeOpenDate" label="开业时间">
					<DatePicker.RangePicker suffixIcon={<IconFont type="icon-rili" />} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="storeCloseDate" label="闭店时间">
					<DatePicker.RangePicker suffixIcon={<IconFont type="icon-rili" />} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="ownership" label="所有权类型">
					<Select placeholder='请选择' allowClear>
						{ownershipList.length && ownershipList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="status" label="营业状态">
					<Select placeholder='请选择' allowClear>
						{statusList.length && statusList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="opsMarketEnList" label="营运市场名称">
					<Select placeholder='请选择' allowClear mode="multiple">
						{opsMarketList.length && opsMarketList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="ops2DisplayNameList" label="运营区域">
					<Select
						placeholder='请选择'
						allowClear
						mode="multiple"
						notFoundContent={storeLoading.ops2DisplayNameLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
						onChange={() => handleChangeStoreLevelQuery('ops2DisplayNameList')}>
						{ops2DisplayNameList.length && ops2DisplayNameList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="ops3DisplayNameList" label="GM">
					<Select
						placeholder='请选择'
						allowClear
						mode="multiple"
						notFoundContent={storeLoading.ops3DisplayNameLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
						onChange={() => handleChangeStoreLevelQuery('ops3DisplayNameList')}>
						{ops3DisplayNameList.length && ops3DisplayNameList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="ops4DisplayNameList" label="DO">
					<Select
						placeholder='请选择'
						allowClear
						mode="multiple"
						notFoundContent={storeLoading.ops4DisplayNameLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
						onChange={() => handleChangeStoreLevelQuery('ops4DisplayNameList')}>
						{ops4DisplayNameList.length && ops4DisplayNameList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="ops5DisplayNameList" label="OM">
					<Select
						placeholder='请选择'
						allowClear
						mode="multiple"
						notFoundContent={storeLoading.ops5DisplayNameLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
						onChange={() => handleChangeStoreLevelQuery('ops5DisplayNameList')}>
						{ops5DisplayNameList.length && ops5DisplayNameList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="ops6DisplayNameList" label="OC">
					<Select
						placeholder='请选择'
						allowClear
						mode="multiple"
						notFoundContent={storeLoading.ops6DisplayNameLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}>
						{ops6DisplayNameList.length && ops6DisplayNameList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
		</Row>
	}

	const renderFormBE = () => {
		return <Row gutter={32}>
			<Col span={3}>
				<Form.Item name="beName" label="BE名称">
					<Input placeholder="查询BE名称" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="usCode" label="餐厅号">
					<Input placeholder="查询餐厅号" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="beCode" label="BE号">
					<Input placeholder="查询BE号" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="beType" label="BE类型">
					<Select placeholder='请选择' allowClear>
						{BEBeTypeList.length && BEBeTypeList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="beTypeLevel1" label="BE大类">
					<Select placeholder='请选择' allowClear>
						{BEBeTypeLevel1List.length && BEBeTypeLevel1List.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="beTypeLevel2" label="BE小类">
					<Select placeholder='请选择' allowClear>
						{BEBeTypeLevel2List.length && BEBeTypeLevel2List.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="beTypeLevel3" label="BE明细类型">
					<Select placeholder='请选择' allowClear>
						{BEBeTypeLevel3List.length && BEBeTypeLevel3List.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="beBusinessStartDay" label="开店日期">
					<DatePicker.RangePicker suffixIcon={<IconFont type="icon-rili" />} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="beBusinessCloseDay" label="关店日期">
					<DatePicker.RangePicker suffixIcon={<IconFont type="icon-rili" />} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="status" label="开关状态">
					<Select placeholder='请选择' allowClear>
						{BEBeStatusList.length && BEBeStatusList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
		</Row>
	}

	const renderFormPromotion = () => {
		return <Row gutter={32}>
			<Col span={3}>
				<Form.Item name="promotionId" label="促销id">
					<Input placeholder="查询促销id" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="promotionName" label="促销名称">
					<Input placeholder="查询促销名称" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="types" label="促销类型">
					<Select
						placeholder='请选择'
						allowClear
						mode="multiple"
						notFoundContent={promotionLoading.typeLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
						onChange={() => handleChangePromotionLevelQuery('types')}>
						{promoTypeList.length && promoTypeList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="promotionTypes" label="促销子类型">
					<Select placeholder='请选择' allowClear mode="multiple">
						{promoSubtypeList.length && promoSubtypeList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="couponId" label="卡券id">
					<Input placeholder="查询卡券id" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="couponName" label="卡券名称">
					<Input placeholder="查询卡券名称" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="campaignTypes" label="活动大类">
					<Select
						placeholder='请选择'
						allowClear
						mode="multiple"
						notFoundContent={promotionLoading.campaignTypeLoading ? <IconLoadingFill spin /> : (<Empty></Empty>)}
						onChange={() => handleChangePromotionLevelQuery('campaignTypes')}>
						{promoCampTypeList.length && promoCampTypeList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="campaignCategories" label="活动类别">
					<Select placeholder='请选择' allowClear mode="multiple">
						{promoCampCategoryList.length && promoCampCategoryList.map(model => {
							return <Select.Option value={model.id} key={model.id}>{model.name}</Select.Option>
						})}
					</Select>
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="campaignCode" label="活动编号">
					<Input placeholder="查询活动编号" allowClear maxLength={50} />
				</Form.Item>
			</Col>
			<Col span={3}>
				<Form.Item name="campaignName" label="活动名称">
					<Input placeholder="查询活动名称" allowClear maxLength={50} />
				</Form.Item>
			</Col>
		</Row>
	}

	const handleChangeStoreLevelQuery = (curKey) => {
		let commitParams = {}, values = formMasterListRef.current?.getFieldsValue() || {}, setFn;
		switch (curKey) {
			case 'ops2DisplayNameList':
				commitParams = {
					ops2DisplayNameList: values.ops2DisplayNameList
				}
				setOps3DisplayNameList([]);
				setOps4DisplayNameList([]);
				setOps5DisplayNameList([]);
				setOps6DisplayNameList([]);
				setStoreLoading({ ...storeLoading, ops3DisplayNameLoading: true })
				setFn = setOps3DisplayNameList;
				break;
			case 'ops3DisplayNameList':
				commitParams = {
					ops2DisplayNameList: values.ops2DisplayNameList,
					ops3DisplayNameList: values.ops3DisplayNameList,
				}
				setOps4DisplayNameList([]);
				setOps5DisplayNameList([]);
				setOps6DisplayNameList([]);
				setStoreLoading({ ...storeLoading, ops4DisplayNameLoading: true })
				setFn = setOps4DisplayNameList;
				break;
			case 'ops4DisplayNameList':
				commitParams = {
					ops2DisplayNameList: values.ops2DisplayNameList,
					ops3DisplayNameList: values.ops3DisplayNameList,
					ops4DisplayNameList: values.ops4DisplayNameList,
				}
				setOps5DisplayNameList([]);
				setOps6DisplayNameList([]);
				setStoreLoading({ ...storeLoading, ops5DisplayNameLoading: true })
				setFn = setOps5DisplayNameList;
				break;
			case 'ops5DisplayNameList':
				commitParams = {
					ops2DisplayNameList: values.ops2DisplayNameList,
					ops3DisplayNameList: values.ops3DisplayNameList,
					ops4DisplayNameList: values.ops4DisplayNameList,
					ops5DisplayNameList: values.ops5DisplayNameList,
				}
				setOps6DisplayNameList([]);
				setStoreLoading({ ...storeLoading, ops6DisplayNameLoading: true })
				setFn = setOps6DisplayNameList;
				break;
		}
		getStoreLevelQuery(commitParams).then(res => {
			if (res && res.data) setFn(res.data.map(itm => ({ id: itm, name: itm })))
		}).catch(err => {
			err.msg && message.error(err.msg);
		}).finally(() => {
			setStoreLoading({
				ops2DisplayNameLoading: false,
				ops3DisplayNameLoading: false,
				ops4DisplayNameLoading: false,
				ops5DisplayNameLoading: false,
				ops6DisplayNameLoading: false
			})
		})
	}

	const handleChangePromotionLevelQuery = (curKey) => {
		let commitParams = {}, values = formMasterListRef.current?.getFieldsValue() || {}, setFn;
		switch (curKey) {
			case 'types':
				commitParams = {
					types: values.types,
					levelType: 1
				}
				setPromotionLoading({ ...storeLoading, typeLoading: true })
				setFn = setPromoSubtypeList;
				break;
			case 'campaignTypes':
				commitParams = {
					campaignTypes: values.campaignTypes,
					levelType: 2
				}
				setPromotionLoading({ ...storeLoading, campaignTypeLoading: true })
				setFn = setPromoCampCategoryList;
				break;
		}
		getPromotionLevelQuery(commitParams).then(res => {
			if (res && res.data) setFn(res.data.map(itm => ({ id: itm, name: itm })))
		}).catch(err => {
			err.msg && message.error(err.msg);
		}).finally(() => {
			setPromotionLoading({
				typeLoading: false,
				campaignTypeLoading: false
			})
		})
	}

	const handleFieldsModal = (operation) => {
		if (operation === 'ok') {
			setFieldInfoVisible(true)
		} else if (operation === 'confirm') {
			if (!showCheckedList.length) {
				message.warning('请勾选下载文件需要的字段！')
				return;
			}
			setFieldInfoVisible(false)
		} else {
			setFieldInfoVisible(false)
		}
	}

	const handleDown = () => {
		const contrast = {
			'ticket': 'TICKET',
			'product': 'PRODUCT',
			'campaign': 'CAMPAIGN',
			'app': 'APP',
			'store': 'STORE',
			'be': 'BE',
			'promotion': 'PROMOTION'
		}
		setEmailModalData({
			...emailModalData,
			isStaff: props.isStaff,
			visibleEmailInfo: true,
			downLoadApi: downloadMasterdata,
			downLoadUrl: contrast[activeKey],
			downLoadParams: {
				id: contrast[activeKey],
				columns: showCheckedList.map(it => it.nameEn)
			}
		})
	}

	const handleExploreForDownloadData = (data) => {
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
			setLoading(false)
			setEmailModalData({
				...emailModalData,
				visibleEmailInfo: false,
				isLoading: false
			})
		} else if (data.operation === 'cancel') {
			setEmailModalData({
				...emailModalData,
				visibleEmailInfo: false,
				isLoading: false,
			})
		}
	}

	const handleExploreForDownloadData2 = (data) => {
		if (data.operation === 'ok') {
			if (emailModalData.isStaff) {
				console.log('雇员取当前用户的邮箱，非雇员才取输入的邮箱')
			}
			setLoading(true)
			setEmailModalData({ ...emailModalData, isLoading: true })
			const contrast = {
				'ticket': 'TICKET',
				'product': 'PRODUCT',
				'campaign': 'CAMPAIGN',
				'app': 'APP',
				'store': 'STORE',
				'be': 'BE',
				'promotion': 'PROMOTION'
			}
			const downObj = {
				email: data.emailStr ?? '',
				columns: showCheckedList.map(it => it.nameEn)
			}
			// console.log(3434, downObj, showCheckedList)
			// return
			downloadMasterdata(contrast[activeKey], downObj).then(res => {
				const url = window.URL.createObjectURL(new Blob([res.data.fileBlob], { type: 'application/octet-stream' }))
				const link = document.createElement('a');
				link.style.display = 'none';
				link.href = url;
				let downName = res.data.fileName.replace(/"|'/g, '');
				link.setAttribute('download', downName);
				document.body.appendChild(link)
				link.click();
				document.body.removeChild(link);
				setLoading(false)
				setEmailModalData({
					...emailModalData,
					visibleEmailInfo: false,
					isLoading: false
				})
			}).catch(err => {
				message.error('下载失败');
				setLoading(false)
			})
		} else if (data.operation === 'cancel') {
			setEmailModalData({
				...emailModalData,
				visibleEmailInfo: false,
				isLoading: false,
			})
		}
	}

	//复选框
	const onChange = (hasCheckedKeys) => {
		setCheckedList(hasCheckedKeys);
		const notCheckedKeys = downloadFields.filter(itt => !hasCheckedKeys.includes(itt.nameEn)).map(itt => itt.nameEn);
		let downloadFieldKeys = downloadFields.map(item => item.nameEn);
		fields.forEach(item => {
			if (downloadFieldKeys.includes(item.nameEn)) {
				if (notCheckedKeys.includes(item.nameEn)) item.checked = false;
				if (hasCheckedKeys.includes(item.nameEn)) item.checked = true;
			}
		})
		setShowCheckedList(() => fields.filter(itt => itt.checked));
		setIndeterminate(!!hasCheckedKeys.length && hasCheckedKeys.length < downloadFields.length);
		setCheckAll(hasCheckedKeys.length === downloadFields.length);
	};

	const onCheckAllChange = (e) => {
		const hasCheckedKeys = e.target.checked ? downloadFields.map(fildItem => fildItem.nameEn) : [];
		setCheckedList(hasCheckedKeys);
		const notCheckedKeys = downloadFields.filter(itt => !hasCheckedKeys.includes(itt.nameEn)).map(itt => itt.nameEn);
		let downloadFieldKeys = downloadFields.map(item => item.nameEn);
		fields.forEach(item => {
			if (downloadFieldKeys.includes(item.nameEn)) {
				if (notCheckedKeys.includes(item.nameEn)) item.checked = false;
				if (hasCheckedKeys.includes(item.nameEn)) item.checked = true;
			}
		})
		setShowCheckedList(() => fields.filter(itt => itt.checked));
		setIndeterminate(false);
		setCheckAll(e.target.checked);
	};

	const handleSearchField = (formData) => {
		setIsLoadingFields(true);
		let tempDownloadFields = [], allCheckedList = showCheckedList.map(it => it.nameEn);
		if (formData.fields == undefined || formData.fields.trim() == '') {
			tempDownloadFields = [...fields];
		} else {
			tempDownloadFields = [...fields].filter(item => item.name.toLowerCase().indexOf(formData.fields.trim().toLowerCase()) >= 0);
		}
		let tempChecked = tempDownloadFields.filter(item => allCheckedList.includes(item.nameEn)).map(itt => itt.nameEn);
		setDownloadFields(tempDownloadFields);
		setCheckedList(tempChecked);
		setIndeterminate(!!tempChecked.length && tempChecked.length < tempDownloadFields.length);
		setCheckAll(tempChecked.length === tempDownloadFields.length);
		setIsLoadingFields(false);
	}

	useEffect(() => {
		initMeta()
	}, []);

	return <Spin spinning={isLoading}>
		<div className="table-container">
			<Form
				className="search-form"
				ref={formMasterListRef}
				layout="vertical"
				size="middle"
				onFinish={fetchDataList}>
				<div className="search-area">
					{renderForm()}
					<Row>
						<Col span={12}>
							<Space>
								<Button type="primary" htmlType="submit" loading={isLoading} onClick={() => { setTablePagenation({ ...tablePagenation, pageNo: 1 }); }}>查询</Button>
								<Button onClick={onReset}>重置</Button>
								{checkMyPermission('oap:masterdata:download') && <Button onClick={handleDown}>下载数据</Button>}
								{checkMyPermission('oap:masterdata:download') && <span style={{ color: '#ffbc0d', cursor: 'pointer' }} onClick={() => handleFieldsModal('ok')}>字段筛选</span>}
							</Space>
						</Col>
					</Row>
				</div>
			</Form>
			<div style={{ height: '12px', background: '#f6f6f6', position: 'relative' }}></div>
			<div className="table-top-wrap">
				<Table
					rowKey="customIdd"
					columns={columns}
					dataSource={dataList}
					pagination={{
						showQuickJumper: true,
						showSizeChanger: true,
						defaultPageSize: getPageSize(),
						pageSize: tablePagenation.pageSize,
						current: tablePagenation.pageNo,
						total: tablePagenation.total,
						onChange: (pageNo, pageSize) => onPageChange(pageNo, pageSize)
					}}
					scroll={{ x: '100%' }} />
			</div>
		</div>
		<ExploreEmailModal onExplored={handleExploreForDownloadData} {...emailModalData} />
		<Modal
			width={760}
			centered
			title="导出字段筛选"
			visible={fieldInfoVisible}
			cancelText="取消"
			okText="确定"
			onCancel={() => handleFieldsModal('cancel')}
			onOk={() => handleFieldsModal('confirm')}>
			<Row gutter={18}>
				<Col flex="420px" style={{ borderRight: '1px solid #ccc' }}>
					<h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>选择字段</h4>
					<Form
						className="search-form"
						layout="vertical"
						onFinish={handleSearchField}>
						<Row gutter={18}>
							<Col flex="200px">
								<Form.Item name="fields">
									<Input placeholder="搜索字段名称" allowClear />
								</Form.Item>
							</Col>
							<Col flex="120px">
								<Button type="primary" htmlType="submit" loading={isLoadingFields}>查询</Button>
							</Col>
						</Row>
					</Form>
					<Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>全选</Checkbox>
					<div style={{ maxHeight: 'calc(58vh - 82px)', overflowY: 'auto' }}>
						<Checkbox.Group value={checkedList} onChange={onChange}>
							<Row>
								{downloadFields.map(item => {
									return <Col span={12} key={item.nameEn}>
										<Checkbox value={item.nameEn}>{item.name}</Checkbox>
									</Col>
								})}
							</Row>
						</Checkbox.Group>
					</div>
				</Col>
				<Col flex="1">
					<h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>已选字段</h4>
					<div style={{ maxHeight: '58vh', overflowY: 'auto' }}>
						{showCheckedList.map(item => {
							return <div key={item.nameEn}>{item.name}</div>
						})}
					</div>
				</Col>
			</Row>
		</Modal>
	</Spin>
})

export default masterDataList;