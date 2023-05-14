import React from 'react';
import { Spin,Tree,Button,Image,Empty } from '@aurum/pfe-ui';
import {
    IconDownloadFiles,
    IconLinkB,
} from '@aurum/icons';
import {
    // getLeftTreeData,
    getMenuPage,
} from '@/api/oap/guide_analysis';
import {
    downloadFile 
} from '@/api/oap/commonApi';
import SearchInput from '@/components/SearchInput';
import '@/style/editor-custom.less';
import { message } from '@mcd/portal-components';
import { saveAs } from 'file-saver';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import parse from 'html-react-parser';

const fieldNames = {
    title: 'title',
    key: 'key',
    children: 'children'
};
export default class FastEntrance extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            treeData: [{
                title: '快速入门',
                key: '0-0',
            }],
            defaultData: [{
                title: '快速入门',
                key: '0-0',
            }],
            selectTreeKeys: ['0-0'],
            expandedKeys: [],
            autoExpandParent: true,
            defaultSelectedKeys: ['0-0'],
            pageData: {
                content: '',
                title: '快速入门',
                type: 0,
                id: '',
                attachments: [],
                systemTemplates: [],
                systemTemplatesVo: [],
            },
            bigSizeShow: false,
        }

    }  
    componentDidMount() {
        getMenuPage({
            scope: 'menu',
            type: 0,
        }).then(res => {
            console.log('快速入门富文本res = ', res);
            if (res.data) {
                let content_deal = res.data.content;
                let that = this;
                content_deal = parse(content_deal, {
                    replace: domNode => {
                        console.log('domNode = ', domNode);
                        if (domNode.name == 'img') {
                            return <Image scale={'16/9'} alt="no data" src={domNode.attribs.src} width={domNode.attribs.width} className='img_has_click' rootClassName='img_root_name' onClick={(e) => that.imgClick(e)} />
                        }
                    }
                });
                this.setState({
                    pageData: {
                        title: res.data.title,
                        id: res.data.id,
                        type: res.data.type,
                        content: content_deal, // res.data.content,
                        attachments: res.data.attachments,
                        systemTemplates: res.data.systemTemplates,
                        systemTemplatesVo: res.data.systemTemplatesVo
                    }
                })
            }
        }).catch(err => {
            // message.error(err.msg || '查询快速入门富文本失败了')
            console.log(err.msg || '查询快速入门富文本失败了')
        })
    }
    componentDidUpdate() {
        console.log('1-update');
    }
    imgClick = (e) => {
        console.log('11111');
    }
    loopSon = (list, keyWords, attrs) => {
        return list.reduce((total, cur) => {
            if ((cur[attrs.title]).trim().toLowerCase().includes(keyWords)) {
                console.log('cur = ', cur);
                total.push(cur);
            } else {
                if (cur[attrs.children] && cur[attrs.children].length) {
                    let childList = this.loopSon(cur[attrs.children], keyWords, attrs);
                    if (childList && childList.length > 0) {
                        console.log('childList = ', childList);
                        cur[attrs.children] = [...childList]
                        total.push(cur);
                    }
                }
            }
            return total;
        }, [])
    }
    firstDeep = (data, attrs, res) => {
        if (data && data.length) {
            res.push(data[0][attrs.key]);
            if (data[0][attrs.children] && data[0][attrs.children].length > 0) {
                this.firstDeep(data[0][attrs.children], attrs, res);
            }
        }
        return res;
    }
    handleSearchField = (keyWords) => {
		console.log('keyWords = ', keyWords);
        keyWords = keyWords.trim().toLowerCase();
		// 根据keyWords再做些筛选
        let opList = JSON.parse(JSON.stringify(this.state.defaultData)), attrs = fieldNames;
        if (keyWords) {
            let result = this.loopSon(opList, keyWords, attrs);
            let exIds = this.firstDeep(result, attrs, []);
            console.log('exIds = ', exIds);

            this.setState({
                treeData: [...result],
                expandedKeys: exIds,
            })
        } else {
            this.setState({
                treeData: [...opList]
            })
        }
	}
    handleSelectTree = (selectedKeys, event) => {
		setSelectTreeKeys(selectedKeys)
		props.onSelected({ selectedKeys: selectedKeys[0], curTab })
	}
    onExpand = expandedKeysValue => {
        console.log('onExpand', expandedKeysValue);
        setExpandedKeys(expandedKeysValue);
        setAutoExpandParent(false);
    };
    createDownloadFileEle = (list=[]) => {
        let ele = (<div className='no-data'>暂无附件</div>);
        if (list && list.length > 0) {
            ele = list.map(it => {
                return (<div key={it.id} className='page-attachment-line'><Button key={it.id} type="link" onClick={() => this.downFile(it)} icon={<IconDownloadFiles />}>{it.fileName}</Button></div>)
            })
        } 
        return ele;
    }
    createLinkUrlEle = (list=[]) => {
        let ele = (<div className='no-data'>暂无案例</div>);
        if (list && list.length > 0) {
            ele = list.map(it => {
                return (<div key={it.id} className='page-template-line'><Button key={it.id} type="link" onClick={() => this.goAnalysisLink(it)} icon={<IconLinkB />}>{it.templateName}</Button></div>)
            })
        }
        return ele;
    }
    downFile = (fileData) => {
        this.setState({
            isLoading: true
        }, () => {
            downloadFile(fileData.id).then(res => {
                const blob = res.data.fileBlob;
                let downName = res.data.fileName.replace(/"/g, '');
                saveAs(blob, downName);
                message.success("文件下载成功！")
            }).catch(err => {
                message.error('下载失败');
            }).finally(() => {
                this.setState({
                    isLoading: false
                })
            })
        })
    }
    goAnalysisLink = (record) => {
        // 去自助取数-分析模板-打开模板详情页
        let pathname = '/oap/home', tabNameZh = '自助取数';
        sessionStorage.setItem('oapHomeModelInfo', encodeURIComponent(JSON.stringify({
            sliceId: record.id,
            modelId: record.businessId,
            businessDomain: record.businessCategoryName,
			tableType: record.tableType,
            templateName: record.templateName,
            isOpenTemplate: true,
		})));
        const params = {
            tabNameZh: tabNameZh,
            tabNameEn: tabNameZh,
            path: pathname,
        };
        window.EventBus && window.EventBus.emit("setAppTab", null, params);
    }
    render() {
        const {isLoading, treeData, selectTreeKeys, expandedKeys, autoExpandParent, defaultSelectedKeys} = this.state;
        return <Spin spinning={isLoading} size={{height: 'calc(100vh - 48px)'}}>
            <div className='oap-container editor-custom-page'>
                <div className='left-menu-content'>
                    <div style={{ margin: '10px 0', padding: '0 8px' }}>
                        <SearchInput placeholder={`搜索名称`} btnWidth={40} disabled={false} onSearch={(str) => this.handleSearchField(str)} />
                    </div>
                    <div className='tree-data-content'>
                        <Tree
                            treeData={treeData}
                            fieldNames={fieldNames}
                            blockNode
                            className='oap-tree'
                            selectedKeys={selectTreeKeys}
                            expandedKeys={expandedKeys}
                            autoExpandParent={autoExpandParent}
                            defaultSelectedKeys={defaultSelectedKeys}
                            onSelect={this.handleSelectTree}
                            onExpand={this.onExpand}
                        />
                    </div>
                </div>
                <div className='right-page-content'>
                    <div className='page-details page-common-style'>
                        <div className='page-title-head'>
                            <div className='page-title-head-name'>{this.state.pageData.title}</div>
                            {/* <span className='page-title-head-link'>复制链接</span> */}
                            <CopyToClipboard key="copy" text={window.location.href} onCopy={() => message.success('链接复制成功！')}><span className='page-title-head-link'>复制链接</span></CopyToClipboard>
                        </div>
                        {/* <div className='page-content-body' dangerouslySetInnerHTML={{ __html: this.state.pageData.content }}>
                           
                        </div> */}
                        {
                            this.state.pageData.content ? <div className='page-content-body'>{this.state.pageData.content}</div>: <Empty />
                        }
                    </div>
                    {
                        this.state.pageData?.attachments.length ? <div className='page-attachment page-common-style'>
                            <div className='page-title-head'>
                                <div className='page-title-head-name'>附件</div>
                            </div>
                            <div className='page-attachment-group'>
                                {
                                    this.createDownloadFileEle(this.state.pageData?.attachments)
                                }
                            </div>
                        </div>: null
                    }
                    {
                        this.state.pageData?.systemTemplatesVo.length ? <div className='page-template page-common-style'>
                            <div className='page-title-head'>
                                <div className='page-title-head-name'>案例实操</div>
                            </div>
                            <div className='page-template-group'>
                                {
                                this.createLinkUrlEle(this.state.pageData?.systemTemplatesVo)
                                }
                            </div>
                        </div>: null
                    }
                </div>
            </div>
        </Spin>
    }
}