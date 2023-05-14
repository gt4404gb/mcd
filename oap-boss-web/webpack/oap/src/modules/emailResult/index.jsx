import React from 'react';
import {Spin, Empty, message} from '@aurum/pfe-ui';
import {
    confirmEmail
} from '@/api/dam/analysisScene';

// 获取url参数
function getAllUrlParams(urls) {
    var url = urls || location.href
    // 用JS拿到URL，如果函数接收了URL，那就用函数的参数。如果没传参，就使用当前页面的URL
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
    // 用来存储我们所有的参数
    var obj = {};
    // 如果没有传参，返回一个空对象
    if (!queryString) {
        return obj;
    }
    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];
    // 将参数分成数组
    var arr = queryString.split('&');
    for (var i = 0; i < arr.length; i++) {
        // 分离成key:value的形式
        var a = arr[i].split('=');
        // 将undefined标记为true
        var paramName = a[0];
        var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];
        if (paramName.match(/\[(\d+)?\]$/)) {
            // 如果paramName不存在，则创建key
            var key = paramName.replace(/\[(\d+)?\]/, '');
            if (!obj[key]) obj[key] = [];
            // 如果是索引数组 e.g. colors[2]
            if (paramName.match(/\[\d+\]$/)) {
                // 获取索引值并在对应的位置添加值
                var index = /\[(\d+)\]/.exec(paramName)[1];
                obj[key][index] = paramValue;
            } else {
                // 如果是其它的类型，也放到数组中
                obj[key].push(paramValue);
            }
        } else {
            // 处理字符串类型
            if (!obj[paramName]) {
                // 如果如果paramName不存在，则创建对象的属性
                obj[paramName] = paramValue;
            } else if (obj[paramName] && typeof obj[paramName] === 'string') {
                // 如果属性存在，并且是个字符串，那么就转换为数组
                obj[paramName] = [obj[paramName]];
                obj[paramName].push(paramValue);
            } else {
                // 如果是其它的类型，还是往数组里丢
                obj[paramName].push(paramValue);
            }
        }
    }
    return obj;
}
class EmailResult extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            imgName: '',
            description: '',
        }
    }
    componentDidMount() {
        // type为0-业务域的返回
        // type为1-分析场景的返回
        // status = 1:同意,2:拒绝,3:失效
        this.setState(state => ({
            ...state,
            isLoading: true,
        }), () => {
            let urlParams = getAllUrlParams();
            confirmEmail(urlParams).then(res => {
                console.log('urlParams = ', urlParams);
                console.log('res = ', res);
                let imgName_ = '', description_ = '';
                if (urlParams.type == 0) {
                    switch(res.data.status) {
                        case 1: imgName_ = 'person/success'; description_ = `非常感谢!您已确认接受担任[${res.data.categoryName}]业务域的[${res.data.typeName}业务负责人]，您将对该业务域下相关[${res.data.typeName}]的业务内容负责。`;break;
                        case 2: imgName_ = 'person/empty-data'; description_ = `您已拒绝接受担任[${res.data.categoryName}]业务域的[${res.data.typeName}业务负责人].`;break;
                        case 3: imgName_ = 'person/empty-search-result'; description_ = '流程失效或您已完成操作，请忽略本次通知。';break;
                        default: imgName_ = ''; description_ = '';break;
                    }
                } else if (urlParams.type == 1) {
                    switch(res.data.status) {
                        case 1: imgName_ = 'person/success'; description_ = '非常感谢!您已确认接受担任分析场景的业务负责人，您将对该场景下业务内容负责。';break;
                        case 2: imgName_ = 'person/empty-data'; description_ = '您已拒绝担任本次分析场景的业务负责人，请忽略本次通知。';break;
                        case 3: imgName_ = 'person/empty-search-result'; description_ = '流程失效或您已完成操作，请忽略本次通知。';break;
                        default: imgName_ = ''; description_ = '';break;
                    }
                }
                this.setState({
                    isLoading: false,
                    imgName: imgName_,
                    description: description_,
                })
            }).catch(err => {
                message.error(err?.msg || err?.message || '网络异常，请稍后重试');
            })
        })
    }
    render () {
        const {isLoading, imgName, description} = this.state;
        return (
            <Spin spinning={isLoading}>
                <Empty 
                    imgName={imgName}
                    description={description}
                />
                {/* <div>邮件结果通知页: 当前页面，根据负责人确认情况，展示不同的提示信息。具体显示需结合实际业务对应开发~</div> */}
            </Spin>
        );
    }
}
export default EmailResult;