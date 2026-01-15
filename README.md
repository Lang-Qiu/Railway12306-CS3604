## 快速开始

### 1. 安装依赖

```bash
# 安装根目录依赖（可选，用于集成测试）
npm install

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```


### 3. 启动开发服务器

在**两个独立的终端窗口**中分别运行：

**终端1 - 启动后端服务**（端口: 3000）：

```bash
cd backend
npm run dev
```

**终端2 - 启动前端服务**（端口: 5173）：

```bash
cd frontend
npm run dev
```

### 4. 访问应用

在浏览器中打开：http://localhost:5173

## Frontend Migration Log (2026-01-15)

Migrated the homepage and navigation components from the original project to the `frontend` directory.

### Added Components
- `src/components/our12306/TopNavigation.tsx` (Header with login/search)
- `src/components/our12306/MainNavigation.tsx` (Main menu)
- `src/components/our12306/BottomNavigation.tsx` (Footer with links/QR codes)
- `src/components/our12306/StationInput.tsx` (Station selector input)
- `src/components/our12306/SearchDropdown.tsx` (Search suggestions)
- `src/components/StationPicker.tsx`
- `src/components/CalendarPopover.tsx`

### Context
- Added `src/context/AuthContext.tsx` for user authentication state.

### Pages
- Updated `src/pages/HomePage.tsx` to include the full layout (Header, Main Nav, Carousel, Search Form, Footer).

### Assets
- Migrated images to `public/images`.
