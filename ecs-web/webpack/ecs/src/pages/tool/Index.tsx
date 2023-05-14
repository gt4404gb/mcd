import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux'
import { Input, Button, Row, Col } from '@aurum/pfe-ui';
const { TextArea } = Input;
import { $fileDownload } from "@/common/net/tools";
export default(() => {
    const _value: any = useRef('');
    const onChange = (e:any) => {
        _value.current = e.target.value
    };
    const create = () => {
        (async () => {
            const hh = await $fileDownload('https://api-uat.mcdchina.net/bff/market/poster/create/minicode?noSign=1', {
                method: 'post',
                data: _value.current
            })
        })()
    }

    const createOfficial = () => {
        (async () => {
            const hh = await $fileDownload('https://api.mcd.cn/bff/market/poster/create/minicode?noSign=1', {
                method: 'post',
                data: _value.current
            })
        })()
    }

    return <div className="distribution-edit">
        <div className="inner-container" >
            <div style={{fontSize:'22px'}}>太阳码生成工具</div>
            <br />
            <div style={{color:'#f00'}}>（ps:码会下载到本地，请打开本地下载的文件查看,按需生成）</div>
            <br />
            <Row>
                <Col span={12}>
                    <TextArea rows={4} disabled defaultValue='实例：{
                        "scene":"shopId=4&spuId=272",
                        "page":"mall/pages/mallgift/index",
                         "isHyaline":false,
                         "width":480
                        }' />
                </Col>
            </Row>
            <br />
            <Row>
                <Col span={12}>
                    <TextArea rows={4} onChange={onChange} />
                </Col>
            </Row>
            <br />
            <Row>
                <Col span={6}>
                    <Button type="primary" onClick={create}>生成内测版太阳码</Button>
                </Col>
                <Col span={6}>
                    <Button type="primary" onClick={createOfficial}>生成正式版太阳码</Button>
                </Col>
            </Row>
        </div>
    </div>
});