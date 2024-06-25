import React from 'react'
import { getMarginStyle } from 'assets/js/proxy-utils'
import { isEmpty } from 'assets/js'
require('./table.scss')
export default React.forwardRef(function Table(props, ref) {
  const data = Array.isArray(props.data) ? props.data : []
  const columns = (Array.isArray(props.columns) ? props.columns : []).filter((c, index) => {
    const show = typeof c.show === 'function' ? c.show(index, data, c, columns) : c.show !== false
    return show
  })
  const onChange = props.onChange
  const colgroup = <colgroup>
    {columns.map((c, k) => {
      const { width } = c
      return <col key={k} width={ width || (100/columns.length + "%")}></col>
    })}
  </colgroup>
  const renderTitle = (c, k, columns) => {
    if (typeof c.title === 'function') {
      return c.title(c, k, columns)
    }
    return c.title
  }
  const thead = <thead>
    <tr>
      {columns.map((c, k) => {
        return <th {...(c.attrs || {})} key={k}>{renderTitle(c, k, columns)}</th>
      })}
    </tr>
  </thead>
  const renderCell = (val, index, record, col, prop) => {
    if (typeof col.cell === 'function') {
      return col.cell(val, index, record, col, prop)
    } else if (typeof col.cell === 'object') {
      return col.cell
    } else {
      return val
    }
  }
  return <div className="c-table" style={getMarginStyle(props)}>
    <div className="fixedHead">
      <table>
        {colgroup}
        {thead}
      </table>
    </div>
    <div className="table-content" style={{maxHeight: `${props.maxHeight || '500px'}`, minHeight: 150}} ref={ref}>
      <table>
        {colgroup}
        {thead}
        <tbody>
          {data.map((d, k) => {
            return <tr key={k} className={
              typeof props.rowClass === 'function' && props.rowClass(d, k) || ''
            } onClick={() => {
              typeof props.rowClick === 'function' &&
                props.rowClick(d, k)
            }}>
              {columns.map((c, index) => {
                return <td key={index}>{renderCell(d[c.key], index, d, c, {
                  rowIndex: k,
                  ...props
                })}</td>
              })}
            </tr>
          })}
          {isEmpty(data) && <tr className='nohover'>
          <td colSpan={columns.length} style={{textAlign: 'center', verticalAlign: 'middle', height: 150, color: '#eee'}}>暂无数据</td>
          </tr>}
        </tbody>
      </table>
    </div>
  </div>
})