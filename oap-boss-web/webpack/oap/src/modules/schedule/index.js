import React from 'react';
import { Tabs, Modal } from '@aurum/pfe-ui';
import List from './list';
import EditForm from './form';
import Show from './show';
import { TASK_TYPE_LIST } from '@/constants';
import { optionFilterProp } from "@/utils/store/func";

export default class index extends React.Component {
    constructor(props) {
        super(props);
        this.paneList = React.createRef();
        this.pane = React.createRef();
        this.newTabIndex = 0;
        this.state = {
            activeKey: 'list',
            tabsList: [
                {
                    tabName: '任务列表',
                    key: 'list',
                    ref: this.paneList,
                    componentName: List,
                    closable: false
                },
            ]
        }
        props.cacheLifecycles.didRecover(this.judgeTabsActive)
    }

    async componentDidMount () {
        this.judgeTabsActive();
    }

    judgeTabsActive = () => {
        let record = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapScheduleCreate'))) || {};
        let { tabsList, activeKey } = this.state, type = '';
        if (record.taskType) {
            activeKey = `newTab${this.newTabIndex++}`;
            type = optionFilterProp(TASK_TYPE_LIST, 'value', record.taskType)?.label || '';
            tabsList.push({
                tabName: `${record.sliceName}-${type}`,
                key: activeKey,
                componentName: EditForm,
                closable: true,
                sliceId: record?.sliceId,
                sliceName: record?.sliceName,
                taskType: record?.taskType,
                businessCategoryName: record?.businessCategoryName,
                sqlStr: record?.sqlStr,
                limits: record?.limits
            })
            this.setState({
                tabsList,
                activeKey
            }, () => {
                sessionStorage.removeItem('oapScheduleCreate');
            })
        }
    }

    //切换tab
    handleChange = (activeKey) => {
        this.setState({
            activeKey
        });
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
        this.setState({
            tabsList,
            activeKey: 'list'
        }, () => {
            this.paneList.current?.fetchDataList();
        });

    }

    onCreateTab = (type, record = {}) => {
        let { tabsList, activeKey } = this.state, taskTypeName = '';
        let hasValue = tabsList.findIndex(itm => {
            return itm.key == record.id
        })
        activeKey = record.id;
        taskTypeName = optionFilterProp(TASK_TYPE_LIST, 'value', record.taskType)?.label || '';
        switch (type) {
            case 'show':
                if (hasValue == -1) {
                    tabsList.push({
                        tabName: `${record.taskName}-${taskTypeName}`,
                        key: activeKey,
                        componentName: Show,
                        closable: true,
                        id: record.id,
                        taskType: record?.taskType,
                    })
                } else {
                    tabsList[hasValue] = {
                        ...tabsList[hasValue],
                        componentName: Show,
                    }
                }
                break;
            case 'edit':
                if (hasValue == -1) {
                    tabsList.push({
                        tabName: `${record.taskName}-${taskTypeName}`,
                        key: activeKey,
                        componentName: EditForm,
                        closable: true,
                        id: record.id,
                        taskType: record?.taskType,
                    })
                } else {
                    tabsList[hasValue] = {
                        ...tabsList[hasValue],
                        componentName: EditForm,
                    }
                }
                break;
        }
        this.setState({ tabsList, activeKey })
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
                            sliceId={pane?.sliceId}
                            sliceName={pane?.sliceName}
                            taskType={pane?.taskType}
                            businessCategoryName={pane?.businessCategoryName}
                            sqlStr={pane?.sqlStr}
                            limits={pane?.limits}
                            id={pane?.id}
                            onBack={() => this.onBackToIndex(pane.key)}
                            onCreate={this.onCreateTab} />
                    </Tabs.TabPane>
                })}
            </Tabs>
        </div>
    }
}