import React, { useEffect, useState, useRef } from 'react';
import { getCaptureScreen } from 'assets/js/webRTC'
require('./index.scss')
export default function Component(props) {
  const [recordStatus, setRecordStatus] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  // 开始录制
  function getRecordVideoStart() {
    if (recordStatus) return
    setRecordStatus(true)
    getCaptureScreen().then(MediaRecord => {
      if (MediaRecord) {
        setMediaRecorder(MediaRecord)
        // 开始录制
        MediaRecord.onRecordEnd = function() {
          // 录制完成
          setRecordStatus(false)
        }
      } else {
        // 取消录制
        setRecordStatus(false)
      }
    })
  }
  // 取消录制
  function getRecordVideoStop() {
    mediaRecorder.stop()
  }
  return <div>
    {recordStatus ? <div
      onClick={getRecordVideoStop}>
      停止录制屏幕</div>: <div
      onClick={getRecordVideoStart}>
      开启屏幕录制</div>}
  </div>
}