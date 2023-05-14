import {get, post, deletes, put} from './http';

// 获取 jupyter 绑定信息。
export function getJupyterInfo(){
  return get('/jupyter/detail');
}