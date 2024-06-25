export const menuWhiteConfig = {
  // 入库
  '/valueaddedservice': {text: '增值服务', icon: 'print-merge-label', show: true},
  '/smallPutin': {text: '小货入库', icon: 'small-putin', show: true},
  '/inStorage': {text: '入库(新)', icon: 'small-putin', show: true},
  '/reprintPutinLabel': { text: '重打入库标签', icon: 'reprint-label', show: true},
  '/bigBagSignAndInStorage': { text: '签收入库', icon: 'small-putin', show: true},
  '/reprintRepeatRouteOrder': { text: '重路由打单', icon: 'reprint-label', show: true},
  '/bigPutin2': {text: '大货入库(新)', icon: 'big-putin', show: true},
  '/bigBagSign': {text: '大包签收&重量校验', icon: 'no-preorder-putin', show: true},
  '/noshelfBigbagSign': {text: "蓄水签收&重量校验", icon: 'no-preorder-putin', show: true},
  '/reversalStorage': {text: '逆向入库', icon: 'reprint-label', show: true},
  '/sortingWall': {text: '分拣墙', icon: 'big-putin', show: true},
  '/qualityCheck': {text: '拆包质检', icon: 'quality-check'},
  // '/test': {text: '测试', icon: 'quality-check', show: true},
  '/returnReplacement': {text: '退件换配入库', icon: 'return-goods', show: true},
  // 出库
  '/mergeOrder': {text: '合箱打单', icon: 'print-merge-label', show: true},
  '/checkMergeOrder': {text: '复核合箱', icon: 'print-merge-label', show: true},
  '/mergeVolumnWeight': {text: '称重打单', icon: 'print-merge-label', show: true},
  '/childMotherSplitOder': {text: '子母件拆单', icon: 'print-merge-label', show: true},
  '/flashSow': {text: '播种(闪)', icon: 'small-putin', show: true},
  '/flashSowAuto': {text: '播种(闪)(新)', icon: 'small-putin', show: true},
  '/flashSowBigPackage': {text: '播种(闪)(多波次)', icon: 'small-putin', show: true},
  '/replaceOrder': {text: '换面单', icon: 'replace-label', show: true },
  '/replaceLabelOrder': {text: '重打小票', icon: 'reprint-label', show: true },
  '/latticeFree': {text: '格口释放', icon: 'return-goods', show: true},
  '/registerException': {text: '异常登记', icon: 'no-preorder-putin', show: true},
  '/destory': {text: '包裹销毁', icon: 'reprint-label', show: true},
  '/returnGoods': { text: '退货', icon: 'return-goods', show: true},
  '/weighVerify': { text: '称重校验', icon: 'no-preorder-putin', show: true},
  '/cardBoardWeight': {text: '卡板称重', icon: 'cardboard-weight', show: true},
  '/sow': {text: '播种', icon: 'small-putin'}, // 弃用
}

// 测试菜单
export const testRoute = [
  {text: '播种(闪)(多波次)', href: '/flashSowBigPackage'},
  // {text: '称重打单', href: '/mergeVolumnWeight'},
  // {text: '复核合箱', href: '/checkMergeOrder'},
  // {text: '签收入库', href: '/bigBagSignAndInStorage'}
]