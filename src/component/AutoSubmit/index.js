import React, {useState, useEffect} from 'react';
import { CheckBox } from '@/component'
import { Cookie, Bus } from 'assets/js/utils'
import { toUpper, isEmpty } from 'assets/js'
const autoOptions = {label: '自动提交', value: 'autoSubmit'}
export default function AutoSubmit(props) {
  const {autoKey = toUpper(location.pathname), isAuto, children, ...attrs} = props;
  const defaultAutoSubmit = isEmpty(Cookie.get(autoKey)) ? (isAuto ? [autoOptions.value] : []) : [Cookie.get(autoKey)];
  const [value, setValue] = useState(defaultAutoSubmit);
  autoOptions.label = typeof children === 'string' && !isEmpty(children) ? children : '自动提交';
  useEffect(() => {
    // 注册自动提交状态
    AutoSubmit.status = () => Cookie.get(autoKey)
    // 注册自动提交事件
    Bus.$on(autoKey, (isAuto) => {
      setAutoValue(isAuto ? [autoOptions.value] : [])
    })
    
  }, [])
  function setAutoValue(d) {
    setValue(d)
    Cookie.set(autoKey, d[0] || '', {hour: 24})
  }
  return <CheckBox mr="10"
    dataSource={[autoOptions]}
    value={value}
    multiple
    onChange={setAutoValue}
    {...attrs}
  ></CheckBox>
}