import React, { useEffect, useState } from 'react';
import {
    Radio,
    Button,
    Input,
    message,
    Row,
    Col
} from '@aurum/pfe-ui';
import '@/assets/styles/shopselection/ShopSelection.less';
import ShopSelectionCard from '@/components/ShopSelectionCard'
import { useRef } from 'react';
const ShopSelection = ((props: any, ref: any) => {
    const { callBackFunc, callSearchFunc, shopSelectionData, defaultSelectData, basePage } = props
    const [value, setValue] = useState(defaultSelectData)
    const [leftData, setLeftData] = useState([{
        id: ""
    }])
    const [rightData, setRightData] = useState([{
        id: ""
    }])
    const POSTION = {
        LEFT: 'LEFT',
        RIGHT: 'RIGHT'
    }
    let searchOrderId = useRef('');


    const seleceShop = (selectData: any) => {
        callBackFunc(selectData, false)
    }
    useEffect(() => {
        if (shopSelectionData) {
            let leftData = [],
                rightData = [];
            for (let i = 0; i < shopSelectionData.length; i += 2) {
                leftData.push(shopSelectionData[i])
                const j = i + 1;
                if (shopSelectionData[j]) {
                    rightData.push(shopSelectionData[j])
                }
            }
            if (leftData.length > 0 || rightData.length > 0) {
                setRightData(rightData)
                setLeftData(leftData)
            }
        }
    }, [shopSelectionData])

    const returnCardList = (data: any, postion: string) => {
        switch (postion) {
            case POSTION.LEFT:
                const returnlLeftElementList = data.map((cardData: any) => {
                    const selectData = {
                        id: cardData.id,
                        name: cardData.name
                    }
                    return <div className="gutter_row_left" key={cardData.id} onClick={() => { seleceShop(selectData) }}>
                        <div className="gutter-wrapper gutter_row_left_card_container">
                            <ShopSelectionCard name={cardData.name} mode={cardData.pays} className="gutter_row_left_card" treeData={cardData.cats} />
                        </div>
                    </div>
                })
                return returnlLeftElementList;
                break;
            case POSTION.RIGHT:
                const returnlRightElementList = data.map((cardData: any) => {
                    const selectData = {
                        id: cardData.id,
                        name: cardData.name
                    }
                    return <div className="gutter_row_right" key={cardData.id} onClick={() => { seleceShop(selectData) }}>
                        <div className="gutter-wrapper gutter_row_right_card_container">
                            <ShopSelectionCard name={cardData.name} mode={cardData.pays} className="gutter_row_right_card" treeData={cardData.cats} />
                        </div>
                    </div>
                })
                return returnlRightElementList;
                break;
        }
    }

    const changeText = (e: any) => {
        searchOrderId.current = e.target.value;
    }

    return (<div className="shop_selection">
        {basePage === 'orders' && <div className="shop_input">
            <div className='check_container'>
                <Row gutter={32} className="form-block">
                    <Col className="gutter-row" span={6}>
                        <Input placeholder="请输入订单号" onChange={(e) => changeText(e)} />
                    </Col>
                    <Col className="gutter-row" span={6}>
                        <Button className="check_button" onClick={() => {
                            if (searchOrderId.current.replace(/^\s*|\s*$/g, "") == '') {
                                message.error('请输入订单号');
                                return
                            }
                            callSearchFunc(searchOrderId.current)
                        }
                        }>查询</Button>
                    </Col>
                </Row>
            </div>
            <div className="shop_input_desc">输入订单号点击查询后，会直接跳转到该订单的订单详情页，需要查询订单列表，请进入到对应的店铺查看</div>
        </div>}
        {shopSelectionData.length > 0 && <div className='shop_selection_title'>选择店铺</div>}
        <div className="shop_selection_radio_group">
            <div className="shop_selection_container">
                <div className="shop_selection_container_row">
                    <div className="shop_selection_container_left_container">
                        {leftData[0]?.id && returnCardList(leftData, POSTION.LEFT)}
                    </div>
                    <div className="shop_selection_container_right_container">
                        {rightData[0]?.id && returnCardList(rightData, POSTION.RIGHT)}
                    </div>
                </div>
            </div>
        </div>

    </div>)
})
export default ShopSelection;


