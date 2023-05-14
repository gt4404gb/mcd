import React, { useState, useEffect } from 'react';
import { Spin, Input, Tree, Radio, } from '@aurum/pfe-ui';
import SearchInput from './SearchInput';


const CustomTab = (props, ref) => {
	const [loading, setLoading] = useState(false);
	const [curTab, setCurTab] = useState(0);
	const [totalWidth, setTotalWidth] = useState(180);
	const [topList, setTopList] = useState([
		{
			label: '主题',
			value: 0,
		}, {
			label: '业务域',
			value: 1,
		}
	]);
	const [fieldNames, setFieldNames] = useState(props.fieldNames)
	const [selectTreeKeys, setSelectTreeKeys] = useState(['all']);
    const [treeData, setTreeData] = useState([]);
    const [defaultData, setDefaultData] = useState([]);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [autoExpandParent, setAutoExpandParent] = useState(true);

	const switchTab = (e) => {
		setCurTab(e.target.value);
		setSelectTreeKeys(['all']);
		props.onSelected({ selectedKeys: 'all', curTab: e.target.value })
	}

	//搜索相关功能
    const getParentKey = (key, tree) => {
        let parentKey;
        for (let i = 0; i < tree.length; i++) {
          const node = tree[i];
          if (node.children) {
            if (node.children.some((item) => item.key === key)) {
              parentKey = node.key;
            } else if (getParentKey(key, node.children)) {
              parentKey = getParentKey(key, node.children);
            }
          }
        }
        return parentKey;
    };
    const loopSon = (list, keyWords, attrs) => {
        return list.reduce((total, cur) => {
            if ((cur[attrs.title]).trim().toLowerCase().includes(keyWords)) {
                console.log('cur = ', cur);
                total.push(cur);
            } else {
                if (cur[attrs.children] && cur[attrs.children].length) {
                    let childList = loopSon(cur[attrs.children], keyWords, attrs);
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
    const firstDeep = (data, attrs, res) => {
        if (data && data.length) {
            res.push(data[0][attrs.key]);
            if (data[0][attrs.children] && data[0][attrs.children].length > 0) {
                firstDeep(data[0][attrs.children], attrs, res);
            }
        }
        return res;
    }
	const handleSearchField = (keyWords) => {
		console.log('keyWords = ', keyWords);
        keyWords = keyWords.trim().toLowerCase();
		// 根据keyWords再做些筛选
        let opList = JSON.parse(JSON.stringify(defaultData)), attrs = fieldNames[curTab];
        if (keyWords) {
            let concatList = [], itemList = [];
            opList.forEach((list, index) => {
                if (index === curTab) {
                    let result = loopSon(list, keyWords, attrs);
                    console.log('result = ', result);
                    concatList[index] = [...result];
                    itemList = [...result];
                } else {
                    concatList[index] = [...list];
                }
            })
            setTreeData([...concatList]);
            // let exIds = itemList.reduce((total,cur) => {

            //     if (cur.id) {
            //         total.push(cur.id);
            //     } 
            //     if (cur.children && cur.childList.length) {

            //     }
            //     return total
            // }, []);
            // setExpandedKeys(exIds);
            let exIds = firstDeep(itemList, attrs, []);
            console.log('exIds = ', exIds);
            setExpandedKeys(exIds);
        } else {
            setTreeData([...opList]);
        }
	}

	const handleSelectTree = (selectedKeys, event) => {
		setSelectTreeKeys(selectedKeys)
		props.onSelected({ selectedKeys: selectedKeys[0], curTab })
	}
    const onExpand = expandedKeysValue => {
        console.log('onExpand', expandedKeysValue);
        // if not set autoExpandParent to false, if children expanded, parent can not collapse.
        // or, you can remove all expanded children keys.
        setExpandedKeys(expandedKeysValue);
        setAutoExpandParent(false);
      };
    useEffect(() => {
        console.log('监听props变化');
        // props.treeData[curTab]
        setDefaultData(props.treeData);
        setTreeData(props.treeData);
        setLoading(props.treeLoading);
    }, [props.treeLoading]);
	return <Spin spinning={loading}>
		<div className="oap-card" style={{ padding: '0 0 6px 0', border: 'none', height: '100%' }}>
			<Radio.Group
				value={curTab}
				onChange={switchTab}
				buttonStyle="solid"
				className="tab-switch-box"
			>
				{
					topList.map((tab, index) => {
						return (<Radio.Button key={`${tab.value}_${index}`} value={tab.value} className="tab-switch">{tab.label}</Radio.Button>)
					})
				}
			</Radio.Group>
			<div style={{ margin: '10px 0', padding: '0 8px' }}>
				<SearchInput placeholder={`搜索${topList[curTab].label}`} btnWidth={40} disabled={false} onSearch={(str) => handleSearchField(str)} />
			</div>
            <div>
                <Tree
                    treeData={treeData[curTab]}
                    fieldNames={fieldNames[curTab]}
                    blockNode
                    className='oap-tree'
                    selectedKeys={selectTreeKeys}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    onSelect={handleSelectTree}
                    onExpand={onExpand}
                />
            </div>
		</div>
	</Spin>
}

export default CustomTab;