import React from 'react'
import img from './img/404.png'
NotFound.title = '404'
export default function NotFound(props) {
    return <div className="page-not-found mch" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        // height: '100%',
        color: '#fff'
    }}>
        <img src={img} style={{marginBottom: '20px',marginTop: "-5%"}}></img>
            抱歉, 您访问的页面不存在
    </div>
    }