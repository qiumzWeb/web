import React, {useEffect, useState, useImperativeHandle} from 'react'
import {Dialog, RadioGroup} from '@/component'
import $http from 'assets/js/ajax'
import { _CountryList, _getName, Cookie } from 'assets/js'
const getRegion = $http({
  url: '/instock/countryAreaList',
})
export default React.forwardRef(function App(props, ref) {
  const [visible, setVisible] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [value, setValue] = useState('')
  useImperativeHandle(ref, () => ({
    open,
    close: onClose
  }))
  useEffect(() => {
    window.dbStore.get(_CountryList).then(list => {
      setValue([Cookie.get('putinArea') || ''])
      list && setDataSource(getDataSource(list))
      getRegion.then(data => {
        const list = Array.isArray(data) && data || []
        const Country = [
          ...list.map(d => ({
            ...d,
            label: d.areaName,
            value: d.areaCode
          }))
        ]
        setDataSource(getDataSource(Country))
        window.dbStore.set(_CountryList, Country)
      })
    })
  }, [])
  function getDataSource(data) {
    return [{ label: '所有', value: '' }].concat(data || [])
  }
  function open() {
    setVisible(true)
    setValue([Cookie.get('putinArea') || ''])
  }
  function onOk() {
    Cookie.set('putinArea', value[0], {hour: 30 * 24})
    onClose()
    window.location.reload()
  }
  function onClose() {
    setVisible(false)
  }
  return <div>
    <Dialog
      title="设置入库地区"
      visible={visible}
      style={{width: 1000}}
      onOk={onOk}
      onClose={onClose}
      onCancel={onClose}
    >
      <RadioGroup dataSource={dataSource} value={value} onChange={(d) => {setValue(d)}}></RadioGroup>
    </Dialog>
  </div>
})