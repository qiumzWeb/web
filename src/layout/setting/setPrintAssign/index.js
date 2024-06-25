import React, { useEffect, useState, useImperativeHandle } from 'react'
import { Dialog, Loading, Message, Select } from '@/component'
import { Cookie, Print } from 'assets/js/utils'
import { printForModel as forModel } from '../config'
const cloudPrint = new Print()
const getPrintCache = () => {
  const data = {}
  Object.keys(forModel).forEach(key => {
    data[key] = Cookie.get(key)
  })
  return data
}
function App(props, ref) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [printOptions, setPrintOptions] = useState([])
  const [formData, setFormData] = useState(getPrintCache())
  useImperativeHandle(ref, () => ({
    open() {
      setVisible(true)
      _handlePrintAssign()
    },
    close() {
      onClose()
    }
  }))
  useEffect(() => {
    
  }, [])
  function _handlePrintAssign() {
    setLoading(true)
    let printSetSocket = cloudPrint.createPrintSocket(1)
    printSetSocket.send({
      "cmd": "getPrinters",
      "requestID": "" + new Date().getTime(),
      "version": "1.0"
    }, function success(res){
      console.log(res, '成功')
      setLoading(false)
      if (res.status == 'success') {
        const data = (res.printers || []).filter(r => r && r.status == 'enable')
        setPrintOptions(data.map(d => ({
          ...d,
          label: d.name,
          value: d.name
        })))
      }
    }, function error(err){
      console.log(err, '失败')
      Message.error('获取不到打印机，请检查连接！')
      printSetSocket = null
      setLoading(false)
    })
  }
  function onOk() {
    Object.entries(formData).forEach(([key, val]) => {
      Cookie.set(key, val, {hour: 30 * 24})
    })
    onClose()
  }
  function onClose() {
    setVisible(false)
    Message.clear()
  }
  return <Dialog
    title="设置打印机"
    visible={visible}
    style={{width: 800}}
    onOk={onOk}
    onClose={onClose}
    onCancel={onClose}
  >
    <div style={{position: 'relative'}}>
      {loading && <Loading></Loading>}
      {Object.entries(forModel).map(([key, label]) => {
        return <div key={key}>
          <Select
            style={{width: '100%'}}
            value={formData[key]}
            hasClear
            mb='10'
            label={label}
            dataSource={printOptions}
            onChange={(val) => {
              setFormData({
                ...formData,
                [key]: val
              })
            }}
          ></Select>
        </div>
      })}
      <Message></Message>
    </div>
  </Dialog>
}

export default React.forwardRef(App)