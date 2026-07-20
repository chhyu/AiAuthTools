import { ElectronAPI } from '@electron-toolkit/preload'

interface AppUpdateInfo {
  code: number
  updateAvailable: boolean
  currentVersion: string
  latestVersion?: string
  forceUpdate?: boolean
  releaseNotes?: string
  fileName?: string
  fileSize?: number
  downloadUrl?: string
  message?: string
}

interface AppUpdateProgress {
  transferred: number
  total: number
  percent: number
}

interface AppElectronAPI {
  getSesCookie(domain: string): Promise<string | null>
  getWebviewCookies(webContentsId: number): Promise<unknown[]>
  setWebviewCookies(webContentsId: number, cookieList: unknown[]): Promise<{ success: boolean }>
  setPartitionCookies(partition: string, cookieList: unknown[]): Promise<{ success: boolean; message?: string }>
  clearWebviewCookies(webContentsId: number): Promise<{ success: boolean; message?: string }>
  getAppVersion(): Promise<string>
  checkForUpdates(): Promise<AppUpdateInfo>
  downloadUpdate(): Promise<void>
  onUpdateProgress(callback: (progress: AppUpdateProgress) => void): () => void
  onUpdateStatus(callback: (status: { status: string }) => void): () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    electronAPI: AppElectronAPI
  }
}
