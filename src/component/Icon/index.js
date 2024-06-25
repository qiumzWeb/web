import React from 'react';
import { getMarginStyle } from 'assets/js/proxy-utils'

const cot = require.context('assets/imgs', true, /\.svg|png|jpg$/)
const defineIcon = {}
cot.keys().forEach(entry => {
  const name = entry.replace('./', '').split(/\.svg|png|jpg/)[0]
  defineIcon[name] = cot(entry).default || cot(entry)
})

export default function App(props) {
  const { type, size, defineType, style, ...attrs } = props
  const sizeConfig = {
    large: 100,
    small: 30,
    xs: 45,
    medium: 60
  }
  return (
    defineType ? <img
      {...attrs}
      style={getMarginStyle(props)}
      src={defineIcon[defineType]}
    ></img> : <i className={`iconfont icon-${type}`} style={{
      fontSize: sizeConfig[size || 'xs'],
      ...getMarginStyle(props)
    }} {...attrs}></i>
  )
}