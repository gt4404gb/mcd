import {get, post, deletes, put} from './http';

// MDX列表
export function getMDXList(data) {
  return get('/guide/down/list',data)
}