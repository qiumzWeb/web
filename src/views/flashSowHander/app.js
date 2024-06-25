import React from 'react';
import { Button, DragBox, Dialog, Icon, WidgetWall } from '@/component'
App.title = '播种(闪)(新)'
export default function App(props) {
  const { location } = props
  const code = location.state && location.state.code || undefined
  function onTap() {
    Dialog.confirm({
      title: '切换播种模式',
      content: '是否切换为闪电播种模式？',
      onOk: () => {
        window.Router.push('/flashSowAuto', { code })
      }
    })
  }
  return <div>
    <WidgetWall isFull code={code}></WidgetWall>
    <DragBox className="px2rem wallIconDrag" right={px2rem(0)} bottom={px2rem(60)}>
      <DragBox.Child onClick={onTap}>
        <Icon type="small-putin" style={{fontSize: px2rem(45)}}></Icon>
      </DragBox.Child>
    </DragBox>
  </div>
}