<template>
    <div class="app-container">
        <div class="platform-container">
            <div class="platform-tabs">
                <div v-for="(item, index) in platformList" :key="index" class="platform-normal" :class="{
                    'platform-checked': platformIndex == index,
                }" @click="onPlatformClick(item, index)">
                    {{ item.name }}
                </div>
            </div>
            <div class="user-actions">
                <span class="current-account">{{ defaultMobile }}</span>
                <el-button class="logout-button" type="danger" plain size="small" @click="handleLogout">
                    退出登录
                </el-button>
            </div>
        </div>
        <div class="main-content">

            <aside class="left-panel">
                <div class="account-list">
                    <div v-for="(item, index) in dataList" :key="index" class="account-item" :class="{
                        active: activeAccountUid === item.uid
                    }">
                        <div class="item-info">

                            <div class="item-text">
                                <div class="item-name">{{ item.name }}</div>
                                <div class="item-subtext" v-if="item.userName">{{ item.userName }}</div>
                            </div>
                        </div>
                        <div class="item-actions">
                            <template v-if="item.status == '1'">
                                <button v-if="!isDouyinPlatform" class="btn btn-primary" @click.stop="handleOpenAccount(item)">打开</button>
                                <button class="btn btn-primary" @click.stop="handleUnauth(item, index)">解除授权</button>
                                <button class="btn btn-warning" @click.stop="handleReauth(item)">重新授权</button>
                                <button class="btn btn-danger" @click.stop="handleDelete(item, index)">删除</button>
                                <span class="status-tag">已授权</span>
                            </template>
                            <template v-else>
                                <button class="btn btn-primary" @click.stop="handleAuth()">去授权</button>
                            </template>
                        </div>
                    </div>

                </div>
                <el-button class="btn_add" type="primary" @click="handleAuth()">新增授权</el-button>
            </aside>

            <main class="right-content">
                <template v-if="isDouyinPlatform">
                    <div class="douyin-auth-panel">
                        <div class="douyin-auth-body">
                            <section class="douyin-flow-panel">
                                <div class="douyin-flow-title">抖音授权流程</div>
                                <div v-for="(step, index) in douyinFlowSteps" :key="step.key" class="douyin-flow-step" :class="{
                                    active: douyinFlowCurrentIndex === index,
                                    done: douyinFlowCurrentIndex > index
                                }">
                                    <span class="douyin-flow-number">{{ douyinFlowCurrentIndex > index ? '✓' : index + 1 }}</span>
                                    <span>{{ step.label }}</span>
                                </div>
                                <p class="douyin-flow-tip">页面关闭后授权任务会停止，请保持本窗口打开并按右侧提示操作。</p>
                            </section>

                            <section class="douyin-auth-workspace">
                                <div class="douyin-auth-header">
                                    <div>
                                        <h2>抖音授权</h2>
                                        <p>授权在自动化中完成，客户端不会打开目标浏览器。</p>
                                    </div>
                                    <el-tag v-if="douyinAuthStage" :type="douyinAuthStatusType">{{ douyinAuthStageText }}</el-tag>
                                </div>

                                <div v-if="!douyinAuthTaskId || douyinAuthFinished" class="douyin-auth-form">
                                    <el-radio-group v-model="douyinAuthMode" :disabled="douyinAuthBusy">
                                        <el-radio-button label="SCAN">扫码登录</el-radio-button>
                                        <el-radio-button label="SMS">手机号验证码</el-radio-button>
                                    </el-radio-group>
                                    <el-input v-model="douyinPhone" :disabled="douyinAuthBusy" maxlength="20"
                                        placeholder="请输入抖音绑定手机号（两种方式都需要）" clearable />
                                    <div class="douyin-auth-help">手机号用于生成固定账号 UID：{{ defaultMobile }}_手机号</div>
                                    <el-button type="primary" :loading="douyinAuthBusy" @click="createDouyinAuthTask">开始授权</el-button>
                                </div>

                                <div v-else class="douyin-auth-running">
                                    <div v-if="!douyinShowSmsBox" class="douyin-scan-box">
                                        <div v-if="douyinQrCode" class="douyin-qr-wrapper">
                                            <img :src="douyinQrCode" alt="抖音登录二维码" class="douyin-qr-image" />
                                        </div>
                                        <div v-else class="douyin-qr-placeholder">正在等待抖音登录二维码…</div>
                                        <div class="douyin-auth-help">请使用抖音 App 扫描二维码，二维码会自动刷新。</div>
                                        <el-button text type="primary" @click="refreshDouyinQr" :disabled="douyinAuthBusy">刷新二维码</el-button>
                                    </div>
                                    <div v-else class="douyin-sms-box">
                                        <div class="douyin-auth-help">
                                            {{ douyinAuthMode === 'SCAN'
                                                ? '自动选择短信验证，请查收短信验证码。'
                                                : '手机号已填入，请查收短信验证码。' }}
                                        </div>
                                        <el-input v-model="douyinSmsCode" maxlength="8" placeholder="请输入短信验证码" clearable />
                                        <div class="douyin-sms-actions">
                                            <el-button type="primary" :loading="douyinSmsSubmitting"
                                                @click="submitDouyinSmsCode">提交验证码</el-button>
                                            <el-button text type="primary" :loading="douyinSmsResending"
                                                :disabled="!douyinCanResendSms || douyinSmsSubmitting"
                                                @click="resendDouyinSmsCode">重新发送验证码</el-button>
                                        </div>
                                    </div>
                                    <el-button type="danger" plain @click="cancelDouyinAuth">取消授权</el-button>
                                </div>

                                <div v-if="douyinAuthError" class="douyin-auth-error">{{ douyinAuthError }}</div>
                                <div v-if="douyinAuthFinished && douyinAuthStage === 'SUCCESS'" class="douyin-auth-success">
                                    授权成功，UID：{{ douyinAuthUid }}。已保存授权环境，可直接用于后续发布。
                                </div>
                            </section>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="loading-mask" v-if="isLoading">
                        <div class="loading-spinner"></div>
                        <p>加载中...</p>
                    </div>
                    <div class="empty-state" v-if="!selectedUrl && !isLoading">
                        <p>请从左侧选择账号访问对应平台</p>
                    </div>
                    <webview v-if="selectedUrl" :key="webviewKey" ref="webviewRef" :src="selectedUrl" class="web-viewer"
                        :partition="activePartition" @did-finish-load="handleLoadComplete" @dom-ready="onWebviewReady"
                        :useragent="customUserAgent" @did-fail-load="handleLoadError">
                    </webview>
                </template>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import request from '@utils/request.ts'
import { useLoginStore } from '../../store/login'
import router from '@renderer/router'
const useStore = useLoginStore()
const customUserAgent = ref("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36");

