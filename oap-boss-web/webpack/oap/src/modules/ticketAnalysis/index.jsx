import React from "react";
// import {Tabs,Modal} from '@mcd/portal-components';
import { Tabs, Modal } from '@aurum/pfe-ui';
import '@/style/ticket-analysis.less';
import List from './components/List';
import TicketAnalysis from './components/TicketAnalysis';

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.paneList = React.createRef();
    this.tabsList = [
      {
        tabName: '列表页',
        key: 'list',
        ref: this.paneList,
        componentName: List,
        closable: false
      }
    ];
    this.newTabIndex = 0;
    this.state = {
      tabsList: this.tabsList,
      activeKey: 'list',
      visibleChooseData: false,
    }
    props.cacheLifecycles.didRecover(this.judgeTabsActive);
  }
  async componentDidMount () {
    this.judgeTabsActive();
  }
  judgeTabsActive = () => {
    const activeInfo = JSON.parse(decodeURIComponent(sessionStorage.getItem('oapTicketActiveTab'))) || {};
    this.setState({
      activeKey: activeInfo.activeTab ? activeInfo.activeTab : 'list'
    }, () => {
      sessionStorage.removeItem('oapTicketActiveTab');
    })
  }

  // 创建分析
  handleCreateAnalysis = (type, record = {}) => {
    let { tabsList, activeKey } = this.state;
    switch (type) {
      case 'create':
        activeKey = `newTab-${this.newTabIndex++}`;
        tabsList.push({
          tabName: `创建分析-${this.newTabIndex}`,
          key: activeKey,
          componentName: TicketAnalysis,
          sliceId: record.id || '', //单条数据ID
          modelId: record.datasourceId || '',
          closable: true,
          type
        })
        break;
      case 'edit':
        let hasValue = tabsList.findIndex(it => it.key === record.id);
        activeKey = record.id;
        if (hasValue < 0) {
          tabsList.push({
            tabName: `编辑分析-${record.sliceName}`,
            key: activeKey,
            componentName: TicketAnalysis,
            sliceId: record.id || null, //单条数据ID
            modelId: record.datasourceId || null,
            closable: true,
            type
          })
        }
        break;
      case 'copy':
        activeKey = `newTab-${this.newTabIndex++}`;
        tabsList.push({
          tabName: `创建分析-${this.newTabIndex}-duplicated`,
          key: activeKey,
          componentName: TicketAnalysis,
          sliceId: record.sliceId || '', //单条数据ID
          modelId: record.modelId || '',
          closable: true,
          type,
        })
        break;
      default: break;
    }
    this.setState({
      tabsList,
      activeKey,
    })
  }
  // 切换tabs
  handleChange = (activeKey) => {
    this.setState({
      activeKey
    }, () => {
      activeKey === 'list' && this.paneList.current?.fetchDataList();
      sessionStorage.setItem('oapTicketActiveTab', encodeURIComponent(JSON.stringify({ activeTab: activeKey })))
    })
  }
  // 删除tabs
  remove = (targetKey) => {
    Modal.confirm({
      title: "确认要关闭吗？",
      content: (<>关闭会导致数据丢失，是否继续?</>),
      cancelText: "取消",
      okText: "确定",
      onOk: () => {
        let { activeKey, tabsList } = this.state, currentIndex;
        let tempTabsList = tabsList.reduce((pre, cur, index) => {
          if (cur.key === targetKey) currentIndex = index;
          cur.key !== targetKey && pre.push(cur);
          return pre;
        }, [])
        if (tempTabsList.length > 0 && activeKey === targetKey) {
          if (currentIndex == tempTabsList.length) {
            activeKey = tempTabsList[currentIndex - 1].key;
          } else {
            activeKey = tempTabsList[currentIndex].key;
          }
        }
        this.setState({
          tabsList: [...tempTabsList],
          activeKey,
        })
      },
    })
  }
  onEdit = (targetKey, action) => {
    this[action](targetKey);
  }
  // 回到首页
  onBackToIndex = (targetKey) => {
    let lastIndex;
    this.state.tabsList.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1;
      }
    })
    const tabsList = this.state.tabsList.filter(pane => pane.key !== targetKey);
    this.setState({
      tabsList: tabsList,
      activeKey: 'list'
    })
    this.paneList.current?.fetchDataList();
  }
  render () {
    const { tabsList } = this.state;
    return (<div className="oap-ticket-tabs-container">
      <Tabs
        activeKey={this.state.activeKey}
        onChange={this.handleChange}
        type="editable-card"
        hideAdd
        onEdit={this.onEdit}
        className="oap-ticket-tabs oap-tabss"
      >
        {tabsList.map(pane => {
          const ComponentName = pane.componentName;
          return <Tabs.TabPane tab={pane.tabName} key={pane.key} closable={pane.closable}>
            <ComponentName
              ref={pane.ref}
              onCreate={this.handleCreateAnalysis}
              onBack={() => this.onBackToIndex(pane.key)}
              tableType={0}
              modelId={pane.modelId}
              sliceId={pane.sliceId}
              type={pane.type}
            ></ComponentName>
          </Tabs.TabPane>
        })}
      </Tabs>
    </div>)
  }
}
export default Index;