import React from 'react';
// import {Button, Empty} from 'antd';
import {PlusSquareOutlined, MinusSquareOutlined} from '@ant-design/icons';
import { Empty } from '@aurum/pfe-ui';
// import {} from '@aurum/icons';
import '@/style/kylin-analysis.less';

export default class LikeTreeTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableData: [],
      expanded: false,
      loading: true,
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.dataSource.length > 0) {
      console.log('旧的树形表 - dataSource = ', nextProps.dataSource);
      this.setState({
        tableData: [...nextProps.dataSource],
      })
    }
    
  }
  generateHeaderRow = () => {
    let headingRows = [];
    if (this.props?.columns) {
      headingRows.push(this.props.columns.map((column) => {
        if (column.title && column.dataIndex) {
          return <th className='ant-table-cell' key={column.key}>{column.title}</th>
        }
      }))
    }
    return headingRows;
  }
  expandOrCollapseTree = (data, selectedRowID, expandAll, collapseAll) => {
    return (function recurse(children, expandBranch = expandAll, collapseBranch = collapseAll) {
        return children && children.map(node => {
            let setExpanded = node.key === selectedRowID ? !node.expanded : node.expanded;
            let setVisible = node.parentKey === selectedRowID ? !node.visible : node.visible;
            if (expandBranch) {
                setExpanded = true;
                setVisible = true;
            }
            if (collapseBranch) {
                setExpanded = false;
                setVisible = false;
            }
            //collapse and hide all below
            let arr = node.parentKey.split(selectedRowID);
            if (arr[0] === '' && !setVisible) {
                collapseBranch = true;
            }
            return Object.assign({}, node, {
                visible: setVisible,
                expanded: setExpanded,
                children: recurse(node.children, expandBranch, collapseBranch)
            })
        });
    })(data);
  }
  rowExpandOrCollapse = (dataRow, expanded) => {
    if (expanded) {
    // if (expanded && !dataRow.hasRemote) {
      this.props.onExpand(expanded, dataRow);
    }
    if (!expanded && dataRow.hasRemote) {
      // console.log('应该合起来！')
      // this.props.onExpandClose(expanded, dataRow);
      let newTree = this.expandOrCollapseTree(this.state.tableData, dataRow.key, false, false);
      this.setState({
        tableData: newTree,
      })
    }
    // if (expanded && dataRow.hasRemote) {
    //   console.log('展开已加载的数据！')
    //   let newTree = this.expandOrCollapseTree(this.state.tableData, dataRow.key, false, false);
    //   this.setState({
    //     tableData: newTree,
    //   })
    // }
  }
  generateExpandColumn = (dataRow, key, dataIndex) => {
    if (dataRow.isDrillDown) {
      // let iconCell = <Button className='ant-table-row-expand-icon ant-table-row-expand-icon-collapsed' icon={<PlusSquareOutlined />} onClick={() => this.rowExpandOrCollapse}/>;
      let iconCell = <PlusSquareOutlined onClick={() => this.rowExpandOrCollapse(dataRow, true)} style={{marginRight: '10px'}}/>;
      if (dataRow.expanded) {
        iconCell = <MinusSquareOutlined onClick={() => this.rowExpandOrCollapse(dataRow, false)} style={{marginRight: '10px'}}/>;
      }
      // if (this.props.columns[0].fixedWidth) {
      //   return (
      //     <td key={key} className={`${this.props.columns[0].styleClass}  ant-table-cell`} width={this.props.columns[0].percentageWidth + '%'}>
      //       <span style={{marginLeft: dataRow.rowLevel + 'em'}}>
      //         {iconCell}
      //         <span className="iconPadding">{dataRow[dataIndex]}</span>
      //       </span>
      //     </td>
      //   );
      // } else {
      //   return (
      //     <td key={key} className={`${this.props.columns[0].styleClass}  ant-table-cell`}>
      //       <span style={{marginLeft: dataRow.rowLevel + 'em'}}>
      //         {iconCell}
      //         <span className="iconPadding">{dataRow[dataIndex]}</span>
      //       </span>
      //     </td>
      //   );
      // }
      return (
        <td key={key} className={`${this.props.columns[0].styleClass}  ant-table-cell`}>
          <span style={{marginLeft: (dataRow.key.split('-').length - 2)*3 + 'em', whiteSpace: 'nowrap'}}>
            {dataRow.isLeaf ? dataRow.hasFuckSon ? null: <span style={{display: 'inline-block', width: '10px'}}></span> : iconCell}
            <span className="iconPadding">{dataRow[dataIndex]}</span>
          </span>
        </td>
      );
    } else {
      // if (this.props.columns[0].fixedWidth) {
      //   return (
      //     <td key={key} className={`${this.props.columns[0].styleClass}  ant-table-cell`} width={this.props.columns[0].percentageWidth + '%'}>
      //       <span style={{marginLeft: (dataRow.rowLevel + 1.25) + 'em'}}>
      //         <span className="iconPadding">{dataRow[dataIndex]}</span>
      //       </span>
      //     </td>
      //   );
      // } else {
      //   return (
      //     <td key={key} className={`${this.props.columns[0].styleClass}  ant-table-cell`}>
      //       <span style={{marginLeft: (dataRow.rowLevel + 1.25) + 'em'}}>
      //         <span className="iconPadding">{dataRow[dataIndex]}</span>
      //       </span>
      //     </td>
      //   );
      // }
      return (
        <td key={key} className={`${this.props.columns[0].styleClass}  ant-table-cell`}>
          <span style={{marginLeft: (dataRow.key.split('-').length - 2)*3 + 'em', whiteSpace: 'nowrap'}}>
          {(dataRow.isLeaf && !dataRow.hasFuckSon) ? <span style={{display: 'inline-block', width: '10px'}}></span> : null}
            <span className="iconPadding">{dataRow[dataIndex]}</span>
          </span>
        </td>
      );
  }
}
  processDataRow = (dataRow) => {
    let rowBody = [];
    rowBody.push(this.props.columns.map((column, index) => {
        let key = dataRow.key + '-' + index;; // dataRow.parentRowID + '-' + dataRow.rowID + '-' + index;
        let output = dataRow[column.dataIndex];
        // if (column.renderer) {
        //   output = this.props.columns[index].renderer(dataRow, column.dataIndex);
        // }
        if (index === 0) {
          return this.generateExpandColumn(dataRow, key, column.dataIndex);
        } else {
          if (column.fixedWidth) {
            return (
              <td key={key} className={`${column.styleClass} ant-table-cell`} width={column.percentageWidth + '%'}>
                {output}
              </td>
            )
          } else {
            return (
              <td key={key} className={`${column.styleClass} ant-table-cell`}>{output}</td>
            )
          }
        }
      }
    ));
    return rowBody;
  }
  generateTableBody = (tableData) => {
    let tableBody = [];
    tableData.forEach((dataRow) => {
      let rowData = this.processDataRow(dataRow);
      let key = dataRow.key; // dataRow.parentRowID + '-' + dataRow.rowID;
      let rowClass = dataRow.visible ? 'shown' : 'hidden';
      tableBody.push(<tr className={`${rowClass} ant-table-row`} key={key} data-key={key}>{rowData}</tr>);
      if (dataRow.children) {
        tableBody.push(...this.generateTableBody(dataRow.children));
      }
    });
    return tableBody;
  }
  render() {
    const {columns} = this.props;
    let headingRows = this.generateHeaderRow();
    let tableBody = this.generateTableBody(this.state.tableData);
    return (
      <div className='like-tree-table-div'>{
        columns.length > 0 ? 
        <div className='ant-table-container'>
          {/* <div className='ant-table-header'>
            <table className='like-tree-table'>
              <thead className='ant-table-thead'>
                <tr>
                  {headingRows}
                </tr>
              </thead>
            </table>
          </div> */}
          <div className='ant-table-body'>
            <table className='like-tree-table'>
              <thead className='ant-table-thead'>
                <tr>
                  {headingRows}
                </tr>
              </thead>
              <tbody className='ant-table-tbody'>
                {tableBody}
              </tbody>
            </table>
          </div>
        </div>
        // : <div className='ant-empty ant-empty-normal'>
        //   <div className="ant-empty-image">
        //    <svg className="ant-empty-img-simple" width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
        //       <g transform="translate(0 1)" fill="none" fillRule="evenodd">
        //         <ellipse className="ant-empty-img-simple-ellipse" cx="32" cy="33" rx="32" ry="7"></ellipse>
        //         <g className="ant-empty-img-simple-g" fillRule="nonzero">
        //           <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path>
        //           <path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" className="ant-empty-img-simple-path"></path>
        //         </g>
        //       </g>
        //     </svg>
        //   </div>
        //   <p className="ant-empty-description">No Data</p>
        // </div>}
        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      </div>
    )
  }
}

// export default LikeTreeTable;