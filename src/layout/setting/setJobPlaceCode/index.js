import React, { useEffect, useState, useImperativeHandle } from 'react'
import { Dialog, Input } from '@/component'
import { Cookie } from 'assets/js'
import { onEnter } from 'assets/js/utils'
import Bus from 'assets/js/bus'
const { useInput, useAction } = React
function App(props, ref) {
  const [visible, setVisible] = useState(false)
  const {getValue, setValue, refs, getFocus, getSelect} = useInput(['jobPlaceCode'])
  const [getOpenCallBack, setOpenCallBack] = useAction('jobPlaceCodeOpenCallBack')
  useEffect(() => {
    const unBus = Bus.$on('setJobPlaceCode',(callback) => {
      open();
      typeof callback === 'function' && setOpenCallBack(callback);
    })
    const unCloseBus = Bus.$on('closeSetDialog', () => {
      onClose(true)
    });
    return () => {
      unBus();
      unCloseBus();
    }
  }, [])
  function open() {
    setVisible(true)
    setTimeout(() => {
      getFocus('jobPlaceCode')
      setValue('jobPlaceCode', Cookie.get('jobPlaceCode'))
    }, 100)
  }
  useImperativeHandle(ref, () => ({
    open,
    close() {
      onClose()
    }
  }))
  function onOk() {
    Cookie.set('jobPlaceCode', getValue('jobPlaceCode'), {hour: 30 * 24})
    onClose()
  }
  function onClose(isDistroy) {
    setVisible(false);
    const openCallBack = getOpenCallBack();
    if (typeof openCallBack === 'function') {
      if (isDistroy) {
        setOpenCallBack(null);
      } else {
        openCallBack();
      }
    }
  }
  return <Dialog
    title="设置作业台号"
    visible={visible}
    style={{width: 800}}
    onOk={onOk}
    onClose={() => onClose()}
    onCancel={() => onClose()}
  >
    <Input label="作业台号" ref={refs['jobPlaceCode']} onKeyPress={onEnter(onOk)}></Input>
  </Dialog>
}

export default React.forwardRef(App)