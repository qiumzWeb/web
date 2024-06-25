import React, {useState, useEffect} from 'react';
import { isTrue, messageAudio } from 'assets/js';
export default function Message(props) {
  const {children, name, isMessage, slot, ...attrs} = props
  const [msg, setMsg] = useState('')
  const [clsName, setClsName] = useState('')
  /**
   * hasAudio, 是否需要提示音， 默认需要
   */
  const info = {
    success: (m, hasAudio = false) => {
      setClsName('success');
      setMsg(m);
      hasAudio && messageAudio.success();
    },
    error: (m, hasAudio = false) => {
      setClsName('error')
      setMsg(m);
      hasAudio && messageAudio.error();
    },
    clear: () => {
      if (msg || clsName) {
        setMsg('')
        setClsName('')
      }
    }
  }
  if (name) {
    Message[name] = info
  }
  Object.assign(Message, info)
  return <div {...attrs}>
    {slot}
    {(msg || isMessage) && <div className={`message_info ${clsName}`}>
      <div className="msgbox">{msg}</div>
    </div> || children}
  </div>
}