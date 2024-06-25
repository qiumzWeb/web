import React, {useEffect, useState, useImperativeHandle} from 'react'
import { Dialog, RadioGroup, CheckBox } from '@/component'
import { Cookie } from 'assets/js'
import { electrifyTypeOptions as typeOptions} from '../config'

export default React.forwardRef(function App(props, ref) {
  const [visible, setVisible] = useState(false)
  const [type, setType] = useState('')
  useImperativeHandle(ref, () => ({
    open,
    close: onClose
  }))
  function open() {
    setVisible(true)
    setType([Cookie.get('electrify') || ''])
  }
  function onOk() {
    Cookie.set('electrify', type[0], {hour: 30 * 24})
    onClose()
    window.location.reload()
  }
  function onClose() {
    setVisible(false)
  }
  return <div>
    <Dialog
      title="设置带电参数"
      visible={visible}
      style={{width: 600}}
      onOk={onOk}
      onClose={onClose}
      onCancel={onClose}
    >
      <div><RadioGroup dataSource={typeOptions} align="vertical" value={type} onChange={(d) => {setType(d)}}></RadioGroup></div>
    </Dialog>
  </div>
})