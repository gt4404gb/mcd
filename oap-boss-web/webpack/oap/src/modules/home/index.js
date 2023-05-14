import React from 'react';
import { Tabs, Modal } from '@aurum/pfe-ui';
import List from './list';
import TemplateList from './template';
import Analysis from '../analysis/Index'
import AnalysisKirin from '../analysisKirin/index';
import ChooseData from './components/chooseData';
import { querySubjectModelByLevel } from '@/api/oap/self_analysis.js';

class index extends React.Component {
    constructor(props) {
        super(props);
        this.paneList = React.createRef();
        this.templateList = React.createRef();
        this.kirinPage = React.createRef();
        this.tabsList = [
            {
                tabName: '列表页',
                key: 'list',
                ref: this.paneList,
                componentName: List,
                closable: false
            },
            {
                tabName: '分析模板',
                key: 'templateList',
                ref: this.templateList,
                componentName: TemplateList,
                closable: false
            },
            // {
            //     tabName: '麒麟',
            //     key: 'kirin',
            //     ref: this.kirinPage,
            //     componentName: AnalysisKirin,
            //     closeable: false,
            // }
        ]
        this.newTabIndex = 0
        this.state = {
            tabsList: this.tabsList,
            activeKey: 'list',
            visibleChooseData: false,
            subjectModel: []
        }
        props.cacheLifecycles.didRecover(this.judgeTabsActive)
    }

    async componentDidMount () {
        this.judgeTabsActive();
        await this.getSubjectModel();
    }

    judgeTabsActive = () => {
        let record = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapHomeModelInfo'))) || {};
        if ((record?.modelId ?? '') !== '') { //modelId存在
            if (record.isOpenTemplate) {
                this.onCreateAnalysis('template', {
                    id: record.sliceId,
                    businessId: record.modelId,
                    businessDomain: record.businessDomain,
                    tableType: record.tableType,
                    templateName: record.templateName,
                    isTemplate: record.isOpenTemplate,
                })
            } else {
                this.onCreateAnalysis('create', {
                    id: record.modelId,
                    tableType: record.tableType,
                    businessName: record.businessName,
                    modelNameByCode: record.modelNameByCode,
                });
            }
            sessionStorage.removeItem('oapHomeModelInfo');
        } else {
            const activeInfo = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapHomeActiveTab'))) || {};
            this.setState({
                activeKey: activeInfo.activeTab ? activeInfo.activeTab : 'list'
            }, () => {
                sessionStorage.removeItem('oapHomeActiveTab');
            });
        }
    }

    //切换tabs
    handleChange = (activeKey) => {
        this.setState({
            activeKey
        }, () => {
            activeKey === '1' && this.paneList.current?.fetchDataList()
            sessionStorage.setItem('oapHomeActiveTab', encodeURIComponent(JSON.stringify({ activeTab: activeKey })))
        });
    }

    onEdit = (targetKey, action) => {
        this[action](targetKey);
    };

    // 删除tabs
    remove = (targetKey) => {
        // 提示确认
        Modal.confirm({
            title: "确认要关闭吗？",
            content: (<>关闭会导致数据丢失，是否继续?</>),
            cancelText: "取消",
            okText: "确定",
            onOk: () => {
                let { activeKey, tabsList } = this.state, currentIndex;
                let tempTabsList = tabsList.reduce((pre, cur, index) => {
                    if (cur.key === targetKey) currentIndex = index;
                    cur.key !== targetKey && pre.push(cur)
                    return pre
                }, []);
                if (tempTabsList.length && activeKey === targetKey) {
                    if (tempTabsList.length == 2) {
                        activeKey = tempTabsList[0].key;
                    } else if (currentIndex == tempTabsList.length) {
                        activeKey = tempTabsList[currentIndex - 1].key;
                    } else {
                        activeKey = tempTabsList[currentIndex].key;
                    }
                }
                this.setState({
                    tabsList: tempTabsList,
                    activeKey
                });
            }
        })
    }

