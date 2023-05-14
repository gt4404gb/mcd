function handleMessage({ msg, onMessage, type = "error", debug = false }) {
  if (msg) {
    if (window.$t) msg = window.$t(msg);
    if (onMessage) onMessage(msg, type);
    if (debug) {
      console[type]("[DEBUG] Image Upload:", msg);
    }
  }
}

const mimeAliases = {
  jpg: ["image/jpeg", "image/pjpeg"],
  png: ["image/png", "image/x-png"],
  gif: ["image/gif"],
};

const imageMimes = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/x-png",
  "image/pjpeg",
  "image/svg+xml",
];

export default {
  getUploadProps: ({
    onUploaded,
    onRemoved,
    onMessage,
    handleChange,
    action = null,
    type = "image",
    minWidth = 0,
    minHeight = 0,
    maxWidth = 0,
    maxHeight = 0,
    maxBytes = 0,
    allowedMimes = [],
    uploadPath = "gallery",
    debug = false,
    setFileList
  }) => {
    let authorization = "";
    document.cookie.split(";").forEach((item) => {
      if (item.includes("Authorization")) {
        authorization = item.replace("Authorization=", "");
      }
    });

    return {
      name: "file",
      action: action || "/api/inner/cms/cms/file/upload",
      data: { path: uploadPath },
      headers: {
        Authorization: authorization,
      },
      beforeUpload: (file) => {
        if (type === "video") {
          if (file.type !== "video/mp4") {
            handleMessage({
              msg: "is not a valid video file",
              type: "error",
              onMessage,
              debug,
            });
            return false;
          }
        } else {
          if (!imageMimes.includes(file.type)) {
            handleMessage({
              msg: "不允许的图片文件类型",
              type: "error",
              onMessage,
              debug,
            });
            return false;
          }
          if (Array.isArray(allowedMimes) && allowedMimes.length > 0) {
            let mimes = [];
            allowedMimes.forEach((alias) => {
              mimes = mimes.concat(mimeAliases[alias] || alias);
            });
            if (!mimes.includes(file.type)) {
              handleMessage({
                msg: "不允许的图片文件类型",
                type: "error",
                onMessage,
                debug,
              });
              return false;
            }
          }
        }
        if (maxBytes > 0) {
          if (file.size > maxBytes) {
            let sizeLabel = maxBytes;
            if (maxBytes >= 1024 && maxBytes < 1024 * 1024) {
              sizeLabel = maxBytes / 1024 + "K";
            } else if (maxBytes >= 1024 * 1024) {
              sizeLabel = (maxBytes / 1024 / 1024).toFixed(1) + "M";
            } else {
              sizeLabel = maxBytes;
            }

            handleMessage({
              msg: `上传文件尺寸不能超过${sizeLabel}B`,
              type: "error",
              onMessage,
              debug,
            });
            return false;
          }
        }
        return true;
      },
      onChange(resp) {
        if (resp.file.status === 'done') {
          let uploadRespData = resp.file.response.data;
          if (typeof uploadRespData === "string") {
            uploadRespData = {
              fileUrl: uploadRespData,
              filename: uploadRespData,
            };
          }
          const { fileUrl, width, height, filename } = uploadRespData;
          if (
            (maxWidth > 0 && width > maxWidth) ||
            (maxHeight > 0 && height > maxHeight)
          ) {
            handleMessage({
              msg: `上传文件尺寸过大，不合要求`,
              type: "error",
              onMessage,
              debug,
            });
          } else if (
            (minWidth > 0 && width < minWidth) ||
            (minHeight > 0 && height < minHeight)
          ) {
            handleMessage({
              msg: `上传文件尺寸太小，不合要求`,
              type: "error",
              onMessage,
              debug,
            });
          } else {          
            onUploaded({
              uid: resp.file.uid,
              url: fileUrl,
              width,
              height,
              name: resp.file.name,
              filename: filename || resp.file.name,
            });
          }
        } else {
          setFileList([...resp.fileList]);
          // handleChange(resp.fileList, resp.file);
          if (resp.file.status === "removed") {
            onRemoved(resp.file);
          } else if (resp.file.status === "error") {
            handleMessage({
              msg: "图片上传失败，请重新操作",
              type: "error",
              onMessage,
              debug,
            });
          }
        }
      },
    };
  },
};