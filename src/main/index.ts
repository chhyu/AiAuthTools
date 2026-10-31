import { app, shell, BrowserWindow, dialog, ipcMain, session, webContents } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerAppUpdater } from './appUpdater'
import { API_BASE_URL } from '../shared/apiConfig'
// import icon from '../../resources/icon.png?asset'

// 接口地址统一在 src/shared/apiConfig.ts 中维护
registerAppUpdater(API_BASE_URL)

let isAppQuitting = false
app.on('before-quit', () => {
  isAppQuitting = true
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/APPC.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true, // 允许在渲染进程中使用Node.js
      contextIsolation: true, // 关闭上下文隔离，以便使用Vue
      // 必须启用 webviewTag
      webviewTag: true,
      webSecurity: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  let closeDialogShowing = false
  mainWindow.on('close', (event) => {
    if (isAppQuitting) return

    event.preventDefault()
    if (closeDialogShowing) return
    closeDialogShowing = true

    dialog.showMessageBox(mainWindow, {
      type: 'question',
      title: '确认退出',
      message: '确定要退出应用吗？',
      detail: '退出后，当前正在进行的操作将会停止。',
      buttons: ['退出应用', '取消'],
      defaultId: 1,
      cancelId: 1,
      noLink: true
    }).then(({ response }) => {
      if (response === 0 && !mainWindow.isDestroyed()) {
        isAppQuitting = true
        app.quit()
      }
    }).finally(() => {
      closeDialogShowing = false
    })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('get-ses-cookie', async (event, domain) => {
  console.log("main get-ses-cookie", event, domain)
  try {

    const cookies = await session.defaultSession.cookies.get({
      url: `${domain}` // 注意：必须指定完整的协议（http/https）
      // 若目标 cookie 是 http 的，这里改为 http://${domain}
    });

    console.log("mainCookies", cookies)
    // 筛选出名称为 "ses" 的 cookie
    const sesCookie = cookies.find(cookie => cookie.name === 'ses');
    return sesCookie ? sesCookie.value : null;
  } catch (error) {
    console.error('获取 cookie 失败：', error);
    return null;
  }
});

ipcMain.handle('get-webview-cookies', async (event, webContentsId) => {
  try {
    // 通过ID找到webview的webContents
    console.log("get-webview-cookies event", event)
    const webContentss = webContents.fromId(webContentsId);
    if (!webContentss) {
      throw new Error('未找到webview的webContents');
    }
    const webviewSession = webContentss.session;
    // 获取该会话中的所有cookie
    const allCookies = await webviewSession.cookies.get({});
    console.log("allCookies", allCookies)
    return allCookies;
  } catch (error) {
    console.error('获取webview cookie失败:', error);
    return [];
  }
});
ipcMain.handle('set-webview-cookies', async (event, webContentsId, cookies) => {
  try {
    console.log("set-webview-cookies event", event, cookies)
    const wc = webContents.fromId(webContentsId);
    if (!wc) throw new Error('未找到 webContents');

    await setCookiesToSession(wc.session, cookies);

    return { success: true };
  } catch (e) {
    console.error("写入 Cookie 失败:", e);
    return { success: false };
  }
});

ipcMain.handle('set-partition-cookies', async (event, partition, cookies) => {
  try {
    console.log("set-partition-cookies event", event, partition, cookies)
    if (!partition || typeof partition !== 'string') {
      throw new Error('partition 参数为空')
    }
    await setCookiesToSession(session.fromPartition(partition), cookies)
    return { success: true }
  } catch (e: any) {
    console.error("按 partition 写入 Cookie 失败:", e);
    return { success: false, message: e.message };
  }
});

async function setCookiesToSession(targetSession, cookies) {
  if (!Array.isArray(cookies)) {
    throw new Error('cookies 必须是数组')
  }

  for (const cookie of cookies) {
    if (!cookie || !cookie.name || cookie.value === undefined || !cookie.domain) {
      continue
    }
    const cookieDetails = {
      url: getCookieUrl(cookie),
      name: cookie.name,
      value: String(cookie.value),
      domain: cookie.domain,
      path: cookie.path || "/",
      secure: !!cookie.secure,
      httpOnly: !!cookie.httpOnly,
      sameSite: cookie.sameSite || 'no_restriction',
      expirationDate: cookie.expirationDate
    };

    await targetSession.cookies.set(cookieDetails);
  }
}

function getCookieUrl(cookie) {
  const protocol = cookie.secure ? "https://" : "http://";
  return protocol + cookie.domain.replace(/^\./, "") + (cookie.path || "/");
}
ipcMain.handle('clear-webview-cookies', async (event, webContentsId) => {
  try {
    console.log("clear-webview-cookies event", event)
    const webContentss = webContents.fromId(webContentsId);
    if (!webContentss) {
      throw new Error('未找到webview的webContents');
    }
    const webviewSession = webContentss.session;
    const allCookies = await webviewSession.cookies.get({});
    if (allCookies.length === 0) {
      return { success: true, message: '没有需要清除的cookie', count: 0 };
    }
    let deletedCount = 0;
    for (const cookie of allCookies) {
      try {
        const url = `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`;
        await webviewSession.cookies.remove(url, cookie.name);
        deletedCount++;
      } catch (deleteError) {
        console.error(`删除cookie ${cookie.name} 失败:`, deleteError);
      }
    }

    return {
      success: true,
      message: `成功清除 ${deletedCount}/${allCookies.length} 个cookie`,
      count: deletedCount
    };
  } catch (error: any) {
    console.error('清除webview cookie失败:', error);
    return {
      success: false,
      message: error.message,
      count: 0
    };
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
