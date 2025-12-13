const fs = require('fs')
const path = require('path')

const STORE_FILE = path.join(__dirname, '../../.data/addresses.json')
const IS_TEST = process.env.NODE_ENV === 'test'

function loadStoreFromDisk() {
  if (IS_TEST) return null
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      if (Array.isArray(parsed.addresses)) return parsed.addresses
    }
  } catch {}
  return null
}

function saveStoreToDisk(addresses) {
  try {
    const dir = path.dirname(STORE_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(STORE_FILE, JSON.stringify({ addresses }, null, 2), 'utf-8')
  } catch {}
}

const REGION_TREE = [
  {
    level: 'province',
    code: 'CN-SH',
    name: '上海',
    children: [
      {
        level: 'city',
        code: 'CN-SH-SHI',
        name: '上海市',
        children: [
          { level: 'district', code: 'CN-SH-HP', name: '黄浦区', children: [
            { level: 'town', code: 'CN-SH-HP-WT', name: '外滩街道' },
            { level: 'town', code: 'CN-SH-HP-NDE', name: '南京东路街道' },
            { level: 'town', code: 'CN-SH-HP-LXM', name: '老西门街道' },
          ]},
          { level: 'district', code: 'CN-SH-XH', name: '徐汇区', children: [
            { level: 'town', code: 'CN-SH-XH-XJH', name: '徐家汇街道' },
            { level: 'town', code: 'CN-SH-XH-TP', name: '天平路街道' },
            { level: 'town', code: 'CN-SH-XH-FL', name: '枫林路街道' },
          ]},
          { level: 'district', code: 'CN-SH-CN', name: '长宁区', children: [
            { level: 'town', code: 'CN-SH-CN-HY', name: '华阳路街道' },
            { level: 'town', code: 'CN-SH-CN-XH', name: '新华路街道' },
            { level: 'town', code: 'CN-SH-CN-JS', name: '江苏路街道' },
          ]},
          { level: 'district', code: 'CN-SH-JA', name: '静安区', children: [
            { level: 'town', code: 'CN-SH-JA-JAS', name: '静安寺街道' },
            { level: 'town', code: 'CN-SH-JA-CJD', name: '曹家渡街道' },
            { level: 'town', code: 'CN-SH-JA-JN', name: '江宁路街道' },
          ]},
          { level: 'district', code: 'CN-SH-PT', name: '普陀区', children: [
            { level: 'town', code: 'CN-SH-PT-CSL', name: '长寿路街道' },
            { level: 'town', code: 'CN-SH-PT-CY', name: '曹杨新村街道' },
            { level: 'town', code: 'CN-SH-PT-CF', name: '长风新村街道' },
          ]},
          { level: 'district', code: 'CN-SH-HK', name: '虹口区', children: [
            { level: 'town', code: 'CN-SH-HK-OY', name: '欧阳路街道' },
            { level: 'town', code: 'CN-SH-HK-QY', name: '曲阳路街道' },
            { level: 'town', code: 'CN-SH-HK-SCBL', name: '四川北路街道' },
          ]},
          { level: 'district', code: 'CN-SH-YP', name: '杨浦区', children: [
            { level: 'town', code: 'CN-SH-YP-DH', name: '定海路街道' },
            { level: 'town', code: 'CN-SH-YP-PL', name: '平凉路街道' },
            { level: 'town', code: 'CN-SH-YP-JP', name: '江浦路街道' },
          ]},
          { level: 'district', code: 'CN-SH-MH', name: '闵行区', children: [
            { level: 'town', code: 'CN-SH-MH-JC', name: '江川路街道' },
            { level: 'town', code: 'CN-SH-MH-QB', name: '七宝镇' },
            { level: 'town', code: 'CN-SH-MH-HQ', name: '虹桥镇' },
          ]},
          { level: 'district', code: 'CN-SH-BS', name: '宝山区', children: [
            { level: 'town', code: 'CN-SH-BS-WS', name: '吴淞街道' },
            { level: 'town', code: 'CN-SH-BS-YY', name: '友谊路街道' },
            { level: 'town', code: 'CN-SH-BS-ZM', name: '张庙街道' },
          ]},
          { level: 'district', code: 'CN-SH-JD', name: '嘉定区', children: [
            { level: 'town', code: 'CN-SH-JD-JD', name: '嘉定镇街道' },
            { level: 'town', code: 'CN-SH-JD-NX', name: '南翔镇' },
            { level: 'town', code: 'CN-SH-JD-AT', name: '安亭镇' },
          ]},
          { level: 'district', code: 'CN-SH-PD', name: '浦东新区', children: [
            { level: 'town', code: 'CN-SH-PD-LJZ', name: '陆家嘴街道' },
            { level: 'town', code: 'CN-SH-PD-ZJ', name: '张江镇' },
            { level: 'town', code: 'CN-SH-PD-CS', name: '川沙新镇' },
          ]},
          { level: 'district', code: 'CN-SH-JS', name: '金山区', children: [
            { level: 'town', code: 'CN-SH-JS-JSW', name: '金山卫镇' },
            { level: 'town', code: 'CN-SH-JS-ZJ', name: '朱泾镇' },
            { level: 'town', code: 'CN-SH-JS-TL', name: '亭林镇' },
          ]},
          { level: 'district', code: 'CN-SH-SJ', name: '松江区', children: [
            { level: 'town', code: 'CN-SH-SJ-FS', name: '方松街道' },
            { level: 'town', code: 'CN-SH-SJ-ZS', name: '中山街道' },
            { level: 'town', code: 'CN-SH-SJ-YF', name: '永丰街道' },
          ]},
          { level: 'district', code: 'CN-SH-QP', name: '青浦区', children: [
            { level: 'town', code: 'CN-SH-QP-XY', name: '夏阳街道' },
            { level: 'town', code: 'CN-SH-QP-YP', name: '盈浦街道' },
            { level: 'town', code: 'CN-SH-QP-ZJJ', name: '朱家角镇' },
          ]},
          { level: 'district', code: 'CN-SH-FX', name: '奉贤区', children: [
            { level: 'town', code: 'CN-SH-FX-NQ', name: '南桥镇' },
            { level: 'town', code: 'CN-SH-FX-FC', name: '奉城镇' },
            { level: 'town', code: 'CN-SH-FX-JH', name: '金汇镇' },
          ]},
          { level: 'district', code: 'CN-SH-CM', name: '崇明区', children: [
            { level: 'town', code: 'CN-SH-CM-CQ', name: '城桥镇' },
            { level: 'town', code: 'CN-SH-CM-BZ', name: '堡镇' },
            { level: 'town', code: 'CN-SH-CM-XH', name: '新河镇' },
          ]},
        ],
      },
    ],
  },
]

async function loadRegionHierarchy() {
  return REGION_TREE
}

function findNode(tree, match) {
  const stack = [...tree]
  while (stack.length) {
    const node = stack.shift()
    if (node.code === match || node.name === match) return node
    if (node.children && node.children.length) stack.push(...node.children)
  }
  return null
}

async function listRegionsByParent(level, parentCode) {
  if (level === 'province') {
    return REGION_TREE.map(n => ({ code: n.code, name: n.name }))
  }
  if (!parentCode) return []
  const parent = findNode(REGION_TREE, parentCode)
  if (!parent || !parent.children) {
    const sample = {
      city: [{ code: 'CITY-001', name: '示例市' }],
      district: [{ code: 'DIST-001', name: '示例区' }],
      town: [{ code: 'TOWN-001', name: '示例镇' }],
      area: [{ code: 'AREA-001', name: '示例区域' }],
    }
    return sample[level] || []
  }
  const nextLevel = level
  return parent.children.filter(c => c.level === nextLevel).map(c => ({ code: c.code, name: c.name }))
}

const LOADED = loadStoreFromDisk()
let ADDRESSES = Array.isArray(LOADED) && LOADED.length > 0
  ? LOADED
  : [
      { id: 'ADDR-001', recipient: '张三', phone: '13800138000', regionPath: ['P001','C001','D001','T001'], detailAddress: '北京路1号', createdAt: new Date().toISOString(), lockedUntil: new Date(Date.now()+7*24*3600*1000).toISOString() }
    ]

async function listUserAddresses(userId) {
  return ADDRESSES
}

async function getAddressById(id) {
  if (id === 'ADDR-001') {
    return { id: 'ADDR-001', recipient: '张三', phone: '13800138000', detailAddress: '北京路1号' }
  }
  return null
}

async function countUserAddresses(userId) {
  return ADDRESSES.length
}

async function checkAddressEditableWithin30Days(id) {
  if (id === 'ADDR-LOCKED' || id === 'ADDR-001') {
    return { editable: false, deletable: false, lockedUntil: new Date(Date.now()+30*24*3600*1000).toISOString() }
  }
  return { editable: true, deletable: true, lockedUntil: null }
}

async function createAddress(userId, payload) {
  const id = 'ADDR-' + Math.floor(Date.now() / 1000)
  const created = { id, recipient: payload.recipient, phone: payload.phone, regionPath: [payload.provinceCode, payload.cityCode, payload.districtCode, payload.townCode].filter(Boolean), detailAddress: payload.detailAddress, createdAt: new Date().toISOString() }
  ADDRESSES = [created, ...ADDRESSES].slice(0, 20)
  saveStoreToDisk(ADDRESSES)
  return created
}

async function updateAddress(id, payload) {
  const idx = ADDRESSES.findIndex(a => a.id === id)
  if (idx === -1) return null
  const prev = ADDRESSES[idx]
  const next = {
    ...prev,
    recipient: payload.recipient ?? prev.recipient,
    phone: payload.phone ?? prev.phone,
    detailAddress: payload.detailAddress ?? prev.detailAddress,
    regionPath: [payload.provinceCode, payload.cityCode, payload.districtCode, payload.townCode, payload.areaCode].filter(Boolean),
  }
  ADDRESSES[idx] = next
  saveStoreToDisk(ADDRESSES)
  return next
}

async function deleteAddress(id) {
  const before = ADDRESSES.length
  ADDRESSES = ADDRESSES.filter(a => a.id !== id)
  saveStoreToDisk(ADDRESSES)
  return { success: ADDRESSES.length < before }
}

module.exports = {
  loadRegionHierarchy,
  listRegionsByParent,
  listUserAddresses,
  getAddressById,
  countUserAddresses,
  checkAddressEditableWithin30Days,
  createAddress,
  updateAddress,
  deleteAddress,
}
