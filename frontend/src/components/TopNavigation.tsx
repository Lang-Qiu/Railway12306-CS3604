import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './TopNavigation.css'

interface TopNavigationProps {
  onLogoClick?: () => void
  showWelcomeLogin?: boolean
}

const TopNavigation: React.FC<TopNavigationProps> = ({ onLogoClick, showWelcomeLogin = false }) => {
  const navigate = useNavigate()
  const handleLogoClick = () => { if (onLogoClick) onLogoClick() }
  // 变更说明：集成来源项目的头部搜索与顶部菜单（无障碍/敬老版/English/我的12306/登录注册），保留原组件接口与登录逻辑
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>(['动车组介绍', '正晚点查询', '代售点'])
  const suggestions = ['购票', '改签', '退票', '起售时间']
  const filteredSuggestions = suggestions.filter(s => s.includes(searchKeyword.trim()))
  const onSearchBlur = () => setTimeout(() => setSearchActive(false), 120)
  const handleSearch = () => {
    const kw = searchKeyword.trim()
    if (!kw) return
    setSearchHistory(prev => [kw, ...prev])
  }
  const applyHistory = (kw: string) => { setSearchKeyword(kw); handleSearch() }
  const applySuggestion = (kw: string) => { setSearchKeyword(kw); handleSearch() }
  const clearHistory = () => setSearchHistory([])

  return (
    <div className="top-navigation" data-testid="top-navigation" onClick={() => console.log('Logo clicked')}>
      <div className="header-con">
        <h1 className="logo">
          {/* 变更说明：采用背景图隐藏文本的方式复刻来源项目 logo 行为 */}
          <a href="/" className="logo-link" aria-label="中国铁路12306">中国铁路12306</a>
          <img src="/images/logo.png" alt="中国铁路12306" style={{ display: 'none' }} />
        </h1>
        {!showWelcomeLogin && (
          <div className="header-right">
            {/* 搜索条 */}
            <div className="header-search">
              <div className="search-bd">
                <input type="password" style={{ display:'none' }} />
                <input
                  type="text"
                  className="search-input"
                  id="search-input"
                  aria-label="搜索车票、餐饮、常旅客、相关规章"
                  value={searchKeyword}
                  placeholder="搜索车票、餐饮、常旅客、相关规章"
                  aria-haspopup="true"
                  onFocus={() => setSearchActive(true)}
                  onBlur={onSearchBlur}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
                />
                <div className={searchActive ? 'search-down show' : 'search-down'}>
                  <a href="javascript:;" className="close" onMouseDown={(e)=>{e.preventDefault(); setSearchActive(false)}}>关闭</a>
                  <ul className="search-down-list" role="listbox" aria-expanded="true">
                    {searchKeyword.trim() === '' && (<li>输入关键词以获取建议</li>)}
                    {searchKeyword.trim() !== '' && filteredSuggestions.length === 0 && (<li>无匹配项</li>)}
                    {filteredSuggestions.map((s, i) => (
                      <li key={i} onMouseDown={(e)=>{e.preventDefault(); applySuggestion(s)}}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className={searchActive ? 'search-history show' : 'search-history'}>
                  <a href="javascript:;" className="history-clear" onMouseDown={(e)=>{e.preventDefault(); clearHistory()}}>清除</a>
                  <h3 className="search-history-tit">搜索历史</h3>
                  <ul className="search-history-list" role="listbox" aria-expanded="true">
                    {searchHistory.map((s, i) => (
                      <li key={i} onMouseDown={(e)=>{e.preventDefault(); applyHistory(s)}}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <a className="search-btn" aria-label="点击搜索" onMouseDown={(e)=>{e.preventDefault(); handleSearch()}}>
                <i className="hdr-icon hdr-search"></i>
              </a>
            </div>
            {/* 顶部菜单 */}
            <ul className="header-menu" role="menubar" id="topMenu">
              <li className="menu-item"><a href="javascript:;" className="menu-nav-hd">无障碍</a></li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item"><a href="javascript:;" className="menu-nav-hd">敬老版</a></li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item menu-nav" role="menuitem">
                <a href="https://www.12306.cn/en/index.html" className="menu-nav-hd item" title="English"> English <i className="caret"></i></a>
                <ul className="menu-nav-bd" role="menu">
                  <li><a href="javascript:;" title="简体中文">简体中文</a></li>
                  <li><a href="https://www.12306.cn/en/index.html" title="English">English</a></li>
                </ul>
              </li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item menu-nav" role="menuitem">
                <a href="javascript:;" className="menu-nav-hd item" id="my12306" onClick={(e)=>{e.preventDefault(); navigate('/user/profile')}}> 我的12306 <i className="caret"></i></a>
                <ul className="menu-nav-bd" role="menu">
                  <li><a href="javascript:;" onClick={(e)=>{e.preventDefault(); navigate('/orders')}}>火车票订单</a></li>
                  <li><a href="javascript:;">候补订单</a></li>
                  <li><a href="javascript:;">计次•定期票订单</a></li>
                  <li><a href="javascript:;">约号订单</a></li>
                  <li><a href="javascript:;">电子发票</a></li>
                  <li><a href="javascript:;">本人车票</a></li>
                  <li className="nav-line"></li>
                  <li><a href="javascript:;">我的餐饮•特产</a></li>
                  <li><a href="javascript:;">我的保险</a></li>
                  <li><a href="javascript:;">我的会员</a></li>
                  <li className="nav-line"></li>
                  <li><a href="javascript:;">查看个人信息</a></li>
                  <li><a href="javascript:;">账户安全</a></li>
                  <li className="nav-line"></li>
                  <li><a href="javascript:;" onClick={(e)=>{e.preventDefault(); navigate('/passengers')}}>乘车人</a></li>
                  <li><a href="javascript:;">地址管理</a></li>
                  <li className="nav-line"></li>
                  <li><a href="javascript:;">温馨服务查询</a></li>
                </ul>
              </li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item menu-login" role="menuitem">
                <a href="/login">登录</a>
                <a href="/register" className="ml">注册</a>
              </li>
            </ul>
          </div>
        )}
        {showWelcomeLogin && (
          <div className="welcome-login-text">欢迎登录12306</div>
        )}
      </div>
    </div>
  )
}

export default TopNavigation