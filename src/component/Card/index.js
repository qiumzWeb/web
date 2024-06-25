import React, { useState, useEffect } from 'react'
import { Bus } from 'assets/js/utils'
import {messageAudio} from 'assets/js'
function Card(props, ref) {
  const [ms, setMs] = useState('success')
  const [msg, setMsg] = useState('')
  const { children, audio, audioType = 0 } = props
  const Child = children ? (Array.isArray(children) && children || [children]) : []
  const getSlot = (name) => {
    return Child.find(c => c.props.slot === name)
  }
  useEffect(() => {
    const unBus = Bus.$on('message', (type, msg = '', flag = audioType, color) => {
      const status = ['success', 'info', 'clear'].includes(type) ? 'success' : type
      msg != 'onlyAudio' && setMsg(msg)
      setMs(color || status)
      if (audio !== false) {
        if (type == 'success' && !msg) return
        if (['info', 'clear'].includes(type)) return
        messageAudio[type] && messageAudio[type](flag);
      }
    })
    return () => unBus()
  }, [])
  const btnTools = getSlot('btnTools')
  const contentHeightStype = {
    height: isPow() ? `calc(100% - ${btnTools && '60px' || '0px'})` : 'auto',
    maxHeight: `calc(100% - ${btnTools && '60px' || '0px'})`
  }
  return <div className="rbox">
        <div className="rcot">
          <div style={{...contentHeightStype, overflowY: 'auto'}}>
            {getSlot('content')}
          </div>
          {btnTools && <div style={{height: 60, marginTop: 10}}>
            {btnTools}
          </div> || null}
        </div>
        <div className={`rinfo  ${ms}`}>
          {getSlot('info')}
          <div className="msgbox" style={{ margin: '20px 10px' }}>{msg}</div>
        </div>
    </div>
}
const BCard = React.forwardRef(Card)
const MessageType = ['success', 'error', 'info', 'clear']
BCard.message = {}
MessageType.forEach(type => {
  BCard.message[type] = function(msg, flag, color) {
    Bus.$emit('message', type, msg, flag, color);
    return {
      log: (logItem = {}) => {
        window.CatchErrorLog({
          status: type == 'error' ? false : true,
          message: msg,
          ...logItem
        })
      }
    }
  }
})
export default BCard