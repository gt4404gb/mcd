import React,{ forwardRef, useEffect,useState } from 'react';
import { IconDownFill } from '@aurum/icons';
import { Empty } from '@aurum/pfe-ui';
import '@/style/kylin-analysis.less';
import SvgIcon from '@/components/SvgIcon';

const MergeTable = (props, ref) => {
  const {columns} = props;
  // dataSource 需要做个处理工作----Hierarchy下钻的维度，虽然有父子关系，但是要放同级，便于展示
  let dataSource = JSON.parse(JSON.stringify(props.dataSource));
  const _hasChildren = (item) => {
    if (item && item.children && item.children.length>0) {
      return true;
    } else {
      return false;
    }
  }

  const setHierarchyToItFirstLevel = (curList, pList, index) => {
    let result = [];
    let item = pList[index];
    for(let i=0,l=curList.length;i<l;i++) {
      if (_hasChildren(curList[i])) {
        let res = setHierarchyToItFirstLevel(curList[i].children, curList, i) || [];
        if (res.result.length) {
          i=i+1;
          curList.splice(i,0,...res.result);
          i=i-1;
          l=l+res.result.length;
        }    
      }
      if (curList[i].selfAlias === item.selfAlias && curList[i].levelAll.length === item.levelAll.length) {
        result.push(curList[i]);
        curList.splice(i,1);
        i=i-1;
        l=l-1;
      }
    }
    return {
      result,
    }
  }
  const dealSource = () => {
    for (let i=0,l=dataSource.length;i<l;i++) {
      if (_hasChildren(dataSource[i])) {
        let res = setHierarchyToItFirstLevel(dataSource[i].children, dataSource, i);
        if (res.result.length) {
          i=i+1;
          dataSource.splice(i,0,...res.result);
          i=i-1;
          l=l+res.result.length;
        }
      }
    }
  }
  
  const [dimColumns,setDimColumns] = useState([...columns?.dim_columns]);
  const [meaColumns,setMeaColumns] = useState([...columns?.mea_columns]);
  const [columnsDimMea,setColumnsDimMea] = useState([...columns?.dim_columns, ...columns?.mea_columns]);
  const [tableData, setTableData] = useState([...dataSource]);

  useEffect(() => {
    setDimColumns([...props.columns.dim_columns]);
    setMeaColumns([...props.columns.mea_columns]);
    setColumnsDimMea([...props.columns.dim_columns,...props.columns.mea_columns]);
    dealSource();
    setTableData([...dataSource]);
  }, [props.columns,props.dataSource]);
  /**
   * 展开表
   */
  const rowExpandOrCollapse = (dataRow, expanded) => {
    if (expanded) {
      // 下钻
      props.onExpand(expanded, dataRow);
    }
    if (!expanded && dataRow.hasRemote) {
      // 上钻
      props.onUpDrill(expanded, dataRow);
    }
  }
  /**f
   * 生产表头
   */
  const createHeaderRow = () => {
    let headingRows = [];
    if (columnsDimMea && columnsDimMea.length > 0) {
      headingRows.push(columnsDimMea.map(col => {
        if (col.title && col.dataIndex) {
          return (<th className='ldw-table-cell' key={col.key}>
            {col.isHierarchy ? <SvgIcon icon='drill_down' className='normal_dim_icon mr-4' />: null}
            <span>{col.title}</span>
          </th>)
        }
      }))
    }
    return headingRows;
  };
  /**
   * 生产表身
   */
  /**
   * 如果当前是下钻维度，则要带上当前的值，也算一个count值
   * @param {*} arr 
   * @param {*} parentLevel 
   * @returns 
   */
  const calcLevelLeaf = (arr, parentLevel = 0) => {
    let count = 0;
    let deep = parentLevel + 1;
    if (dimColumns.length > 0 ) {
      arr.forEach(item => {
        item.level_ = parentLevel + 1;
        item.leafCount = 0;
        let currentDim = dimColumns[parentLevel];
        if (parentLevel >= dimColumns.length) {
          currentDim = [...dimColumns].pop();
        }
        item.isHierarchy = currentDim.isHierarchy;
        if (_hasChildren(item)) {
          const {count: c, deep: d} = calcLevelLeaf(
            item.children,
            item.level_
          )
          item.leafCount += c;
          count += c;
          // if (item.expanded && item.levelAll && item.levelAll.length > 0) {
          //   item.leafCount = 1;
          // }
          item.isLeaf = false;
          deep = Math.max(deep, d);
        } else {
          item.isLeaf = true;
          item.leafCount = 1;
          count += 1;
        }
      })
    } else {
      arr.forEach(item => {
        item.level_ = 0;
        item.isHierarchy = false;
        item.leafCount = 1;
      })
    }
    return {
      count,
      deep
    }
  }
  const getRows = (data, deep) => {
    let stack = [], RowsResult = [], result = [];
    stack.push(data);
    while (stack.length) {
      let top = stack.pop();
      let item = {
        ...top,
        children: null,
        rowSpan: top.leafCount
      }
      if (_hasChildren(top)) {
        item.colSpan = 1;
      } else {
        item.colSpan = deep - top.level_ + 1;
      }
      result.push(item);
      let children = top.children;
      if (children && children.length > 0) {
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push(children[i]);
        }
      } else {
        RowsResult.push(result);
        result = [];
      }
    }
    return RowsResult;
  }
  const translate2Rows = (roots) => {
    const entryArray = Array.isArray(roots) ? roots : [roots];
    const {deep} = calcLevelLeaf(entryArray);
    let result = [];
    entryArray.forEach(i => {
      result.push(getRows(i, deep));
    })
    if (result.length === 1) {
      return result[0];
    }
    return result;
  }
  const hierarchyTd = (td) => {
    let tdEle = null;
    if (td && td.isHierarchy) {
      if (td.expanded) {
        if (td.selfUrlKey && td.levelAll && td.selfUrlKey.length < td.levelAll.length) {
          tdEle = (<IconDownFill style={{marginLeft: td.selfUrlKey&&td.selfUrlKey.length ? `${(td.selfUrlKey.length - 1)*2}em` : '0', whiteSpace: 'nowrap', transform: 'rotate(0deg)', cursor: 'pointer'}} onClick={() => rowExpandOrCollapse(td, false)} />)
        } else {
          tdEle = (<><span style={{marginLeft: td.selfUrlKey&&td.selfUrlKey.length ? `${(td.selfUrlKey.length - 1)*2}em` : '0'}}></span><span style={{display: 'inline-block', width: '16px'}}></span></>);
        }
      } else {
        if (td.selfUrlKey && td.levelAll && td.selfUrlKey.length < td.levelAll.length) {
          tdEle = (<IconDownFill style={{marginLeft: td.selfUrlKey&&td.selfUrlKey.length ? `${(td.selfUrlKey.length - 1)*2}em` : '0', whiteSpace: 'nowrap', transform: 'rotate(-90deg)', cursor: 'pointer'}} onClick={() => rowExpandOrCollapse(td, true)} />)
        } else {
          tdEle = (<><span style={{marginLeft: td.selfUrlKey&&td.selfUrlKey.length ? `${(td.selfUrlKey.length - 1)*2}em` : '0'}}></span><span style={{display: 'inline-block', width: '16px'}}></span></>);
        }
      }
    }
    return tdEle;
  }
  const createMeasureTd = (td, i, idx) => {
    let tdList = [];
    if (dimColumns.length > 0) {
      tdList.push(<td key={`tr_${i}_td_${td.dimensionName}_${idx}`} rowSpan={td.rowSpan} style={{verticalAlign: td.rowSpan > 1 ? 'top': 'inherit'}}>
        {hierarchyTd(td)}
        {td.dimensionName}
      </td>);
    }
    if (!_hasChildren(td) && (td.level_ === dimColumns.length || dimColumns.length < 1)) {
      meaColumns.forEach((mea,index) => {
        let output = td[mea.dataIndex];
        tdList.push(<td key={`tr_${i}_td_${idx}_${mea.dataIndex}_${index}`}>{output}</td>);
      })
    }
    return tdList;
  }
  const createTr = (rows,index) => {
    let trList = [];
    for(let i=0;i<rows.length;i++) {
      trList.push(<tr key={`tr_line_${index+i}_${i}`}>{
        rows[i].map((td,idx) => {
          return createMeasureTd(td, i, idx);
        })
      }</tr>);
    }
    return trList;
  }
  const createBody = (tableData) => {
    let rowList = [];
    tableData.forEach((item) => {
      let row = translate2Rows(item);
      let trs = createTr(row,rowList.length);
      rowList.push(...trs);
    })
    return rowList;
  }
  let headingRows = createHeaderRow();
  let tableBody = createBody(tableData);
  return (<div className='like-ldw-table-div'>
    {
      columnsDimMea.length > 0 ? <div className='ldw-table-container'>
        <div className='customized-table'>
          <table className='ldw-tree-table'>
            <thead>
              <tr>{headingRows}</tr>
            </thead>
            <tbody>{tableBody}</tbody>
          </table>
        </div>
      </div>: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
    }
  </div>);
}

export default MergeTable;