import React from 'react';
// import {Tabs} from '@aurum/pfe-ui';
import ProductList from './components/ProductList';
import '@/style/upload-data.less';

class UploadMainData extends React.Component {
  constructor(props) {
    super(props);
    this.paneList = React.createRef();
    this.tabsList = [
      {
        tabName: '产品主数据',
        key: 'mainDataList',
        ref: this.paneList,
        componentName: ProductList,
        closable: false
      }
    ]
    this.state = {
      tabsList: this.tabsList,
      activeKey: 'mainDataList',
      visibleChooseData: false,
    }
  }
  // 切换tabs
  handleChange = (activeKey) => {
    this.setState({
      activeKey
    }, () => {
      activeKey === 'mainDataList' && this.paneList.current?.fetchDataList();
    })
  }
  render() {
    const {tabsList} = this.state;
    return (
      <div className='oap-uploaddataforwarehouse-tabs-container'>
        {/* <Tabs
          activeKey={this.state.activeKey}
          onChange={this.handleChange}
          type="card"
          className="oap-upload-tabs"
        >
          {tabsList.map(pane => {
            const ComponentName = pane.componentName;
            return <Tabs.TabPane tab={pane.tabName} key={pane.key}>
              <ComponentName
                ref={pane.ref}
              ></ComponentName>
            </Tabs.TabPane>
          })}
        </Tabs> */}
        <ProductList />
      </div>
    )
  }
}

export default UploadMainData;