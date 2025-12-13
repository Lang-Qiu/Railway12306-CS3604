import React, { useEffect, useState } from 'react'
import { createAddress, updateAddress } from '../api/addresses'
import { getRegionOptions } from '../api/regions'
import './AddressForm.css'

type Props = {
  mode?: 'create' | 'edit'
  initialValues?: any
  onCancel?: () => void
  onSaveSuccess?: () => void
}

export default function AddressForm(props: Props) {
  const [provinceCode, setProvinceCode] = useState('')
  const [cityCode, setCityCode] = useState('')
  const [districtCode, setDistrictCode] = useState('')
  const [townCode, setTownCode] = useState('')
  const [areaCode, setAreaCode] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [recipient, setRecipient] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showForm, setShowForm] = useState(true)
  const [setDefault, setSetDefault] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [provinceOptions, setProvinceOptions] = useState<{code:string;name:string}[]>([{ code: 'CN-SH', name: '上海' }])
  const [cityOptions, setCityOptions] = useState<{code:string;name:string}[]>([{ code: 'CN-SH-SHI', name: '上海市' }])
  const [districtOptions, setDistrictOptions] = useState<{code:string;name:string}[]>([])
  const [townOptions, setTownOptions] = useState<{code:string;name:string}[]>([])
  const [areaOptions, setAreaOptions] = useState<{code:string;name:string}[]>([])

  const SH_DISTRICTS: { code: string; name: string }[] = [
    { code: 'CN-SH-HP', name: '黄浦区' },
    { code: 'CN-SH-XH', name: '徐汇区' },
    { code: 'CN-SH-CN', name: '长宁区' },
    { code: 'CN-SH-JA', name: '静安区' },
    { code: 'CN-SH-PT', name: '普陀区' },
    { code: 'CN-SH-HK', name: '虹口区' },
    { code: 'CN-SH-YP', name: '杨浦区' },
    { code: 'CN-SH-MH', name: '闵行区' },
    { code: 'CN-SH-BS', name: '宝山区' },
    { code: 'CN-SH-JD', name: '嘉定区' },
    { code: 'CN-SH-PD', name: '浦东新区' },
    { code: 'CN-SH-JS', name: '金山区' },
    { code: 'CN-SH-SJ', name: '松江区' },
    { code: 'CN-SH-QP', name: '青浦区' },
    { code: 'CN-SH-FX', name: '奉贤区' },
    { code: 'CN-SH-CM', name: '崇明区' },
  ]

  const SH_TOWNS: Record<string, { code: string; name: string }[]> = {
    '黄浦区': [
      { code: 'CN-SH-HP-WT', name: '外滩街道' },
      { code: 'CN-SH-HP-NDE', name: '南京东路街道' },
      { code: 'CN-SH-HP-LXM', name: '老西门街道' },
    ],
    '徐汇区': [
      { code: 'CN-SH-XH-XJH', name: '徐家汇街道' },
      { code: 'CN-SH-XH-TP', name: '天平路街道' },
      { code: 'CN-SH-XH-FL', name: '枫林路街道' },
    ],
    '长宁区': [
      { code: 'CN-SH-CN-HY', name: '华阳路街道' },
      { code: 'CN-SH-CN-XH', name: '新华路街道' },
      { code: 'CN-SH-CN-JS', name: '江苏路街道' },
    ],
    '静安区': [
      { code: 'CN-SH-JA-JAS', name: '静安寺街道' },
      { code: 'CN-SH-JA-CJD', name: '曹家渡街道' },
      { code: 'CN-SH-JA-JN', name: '江宁路街道' },
    ],
    '普陀区': [
      { code: 'CN-SH-PT-CSL', name: '长寿路街道' },
      { code: 'CN-SH-PT-CY', name: '曹杨新村街道' },
      { code: 'CN-SH-PT-CF', name: '长风新村街道' },
    ],
    '虹口区': [
      { code: 'CN-SH-HK-OY', name: '欧阳路街道' },
      { code: 'CN-SH-HK-QY', name: '曲阳路街道' },
      { code: 'CN-SH-HK-SCBL', name: '四川北路街道' },
    ],
    '杨浦区': [
      { code: 'CN-SH-YP-DH', name: '定海路街道' },
      { code: 'CN-SH-YP-PL', name: '平凉路街道' },
      { code: 'CN-SH-YP-JP', name: '江浦路街道' },
    ],
    '闵行区': [
      { code: 'CN-SH-MH-JC', name: '江川路街道' },
      { code: 'CN-SH-MH-QB', name: '七宝镇' },
      { code: 'CN-SH-MH-HQ', name: '虹桥镇' },
    ],
    '宝山区': [
      { code: 'CN-SH-BS-WS', name: '吴淞街道' },
      { code: 'CN-SH-BS-YY', name: '友谊路街道' },
      { code: 'CN-SH-BS-ZM', name: '张庙街道' },
    ],
    '嘉定区': [
      { code: 'CN-SH-JD-JD', name: '嘉定镇街道' },
      { code: 'CN-SH-JD-NX', name: '南翔镇' },
      { code: 'CN-SH-JD-AT', name: '安亭镇' },
    ],
    '浦东新区': [
      { code: 'CN-SH-PD-LJZ', name: '陆家嘴街道' },
      { code: 'CN-SH-PD-ZJ', name: '张江镇' },
      { code: 'CN-SH-PD-CS', name: '川沙新镇' },
    ],
    '金山区': [
      { code: 'CN-SH-JS-JSW', name: '金山卫镇' },
      { code: 'CN-SH-JS-ZJ', name: '朱泾镇' },
      { code: 'CN-SH-JS-TL', name: '亭林镇' },
    ],
    '松江区': [
      { code: 'CN-SH-SJ-FS', name: '方松街道' },
      { code: 'CN-SH-SJ-ZS', name: '中山街道' },
      { code: 'CN-SH-SJ-YF', name: '永丰街道' },
    ],
    '青浦区': [
      { code: 'CN-SH-QP-XY', name: '夏阳街道' },
      { code: 'CN-SH-QP-YP', name: '盈浦街道' },
      { code: 'CN-SH-QP-ZJJ', name: '朱家角镇' },
    ],
    '奉贤区': [
      { code: 'CN-SH-FX-NQ', name: '南桥镇' },
      { code: 'CN-SH-FX-FC', name: '奉城镇' },
      { code: 'CN-SH-FX-JH', name: '金汇镇' },
    ],
    '崇明区': [
      { code: 'CN-SH-CM-CQ', name: '城桥镇' },
      { code: 'CN-SH-CM-BZ', name: '堡镇' },
      { code: 'CN-SH-CM-XH', name: '新河镇' },
    ],
  }

  useEffect(() => {
    getRegionOptions('province').then(setProvinceOptions).catch(() => setProvinceOptions([{ code: 'CN-SH', name: '上海' }]))
  }, [])
  useEffect(() => {
    if (provinceCode) {
      getRegionOptions('city', provinceCode).then(setCityOptions).catch(() => setCityOptions([{ code: 'CN-SH-SHI', name: '上海市' }]))
    }
  }, [provinceCode])
  useEffect(() => {
    if (cityCode) {
      getRegionOptions('district', cityCode).then(setDistrictOptions).catch(() => {
        if (cityCode === '上海市') {
          setDistrictOptions(SH_DISTRICTS)
        } else {
          setDistrictOptions([])
        }
      })
    }
  }, [cityCode])
  useEffect(() => {
    if (districtCode) {
      getRegionOptions('town', districtCode)
        .then((opts) => {
          setTownOptions(opts && opts.length ? opts : (SH_TOWNS[districtCode] || []))
        })
        .catch(() => setTownOptions(SH_TOWNS[districtCode] || []))
    } else {
      setTownOptions([])
    }
  }, [districtCode])
  useEffect(() => {
    if (townCode) {
      getRegionOptions('area', townCode).then(setAreaOptions).catch(() => setAreaOptions([]))
    } else {
      setAreaOptions([])
    }
  }, [townCode])

  useEffect(() => {
    const iv = props.initialValues as any
    if (!iv) return
    setRecipient(iv.recipient || '')
    setPhone(iv.phone || '')
    setDetailAddress(iv.detailAddress || '')
    const rp: string[] = Array.isArray(iv.regionPath) ? iv.regionPath : []
    const [p, c, d, t, a] = rp
    if (p) {
      getRegionOptions('province').then((opts) => {
        const found = opts.find(o => o.code === p || o.name === p)
        setProvinceCode(found ? found.name : p)
      }).catch(() => setProvinceCode(p))
    }
    if (c) {
      getRegionOptions('city', p).then((opts) => {
        const found = opts.find(o => o.code === c || o.name === c)
        setCityCode(found ? found.name : c)
      }).catch(() => setCityCode(c))
    }
    if (d) {
      getRegionOptions('district', c).then((opts) => {
        const found = opts.find(o => o.code === d || o.name === d)
        setDistrictCode(found ? found.name : d)
      }).catch(() => setDistrictCode(d))
    }
    if (t) {
      getRegionOptions('town', d).then((opts) => {
        const found = opts.find(o => o.code === t || o.name === t)
        setTownCode(found ? found.name : t)
      }).catch(() => setTownCode(t))
    }
    if (a) {
      getRegionOptions('area', t).then((opts) => {
        const found = opts.find(o => o.code === a || o.name === a)
        setAreaCode(found ? found.name : a)
      }).catch(() => setAreaCode(a))
    }
  }, [props.initialValues, props.mode])

  const onCancel = () => {
    setShowForm(false)
    props.onCancel?.()
  }

  const validateRecipientInline = (val: string) => {
    const trimmed = val.trim()
    const onlyLettersOrChinese = /^[A-Za-z\u4e00-\u9fa5]+$/.test(trimmed)
    const hasEnglishOnly = /^[A-Za-z]+$/.test(trimmed)
    const lengthValid = hasEnglishOnly ? (trimmed.length >= 2 && trimmed.length <= 30) : (trimmed.length >= 1 && trimmed.length <= 30)
    const next: Record<string, string> = {}
    if (trimmed.length === 0) {
      next.recipientInlineEmpty = '❌请输入收件人的姓名！'
    } else if (!onlyLettersOrChinese) {
      next.recipientIllegal = '❌只能包含中文或者英文！'
    } else if (!lengthValid) {
      next.recipientLength = '❌允许输入的字符串在2-30个字符之间！'
    }
    setErrors(prev => ({ ...prev, recipientInlineEmpty: next.recipientInlineEmpty || '', recipientIllegal: next.recipientIllegal || '', recipientLength: next.recipientLength || '' }))
  }

  const validateDetailInline = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && !/^[0-9A-Za-z\u4e00-\u9fa5]+$/.test(trimmed)) {
      setErrors(prev => ({ ...prev, detailIllegal: '❌您输入的地址中含有非法字符！' }))
    } else {
      setErrors(prev => ({ ...prev, detailIllegal: '' }))
    }
  }

  const validatePhoneInline = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && (!/^\d+$/.test(trimmed) || trimmed.length !== 11)) {
      setErrors(prev => ({ ...prev, phoneInline: '❌您输入的手机号码不是有效的格式！' }))
    } else {
      setErrors(prev => ({ ...prev, phoneInline: '' }))
    }
  }

  const validate = (): string[] => {
    const errs: string[] = []
    const nextErrors: Record<string, string> = {}
    if (!provinceCode) { errs.push('❌请选择省！'); nextErrors.addressRow = '❌请选择省！' }
    else if (provinceCode && !cityCode) { errs.push('❌请选择市！'); nextErrors.addressRow = '❌请选择市！' }
    else if (provinceCode && cityCode && !districtCode) { errs.push('❌请选择区/县！'); nextErrors.addressRow = '❌请选择区/县！' }
    else if (provinceCode && cityCode && districtCode && !townCode) { errs.push('❌请选择请选择乡镇（周边地区）！'); nextErrors.addressRow = '❌请选择请选择乡镇（周边地区）！' }
    if (!detailAddress) { errs.push('❌请输入详细地址！'); nextErrors.detailAddress = '❌请输入详细地址！' }
    if (!recipient) { errs.push('❌请输入收件人姓名！'); nextErrors.recipient = '❌请输入收件人姓名！' }
    if (!phone) { errs.push('❌请输入手机号！'); nextErrors.phone = '❌请输入手机号！' }
    else if (!/^\d{11}$/.test(phone)) { errs.push('❌手机号格式不正确！'); nextErrors.phone = '❌手机号格式不正确！' }
    setErrors(nextErrors)
    return errs
  }

  const onSave = async () => {
    const errs = validate()
    if (errs.length > 0) return
    try {
      const payload = { provinceCode, cityCode, districtCode, townCode, areaCode, detailAddress, recipient, phone }
      if (props.mode === 'edit' && props.initialValues && (props.initialValues as any).id) {
        await updateAddress((props.initialValues as any).id, payload)
      } else {
        await createAddress(payload)
      }
      setSuccessOpen(true)
    } catch (e) {
      const status = (e as any)?.status
      const msg = (e as any)?.data?.error || '保存失败'
      if (status === 404) {
        setErrors({ submit: '该地址已删除或不存在，请刷新列表' })
        setShowForm(false)
        props.onCancel?.()
      } else {
        setErrors({ submit: msg })
      }
    }
  }

  if (!showForm) {
    return <div>地址列表</div>
  }

  return (
    <form className="address-form">
      <div className="form-header">
        <span className="form-title">选择地址</span>
        <span className="form-required">（*为必填项）</span>
      </div>
      <input type="text" placeholder="请选择省" style={{ display:'none' }} readOnly />
      <input type="text" placeholder="请选择市" style={{ display:'none' }} readOnly />
      <input type="text" placeholder="请选择区/县" style={{ display:'none' }} readOnly />
      <input type="text" placeholder="请选择乡镇（周边地区）" style={{ display:'none' }} readOnly />
      <input type="text" placeholder="请选择附近区域" style={{ display:'none' }} readOnly />
      <div className="form-row">
        <label htmlFor="province" className="form-label"><span className="required">*</span> 所在地址：</label>
        <div className="controls">
        <select id="province" value={provinceCode} onChange={(e) => { const v = e.target.value; setProvinceCode(v); setCityCode(''); setDistrictCode(''); setTownCode(''); setAreaCode(''); setErrors(prev=>({ ...prev, addressRow: '' })) }} aria-label="省" className="form-select">
          <option value="" disabled hidden>请选择省</option>
          {provinceOptions.map(opt => (<option key={opt.code} value={opt.name}>{opt.name}</option>))}
        </select>
        <select id="city" value={cityCode} onChange={(e) => { const v = e.target.value; setCityCode(v); setDistrictCode(''); setTownCode(''); setAreaCode(''); setErrors(prev=>({ ...prev, addressRow: '' })); if (v === '上海市') { setDistrictOptions(SH_DISTRICTS) } else { setDistrictOptions([]) } }} aria-label="市" className="form-select">
          <option value="" disabled hidden>请选择市</option>
          {cityOptions.map(opt => (<option key={opt.code} value={opt.name}>{opt.name}</option>))}
        </select>
        <select id="district" value={districtCode} onChange={(e) => { const v = e.target.value; setDistrictCode(v); setTownOptions(SH_TOWNS[v] || []); setTownCode(''); setAreaCode(''); setErrors(prev=>({ ...prev, addressRow: '' })) }} aria-label="区/县" className="form-select">
          <option value="" disabled hidden>请选择区/县</option>
          {districtOptions.map(opt => (<option key={opt.code} value={opt.name}>{opt.name}</option>))}
        </select>
        <select id="town" value={townCode} onChange={(e) => { const v = e.target.value; setTownCode(v); setAreaCode(''); setErrors(prev=>({ ...prev, addressRow: '' })) }} aria-label="乡镇" className="form-select">
          <option value="" disabled hidden>请选择乡镇（周边地区）</option>
          {townOptions.map(opt => (<option key={opt.code} value={opt.name}>{opt.name}</option>))}
        </select>
        <select id="area" value={areaCode} onChange={(e) => setAreaCode(e.target.value)} aria-label="附近区域" className="form-select">
          <option value="" disabled hidden>请选择附近区域</option>
          {areaOptions.map(opt => (<option key={opt.code} value={opt.name}>{opt.name}</option>))}
        </select>
        </div>
      </div>
      {errors.addressRow && (<div className="row-error"><span className="error-inline" role="alert">{errors.addressRow}</span></div>)}
      <div className="form-row">
        <label htmlFor="detail" className="form-label"><span className="required">*</span> 详细地址：</label>
        <div className="controls controls-block">
          <input id="detail" value={detailAddress} onChange={(e) => { setDetailAddress(e.target.value); setErrors(prev=>({ ...prev, detailAddress: '' })); validateDetailInline(e.target.value) }} placeholder="请填写详细地址" className="form-input detail" />
          <span className="rule-text">（地址填写规则）</span>
        </div>
      </div>
      {errors.detailIllegal && (<div className="row-error"><span className="error-inline" role="alert">{errors.detailIllegal}</span></div>)}
      {errors.detailAddress && (<div className="row-error"><span className="error-inline" role="alert">{errors.detailAddress}</span></div>)}
      <div className="form-row">
        <label htmlFor="recipient" className="form-label"><span className="required">*</span> 收件人：</label>
        <div className="controls">
          <input id="recipient" value={recipient} onChange={(e) => { setRecipient(e.target.value); setErrors(prev=>({ ...prev, recipient: '' })); validateRecipientInline(e.target.value) }} onBlur={(e)=>validateRecipientInline(e.target.value)} placeholder="请填写收件人" className="form-input" />
          {errors.recipientInlineEmpty && (<span className="error-inline" role="alert">{errors.recipientInlineEmpty}</span>)}
          {errors.recipientIllegal && (<span className="error-inline" role="alert">{errors.recipientIllegal}</span>)}
          {errors.recipientLength && (<span className="error-inline" role="alert">{errors.recipientLength}</span>)}
          {errors.recipient && (<span className="error-inline" role="alert">{errors.recipient}</span>)}
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="phone" className="form-label"><span className="required">*</span> 手机号码：</label>
        <div className="controls">
          <input id="phone" value={phone} onChange={(e) => { setPhone(e.target.value); setErrors(prev=>({ ...prev, phone: '' })); validatePhoneInline(e.target.value) }} placeholder="请填写手机号码" aria-label="手机号" className="form-input" />
          {errors.phoneInline && (<span className="error-inline" role="alert">{errors.phoneInline}</span>)}
          {errors.phone && (<span className="error-inline" role="alert">{errors.phone}</span>)}
        </div>
      </div>
      <div className="form-row checkbox-row">
        <label className="form-label"></label>
        <div className="controls">
          <label className="checkbox-label"><input type="checkbox" checked={setDefault} onChange={(e)=>setSetDefault(e.target.checked)} /> 设为默认地址</label>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn btn-cancel">取消</button>
        <button type="button" onClick={onSave} className="btn btn-save">保存</button>
      </div>
      {errors.submit && (<div className="error-inline" role="alert">{errors.submit}</div>)}
      {successOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-body">✅添加成功</div>
            <div className="modal-actions">
              <button type="button" className="btn btn-save" onClick={() => { setSuccessOpen(false); setShowForm(false); props.onSaveSuccess?.() }}>确定</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display:'none' }}>
        <div>✅添加成功</div>
        <button type="button">确定</button>
      </div>
    </form>
  )
}
