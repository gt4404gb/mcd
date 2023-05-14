import React, { useEffect, useState } from 'react';
import '@/assets/styles/shopselection/ShopSelectionCard.less';
import {
    Tree
} from '@aurum/pfe-ui';
const ShopSelectionCard = ((props: any, ref: any) => {
    let { name, mode, treeData } = props
    const [currentTreeData,setCurrentTreeData] = useState([]);
    const stringTreeData = JSON.stringify(treeData);


    useEffect(() => {
        const getTreeData = stringTreeData.replace(/name/g,'title').replace(/subCategories/g,'children').replace(/ruleId/g,'key')
        treeData = JSON.parse(getTreeData)
        setCurrentTreeData(treeData)
    }, [JSON.stringify(stringTreeData)])

    return (<div className="shop_selection_card">
        <div className="shop_selection_card_standing_position"></div>
        <div className='shop_selection_card_container'>
            <div className='shop_selection_card_title'>{name}</div>
            <div className='shop_selection_card_shop_category'>
                <p className='shop_selection_card_shop_category_title'>
                    商店类目：
                </p>
                <Tree
                    className='shop_selection_card_shop_category_tree'
                    style={{backgroundColor:"rgb(246, 246, 246)"}}
                    treeData={currentTreeData}
                />
            </div>
            <div className='shop_selection_card_shop_pay'>
                <p className='shop_selection_card_shop_pay_font'>
                    支付方式：
                </p>
                <div className='shop_selection_card_shop_pay_font'>{mode}</div>
            </div>
        </div>
    </div>
    )
})
export default ShopSelectionCard;