const webviewRef = ref(null)
// 状态管理
const selectedUrl = ref('');
const activePartition = ref('persist:aigeo_empty');
const webviewKey = ref(0);
const currentWebviewMode = ref('');
const activeAccountUid = ref('');
const isLoading = ref(false);
const platformIndex = ref(0)
const selectedIndex = ref(-1);
const defaultMobile = ref("")
const activeName = ref("百家号")
const dataList = ref([])
const webContentsReady = ref(false);
const loginSuccessStayDelay = 5000
const webviewStableDelay = 3000
const isHandlingBaijiahaoLogin = ref(false)
const isHandlingSohuLogin = ref(false)
const douyinAuthTaskId = ref('')
const douyinAuthMode = ref('SCAN')
const douyinPhone = ref('')
const douyinSmsCode = ref('')
const douyinQrCode = ref('')
const douyinQrVersion = ref(0)
const douyinAuthStage = ref('')
const douyinAuthUid = ref('')
const douyinAuthError = ref('')
const douyinAuthBusy = ref(false)
const douyinSmsSubmitting = ref(false)
const douyinSmsResending = ref(false)
const douyinSecondVerifyActive = ref(false)
const douyinAuthFinished = ref(false)
const douyinAuthPollingTimer = ref(null)
const douyinAuthPollInFlight = ref(false)
const douyinFlowSteps = [
    { key: 'CREATE', label: '选择方式并创建授权任务' },
    { key: 'BROWSER', label: '创建抖音授权环境' },
    { key: 'LOGIN', label: '打开抖音登录页' },
    { key: 'VERIFY', label: '扫码或提交验证码' },
    { key: 'SAVE', label: '保存账号和浏览器环境' },
    { key: 'SUCCESS', label: '授权完成' }
]
const isDouyinPlatform = computed(() => platformList.value?.[platformIndex.value]?.name === '抖音')
const douyinAuthStageText = computed(() => ({
    CREATED: '准备中', CREATING_BROWSER: '创建浏览器', STARTING_BROWSER: '启动浏览器',
    BROWSER_READY: '打开登录页', OPENING_LOGIN_PAGE: '打开登录页', WAIT_SCAN: '等待扫码',
    WAIT_SCAN_CONFIRM: '等待手机确认', QR_EXPIRED: '刷新二维码', WAIT_PHONE_CODE: '等待短信验证码',
    SUBMITTING_PHONE_CODE: '提交验证码', CHECKING_LOGIN: '检查登录', LOGGING_IN: '检查登录',
    SAVING_ACCOUNT: '保存账号', SUCCESS: '授权成功', CANCELED: '已取消', TIMEOUT: '已超时', FAILED: '失败'
}[douyinAuthStage.value] || '等待操作'))
const douyinAuthStatusType = computed(() => {
    if (douyinAuthStage.value === 'SUCCESS') return 'success'
    if (['FAILED', 'TIMEOUT', 'CANCELED'].includes(douyinAuthStage.value)) return 'danger'
    return 'primary'
})
const douyinShowSmsBox = computed(() => {
    const stage = douyinAuthStage.value
    // 手机号登录触发“使用原设备扫码”二次验证时，改用二维码展示而不是短信框。
    if (douyinAuthMode.value === 'SMS' && stage === 'WAIT_SCAN') return false
    if (douyinAuthMode.value === 'SMS') return true
    return douyinSecondVerifyActive.value || ['WAIT_PHONE_CODE', 'SUBMITTING_PHONE_CODE', 'CHECKING_LOGIN', 'LOGGING_IN'].includes(stage)
})
const douyinCanResendSms = computed(() =>
    Boolean(douyinAuthTaskId.value) &&
    ['WAIT_PHONE_CODE'].includes(douyinAuthStage.value) &&
    !douyinAuthFinished.value
)
const douyinFlowCurrentIndex = computed(() => {
    const stage = douyinAuthStage.value
    if (!stage || stage === 'CREATED') return 0
    if (['CREATING_BROWSER', 'STARTING_BROWSER'].includes(stage)) return 1
    if (['OPENING_LOGIN_PAGE', 'BROWSER_READY'].includes(stage)) return 2
    if (['WAIT_SCAN', 'WAIT_SCAN_CONFIRM', 'QR_EXPIRED', 'WAIT_PHONE_CODE', 'SUBMITTING_PHONE_CODE', 'CHECKING_LOGIN', 'LOGGING_IN'].includes(stage)) return 3
    if (stage === 'SAVING_ACCOUNT') return 4
    if (stage === 'SUCCESS') return 5
    return 0
})
const onWebviewReady = () => {
    webContentsReady.value = true;
    console.log('webview 已就绪，可以调用方法');
};

