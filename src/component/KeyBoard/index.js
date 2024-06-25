import React, {useState, useEffect} from 'react'
require('./keyboard.scss')

export default React.forwardRef(function KeyBoard(props, ref) {
  const { row = 4, children, inputContainer, visible, activeIndex = -1 } = props
  const [inputs, setInputs] = useState([])
  const [activeKey, setActiveKey] = useState(activeIndex)
  const [initInput, setInitInput] = useState(false)
  const keyNums = [
    {label: 0, value: 0},
    {label: 1, value: 1},
    {label: 2, value: 2},
    {label: 3, value: 3},
    {label: 4, value: 4},
    {label: 5, value: 5},
    {label: 6, value: 6},
    {label: 7, value: 7},
    {label: 8, value: 8},
    {label: 9, value: 9},
    {label: '.', value: '.', size: 1.5/3},
    {label: "上一项", value: 10, size: 2.275/3},
    {label: "下一项", value: 11, size: 2.275/3},
  ]
  const reset = () => {
    setActiveKey(0)
    inputs.forEach(input => {
      input.value = ''
    })
    inputs[0].focus()
  }
  if (props.hasOwnProperty('visible')) {
    useEffect(() => {
      if (visible && initInput){
        reset()
      }
    }, [visible])
  }
  useEffect(() => {
    if (inputContainer instanceof HTMLElement) {
      const inputs = Array.from(inputContainer.getElementsByTagName('input'))
      if (inputs.length) {
        inputs.forEach((input, index) => {
          input.focusEvent = function(e) {
            setActiveKey(index)
          }
          input.clickEvent = function(e) {
            input.value = ''
          }
          input.addEventListener('focus', input.focusEvent, false)
          input.addEventListener('click', input.clickEvent, false)
        })
        activeKey > -1 && inputs[activeKey].focus()
        setInputs(inputs)
        setInitInput(true)
      }
    }
    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', input.focusEvent, false)
        input.removeEventListener('click', input.clickEvent, false)
      })
    }
  }, [inputContainer])
  // 上一项
  const preInput = () => {
    let index = activeKey
    if (index < 1) {
      index = 1
    }
    const input = inputs[index - 1]
    input.focus()
    input.click()
  }
  // 下一项
  const nextInput = () => {
    let index = activeKey
    if (index > inputs.length -2) {
      index = inputs.length - 2
    }
    const input = inputs[index + 1]
    input.focus()
    input.click()
  }
  // 输入
  const inputNum = (n) => {
    const input = inputs[activeKey] || inputs[0]
    const val = input.value + '' + n
    input.value = val
    input.focus()
  }
  // 按键
  const keyDown = (n) => {
    if (!initInput) return
    switch (n) {
      case 10: 
        preInput(); // 上一项
        break;
      case 11: 
        nextInput(); // 下一项
        break;
      default: 
        inputNum(n);  //输入 
        break;
    }
  }
  return <div className="c-keyboard" ref={ref} style={{minHeight: Math.ceil(12/row) * 70}}>
    <div className="c-key-input">{children}</div>
    <div className={`c-key-number`}>
      {keyNums.map(n => {
        return <div className={`c-num ${[10, 11].includes(n.value) ? 'sp' : ''}`} style={{
          width: `${(100 / row) * (n.size || 1) - 1}%`
        }} onClick={() => keyDown(n.value)} key={n.value}>{n.label}</div>
      })}
    </div>
  </div>
})