    onCreateAnalysis = (type, record = {}) => {
        let { tabsList, activeKey } = this.state;
        switch (type) {
            case 'create':
                activeKey = `newTab${this.newTabIndex++}`;
                tabsList.push({
                    tabName: `创建分析-${this.newTabIndex}`,
                    key: activeKey,
                    //componentName: record.tableType === 0 ? Analysis : AnalysisKirin,
                    componentName: [0, 2].includes(record.tableType) ? Analysis : AnalysisKirin,
                    closable: true,
                    modelId: record.id || '',
                    tableId: record.tableId || '',
                    projectId: record.projectId || '',
                    tableName: record.tableName || '',
                    projectName: record.projectName || '',
                    tableType: record.tableType,
                    type,
                    localCopyUid: '',
                    business: record.businessName,
                    businessDomain: record.modelNameByCode,
                })
                break;
            case 'edit':
                let hasValue = tabsList.findIndex(itm => {
                    return itm.key == record.id
                })
                activeKey = record.id;
                if (hasValue == -1) {
                    tabsList.push({
                        tabName: `编辑分析-${record.sliceName}`,
                        key: activeKey,
                        //componentName: record.tableType === 0 ? Analysis : AnalysisKirin,
                        componentName: [0, 2].includes(record.tableType) ? Analysis : AnalysisKirin,
                        closable: true,
                        sliceId: record.id || null, //单条数据ID
                        modelId: record.datasourceId || null,
                        tableId: record.tableId || '',
                        projectId: record.projectId || '',
                        tableName: record.tableName || '',
                        projectName: record.projectName || '',
                        tableType: record.tableType,
                        type,
                        localCopyUid: '',
                        business: record.businessName,
                        businessDomain: record.datasourceName,
                    })
                }
                break;
            case 'copy':
                activeKey = `newTab${this.newTabIndex++}`;
                tabsList.push({
                    tabName: `创建分析-${this.newTabIndex}duplicated`,
                    key: activeKey,
                    //componentName: record.tableType === 0 ? Analysis : AnalysisKirin,
                    componentName: [0, 2].includes(record.tableType) ? Analysis : AnalysisKirin,
                    closable: true,
                    sliceId: record.sliceId,
                    modelId: record.modelId,
                    tableId: record.tableId || '',
                    projectId: record.projectId || '',
                    tableName: record.tableName || '',
                    projectName: record.projectName || '',
                    tableType: record.tableType,
                    type,
                    localCopyUid: record.localCopyUid,
                    business: record.business,
                    businessDomain: record.businessDomain,
                })
                break;
            case 'template':
                activeKey = `template${this.newTabIndex++}`;
                tabsList.push({
                    tabName: `编辑模板-${record.templateName}-${this.newTabIndex}`,
                    key: activeKey,
                    //componentName: record.tableType === 0 ? Analysis : AnalysisKirin,
                    componentName: [0, 2].includes(record.tableType) ? Analysis : AnalysisKirin,
                    closable: true,
                    sliceId: record.id,
                    modelId: record.businessId,
                    tableId: record.tableId || '',
                    projectId: record.projectId || '',
                    tableName: record.tableName || '',
                    projectName: record.projectName || '',
                    tableType: record.tableType,
                    type,
                    isTemplate: record.isTemplate,
                    business: record.businessName,
                    businessDomain: record.businessDomain,
                })
                break;
        }
        this.setState({ tabsList, activeKey })
    }

    //回到首页
    onBackToIndex = (targetKey) => {
        let lastIndex;
        this.state.tabsList.forEach((pane, i) => {
            if (pane.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const tabsList = this.state.tabsList.filter(pane => pane.key !== targetKey);
        this.setState({ tabsList, activeKey: 'list' });
        console.log(323232, this.paneList)
        this.paneList.current?.fetchDataList();
    }

    //选择弹框的显示与隐藏
    changeChooseDataVisible = (visible) => {
        this.setState({
            visibleChooseData: visible,
        })
    }

    getSubjectModel = async () => {
        try {
            let res = await querySubjectModelByLevel();
            this.setState({
                subjectModel: res.data
            });
        } catch (err) { }
    }

    completeChoose = (record) => {
        this.onCreateAnalysis('create', record);
    }

    changeTabsName = (newName, sliceId) => {
        console.log('newName2 = ', newName);
        if (newName) {
            let { tabsList } = this.state;
            let activeTabsIndex = tabsList.findIndex(it => it.key === this.state.activeKey);
            //if (tabsList[activeTabsIndex] && tabsList[activeTabsIndex].tableType > 0) {
            if (tabsList[activeTabsIndex] && tabsList[activeTabsIndex].tableType == 1) {
                tabsList[activeTabsIndex].tabName = `编辑分析-${newName}`;
                tabsList[activeTabsIndex].type = 'edit';
                tabsList[activeTabsIndex].sliceId = sliceId || '';
                this.setState({
                    tabsList: tabsList,
                })
            }
        }
    }

    render () {
        return <div className="oap-tabs-container">
            <Tabs
                activeKey={this.state.activeKey}
                onChange={this.handleChange}
                type="editable-card"
                hideAdd
                onEdit={this.onEdit}
                className="oap-tabss">
                {this.state.tabsList.map(pane => {
                    const ComponentName = pane.componentName
                    return <Tabs.TabPane tab={pane.tabName} key={pane.key} closable={pane.closable}>
                        <ComponentName
                            ref={pane?.ref}
                            onCreate={this.onCreateAnalysis}
                            onBack={() => this.onBackToIndex(pane.key)}
                            onChooseData={() => this.changeChooseDataVisible(true, pane)}
                            onResetTabsName={(newName, sliceId) => this.changeTabsName(newName, sliceId)}
                            sliceId={pane.sliceId}
                            modelId={pane.modelId}
                            tableId={pane.tableId}
                            tableName={pane.tableName}
                            projectId={pane.projectId}
                            projectName={pane.projectName}
                            activeKey={pane.key}
                            tableType={pane.tableType}
                            type={pane.type}
                            localCopyUid={pane.localCopyUid}
                            business={pane.business}
                            businessDomain={pane.businessDomain}
                            subjectModelList={this.state.subjectModel} />
                    </Tabs.TabPane>
                })}
            </Tabs>
            <ChooseData
                visible={this.state.visibleChooseData}
                subjectModelList={this.state.subjectModel}
                completeChoose={this.completeChoose}
                changeVisible={this.changeChooseDataVisible} />
        </div>
    }
}

export default index;