const { electronAPI } = window
const retryIndex = ref(1)
const buildPartitionName = (platformName, uid) => {
    const rawValue = `${defaultMobile.value}_${platformName}_${uid}`
    return `persist:aigeo_${encodeURIComponent(rawValue).replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

const buildAuthPartitionName = (platformName) => {
    const rawValue = `${defaultMobile.value}_${platformName}_${Date.now()}`
    return `persist:aigeo_auth_${encodeURIComponent(rawValue).replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

const parseCookieObjStr = (cookieObjStr) => {
    if (!cookieObjStr) {
        return []
    }
    try {
        const cookieList = JSON.parse(cookieObjStr)
        return Array.isArray(cookieList) ? cookieList : []
    } catch (error) {
        console.error('解析 Cookie Profile 失败:', error)
        return []
    }
}

const onPlatformClick = (item, index) => {
    if (isDouyinPlatform.value && douyinAuthTaskId.value && !douyinAuthFinished.value) {
        cancelDouyinAuth(true)
    }
    if (index == platformIndex.value) {
        return
    }
    platformIndex.value = index
    selectedUrl.value = ""
    activeAccountUid.value = ""
    currentWebviewMode.value = ""
    if (checkIntervalId.value) {
        clearInterval(checkIntervalId.value)
        checkIntervalId.value = ''
    }
    isHandlingBaijiahaoLogin.value = false
    isHandlingSohuLogin.value = false
    getUserAuthStatus()
}
const handleLoadComplete = async (e) => {
    if (!webContentsReady.value || !webviewRef.value) {
        console.error('webview 尚未就绪，无法获取Cookie');
        return;
    }
    let selectedItem = platformList.value[selectedIndex.value]
    console.log("handleLoadComplete", selectedItem)
    isLoading.value = false
    if (currentWebviewMode.value == 'auth' && webviewRef.value && selectedItem && !selectedItem.isIntervalCheck) {
        handleAfterLoginSuccessAction(selectedItem)
    }
}

const handleAfterLoginSuccessAction = async (selectedItem) => {
    const cookieObj = await getSelectedWebviewTargetCookies(selectedItem)
    const cookieStr = cookieObj['cookieStr']
    const cookieObjStr = cookieObj['cookieObjStr']
    if (hasTargetCookie(cookieStr, selectedItem)) {
        let userInfo = null
        if (selectedItem.name == '蓝色河畔') {
            userInfo = await getLanSeHePanUserInfo()
        } else if (selectedItem.name == '抖音') {
            userInfo = await getDouYinUserInfo()
        }

        if (['蓝色河畔', '抖音'].includes(selectedItem.name) && !userInfo) {
            return false
        }

        saveInfo2Server(cookieStr, cookieObjStr, userInfo)
        return true
    }
    return false
}

const handleBaijiahaoLoginSuccessAction = async (selectedItem) => {
    if (isHandlingBaijiahaoLogin.value) {
        return
    }

    isHandlingBaijiahaoLogin.value = true

    try {
        const cookieObj = await getSelectedWebviewTargetCookies(selectedItem)
        if (!hasTargetCookie(cookieObj['cookieStr'], selectedItem)) {
            isHandlingBaijiahaoLogin.value = false
            return
        }

        if (checkIntervalId.value) {
            clearInterval(checkIntervalId.value)
            checkIntervalId.value = ''
        }

        // 登录成功后先停留在当前页面，再进入编辑页补全该页面产生的 Cookie。
        await wait(loginSuccessStayDelay)
        if (platformList.value[selectedIndex.value] !== selectedItem || !isHandlingBaijiahaoLogin.value) {
            return
        }

        await loadWebviewUrlAndWaitForStable(selectedItem.afterLoginUrl)
        const latestCookieObj = await getSelectedWebviewTargetCookies(selectedItem)
        if (hasTargetCookie(latestCookieObj['cookieStr'], selectedItem)) {
            isHandlingBaijiahaoLogin.value = false
            saveInfo2Server(latestCookieObj['cookieStr'], latestCookieObj['cookieObjStr'])
        } else {
            isHandlingBaijiahaoLogin.value = false
            handleGetCookieInterval()
        }
    } catch (error) {
        console.error('百家号跳转后重新获取Cookie失败:', error)
        isHandlingBaijiahaoLogin.value = false
        handleGetCookieInterval()
    }
}

const getSelectedWebviewTargetCookies = async (selectedItem) => {
    const webContentsId = webviewRef.value.getWebContentsId();
    // 发送到主进程，获取该webview会话中的所有cookie
    const webviewCookies = await window.electronAPI.getWebviewCookies(webContentsId);
    console.log('webviewCookies:', webviewCookies);

    return getTargetCookies(webviewCookies, selectedItem.domain)
}

const hasTargetCookie = (cookieStr, selectedItem) => {
    if (!cookieStr || !selectedItem.cookieKeyword) {
        return false
    }
    const cookieKeywords = selectedItem.cookieKeyword
        .split(',')
        .map(keyword => keyword.trim())
        .filter(Boolean)

    if (!cookieKeywords.length) {
        return false
    }

    const cookieNames = cookieStr
        .split(';')
        .map(cookie => cookie.trim().split('=')[0])
        .filter(Boolean)
    // return cookieKeywords.every(keyword => cookieNames.includes(keyword)) //必须全部满足
    return cookieKeywords.some(keyword => cookieNames.includes(keyword))
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const isSameOrChildUrl = (currentUrl, targetUrl) => {
    if (!currentUrl || !targetUrl) {
        return false
    }

    return currentUrl === targetUrl
        || currentUrl.startsWith(`${targetUrl}?`)
        || currentUrl.startsWith(`${targetUrl}#`)
        || currentUrl.startsWith(`${targetUrl}/`)
}

const checkSohuLoginState = async () => {
    if (!webviewRef.value || typeof webviewRef.value.executeJavaScript !== 'function') {
        return false
    }

    try {
        return await webviewRef.value.executeJavaScript(`
            (() => {
                const noLoginElement = document.querySelector('.no-login')
                const loginElement = document.querySelector('.login')
                return Boolean(loginElement && !noLoginElement)
            })()
        `)
    } catch (error) {
        console.error('Failed to check Sohu login state:', error)
        return false
    }
}

const waitForWebviewReady = async (timeout = 30000) => {
    const startTime = Date.now()
    while (!webviewRef.value || !webContentsReady.value) {
        if (Date.now() - startTime > timeout) {
            throw new Error('页面初始化超时，请稍后重试')
        }
        await wait(100)
    }
}

const loadWebviewUrlAndWaitForStable = (url) => {
    return new Promise((resolve, reject) => {
        const webview = webviewRef.value
        if (!webview) {
            reject(new Error('webview未就绪'))
            return
        }

        let isSettled = false
        let timeoutId = null

        const cleanup = () => {
            webview.removeEventListener('did-finish-load', handleFinishLoad)
            webview.removeEventListener('did-fail-load', handleFailLoad)
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
        }

        const handleFinishLoad = async () => {
            if (isSettled) {
                return
            }
            isSettled = true
            cleanup()
            await wait(webviewStableDelay)
            resolve()
        }

        const handleFailLoad = (event) => {
            if (event.errorCode === -3) {
                return
            }
            if (isSettled) {
                return
            }
            isSettled = true
            cleanup()
            reject(new Error(`页面加载失败: ${event.errorDescription || event.errorCode || url}`))
        }

        webview.addEventListener('did-finish-load', handleFinishLoad)
        webview.addEventListener('did-fail-load', handleFailLoad)
        timeoutId = setTimeout(() => {
            if (isSettled) {
                return
            }
            isSettled = true
            cleanup()
            reject(new Error(`页面加载超时: ${url}`))
        }, 30000)

        try {
            isLoading.value = true
            if (selectedUrl.value !== url) {
                // 保持 Vue 的 src 状态和 webview 的实际地址一致，避免后续渲染回到默认 URL。
                selectedUrl.value = url
            } else if (typeof webview.loadURL === 'function') {
                webview.loadURL(url)
            }
        } catch (error) {
            isSettled = true
            cleanup()
            reject(error)
        }
    }).finally(() => {
        isLoading.value = false
    })
}

const getLanSeHePanUserInfo = async () => {
    if (!webviewRef.value) {
        return null
    }

    try {
        // 蓝色河畔登录后，页面顶部会渲染当前用户空间入口，这里直接从页面取用户名和 uid。
        const userInfo = await webviewRef.value.executeJavaScript(`
            (() => {
                const userLink = document.querySelector('strong.yonghuming a[href*="home.php?mod=space"]')
                if (!userLink) {
                    return null
                }

                const userName = (userLink.textContent || '').trim()
                const href = userLink.getAttribute('href') || ''
                const uidMatch = href.match(/[?&]uid=(\\d+)/)
                const userId = uidMatch ? uidMatch[1] : ''

                if (!userName || !userId) {
                    return null
                }

                return {
                    userName,
                    userId
                }
            })()
        `)

        if (!userInfo || !userInfo.userName || !userInfo.userId) {
            console.error('获取蓝色河畔用户信息失败:', userInfo)
            return null
        }

        return userInfo
    } catch (error) {
        console.error('获取蓝色河畔用户信息失败:', error)
        return null
    }
}

const getDouYinUserInfo = async () => {
    if (!webviewRef.value) {
        return null
    }

    try {
        const userInfo = await webviewRef.value.executeJavaScript(`
            (() => {
                const uniqueIdNode = document.querySelector('[class^="unique_id-"], [class*=" unique_id-"]')
                if (!uniqueIdNode) {
                    return null
                }

                const headerNode = uniqueIdNode.parentElement
                const profileNode = headerNode && headerNode.parentElement && headerNode.parentElement.parentElement
                const nameNode = headerNode && headerNode.querySelector('[class^="name-"], [class*=" name-"]')
                const avatarNode = profileNode && profileNode.querySelector('img')
                const userId = (uniqueIdNode.textContent || '')
                    .replace(/^抖音号[：:]\\s*/, '')
                    .trim()
                const userName = (nameNode && nameNode.textContent || '').trim()
                const avatar = avatarNode && avatarNode.src ? avatarNode.src : ''

                if (!userName || !userId) {
                    return null
                }

                return {
                    userName,
                    userId,
                    avatar
                }
            })()
        `)

        if (!userInfo || !userInfo.userName || !userInfo.userId) {
            console.error('获取抖音用户信息失败:', userInfo)
            return null
        }

        return userInfo
    } catch (error) {
        console.error('获取抖音用户信息失败:', error)
        return null
    }
}

const saveInfo2Server = (cookies, cookieObjStr, userInfo = null) => {
    let param = {
        "platform": platformList.value[selectedIndex.value].name,
        "account": defaultMobile.value,
        "cookie": cookies,
        "cookieObjStr": cookieObjStr
    }
    if (userInfo) {
        param.userInfo = userInfo
    }
    if (checkIntervalId.value) {
        clearInterval(checkIntervalId.value)
    }
    request.post('/pub/saveAuthInfo', param).then(res => {
        console.log('信息保存成功', res);
        if (res.result == 'success' && res.data.code == 0) {
            const savedUid = res.data.data && res.data.data.uid ? res.data.data.uid : ''
            if (savedUid) {
                activeAccountUid.value = savedUid
            }
            currentWebviewMode.value = 'profile'
            setTimeout(() => {
                getUserAuthStatus()
            }, 2000);
            ElMessage.success('授权信息已保存，可从左侧账号列表打开独立页面')
        } else {
            handleGetCookieInterval()
        }
    })
        .catch(err => {
            console.error('信息保存失败', err);
            handleGetCookieInterval()
        });
}


const getTargetCookies = (cookies, targetDomain) => {
    const cookieStrList = [];
    const cookieObjList = [];
    if (!Array.isArray(cookies)) {
        console.warn('第一个参数必须是cookie数组');
        return {
            "cookieStr": "",
            "cookieObjStr": "[]"
        };
    }
    if (typeof targetDomain !== 'string') {
        console.warn('第二个参数必须是字符串类型的domain');
        return {
            "cookieStr": "",
            "cookieObjStr": "[]"
        };
    }
    cookies.forEach(cookie => {
        // 只保存当前平台域名下的 Cookie，避免把其它平台登录态串进来。
        if (cookie && (cookie.domain || '').includes(targetDomain)) {
            cookieStrList.push(`${cookie.name}=${cookie.value}`);
            cookieObjList.push(cookie)
        }
    });
    // return cookiePairs.join('; ');
    return {
        "cookieStr": cookieStrList.join('; '),
        "cookieObjStr": JSON.stringify(cookieObjList)
    };
}

const clearAllCookie = async (isClearUrl = true) => {
    try {
        if (!webviewRef.value) {
            return
        }
        const webContentsId = webviewRef.value.getWebContentsId();
        const result = await window.electronAPI.clearWebviewCookies(webContentsId);
        if (result.success) {
            console.log('清除结果:', result.message);
        } else {
            console.error('清除失败:', result.message);
        }
    } catch (error) {
        console.error('操作出错:', error);
    } finally {
        if (isClearUrl) {
            selectedUrl.value = ''
        }
    }
}

const handleLoadError = (e) => {
    console.log("load error", e)
    // 页面跳转中止上一条导航时会触发 ERR_ABORTED，这不是实际加载失败。
    if (e.errorCode === -3) {
        return
    }
    // ERR_BLOCKED_BY_RESPONSE(-27)：目标页面通过 X-Frame-Options 等响应头禁止被嵌入，
    // 只是该页面无法在 webview 中展示，不代表登录失败，不能清空 Cookie（网易号登录后
    // 跳转 c.m.163.com/nc/qa/uid.html 即属于这种情况）。
    if (e.errorCode === -27) {
        isLoading.value = false
        return
    }
    isLoading.value = false
    if (currentWebviewMode.value == 'auth') {
        clearAllCookie(false)
    }
}

const handleLogout = () => {
    ElMessageBox.confirm(
        '退出后需要重新输入用户名和密码，确定要退出登录吗？',
        '退出登录',
        {
            confirmButtonText: '退出登录',
            cancelButtonText: '取消',
            type: 'warning',
            closeOnClickModal: false,
        }
    ).then(async () => {
        if (checkIntervalId.value) {
            clearInterval(checkIntervalId.value)
            checkIntervalId.value = ''
        }
        selectedUrl.value = ''
        activeAccountUid.value = ''
        currentWebviewMode.value = ''
        useStore.clearLoginInfo()
        await router.replace({ name: 'Login' })
        ElMessage.success('已退出登录')
    }).catch(() => undefined)
}

// 点击列表项
const douyinAuthIsTerminal = (stage) => ['SUCCESS', 'CANCELED', 'TIMEOUT', 'FAILED'].includes(stage)
const stopDouyinAuthPolling = () => {
    if (douyinAuthPollingTimer.value) {
        clearInterval(douyinAuthPollingTimer.value)
        douyinAuthPollingTimer.value = null
    }
}
const resetDouyinAuthPanel = () => {
    stopDouyinAuthPolling()
    douyinAuthTaskId.value = ''
    douyinAuthStage.value = ''
    douyinAuthUid.value = ''
    douyinAuthError.value = ''
    douyinQrCode.value = ''
    douyinQrVersion.value = 0
    douyinSmsCode.value = ''
    douyinSmsResending.value = false
    douyinSecondVerifyActive.value = false
    douyinAuthFinished.value = false
    douyinAuthBusy.value = false
}
const applyDouyinAuthResult = (payload) => {
    if (!payload) return
    const incomingStage = payload.stage || payload.status || ''
    // 只有“扫码登录”的短信二次验证才需要防止迟到的 WAIT_SCAN 回退。
    // 手机号登录的二次验证本身就是“使用原设备扫码”，WAIT_SCAN 必须生效，
    // 否则客户端无法从短信框切换到二维码。
    if (!(douyinAuthMode.value === 'SCAN' && douyinSecondVerifyActive.value && incomingStage === 'WAIT_SCAN')) {
        douyinAuthStage.value = incomingStage
    }
    if (['WAIT_PHONE_CODE', 'SUBMITTING_PHONE_CODE', 'CHECKING_LOGIN', 'LOGGING_IN'].includes(incomingStage)) {
        douyinSecondVerifyActive.value = true
    }
    douyinAuthUid.value = payload.uid || douyinAuthUid.value
    douyinAuthError.value = payload.errorMessage || ''
    if (payload.qrVersion && payload.qrVersion !== douyinQrVersion.value) {
        douyinQrVersion.value = payload.qrVersion
        douyinQrCode.value = payload.qrCode || ''
    } else if (!payload.qrCode && payload.stage === 'QR_EXPIRED') {
        douyinQrCode.value = ''
    }
    douyinAuthFinished.value = douyinAuthIsTerminal(douyinAuthStage.value)
    if (douyinAuthFinished.value) {
        stopDouyinAuthPolling()
        if (douyinAuthStage.value === 'SUCCESS') {
            douyinPhone.value = ''
            douyinSmsCode.value = ''
            getUserAuthStatus()
        }
    }
}
const pollDouyinAuth = async () => {
    const taskId = douyinAuthTaskId.value
    if (!taskId || douyinAuthPollInFlight.value) return
    douyinAuthPollInFlight.value = true
    try {
        const res = await request.post('/pub/douyinAuth/poll', {
            account: defaultMobile.value,
            taskId
        })
        // 页面切换或取消后，忽略旧任务的迟到响应，避免覆盖新授权面板。
        if (douyinAuthTaskId.value !== taskId) return
        if (res.result !== 'success' || !res.data || res.data.code !== 0) {
            throw new Error(res.msg || res.data?.msg || '获取抖音授权状态失败')
        }
        applyDouyinAuthResult(res.data.data)
    } catch (error) {
        if (douyinAuthTaskId.value === taskId) {
            douyinAuthError.value = error?.message || '获取抖音授权状态失败'
        }
    } finally {
        douyinAuthPollInFlight.value = false
    }
}
const startDouyinAuthPolling = () => {
    stopDouyinAuthPolling()
    pollDouyinAuth()
    douyinAuthPollingTimer.value = setInterval(pollDouyinAuth, 1500)
}
const createDouyinAuthTask = async () => {
    const phone = String(douyinPhone.value || '').trim()
    if (!/^\d{6,20}$/.test(phone)) {
        douyinAuthError.value = '请输入 6-20 位数字手机号'
        return
    }
    if (!defaultMobile.value) {
        douyinAuthError.value = '当前客户端账号为空，请重新登录'
        return
    }
    douyinAuthBusy.value = true
    douyinAuthError.value = ''
    try {
        const res = await request.post('/pub/douyinAuth/create', {
            account: defaultMobile.value,
            loginMode: douyinAuthMode.value,
            phone
        })
        if (res.result !== 'success' || !res.data || res.data.code !== 0) {
            throw new Error(res.msg || res.data?.msg || '创建抖音授权任务失败')
        }
        douyinAuthTaskId.value = res.data.data.taskId
        douyinAuthStage.value = 'CREATED'
        douyinSecondVerifyActive.value = false
        douyinAuthFinished.value = false
        douyinQrCode.value = ''
        douyinQrVersion.value = 0
        startDouyinAuthPolling()
    } catch (error) {
        douyinAuthError.value = error?.message || '创建抖音授权任务失败'
    } finally {
        douyinAuthBusy.value = false
    }
}
const refreshDouyinQr = async () => {
    if (!douyinAuthTaskId.value) return
    try {
        const res = await request.post('/pub/douyinAuth/refreshQr', {
            account: defaultMobile.value,
            taskId: douyinAuthTaskId.value
        })
        if (res.result !== 'success' || !res.data || res.data.code !== 0) {
            throw new Error(res.msg || res.data?.msg || '刷新二维码失败')
        }
        douyinQrCode.value = ''
        douyinAuthError.value = ''
        await pollDouyinAuth()
    } catch (error) {
        douyinAuthError.value = error?.message || '刷新二维码失败'
    }
}
const submitDouyinSmsCode = async () => {
    const smsCode = String(douyinSmsCode.value || '').trim()
    if (!/^\d{4,8}$/.test(smsCode)) {
        douyinAuthError.value = '请输入 4-8 位数字验证码'
        return
    }
    douyinSmsSubmitting.value = true
    douyinAuthError.value = ''
    try {
        const res = await request.post('/pub/douyinAuth/submitSmsCode', {
            account: defaultMobile.value,
            taskId: douyinAuthTaskId.value,
            smsCode
        })
        if (res.result !== 'success' || !res.data || res.data.code !== 0) {
            throw new Error(res.msg || res.data?.msg || '提交验证码失败')
        }
        douyinAuthStage.value = 'SUBMITTING_PHONE_CODE'
        await pollDouyinAuth()
    } catch (error) {
        douyinAuthError.value = error?.message || '提交验证码失败'
    } finally {
        douyinSmsSubmitting.value = false
    }
}
const resendDouyinSmsCode = async () => {
    if (!douyinCanResendSms.value || douyinSmsResending.value) return
    douyinSmsResending.value = true
    douyinAuthError.value = ''
    try {
        const res = await request.post('/pub/douyinAuth/resendSms', {
            account: defaultMobile.value,
            taskId: douyinAuthTaskId.value
        })
        if (res.result !== 'success' || !res.data || res.data.code !== 0) {
            throw new Error(res.msg || res.data?.msg || '重新发送验证码失败')
        }
        ElMessage.success('已请求重新发送验证码')
        await pollDouyinAuth()
    } catch (error) {
        douyinAuthError.value = error?.message || '重新发送验证码失败'
    } finally {
        douyinSmsResending.value = false
    }
}
const cancelDouyinAuth = async (silent = false) => {
    if (!douyinAuthTaskId.value) {
        resetDouyinAuthPanel()
        return
    }
    const taskId = douyinAuthTaskId.value
    stopDouyinAuthPolling()
    try {
        await request.post('/pub/douyinAuth/cancel', { account: defaultMobile.value, taskId })
        if (!silent) ElMessage.info('抖音授权已取消')
    } catch (error) {
        if (!silent) ElMessage.error(error?.message || '取消抖音授权失败')
    } finally {
        resetDouyinAuthPanel()
    }
}
const handleAuth = () => {
    let selectedPlatform = platformList.value[platformIndex.value]
    if (selectedPlatform.name === '抖音') {
        resetDouyinAuthPanel()
        return
    }
    if (selectedPlatform.url) {
        isLoading.value = true;
        isHandlingBaijiahaoLogin.value = false
        isHandlingSohuLogin.value = false
        activeAccountUid.value = ''
        currentWebviewMode.value = 'auth'
        activePartition.value = buildAuthPartitionName(selectedPlatform.name)
        webContentsReady.value = false
        webviewKey.value += 1
        selectedUrl.value = selectedPlatform.url;
        selectedIndex.value = platformIndex.value
        handleGetCookieInterval()
    }
};

const checkIntervalId = ref('')
const handleGetCookieInterval = () => {
    let selectedItem = platformList.value[selectedIndex.value]
    if (currentWebviewMode.value != 'auth' || !selectedItem || !selectedItem.isIntervalCheck) {
        return
    }
    if (checkIntervalId.value) {
        clearInterval(checkIntervalId.value)
    }
    checkIntervalId.value = setInterval(async () => {
        if (webviewRef.value && webContentsReady.value) {
            const currentPageUrl = typeof webviewRef.value.getURL === 'function'
                ? webviewRef.value.getURL()
                : selectedUrl.value
            console.log("已选中的平台：", selectedItem.name)
            console.log("当前页面地址：", currentPageUrl)
            if (selectedItem.name == '搜狐号') {
                // Prevent overlapping async checks. A return only exits the current interval callback.
                if (isHandlingSohuLogin.value) {
                    return
                }
                isHandlingSohuLogin.value = true

                try {
                    const targetUrl = selectedItem.afterLoginUrl || selectedItem.url

                    // Only the target page creates the authorization Cookie.
                    // Once there, do not depend on the login-page .login element anymore.
                    if (isSameOrChildUrl(currentPageUrl, targetUrl)) {
                        const hasSavedAuthInfo = await handleAfterLoginSuccessAction(selectedItem)
                        isHandlingSohuLogin.value = false
                        if (hasSavedAuthInfo && checkIntervalId.value) {
                            clearInterval(checkIntervalId.value)
                            checkIntervalId.value = ''
                        }
                        return
                    }

                    // Sohu is logged in when .login exists and .no-login is absent.
                    // Cookie presence is not used here because it is created after navigating to afterLoginUrl.
                    const hasLoggedIn = await checkSohuLoginState()
                    console.log('Sohu page login state:', hasLoggedIn)
                    if (!hasLoggedIn) {
                        isHandlingSohuLogin.value = false
                        return
                    }

                    if (checkIntervalId.value) {
                        clearInterval(checkIntervalId.value)
                        checkIntervalId.value = ''
                    }

                    // Confirm login first, then navigate and read the authorization Cookie from the target page.
                    await loadWebviewUrlAndWaitForStable(targetUrl)
                    const hasSavedAuthInfo = await handleAfterLoginSuccessAction(selectedItem)
                    isHandlingSohuLogin.value = false
                    if (!hasSavedAuthInfo) {
                        // The target Cookie may be written asynchronously; retry Cookie checks only.
                        handleGetCookieInterval()
                    }
                } catch (error) {
                    console.error('Failed to handle Sohu login:', error)
                    isHandlingSohuLogin.value = false
                    handleGetCookieInterval()
                }
            } else if (selectedItem.name == '百家号') {
                handleBaijiahaoLoginSuccessAction(selectedItem)
            } else {
                const hasSavedAuthInfo = await handleAfterLoginSuccessAction(selectedItem)
                if (hasSavedAuthInfo) {
                    clearInterval(checkIntervalId.value)
                }
            }
        }
    }, 5000);
}

const loadAccountProfile = async (item, mode = 'profile', targetUrl = '') => {
    const selectedPlatform = platformList.value[platformIndex.value]
    if (!selectedPlatform || !item || item.status != '1') {
        return
    }

    if (checkIntervalId.value) {
        clearInterval(checkIntervalId.value)
        checkIntervalId.value = ''
    }

    isLoading.value = true
    isHandlingBaijiahaoLogin.value = false
    currentWebviewMode.value = mode
    selectedIndex.value = platformIndex.value

    const openUrl = targetUrl || selectedPlatform.url
    const partition = buildPartitionName(selectedPlatform.name, item.uid)

    if (activeAccountUid.value != item.uid || activePartition.value != partition || !webviewRef.value) {
        const profileResp = await request.post('/pub/getAuthProfile', {
            account: defaultMobile.value,
            uid: item.uid
        })

        if (profileResp.result != 'success' || !profileResp.data || profileResp.data.code != 0) {
            throw new Error(profileResp.msg || profileResp.data?.msg || '获取授权 Profile 失败')
        }

        const profileData = profileResp.data.data
        const cookieList = parseCookieObjStr(profileData.cookieObjStr)
        if (!cookieList.length) {
            throw new Error('该账号没有可恢复的 Cookie Profile，请重新授权')
        }

        const setCookieResult = await window.electronAPI.setPartitionCookies(partition, cookieList)
        if (!setCookieResult || !setCookieResult.success) {
            throw new Error(setCookieResult?.message || '写入独立 Profile Cookie 失败')
        }
    }

    activePartition.value = partition
    activeAccountUid.value = item.uid
    webContentsReady.value = false
    selectedUrl.value = ''
    webviewKey.value += 1
    await nextTick()
    selectedUrl.value = openUrl
}

// 打开已授权账号的独立 Profile
const handleOpenAccount = async (item) => {
    if (isDouyinPlatform.value) {
        ElMessage.info('抖音登录态保存在授权环境中，客户端不打开目标浏览器')
        return
    }
    try {
        await loadAccountProfile(item, 'profile')
    } catch (error) {
        console.error('打开授权账号失败:', error)
        activeAccountUid.value = ''
        ElMessage.error(error.message || '打开授权账号失败')
        isLoading.value = false
    }
}

// 重新授权：使用当前账号独立 Profile 的最新登录态重新保存 Cookie
const handleReauth = (item) => {
    if (isDouyinPlatform.value) {
        resetDouyinAuthPanel()
        return
    }
    ElMessageBox.confirm(
        '请确认当前账号处于已登录状态并重新授权，点击确认后将再次获取登录信息并保存到后台。',
        '重新授权',
        {
            confirmButtonText: '确认重新授权',
            cancelButtonText: '取消',
            type: 'warning',
            closeOnClickModal: false,
        }
    )
        .then(() => {
            reauthPlatformAccount(item)
        })
        .catch(() => {
            ElMessage.info('操作已取消');
        });
}

const reauthPlatformAccount = async (item) => {
    const selectedPlatform = platformList.value[platformIndex.value]
    if (!selectedPlatform || !item || item.status != '1') {
        return
    }

    try {
        const targetUrl = selectedPlatform.afterLoginUrl
            ? selectedPlatform.afterLoginUrl
            : selectedPlatform.url

        await loadAccountProfile(item, 'reauth', targetUrl)
        await waitForWebviewReady()
        await loadWebviewUrlAndWaitForStable(targetUrl)

        const hasSavedAuthInfo = await handleAfterLoginSuccessAction(selectedPlatform)
        if (!hasSavedAuthInfo) {
            ElMessage.error('未获取到有效登录信息，请确认右侧页面已登录当前账号后再重新授权')
            return
        }

        ElMessage.success('重新授权信息已提交保存')
    } catch (error) {
        console.error('重新授权失败:', error)
        ElMessage.error(error.message || '重新授权失败')
    } finally {
        isLoading.value = false
    }
}

// 解除授权
const handleUnauth = (item, index) => {
    ElMessageBox.confirm(
        '确定要执行解除授权操作吗？',
        '温馨提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            closeOnClickModal: false,
        }
    )
        .then(() => {
            canclePlatformAuth(item)
        })
        .catch(() => {
            ElMessage.info('操作已取消');
        });
};

// 删除账号
const handleDelete = (item, index) => {
    ElMessageBox.confirm(
        '确定要执行删除账号操作吗？',
        '温馨提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            closeOnClickModal: false,
        }
    )
        .then(() => {
            delPlatformAccount(item)
        })
        .catch(() => {
            ElMessage.info('操作已取消');
        });
};

const canclePlatformAuth = (item) => {
    let param = {
        "uid": item.uid
    }
    request.post('/pub/cancleAuth', param).then(res => {
        console.log("解除授权", res)
        if (res.result == "success") {
            ElMessage.success('解除授权成功');
            if (activeAccountUid.value == item.uid) {
                selectedUrl.value = ''
                activeAccountUid.value = ''
                currentWebviewMode.value = ''
            }
            getUserAuthStatus()
        }
    })
        .catch(err => {
            console.error('解除授权失败', err);
        });
}

const delPlatformAccount = (item) => {
    let param = {
        "uid": item.uid
    }
    request.post('/pub/delPlatformAccount', param).then(res => {
        console.log("删除账号", res)
        if (res.result == "success") {
            ElMessage.success('删除账号成功');
            if (activeAccountUid.value == item.uid) {
                selectedUrl.value = ''
                activeAccountUid.value = ''
                currentWebviewMode.value = ''
            }
            setTimeout(() => {
                getUserAuthStatus()
            }, 1000);
        }
    })
        .catch(err => {
            console.error('删除账号失败', err);
        });
}

const getUserAuthStatus = () => {
    let platformName = platformList.value[platformIndex.value].name
    let param = {
        "platform": platformName,
        "account": defaultMobile.value
    }
    request.post('/pub/getAuthStatus', param).then(res => {
        console.log(res)
        if (res.result == "success") {
            dataList.value = res.data
        }
    })
        .catch(err => {
            ElMessage.error(`${platformName}获取授权列表失败，error:${err}`);
        });
}

// 初始化
onMounted(() => {
    defaultMobile.value = useStore.loginInfo.account
    getUserAuthStatus()
});

onUnmounted(() => {
    if (douyinAuthTaskId.value && !douyinAuthFinished.value) {
        cancelDouyinAuth(true)
    } else {
        stopDouyinAuthPolling()
    }
    if (checkIntervalId.value) clearInterval(checkIntervalId.value)
});
const platformList = ref([
    {
        name: "百家号",
        url: "https://baijiahao.baidu.com",
        afterLoginUrl: "https://baijiahao.baidu.com/builder/rc/edit?type=news&is_from_cms=1",
        status: "0",
        userName: "",
        color: "#165DFF",
        domain: "baidu.com",
        cookieKeyword: 'bjhStoken',
        isIntervalCheck: true
    },
    {
        name: "搜狐号",
        url: "https://mp.sohu.com",
        afterLoginUrl:"https://mp.sohu.com/mpfe/v4/contentManagement/first/page",
        status: "0",
        userName: "",
        color: "#F7BA1E",
        domain: "sohu.com",
        cookieKeyword: 'mp-cv',
        isIntervalCheck: true
    },
    {
        name: "网易号",
        url: "https://mp.163.com",
        status: "0",
        userName: "",
        color: "#FF2D55",
        domain: ".163.com",
        cookieKeyword: 'NTES_YD_SESS,THE_LAST_LOGIN',
        isIntervalCheck: false
    },
    {
        name: "头条号",
        url: "https://mp.toutiao.com",
        status: "0",
        userName: "",
        color: "#FF2D20",
        domain: ".toutiao.com",
        cookieKeyword: 'toutiao_sso_user',
        isIntervalCheck: false
    },
    {
        name: "什么值得买",
        url: "https://www.smzdm.com",
        status: "0",
        userName: "",
        color: "#1677FF",
        domain: "smzdm.com",
        cookieKeyword: 'sess',
        isIntervalCheck: false
    },
    // {
    //     name: "蓝色河畔",
    //     url: "https://www.hepan.com/",
    //     status: "0",
    //     userName: "",
    //     color: "#1677FF",
    //     domain: "hepan.com",
    //     cookieKeyword: 'hepan_de71_auth',
    //     isIntervalCheck: true
    // },
    {
        name: "抖音",
        url: "https://creator.douyin.com/creator-micro/content/upload?enter_from=dou_web",
        afterLoginUrl: "https://creator.douyin.com/creator-micro/home",
        status: "0",
        userName: "",
        color: "#161823",
        domain: "douyin.com",
        cookieKeyword: 'sessionid,sid_guard,uid_tt',
        isIntervalCheck: true
    }
]);
</script>

<style scoped>
/* 基础样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.app-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.platform-container {
    width: 100vw;
    min-height: 54px;
    align-items: center;
    display: flex;
    justify-content: space-between;
    background-color: white;
    padding: 0 14px;
    border-bottom: 1px solid #edf0f5;
    box-shadow: 0 2px 10px rgba(32, 57, 92, 0.05);
}

.platform-tabs,
.user-actions {
    display: flex;
    align-items: center;
}

.platform-tabs {
    height: 54px;
    gap: 4px;
}

.user-actions {
    gap: 10px;
}

.current-account {
    max-width: 150px;
    overflow: hidden;
    color: #667085;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.platform-normal {
    height: 54px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    color: #475467;
    font-size: 13px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.2s ease, border-color 0.2s ease;
}

.platform-checked {
    color: #165DFF;
    font-weight: 600;
    border-bottom-color: #165DFF;
}

.logout-button {
    border-radius: 7px;
}

/* 顶部导航 */
.app-header {
    height: 60px;
    background-color: #165DFF;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 10;
}

.app-header h1 {
    font-size: 18px;
    font-weight: 600;
}

/* 菜单按钮 */
.menu-toggle {
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
}

.menu-icon {
    display: block;
    width: 24px;
    height: 2px;
    background-color: white;
    position: relative;
}

.menu-icon::before,
.menu-icon::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background-color: white;
    left: 0;
}

