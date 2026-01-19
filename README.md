# Editing Transcoder

一款将视频转换为剪辑友好格式（ProRes、DNxHR）的桌面应用，专为 Adobe Premiere Pro 和 After Effects 设计。

**设计理念：** 意图驱动，而非参数驱动。用户只需选择"我要剪辑"，无需理解复杂的编码参数。

## 下载

| 文件                                                                                            | 大小   | 说明                         |
| ----------------------------------------------------------------------------------------------- | ------ | ---------------------------- |
| [transcoder-v0.5.1-windows.zip](../../releases/download/v0.5.1/transcoder-v0.5.1-windows.zip)       | ~70 MB | **推荐** — 解压即可运行      |

**系统要求：** Windows 10/11 (64-bit)

**使用方法：** 下载后解压 zip 文件，双击 `transcoder.exe` 即可运行。FFmpeg 已内置在 `ffmpeg/` 文件夹中，无需单独安装。

## 功能特性

- **一键转码** — 转换为剪辑友好的中间编码格式
- **片段裁剪** — 支持选择视频片段进行转码（双滑块 + 时间码输入）
- **5 种输出预设**
  - **ProRes 422**（推荐）— 10-bit 4:2:2，专业剪辑格式
  - **ProRes 422 LT** — 节省空间的版本
  - **ProRes 422 Proxy** — 低码率代理格式
  - **DNxHR HQX** — Windows 友好格式
  - **H.264 CRF 18** — 高质量 H.264，用于交付
- **批量转码** — 支持多文件并行处理
- **自定义文件名** — 编辑输出文件名（后缀/扩展名自动管理）
- **实时进度** — 显示转码进度和预计剩余时间
- **文件大小估算** — 转码前预估输出文件大小
- **拖拽操作** — 支持拖拽视频文件或文件夹
- **内置 FFmpeg** — 无需外部依赖

## 使用方法

### 快速开始

1. **启动应用** — 双击运行 `transcoder.exe` 或安装后从开始菜单启动
2. **添加视频** — 拖拽视频文件到窗口，或点击 "Browse Files" 选择文件
   - 支持多选或拖拽多个文件
   - 支持拖拽文件夹，自动识别其中的视频文件
3. **选择格式** — 点击选择输出格式预设
   - ProRes 422：推荐用于大多数剪辑场景
   - ProRes 422 LT：硬盘空间不足时使用
   - ProRes 422 Proxy：用于离线剪辑或低配置电脑
   - DNxHR HQX：Windows 环境下的首选
   - H.264 CRF 18：用于最终交付或网络分享
4. **确认输出** — 查看预估文件大小，确认或修改输出目录
5. **(可选) 裁剪片段** — 勾选 "Trim video segment" 可只转码选中的时间段
   - 拖动滑块或输入时间码（HH:MM:SS）设置起止时间
   - 适用于提取视频中的特定片段
6. **开始转码** — 点击 "Start Batch Transcode" 按钮
7. **等待完成** — 查看实时进度，转码完成后导入 PR/AE 使用

### 输出格式对照表

| 预设             | 编码      | 容器 | 位深   | 色度采样 | 音频        | 码率 (1080p) | 用途                 |
| ---------------- | --------- | ---- | ------ | -------- | ----------- | ------------ | -------------------- |
| ProRes 422       | prores_ks | .mov | 10-bit | 4:2:2    | PCM 16-bit  | ~147 Mbps    | 主力剪辑格式（推荐） |
| ProRes 422 LT    | prores_ks | .mov | 10-bit | 4:2:2    | PCM 16-bit  | ~102 Mbps    | 硬盘空间受限         |
| ProRes 422 Proxy | prores_ks | .mov | 8-bit  | 4:2:0    | AAC 320kbps | ~36 Mbps     | 代理/离线剪辑        |
| DNxHR HQX        | dnxhd     | .mov | 10-bit | 4:2:2    | PCM 16-bit  | ~295 Mbps    | Windows 友好         |
| H.264 CRF 18     | libx264   | .mp4 | 8-bit  | 4:2:0    | AAC 320kbps | 可变         | 交付/网络分发        |

### 智能处理规则

应用会自动处理：

- **10-bit 视频输入** → 保留 10-bit 输出（Proxy/H.264 除外）
- **任意帧率** → 完全保留，不进行帧率转换
- **FLAC/Opus 音频** → 自动转换为 PCM 或 AAC
- **8-bit 视频** → 保持 8-bit，不 upscale

### 常见问题

**Q: 如何使用这个软件？**

A: 下载 zip 文件后解压，双击 `transcoder.exe` 即可运行。无需安装，FFmpeg 已内置。

**Q: Windows Defender 提示"未知发布者"怎么办？**

A: 这是正常现象。点击 "更多信息" → "仍要运行" 即可。

**Q: 支持哪些输入格式？**

A: 支持 FFmpeg 能解码的所有视频格式，包括 MP4、MKV、AVI、MOV、WEBM 等。

## 从源码构建

```bash
# 克隆仓库
git clone <repository-url>
cd Transcoder

# 安装依赖
npm install

# 下载 FFmpeg 二进制文件（构建必需）
# 创建 src-tauri/binaries/windows/ 目录，放入：
#   - ffmpeg.exe
#   - ffprobe.exe
# Windows 下载: https://www.gyan.dev/ffmpeg/builds/
# macOS 下载: https://evermeet.cx/ffmpeg/

# 开发模式运行
npm run tauri dev

# 构建发布版本
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 技术栈

- **前端：** TypeScript + React + Vite
- **后端：** Rust + Tauri
- **媒体处理：** FFmpeg

## 更新日志

查看 [CHANGELOG.md](./docs/CHANGELOG.md) 了解完整版本历史。

## 开源许可

Apache-2.0

## 贡献

欢迎贡献！请随时提交 Pull Request。
