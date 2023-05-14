export function isOrderButtonEnabled(buttonName: string, order: any) {
  const ops: any = order.ops || [];
  return ops.indexOf(buttonName) > -1;
}

export function ab2str(buff: any, callback: any) {
  const b: any = new Blob([buff]);
  const r: any = new FileReader();
  r.readAsText(b, "UTF-8");
  r.onload = () => {
    if (callback) {
      let resp: any = {};
      try {
        resp = JSON.parse(r.result);
      } catch (e: any) {}
      callback.call(null, resp);
    }
  };
}

export default {
  isOrderButtonEnabled,
  ab2str,
};
