import React, { useEffect, useState } from 'react'
import { getMarginStyle } from 'assets/js/proxy-utils'
export default function App(props) {
  const { dataSource, multiple, value, onChange, ...attrs} = props
  const [checkSetData, setCheckSetData] = useState({})
  const refs = {}
  useEffect(() => {
    const data = {}
    Array.isArray(value) && value.forEach(v => {
      data[v] = true
    })
    changeStatus(data)
  }, [])
  function changeStatus(item) {
    let newData = {
      ...item
    }
    if (multiple) {
      newData = {
        ...checkSetData,
        ...item
      }
    }
    setCheckSetData(newData)
    typeof onChange === 'function' && onChange(
      Object.entries(newData)
        .filter(([key, val]) => {
          return val
        })
        .map(([key,val]) => key)
    )
  }
  return <div style={{
      display: 'inline-block',
      ...getMarginStyle(props)
    }}>
    {Array.isArray(dataSource) && dataSource.map((d, i) => {
      return <div style={{display: 'inline-block'}} key={i}><label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          marginRight: 10,
          userSelect: 'none',
          cursor: 'pointer'
        }}
      >
        <input
          ref={ref => refs[d.value] = ref}
          type="checkbox"
          style={{
            width: 30,
            height: 30,
            marginTop: 6
          }}
          checked={Array.isArray(value) && value.includes(d.value) && true || ''}
          onChange={() => {}}
          onClick={(e) => {
           changeStatus({
            [d.value]: !checkSetData[d.value]
           })
          }}
        ></input>
        <span style={{lineHeight: '100%'}}>{d.label}</span>
      </label>
      </div>
    })}

  </div>
}