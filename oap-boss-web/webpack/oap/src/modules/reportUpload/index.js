import React from 'react';
import { Tabs, Modal } from '@aurum/pfe-ui';
import List from './list';
import EditForm from './form';

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
          tabName: '报告上传列表',
          key: 'list',
          ref: this.paneList,
          componentName: List,
          closable: false
        },
      ]
    }
  }

  //切换tab
  handleChange = (activeKey) => {
    this.setState({
      activeKey
    });
  }

  onCreateTab = (type, record = {}) => {
    let { tabsList, activeKey } = this.state;
    let hasValue = tabsList.findIndex(itm => {
      return itm.key == record.id
    })
    activeKey = record.id;
    switch (type) {
      case 'edit':
        if (hasValue == -1) {
          tabsList.push({
            tabName: `${record.reportName}`,
            key: activeKey,
            componentName: EditForm,
            closable: true,
            id: record.id
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
              id={pane?.id}
              onCreate={this.onCreateTab} />
          </Tabs.TabPane>
        })}
      </Tabs>
    </div>
  }
}