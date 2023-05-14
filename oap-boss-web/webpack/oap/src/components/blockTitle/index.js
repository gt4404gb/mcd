import React from "react";
import {Space} from "@aurum/pfe-ui";
import './index.less'
export default function BlockTitle(props) {
    return (
        <div className="oap-block-title" style={{backgroundColor:props.background, marginBottom: props.bottom, marginTop: props.top }}>
            <i className="left-icon"></i>
            <Space>
                <span style={{fontSize:props.fontSize}}>{props.text}</span>
                {
                    React.Children.map(props.children, ele => {
                        return ele
                    })
                }
            </Space>

        </div>
    )
}