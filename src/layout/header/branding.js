import React from 'react'
import { useHistory } from 'react-router'
import CainiaoLogo from 'assets/imgs/logo.js'
export default function Branding(props) {
  const history = useHistory()
  const logo = <span style={{margin: '0 18px 0 7px', cursor: 'pointer'}} onClick={() => {
    history.push('/')
  }}>
    <CainiaoLogo></CainiaoLogo>
  </span>

  return <div className="pcs-header-logo" style={{width: 260}}>
    {logo }
  </div>
}