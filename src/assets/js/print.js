import { getObjType, localStore,  Cookie, currentPrintDataKey, isJSON} from 'assets/js'
/**
 * 打印
 */

const printMap = {
  // 标签打印
  printLabel: ['Label_WareHouse', 'Label_BigPackageInBound', 'Label_NoPreAlertIn', 'Label_NoPrePackageInBound', 'Label_SelfInferior', 'Label_SelfGood'],
  // 面单打印
  printOrder: [
    'Label_FpxHk', 'Label_HCT', 'Label_ManyBo', 'Label_Pelican', 'Label_Royale', 'Label_TWSevenEleven',
    'Lable_TWBlackCat', 'Label_BreakBulk', 'Label_ReportYD', 'Label_AUPost', 'Label_AUGRID'
  ],
  // 发票打印
  printBill: ['Label_TaiWanInvoice', 'Label_HandoverList', 'Label_TmallSelfSupport', 'Label_TWInvoiceSeller']
}

// 云打印
let CloudSocket = null

// Agent 打印
let AgentSocket = null


export default class Print {
  constructor(opt) {
    this.Socket = null
    // 打印数据
    this.data = opt || {}
    // 打印实例
    this.CloudSocket = null
    this.AgentSocket = null
    if (this.data) this.open()
    window.__Print = this // 调式用
  }
  fn(){}
  createPrintSocket(intSign) {
    if (intSign == 1) {
      if (!CloudSocket) {
        CloudSocket = new window.cloudSocket()
      }
      return CloudSocket
    } else {
      if (!AgentSocket) {
        AgentSocket = new window.socket()
      }
      return AgentSocket
    }
  }
  open() {
    if (isPow()) {
      this.Socket = {
        send: (data, success = this.fn, error = this.fn) => {
          callWindVane(nativeClassName, "print", data).then((res) => {
            window.CatchErrorLog({
              status: true,
              message: 'lemoCode打印成功',
              code: 'lemoCode_print'
            })
            success(res)
          }).catch((err) => {
            window.CatchErrorLog({
              status: false,
              message: 'lemoCode打印失败，请检查打印组件',
              code: 'lemoCode_print'
            })
            error(err)
          })
        }
      }
    } else {
      if (this.data.intSign == 1) { // 云打印
        this.CloudSocket = this.createPrintSocket(1)
        this.Socket = {
          send: (data, success = this.fn, error = this.fn) => {
            this.setCloudPrinter(data)
            this.CloudSocket.send(data, (res) => {
              if (res.Success || res.success) {
                window.CatchErrorLog({
                  status: true,
                  message: '菜鸟云打印成功',
                  code: 'cloud_print'
                })
                success(res)
              } else {
                window.CatchErrorLog({
                  status: false,
                  message: '菜鸟云打印失败，请检查打印组件',
                  code: 'cloud_print'
                })
                error(res)
              }
            }, (err) => {
              window.CatchErrorLog({
                status: false,
                message: '菜鸟云打印连接失败，请检查打印组件',
                code: 'cloud_print'
              })
              error(err)
            })
          }
        }
      } else { // Agent 打印
        this.AgentSocket = this.createPrintSocket()
        this.Socket = {
          send: (data, success = this.fn, error = this.fn) => {
            PrintDone.call(this, data.data)
            if (data.resultData){
              PrintDone.call(this, data.resultData)
            }
            function PrintDone(pData) {
              let printData = []
              if (Array.isArray(pData)) {
                this.setAgentPrinter(pData)
                printData = pData
              } else {
                this.setAgentPrinter([pData])
                printData = [pData]
              }
              printData.forEach(d => {
                this.AgentSocket.send(d, (res) => {
                  if (res.Success || res.success) {
                    window.CatchErrorLog({
                      status: true,
                      message: 'Agent打印成功',
                      code: 'agent_print'
                    })
                    success(res)
                  } else {
                    window.CatchErrorLog({
                      status: false,
                      message: 'Agent打印失败，请检查打印组件',
                      code: 'agent_print'
                    })
                    error(res)
                  }
                }, (err) => {
                  console.log(err, 'Agent打印连接失败，请检查打印组件')
                  window.CatchErrorLog({
                    status: false,
                    message: 'Agent打印连接失败，请检查打印组件',
                    code: 'agent_print'
                  })
                  error(err)
                })
              })
            }
          }
        }
      }
    }
  }
  send() {
    return new Promise((resolve, reject) => {
      window[currentPrintDataKey] = this.data;
      localStore.set(currentPrintDataKey, JSON.stringify(this.data));
      this.Socket.send(this.data, resolve, reject);
    })
  }
  // 云打印设置
  setCloudPrinter(data) {
    const d = data.data
    if (d && d.dataType == 'Label') {
      data.printer = Cookie.get('printLabel')
    } else {
      data.printer = Cookie.get('printCloud')
    }
  }
  // Agent 打印设置
  setAgentPrinter(data) {
    data.forEach(d => {
      const info = d.bizdata?.lableInfo || {templateName: null};
      Object.entries(printMap).some(([key, temArr]) => {
        if (temArr.includes(info.templateName)) {
          info.printer = Cookie(key)
          return true
        }
        return false
      })
    })
  }
}