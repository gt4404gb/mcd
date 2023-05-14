import React, { useState, useEffect } from 'react';
import { Input, Tree } from '@aurum/pfe-ui';
import { CloseCircleFilled } from '@ant-design/icons';
import * as apis from '@/apps/openapi/common/apis'
import './EmployeeChooser.less';

let timer: any;

export default ({ value, onChange }: any) => {
  const [choosedUserInfos, setChoosedUserInfos]: any = useState({
    employeenumbers: [],
    chineseNames: []
  });
  const [choosedMap, setChoosedMap]: any = useState({});
  const [treeData, setTreeData]: any = useState([]);
  const [treeMap, setTreeMap]: any = useState({});
  const [checkedKeys, setCheckedKeys]: any = useState([]);

  useEffect(() => {
    setChoosedUserInfos({
      employeenumbers: value.employeenumbers ? value.employeenumbers.split(',') : [],
      chineseNames: value.chineseNames ? value.chineseNames.split(',') : [],
    });
  }, [value]);

  const onSearch: any = async (keyword: any) => {
    const resp: any = await apis.getXmenModule().queryUsers(keyword);

    const uniqueUsers: any = {}
    resp.responseData.forEach((item: any) => {
      uniqueUsers[item.employeenumber] = item;
    });
    setTreeMap(uniqueUsers);

    setTreeData(Object.values(uniqueUsers).map((item: any) => {
      return {
        key: item.employeenumber,
        title: `${item.chinesename} / ${item.organizationname}`,
      };
    }));
  }

  const updateChoosedUsernames: any = (employeenumbers: any) => {
    const values: any = {
      employeenumbers,
      chineseNames: employeenumbers.map((enumber: any) => choosedMap[enumber]?.chinesename || treeMap[enumber]?.chinesename || enumber),
    };
    if (onChange) {
      onChange({
        employeenumbers: values.employeenumbers.join(','),
        chineseNames: values.chineseNames.join(','),
      });
    } else {
      setChoosedUserInfos(values);
    }
  };

  useEffect(() => {
    const _choosedMap: any = {};
    let cnt: number = 0;
    for (const enumber of choosedUserInfos.employeenumbers) {
      _choosedMap[enumber] = {
        chinesename: choosedUserInfos.chineseNames[cnt],
        employeenumber: enumber,
      } || treeMap[enumber] || choosedMap[enumber] || {
        chinesename: enumber,
        employeenumber: enumber,
      };
      cnt++;
    }

    setChoosedMap(_choosedMap);
    const allTreeKeys: any = treeData.map((it: any) => it.key);
    let _checkedKeys: any = choosedUserInfos.employeenumbers.filter((id: any) => {
      return (allTreeKeys.indexOf(id) > -1) ? true : false
    });
    setCheckedKeys(_checkedKeys);
  }, [choosedUserInfos, treeData]);

  return (<div className="employee-chooser">
    <Input.Group compact>
      <Input.Search style={{ marginBottom: 8 }} placeholder="请输入搜索关键字"
        onChange={(e: any) => {
          const value: any = e.target.value;
          clearTimeout(timer);
          timer = setTimeout(() => {
            onSearch(value);
          }, 500);
        }}
        onSearch={onSearch}
      />
    </Input.Group>
    {treeData.length > 0 && <Tree
      height={300}
      checkable
      onCheck={(checkedKeysValue: any) => {
        let _choosedUsernames: any = choosedUserInfos.employeenumbers.filter((id: any) => (checkedKeys.indexOf(id) > -1) ? false : true);
        _choosedUsernames = _choosedUsernames.concat(checkedKeysValue);
        updateChoosedUsernames(Array.from(new Set(_choosedUsernames)));
      }}
      onSelect={(selectKeyValues: any, nodeStruct: any) => {
        if (selectKeyValues.length <= 0) { //取消选择
          updateChoosedUsernames(choosedUserInfos.employeenumbers.filter((id: any) => id != nodeStruct.node.key));
        } else { //选择
          choosedUserInfos.employeenumbers.push(selectKeyValues[0]);
          updateChoosedUsernames(Array.from(new Set([...choosedUserInfos.employeenumbers])));
        }
      }}
      checkedKeys={checkedKeys}
      treeData={treeData}
    />}
    <div className="choosed-employeenumbers">
      {Object.values(choosedMap).map((item: any) => <span className="username-tag" key={item.chinesename}>
        {item.chinesename} <CloseCircleFilled onClick={() => updateChoosedUsernames(choosedUserInfos.employeenumbers.filter((thisEnumber: any) => {
          return thisEnumber !== item.employeenumber
        }))} />
      </span>)}
    </div>
  </div>);
}