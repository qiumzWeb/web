import React, { useEffect, useState, useImperativeHandle } from 'react'
import { getMarginStyle } from 'assets/js/proxy-utils'
export default React.forwardRef(function App(props, ref) {
  const { dataSource, multiple, value, onChange, align, ...attrs} = props
  const [radioSetData, setRadioSetData] = useState({})
  const [groupValue, setGroupValue] = useState(value)
  const refs = {}
  useEffect(() => {
    const data = {}
    Array.isArray(value) && value.forEach(v => {
      data[v] = true
    })
    changeStatus(data)
  }, [])
  useImperativeHandle(ref, () => ({
    value: groupValue
  }))
  useEffect(() => {
    setGroupValue(groupValue)
  }, [value])
  function changeStatus(item) {
    let newData = {
      ...item
    }
    if (multiple) {
      newData = {
        ...radioSetData,
        ...item
      }
    }
    setRadioSetData(newData)
    const newValue =  Object.entries(newData).filter(([key, val]) => val).map(([key,val]) => key)
    typeof onChange === 'function' && onChange(newValue)
    setGroupValue(newValue)
  }
  return <div style={{
      display: 'inline-block',
      ...getMarginStyle(props)
    }}>
    {Array.isArray(dataSource) && dataSource.map((d, i) => {
      return <div style={{display: align !== 'vertical' ? 'inline-block' : 'block'}} key={i}><label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: align !== 'vertical' ? 'center' : 'flex-start',
          color: '#fff',
          marginRight: 10,
          marginBottom: 10,
          userSelect: 'none',
          cursor: 'pointer'
        }}
      >
        <input
          ref={ref => refs[d.value] = ref}
          type="radio"
          style={{
            width: 30,
            height: 30
          }}
          checked={Array.isArray(groupValue) && groupValue.includes(d.value) && true || ''}
          onChange={() => {}}
          onClick={(e) => {
            if (!multiple && radioSetData[d.value]) return
           changeStatus({
            [d.value]: !radioSetData[d.value]
           })
          }}
        ></input>
        {d.label}
      </label>
      </div>
    })}

  </div>
})