import React, {useEffect, useState, useRef } from 'react'
import { Dialog } from '@/component'
import { Print } from 'assets/js/utils'
import { logout, setWid, getWid, currentPrintDataKey, localStore, isJSON, getUuid } from 'assets/js'
// 打印面单 
function PrintLabel(data) {
  return new Print(data).send()
}

export default {
  openDebug() {
    if (!window.debugStatus) {
      Dialog.confirm({
        title: '开启Debug调式模式',
        content: '是否开启Debug日志调试模式？开启后屏幕上将会打印出代码日志',
        onOk: () => {
          window.debugStatus = true
          console.log = window.log
        }
      })
    } else {
      Dialog.confirm({
        title: '关闭Debug调式模式',
        content: '是否关闭Debug调试模式？',
        onOk: () => {
          window.location.reload()
        }
      })
    }
  },
  openPrintTest() {
    let textareaRef = null
    Dialog.confirm({
      title: '打印测试',
      okText: '打印',
      style: {width: 1000},
      content: <div style={{color: "#333", overflow: 'auto'}}>
        <textarea style={{width: '100%', height: 400}} ref={ref => {
          const cache = isJSON(localStore.get(currentPrintDataKey)) ? JSON.parse(localStore.get(currentPrintDataKey)) : {}
          ref && (ref.value = JSON.stringify(window[currentPrintDataKey] || cache, null, 2));
          textareaRef = ref;
        }}></textarea>
      </div>,
      onOk: () => {
        const data = textareaRef.value && JSON.parse(textareaRef.value)
        PrintLabel(data)
      }
    })
  },
}