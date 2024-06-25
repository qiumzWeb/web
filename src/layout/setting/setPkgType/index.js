import React, {useEffect, useState, useImperativeHandle} from 'react'
import { Dialog, RadioGroup, CheckBox } from '@/component'
import { Cookie } from 'assets/js'
import { pkgtypeTypeOptions as typeOptions, defaultVolumeOption} from '../config'

export default React.forwardRef(function App(props, ref) {
  const [visible, setVisible] = useState(false)
  const [type, setType] = useState('')
  const [defaultVolume, setDefaultVolume] = useState('')
  useImperativeHandle(ref, () => ({
    open,
    close: onClose
  }))
  function open() {
    setVisible(true)
    setType([Cookie.get('pkgtype') || ''])
    setDefaultVolume([Cookie.get('defaultVolume') || ''])
  }
  function onOk() {
    Cookie.set('pkgtype', type[0], {hour: 30 * 24})
    Cookie.set('defaultVolume', defaultVolume[0], {hour: 30 * 24} )
    onClose()
    window.location.reload()
  }
  function onClose() {
    setVisible(false)
  }
  return <div>
    <Dialog
      title="设置作业包裹类型"
      visible={visible}
      style={{width: 600}}
      onOk={onOk}
      onClose={onClose}
      onCancel={onClose}
    >
      <div><RadioGroup dataSource={typeOptions} value={type} onChange={(d) => {setType(d)}}></RadioGroup></div>
      <div><CheckBox dataSource={defaultVolumeOption} value={defaultVolume} onChange={(d) => {setDefaultVolume(d)}}></CheckBox></div>
    </Dialog>
  </div>
})