.menu-icon::before {
    top: -8px;
}

.menu-icon::after {
    bottom: -8px;
}

/* 主内容区 */
.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* 左侧面板 */
.left-panel {
    width: 440px;
    background-color: white;
    border-right: 1px solid #eee;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
    z-index: 5;
}

.panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
}

.panel-header h2 {
    font-size: 16px;
    color: #333;
    margin-bottom: 4px;
}

.panel-header p {
    font-size: 12px;
    color: #666;
}

/* 账号列表 */
.account-list {
    overflow-y: auto;
    flex: 1;
}

.btn_add {
    width: 98%;
    background-color: #165DFF;
    margin: 5px;
}

.account-item {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background-color 0.2s;
}

.account-item:hover {
    background-color: #f9f9f9;
}

.account-item.active {
    background-color: #f0f7ff;
    border-left: 3px solid #165DFF;
}

/* 列表项信息 */
.item-info {
    display: flex;
    align-items: center;
}

.item-icon {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 12px;
}

.item-text {
    min-width: 0;
}

.item-name {
    font-size: 14px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-subtext {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
}

/* 操作按钮 */
.item-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s;
}

.btn-primary {
    background-color: #e8f3ff;
    color: #165DFF;
}

.btn-primary:hover {
    background-color: #dcefff;
}

