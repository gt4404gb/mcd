import React, { useState, useRef, useEffect } from 'react';
import { Spin, Tabs } from '@aurum/pfe-ui';
import Dashboard from './components/Dashboard';
import MonitorBorad from './components/Monitorboard';
import Report from './components/Report';
import DemandForm from './components/DemandForm';
import { uuid } from '@/utils/store/func';
import { checkMyPermission } from '@mcd/portal-components/dist/utils/common';

const [stableDemand, stableReport, stableMonitor] = ['stable-1', 'stable-2', 'stable-3'];
const DemandBoard = (props, ref) => {
    const [loading, setLoading] = useState(false);
    const [activeTabKey, setActiveTabKey] = useState('stable-1');
    const demandRef = useRef();
    const stableDemandTab = {
        tabsTitle: '需求看板',
        key: stableDemand,
        component: Dashboard,
        closable: false,
        cardType: 'fixed',
        ref: demandRef,
    }
    const stableReportTab = {
        tabsTitle: '报告概览',
        key: stableReport,
        component: Report,
        closable: false,
        cardType: 'fixed',
    }
    const stableMonitorTab = {
        tabsTitle: '公共层监控看板',
        key: stableMonitor,
        component: MonitorBorad,
        closable: false,
        cardType: 'fixed'
    }
    const [tabsList, setTabsList] = useState([])
    useEffect(() => {
        setLoading(false);
        let arr = [];
        if (checkMyPermission('oap:demand:tag')) {
            arr.push(stableDemandTab)
        }
        if (checkMyPermission('oap:reportOverview:tag')) {
            arr.push(stableReportTab)
        }
        if (checkMyPermission('oap:publicFloorSignage:tag')) {
            arr.push(stableMonitorTab)
        }
        setTabsList(arr)
    }, [])

    const handleTabsChange = (activeKey) => {
        setActiveTabKey(activeKey);
    }

    const addTabs = (issueKey, tabType) => {
        const newPanes = [...tabsList];
        let len = newPanes.filter(it => it.cardType === 'create').length + 1;
        let newTitle = `需求看板-${len}`, newKey = `${uuid()}`;
        let obj = {
            tabsTitle: tabType == 'edit' ? issueKey : newTitle,
            key: newKey,
            component: DemandForm,
            closable: true,
            cardType: tabType,
            issueKey: issueKey,
        }
        if (tabType === 'edit') {
            let hasValue = newPanes.findIndex(itm => {
                return itm.issueKey == issueKey;
            })
            if (hasValue == -1) {
                newPanes.push(obj);
            } else {
                newKey = newPanes[hasValue].key;
                obj.key = newPanes[hasValue].key;
            }
        } else {
            newPanes.push(obj);
        }
        setTabsList(newPanes);
        setActiveTabKey(newKey);
    }
    const resetFirst = (key) => {
        if (key) {
            let newList = tabsList.filter(it => it.key !== key)
            setActiveTabKey(stableDemand);
            setTabsList(newList);
            demandRef.current.getFullData();
        }
    }
    const removeTabs = (targetKey) => {
        // tabsList.slice();
        let newActiveKey = activeTabKey;
        let lastIndex = -1;
        tabsList.forEach((item, i) => {
            if (item.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const newPanes = tabsList.filter((item) => item.key !== targetKey);
        // let index_ = tabsList.findIndex(item => item.key === targetKey);
        // console.log('index_ = ', index_);
        // tabsList.splice(index_,1);
        if (newPanes.length && newActiveKey === targetKey) {
            if (lastIndex >= 3) {
                newActiveKey = newPanes[lastIndex].key;
            } else {
                newActiveKey = newPanes[0].key;
            }
        }
        setTabsList(newPanes);
        setActiveTabKey(newActiveKey);
    };
    const onEditTabs = (targetKey, action) => {
        if (action === 'add') {
            addTabs(targetKey, 'create');
        } else {
            removeTabs(targetKey);
        }
    }
    return (<Spin spinning={loading}>
        <div className='oap-tabs-container'>
            <Tabs
                className="oap-tabss oap-tabss-fordashboard-special"
                key="just-for-demand-dashboard"
                type="editable-card"
                hideAdd
                activeKey={activeTabKey}
                onChange={(activeKey) => handleTabsChange(activeKey)}
                onEdit={onEditTabs}
            >
                {
                    tabsList.map(tabs => {
                        const CustomComponent = tabs.component;
                        return <Tabs.TabPane tab={tabs.tabsTitle} key={tabs.key} forceRender={true} className={tabs.key == stableMonitor ? 'monitor-dashboard-page-upgrad' : ''} closable={tabs.closable}>
                            <CustomComponent
                                key={tabs.key}
                                selfId={tabs.key}
                                addNewTab={(issueKey, tabType) => addTabs(issueKey, tabType)}
                                goFirst={resetFirst}
                                issueKey={tabs.issueKey || ''}
                                formStatus={tabs.cardType}
                                ref={tabs.ref}
                                allList={tabsList}
                            ></CustomComponent>
                        </Tabs.TabPane>
                    })
                }
            </Tabs>
        </div>
    </Spin>)
}

export default DemandBoard;