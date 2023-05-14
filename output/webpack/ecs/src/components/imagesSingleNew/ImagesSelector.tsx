import React, { useEffect, useState } from 'react';
import { Button, Modal } from '@aurum/pfe-ui';
import './ImagesSelector.less';
export default ({ visible, onClose, basicImages }: any) => {
  const [lists, setLists] = useState([])
  const [dragging, setDragging] = useState(false)
  const [draggingItemIndex, setDraggingItemIndex] = useState(-1)
  const [startPageX, setStartPageX] = useState(0)
  const [offsetX, setOffsetX] = useState(0)

  useEffect(() => {
    if (!basicImages || !basicImages.length) return;
    basicImages.map((item: any, index: any) => {
      item.fileUrl = item.obj.fileUrl || item.obj.url;
      item.url = item.obj.fileUrl || item.obj.url;
      item.id = index
    })
  
    setLists(basicImages);
  }, [basicImages])

  const handleMouseDown = (event:any, index:any) => {
    setDragging(true);
    setDraggingItemIndex(index);
    setStartPageX(event.pageX);
  };

  const handleMouseUp = (event:any) => {
    setDragging(false);
    setDraggingItemIndex(-1);
    setStartPageX(0);
  };

  const move = (arr:any, startIndex:any, isMoveDown:any) => {
    let newArr = arr.slice();
    let moveItem = newArr.splice(startIndex, 1)[0];
    if (isMoveDown) {
      newArr.splice(startIndex + 1, 0, moveItem);
    } else {
      newArr.splice(startIndex - 1, 0, moveItem);
    }
    return newArr;
  };


  const handleMouseMove = (event:any) => {
    let offset = event.pageX - startPageX;
    let draggingIndex = draggingItemIndex;
    const lineWidth = 90; //通过document.querySelector('.listContainer li').offsetWidth获取
    //move down
    //当移动的item没有超过list的长度， 则每往下移动超过lineHeight，就把数组中数据往后挪一位。相应的draggingItemIndex 和 startPageY都要增加一位。
    if (offset > lineWidth && draggingIndex < lists.length - 1) {
      offset -= lineWidth;
      setLists(move(lists, draggingIndex, true))
      setDraggingItemIndex(draggingIndex + 1);
      setStartPageX(startPageX + lineWidth);
      //当移动的item还是list里面， 则每往左移动超过linewidth，就把数组中数据往前挪一位。相应的draggingItemIndex 和 startPageX都要减少一位。
    } else if (offset < -lineWidth && draggingIndex > 0) {
      offset += lineWidth;
      setLists(move(lists, draggingIndex, false));
      setDraggingItemIndex(draggingIndex - 1);
      setStartPageX(startPageX - lineWidth);
    }

   setOffsetX(offset)
  };


  const getDraggingStyle = (index:any) => {
    if (index === draggingItemIndex) {
      return {
        backgroundColor: "#ccc",
        transform: `translate(${offsetX}px, 10px)`,
        opacity: 0.5
      };
    } else {
      return {};
    }
  };

  const close = (data:any) => {
    if (onClose) {
      onClose(data);
    }
  }

  return (
    <Modal width={900} visible={visible} onCancel={() => { close([]) }}
      bodyStyle={{ paddingTop: '0' }}
      title="修改图片顺序"
      footer={[
        <Button key="cancel" onClick={() => { close([]) }}>取消</Button>,
        <Button key="confirm" type="primary" onClick={() => { close(lists) }} >确定</Button>,
      ]}
    >


      <div className="listContainer">
        {lists.map((item:any, index:any) => (
          <li
            key={item.id}
            onMouseDown={(event) => handleMouseDown(event, index)}
            style={getDraggingStyle(index)}
          >
           <img src={item.fileUrl || item.url} style={{width:'80px', height:'80px', display:'inline-block'}} />
          </li>
        ))}
        {dragging && (
          <div
            className="coverMask"
            onMouseUp={(event) => {
              handleMouseUp(event);
            }}
            onMouseMove={(event) => {
              handleMouseMove(event);
            }}
          />
        )}
      </div>
    </Modal>
  )
}
