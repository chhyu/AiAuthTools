import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { createWriteStream, promises as fs } from 'fs'
import { get as httpGet, type IncomingMessage } from 'http'
import { get as httpsGet } from 'https'
import { basename, join } from 'path'

export interface AppUpdateInfo {
  code: number
  updateAvailable: boolean
  currentVersion: string
  latestVersion?: string
  versionId?: number
  forceUpdate?: boolean
  releaseNotes?: string
  fileName?: string
  fileSize?: number
  downloadUrl?: string
  message?: string
}

let checkedUpdate: AppUpdateInfo | null = null
let downloadTask: Promise<void> | null = null

function request(url: string, redirects = 0): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const getter = parsedUrl.protocol === 'https:' ? httpsGet : httpGet
    const req = getter(parsedUrl, { headers: { 'User-Agent': `AiArticlePublishUi/${app.getVersion()}` } }, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume()
        if (redirects >= 5) {
          reject(new Error('更新服务重定向次数过多'))
          return
        }
        resolve(request(new URL(response.headers.location, parsedUrl).toString(), redirects + 1))
        return
      }
      resolve(response)
    })
    req.setTimeout(30_000, () => req.destroy(new Error('连接更新服务超时')))
    req.on('error', reject)
  })
}

async function requestJson(url: string): Promise<unknown> {
  const response = await request(url)
  if (response.statusCode !== 200) {
    response.resume()
    throw new Error(`更新服务响应异常（HTTP ${response.statusCode || 0}）`)
  }
  const chunks: Buffer[] = []
  for await (const chunk of response) chunks.push(Buffer.from(chunk))
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'))
}

function sendToRenderer(channel: string, data: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, data)
  }
}

async function checkForUpdate(apiBaseUrl: string): Promise<AppUpdateInfo> {
  const query = new URLSearchParams({
    currentVersion: app.getVersion()
  })
  const raw = (await requestJson(
    `${apiBaseUrl.replace(/\/$/, '')}/pub/appUpdate/check?${query.toString()}`
  )) as { result?: string; data?: AppUpdateInfo; error?: string }
  if (raw.result !== 'success' || !raw.data) {
    throw new Error(raw.error || '更新服务返回的数据无效')
  }
  checkedUpdate = raw.data
  return raw.data
}

async function downloadAndInstall(): Promise<void> {
  const update = checkedUpdate
  if (!update?.updateAvailable || !update.downloadUrl || !update.fileName) {
    throw new Error('没有可下载的更新，请重新检查')
  }

  const updateDir = join(app.getPath('temp'), 'article-publish-tools-updates')
  await fs.mkdir(updateDir, { recursive: true })
  const fileName = basename(update.fileName)
  const installerPath = join(updateDir, fileName)
  const tempPath = `${installerPath}.download`
  await fs.rm(tempPath, { force: true })

  try {
    const response = await request(update.downloadUrl)
    if (response.statusCode !== 200) {
      response.resume()
      throw new Error(`下载安装包失败（HTTP ${response.statusCode || 0}）`)
    }

    const total = Number(response.headers['content-length']) || update.fileSize || 0
    let transferred = 0
    const writer = createWriteStream(tempPath)
    response.on('data', (chunk: Buffer) => {
      transferred += chunk.length
      sendToRenderer('app-update-progress', {
        transferred,
        total,
        percent: total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : 0
      })
    })
    response.pipe(writer)
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
      response.on('error', reject)
    })

    if (total > 0 && transferred !== total) {
      throw new Error('安装包下载不完整，请重新下载')
    }
    await fs.rm(installerPath, { force: true })
    await fs.rename(tempPath, installerPath)
    sendToRenderer('app-update-status', { status: 'installing' })
    const openError = await shell.openPath(installerPath)
    if (openError) throw new Error(`无法启动安装程序：${openError}`)
    setTimeout(() => app.quit(), 800)
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined)
    throw error
  }
}

export function registerAppUpdater(apiBaseUrl: string): void {
  ipcMain.handle('get-app-version', () => app.getVersion())
  ipcMain.handle('check-app-update', () => checkForUpdate(apiBaseUrl))
  ipcMain.handle('download-app-update', async () => {
    if (!downloadTask) {
      downloadTask = downloadAndInstall().finally(() => {
        downloadTask = null
      })
    }
    return downloadTask
  })
}
