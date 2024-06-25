import React, {useEffect, useTransition, useState} from 'react';
import { _CountryList, _getName, getWName, getWid, getUuid} from 'assets/js'
import Bus from 'assets/js/bus'
export default function WaterMark() {
  const [isPending, startTranstion] = useTransition()
  useEffect(() => {
    startTranstion(getWaterMark)
    const unBus = Bus.$on('updateWaterMark', () => {
      startTranstion(getWaterMark)
    })
    return () => {
      unBus()
    }
  }, [])
  function getWaterMark() {
    Bus.getState('getWarehouseList').then(async () => {
      const warehouse = getWName(getWid())
      const currentVersion = (window.BASE_URL.split('/').slice(-1) + '') || '0.0.0';
      const userAccount = await window.getEmployeeNo;
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d');
      ctx.font = "14px serif";
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.rotate((Math.PI / 180) * -15); // 弧度 = (Math.PI/180)*角度
      ctx.fillText(warehouse, -10,  canvas.width * 1 / 4);
      ctx.fillText(userAccount, 100,  canvas.height * 2.5 / 4);
      ctx.fillText(currentVersion, 200, canvas.height * 4 / 4);
      const waterMark = document.getElementById('water-mark')
      waterMark.style.background = `url(${canvas.toDataURL()}) left top repeat`;
    }).catch(e => console.log(e))
  }
  return <div className='water-mark' id='water-mark'></div>
}