import React, {useState, useEffect, useRef} from 'react'
import ReactDOM from 'react-dom'
import ReactApp from 'react-dom/client'
import Confirm from './confirm'
import Dialog from './dialog'

const CDialog = React.forwardRef(function App(props, ref) {
  return ReactDOM.createPortal(<Dialog ref={ref} {...props}></Dialog>, document.body)
})

const dialogConfirmClassName = 'dialog_confirm'
CDialog.confirm = function (props) {
  const popup = new Promise((resolve, reject) => {
    const noop = async() => {}
    const confirm = document.createElement('div')
    confirm.className = dialogConfirmClassName
    document.body.appendChild(confirm)
    ReactApp.createRoot(confirm).render(<Confirm
      onCancel={noop}
      onClose={noop}
      onOk={noop}
     {...props} closeAction={(action) => {
      if (action == 3) {
        resolve(1)
      } else {
        reject(action)
      }
    }} container={confirm}></Confirm>)
  })
  return popup
}

export default CDialog