.btn-warning {
    background-color: #fff7e6;
    color: #d46b08;
}

.btn-warning:hover {
    background-color: #fff1cc;
}

.btn-danger {
    background-color: #fff1f0;
    color: #f53f3f;
}

.btn-danger:hover {
    background-color: #ffe8e6;
}

.status-tag {
    font-size: 12px;
    color: #00b42a;
    background-color: #f6ffed;
    padding: 2px 8px;
    border-radius: 12px;
}

/* 右侧内容区 */
.right-content {
    flex: 1;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.web-viewer {
    width: 100%;
    height: 100%;
    border: none;
}

/* 加载状态 */
.loading-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e0e0e0;
    border-top-color: #165DFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* 空状态 */
.empty-state {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fafafa;
    color: #999;
}

/* 响应式适配 */
@media (max-width: 767px) {
    .menu-toggle {
        display: flex;
    }

    .left-panel {
        position: absolute;
        height: calc(100% - 60px);
        top: 60px;
        left: 0;
    }

    .panel-hidden {
        transform: translateX(-100%);
    }
}

/* 抖音授权面板 */
.douyin-flow-panel {
    padding: 18px 16px;
    border: 1px solid #e7ecf3;
    border-radius: 12px;
    background: linear-gradient(180deg, #fbfcff 0%, #f5f8fc 100%);
}
.douyin-flow-title { font-size: 14px; font-weight: 700; color: #172b4d; margin-bottom: 14px; }
.douyin-flow-step { display: flex; align-items: center; gap: 9px; color: #98a2b3; font-size: 12px; line-height: 32px; }
.douyin-flow-step.active { color: #165dff; font-weight: 600; }
.douyin-flow-step.done { color: #12b76a; }
.douyin-flow-number { display: inline-flex; flex: 0 0 auto; width: 20px; height: 20px; align-items: center; justify-content: center; border-radius: 50%; background: #e9eef7; color: #667085; font-size: 11px; }
.douyin-flow-step.active .douyin-flow-number { background: #e0eaff; color: #165dff; }
.douyin-flow-step.done .douyin-flow-number { background: #dcfae6; color: #12b76a; }
.douyin-flow-tip { margin: 16px 0 0; color: #98a2b3; font-size: 12px; line-height: 1.6; }
.douyin-auth-panel { width: min(960px, 94%); margin: 32px auto; padding: 24px; border: 1px solid #e4e7ec; border-radius: 16px; background: #fff; box-shadow: 0 12px 36px rgba(16, 24, 40, .08); }
.douyin-auth-body { display: grid; grid-template-columns: minmax(210px, 260px) minmax(0, 1fr); gap: 28px; align-items: start; }
.douyin-auth-workspace { min-width: 0; }
.douyin-auth-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 24px; }
.douyin-auth-header h2 { margin: 0 0 8px; color: #101828; font-size: 22px; }
.douyin-auth-header p { margin: 0; color: #667085; font-size: 13px; }
.douyin-auth-form, .douyin-sms-box { display: flex; flex-direction: column; gap: 16px; max-width: 440px; }
@media (max-width: 900px) {
    .douyin-auth-body { grid-template-columns: 1fr; }
    .douyin-flow-panel { order: 2; }
    .douyin-auth-workspace { order: 1; }
}
.douyin-auth-running { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.douyin-auth-help { color: #667085; font-size: 12px; line-height: 1.6; }
.douyin-scan-box { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.douyin-qr-wrapper { width: 280px; height: 280px; padding: 10px; border: 1px solid #e4e7ec; border-radius: 12px; background: #fff; }
.douyin-qr-image { width: 100%; height: 100%; object-fit: contain; display: block; }
.douyin-qr-placeholder { width: 280px; height: 280px; display: flex; align-items: center; justify-content: center; border: 1px dashed #b8c2d1; border-radius: 12px; color: #98a2b3; font-size: 13px; text-align: center; padding: 24px; }
.douyin-auth-error { margin-top: 18px; padding: 10px 12px; border-radius: 8px; color: #b42318; background: #fef3f2; font-size: 13px; }
.douyin-auth-success { margin-top: 18px; padding: 12px; border-radius: 8px; color: #027a48; background: #ecfdf3; font-size: 13px; line-height: 1.6; }
</style>
