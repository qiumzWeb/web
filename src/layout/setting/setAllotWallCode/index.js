import React, { useEffect, useState, useImperativeHandle } from 'react'
import { Dialog, Input } from '@/component'
import { Cookie } from 'assets/js'
const { useInput } = React
function App(props, ref) {
  const [visible, setVisible] = useState(false)
  const {getValue, setValue, refs, getFocus, getSelect} = useInput(['allotWallCode'])

  useImperativeHandle(ref, () => ({
    open() {
      setVisible(true)
      setTimeout(() => {
        getFocus('allotWallCode')
        setValue('allotWallCode', Cookie.get('allotWallCode'))
      }, 100)
    },
    close() {
      onClose()
    }
  }))
  function onOk() {
    Cookie.set('allotWallCode', getValue('allotWallCode'), {hour: 30 * 24})
    onClose()
  }
  function onClose() {
    setVisible(false)
  }
  return <Dialog
    title="设置播种墙号"
    visible={visible}
    style={{width: 800}}
    onOk={onOk}
    onClose={onClose}
    onCancel={onClose}
  >
    <Input label="播种墙号" ref={refs['allotWallCode']}></Input>
  </Dialog>
}

export default React.forwardRef(App)