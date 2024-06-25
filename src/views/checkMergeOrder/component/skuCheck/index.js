import React, { useImperativeHandle, useState } from 'react'
import { Dialog, Input, Table } from '@/component'
import { getVideoMakeTap } from '@/views/mergeOrder/config'
import { isEmpty, isSame, messageAudio } from 'assets/js'
import { getCheckSkuSubmit } from '../../api'
import { getMark, getSkuCode, setSkuRowClass, skuColumns } from '../../config'
const { useReset, useInput, useRefresh, useAction } = React

// SKU 复核
export default React.forwardRef(function App(props, ref) {
  const { getValue, setValue, refs, getFocus, getBlur } = useInput([
    'skuSearchCode'
  ])
  // 显示sku复核框
  const [skuCheckVisible, setSkuCheckVisible] = useState(false)
  const [data, setData] = useState({})
  const [tableData, setTableData] = useState([])

  useImperativeHandle(ref, () => ({
    open(data) {
      setData(data)
      setTableData(data.skuList || [])
      setSkuCheckVisible(true)
    },
    close: () => onSkuClose()
  }))
  // 删除多件
  function onTableChange(item, key) {
    const newList = tableData.map((t, index) => {
      if (index == key) {
        t = item
      }
      getMark(t)
      return t
    }).filter((t) => {
      return !(t.quantity == 0 && t.scanCount == 0)
    })
    setTableData(newList)
  }
  // 扫描 SKU
  async function onSearch() {
    const skuCode = getValue('skuSearchCode');
    setValue('skuSearchCode', '');
    getFocus('skuSearchCode');
    let newList = [...tableData]
    // 打水印，sku
    getVideoMakeTap(skuCode);
    const getTake = (t) => {
      t.scanCount = (t.scanCount || 0) + 1
      getMark(t)
      if (t.exceptionType) {
        messageAudio.error()
      } else if (t.scanCount < t.quantity) {
        messageAudio.success()
      } else {
        messageAudio.success(1)
      }
    }
    const getSkuList = (t) => typeof t.skuCode == 'string' && t.skuCode.split('#') || [];
    if (
      // 优先全等校验一遍
      !newList.some(t => {
        const skuCodeList = getSkuList(t);
        // 全等校验
        if (!isEmpty(skuCodeList) && skuCodeList.some(s => s === skuCode)) {
          getTake(t)
          return true
        }
        return false
      }) &&
      // 全等校验不通过 时 再弱校验一遍
      !newList.some(t => {
        const skuCodeList = getSkuList(t);
        // 弱校验
        if (!isEmpty(skuCodeList) && skuCodeList.some(s => isSame(s, skuCode))) {
          getTake(t)
          return true
        }
        return false
      })
    ) {
      createNewSku(newList, skuCode)
    }

    setTableData(newList)
  }

  // 创建多件
  function createNewSku(newList, skuCode) {
    const newSku = {
      deliveryCode: "多件",
      referLogisticsOrderCode: "",
      packageWeight: '',
      skuCode,
      scanCount: 1,
      skuName: "未知",
      quantity: 0
    }
    getMark(newSku)
    messageAudio.error()
    Array.isArray(newList) && newList.push(newSku)
  }

  /** */

  // SKU复核提交
  async function onSkuSubmit() {
    const sku = getSkuCode(tableData)
    console.log(sku, isEmpty(sku.more), '---------------')
    if (!isEmpty(sku.more)) {
      return '复核异常，包裹存在不属于该包裹的SKU，请移除多件SKU后再提交！'
    }
    if (!isEmpty(sku.miss)) {
      Dialog.confirm({
        title: '提示',
        content: "SKU少货，确认是否提交？",
        onOk: async () => {
          try {
            await getCheckSkuSubmit({
              "deliveryCode": data.deliveryCode,
              "normalSkus": sku.pass,
              "missingSkus": sku.miss,
              "moreSkus": sku.more
            })
            onSkuClose(true)
            messageAudio.success()
          } catch (e) {
            return e.message
          }
        },
      })
      return;
    }
    try {
      await getCheckSkuSubmit({
        "deliveryCode": data.deliveryCode,
        "normalSkus": sku.pass,
        "missingSkus": sku.miss,
        "moreSkus": sku.more
      })
      onSkuClose(true)
      messageAudio.success()
    } catch (e) {
      return e.message
    }
  }
  // 关闭SKU复核
  function onSkuClose(isSubmit) {
    const hasChecked = isSubmit ? true : !!data.hasChecked
    const sku = getSkuCode()
    typeof props.onClose == 'function' && props.onClose({
      ...data,
      hasChecked,
      isMore: !isEmpty(sku.more),
      isPass: isEmpty(sku.miss) && isEmpty(sku.more),
      skuList: [...tableData]
    })
    setSkuCheckVisible(false)
  }

  return <div className="skuCheckBox">
    <Dialog title="SKU复核"
      visible={skuCheckVisible}
      okText="提交"
      cancelText="关闭"
      onOk={onSkuSubmit}
      onClose={() => onSkuClose()}
      onCancel={() => onSkuClose()}
      style={{ width: 1000 }}
    >
      <div ref={(ref) => {
        setTimeout(() => {
          ref && getFocus('skuSearchCode')
        }, 500)
      }}>
        <Input ref={refs['skuSearchCode']} style={{ flex: 1 }} onEnter={onSearch} label="SKU" placeholder="请扫描SKU码"></Input>
        <Table
          columns={skuColumns}
          data={tableData}
          rowClass={setSkuRowClass}
          onChange={onTableChange}
          mt="10" maxHeight={'calc(100vh - 380px)'}
        ></Table>
      </div>
    </Dialog>
  </div>
})
