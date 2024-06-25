import { download, getObjType } from './common'

// 媒体类型
export const mediaType = {
  audio: 'audio/ogg; codecs=opus',
  videoMp4: 'video/mp4; codecs="avc1.424028, mp4a.40.2"',
  videoWebm: "video/webm; codecs=vp9"
}

// 创建Video 
export function createVideo(attrs) {
  const video = document.createElement('video')
  video.className = 'RTC_VIDEO'
  if (getObjType(attrs) === 'Object') {
    Object.entries(attrs).forEach(([key, val]) => {
      video.setAttribute(key,val)
    })
  }
  return video
}

// 下载视频
export function downloadVideo(res, name) {
  download(res, {
    fileName: name || `视频录制-${new Date().toLocaleDateString()}-${Date.now()}`,
    mimeType: mediaType.videoMp4
  })
}

// 录屏功能
export async function getCaptureScreen(displayMediaOptions = {video: true, audio: true}) {
  let mediaRecorder = null;
  const mimeType = mediaType.videoWebm
  // 开始录制
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    mediaRecorder = new MediaRecorder(stream, { mimeType })
    const chunks = []
    mediaRecorder.start()
    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data)
      closeMediaRecord(chunks)
      downloadVideo(chunks)
    }
    mediaRecorder.onstop = function(e) {
      console.log("data available after MediaRecorder.stop() called.");
      stream.getTracks().forEach(track => track.stop())
      console.log("录像停止");
    }
  } catch(err) {
    console.log("Error: " + err);
  }
  // 取消录制
  function closeMediaRecord(chunks) {
    typeof mediaRecorder.onRecordEnd === 'function' && mediaRecorder.onRecordEnd(chunks)
  }
  return mediaRecorder;
}


