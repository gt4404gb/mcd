import React, { useState } from 'react';
import { IconFont } from '@aurum/pfe-ui';
import '@/assets/styles/distribution/tableCell.less'
export default (({ cellsData = {
    name: "", lasModify: "", freightInformation: [{
        'DISTRIBUTIONAREA': '',
        'FIRSTARTICLE': '',
        'CONTINUATION': '',
        'FREIGHT': '',
        'RENEW': ''
    }]
}, index = 0 }) => {
    const [showChild, setShowChild] = useState(false)

    const deleteModule = () => {

    }
    const modifyModule = () => {

    }
    const copyModule = () => {

    }
    return <div>
        <div className="table-cell">
            <div className="table-cell-header">
                <div>{cellsData.name}</div>
                <div className="operation-button">
                    <div>最后编辑时间：{cellsData.lasModify}</div>
                    <a className="button-margin" onClick={copyModule}>复制模版</a>
                        -
                        <a className="button-margin" onClick={modifyModule}>修改</a>
                        -
                        <a className="button-margin" onClick={deleteModule}>删除</a>
                    <div className='icon-outline' onClick={() => {
                        setShowChild(!showChild)
                    }}>
                        {showChild ? <IconFont type="icon-xiangshang" /> : <IconFont type="icon-xiangxia" />}
                    </div>
                </div>
            </div>
            {showChild && cellsData.freightInformation && cellsData.freightInformation.map((data: any, index) => {
                const textTitle = index > 0 ? "title" : "title cell-header";
                return <div className="table-cell-body" key={Math.random()}>
                    <div className="cell-container">
                        <div className={index > 0 ? "distribution-area" : "distribution-area cell-header"}>{data.DISTRIBUTIONAREA}</div>
                        <div className="freight-information">
                            <p className={textTitle} >{data.FIRSTARTICLE}</p>
                            <p className={textTitle}>{data.FREIGHT}</p>
                            <p className={textTitle}>{data.CONTINUATION}</p>
                            <p className={textTitle}>{data.RENEW}</p>
                        </div>
                    </div>
                </div>
            })}
        </div>
    </div>
})
