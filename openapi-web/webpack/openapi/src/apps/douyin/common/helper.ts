import { message } from "@aurum/pfe-ui";
export const handleMessage: any = (
  resp: any,
  fallbackMessages: any,
  onCallback: any
) => {
  if (typeof fallbackMessages === "string") {
    fallbackMessages = {
      success: fallbackMessages,
    };
  }
  fallbackMessages = fallbackMessages || {};

  message.destroy();
  if (
    resp?.success &&
    !resp.data.base.biz_code &&
    !resp.data.base.gateway_code
  ) {
    message.success(fallbackMessages.success || `调用成功`);
    if (onCallback) onCallback();
  } else {
    if (!resp.success) {
      message.error(resp.message || fallbackMessages.failed);
    } else {
      if (resp.data.base.gateway_code) {
        message.error(resp.data.base.gateway_msg);
      } else if (resp.data.base.biz_code) {
        message.error(resp.data.base.biz_msg);
      }
    }
  }
};
export default {
  handleMessage,
};
