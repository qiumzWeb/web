import React, { useEffect, useState, useImperativeHandle } from 'react';
import { Dialog, Input } from '@/component';
import { Cookie, isEmpty } from 'assets/js';
const { useInput, useAction } = React;
const autoSubmitTimes = 'autoSubmitTimes';
// 默认自动提交时间 500 毫秒
const defaultSaveTime = 500;
// 注册获取自动提交时间
window.getAutoSubmitTime = () => +(Cookie.get(autoSubmitTimes) || defaultSaveTime);

// 初始化默认设置时间
function setTime(time) {
  time = (isNaN(time) || isEmpty(time)) ? defaultSaveTime : time
  Cookie.set(autoSubmitTimes, time, {hour: 30 * 24})
};
setTime(Cookie.get(autoSubmitTimes));
// 组件
function App(props, ref) {
  const [visible, setVisible] = useState(false)
  const {getValue, setValue, refs, getFocus, getSelect} = useInput([autoSubmitTimes])
  function open() {
    setVisible(true)
    setTimeout(() => {
      getFocus(autoSubmitTimes)
      setValue(autoSubmitTimes, Cookie.get(autoSubmitTimes))
    }, 100)
  }
  useImperativeHandle(ref, () => ({
    open,
    close() {
      onClose()
    }
  }))
  function onOk() {
    setTime(getValue(autoSubmitTimes))
    onClose()
  }
  function onClose() {
    setVisible(false);
  }
  return <Dialog
    title="设置称重自动提交触发时间"
    visible={visible}
    style={{width: 800}}
    onOk={onOk}
    onClose={onClose}
    onCancel={onClose}
  >
    <Input label="电子称重量稳定时间（毫秒）" type="number" ref={refs[autoSubmitTimes]} onEnter={onOk}></Input>
    <div className='warn-color' style={{marginTop: 30, fontSize: 24}}>
      <p>称重自动提交：操作界面上勾选自动提交后，由电子称称重稳定后触发；</p>
      <p>电子称重量稳定时间：指电子称在设置的时间范围内，重量不变； </p>
    </div>
  </Dialog>
}

export default React.forwardRef(App)