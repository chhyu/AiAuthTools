import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
console.log("contextIsolated", process.contextIsolated)
if (process.contextIsolated) {
  try {
    // contextBridge.exposeInMainWorld('electron', electronAPI)
    // contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', {
      getSesCookie: (domain) => ipcRenderer.invoke('get-ses-cookie', domain),
      getWebviewCookies: (webContentsId) => ipcRenderer.invoke('get-webview-cookies', webContentsId),
      setWebviewCookies: (webContentsId,cookieList) => ipcRenderer.invoke('set-webview-cookies', webContentsId,cookieList),
      setPartitionCookies: (partition, cookieList) => ipcRenderer.invoke('set-partition-cookies', partition, cookieList),
      getAppVersion: () => ipcRenderer.invoke('get-app-version'),
      checkForUpdates: () => ipcRenderer.invoke('check-app-update'),
      downloadUpdate: () => ipcRenderer.invoke('download-app-update'),
      onUpdateProgress: (callback) => {
        const listener = (_event, progress) => callback(progress)
        ipcRenderer.on('app-update-progress', listener)
        return () => ipcRenderer.removeListener('app-update-progress', listener)
      },
      onUpdateStatus: (callback) => {
        const listener = (_event, status) => callback(status)
        ipcRenderer.on('app-update-status', listener)
        return () => ipcRenderer.removeListener('app-update-status', listener)
      },
      clearWebviewCookies: async (webContentsId) => {
        try {
          // 调用主进程的'clear-webview-cookies'方法
          const result = await ipcRenderer.invoke('clear-webview-cookies', webContentsId);
          return result;
        } catch (error:any) {
          console.error('调用清除Cookie方法失败:', error);
          return { success: false, message: error.message };
        }
      },
    });

    console.log('preload: electronAPI 已暴露');
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
