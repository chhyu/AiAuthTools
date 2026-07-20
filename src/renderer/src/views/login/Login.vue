<template>
    <div class="login-page-container">
        <div class="left-panel">
            <div class="ambient ambient-one"></div>
            <div class="ambient ambient-two"></div>
            <div class="brand-content">
                <div class="brand-badge">
                    <span class="brand-mark">AI</span>
                    <span>Authorization Tool</span>
                </div>
                <div class="hero-copy">
                    <p class="eyebrow">MULTI-PLATFORM CONTENT</p>
                    <h2>一次授权，<br />高效管理多个内容平台</h2>
                    <p>聚合平台账号授权与内容发布能力，让日常运营更简单、更稳定。</p>
                </div>
                <div class="feature-list">
                    <div><span>✓</span>统一账号授权管理</div>
                    <div><span>✓</span>客户端自动安全更新</div>
                    <div><span>✓</span>多平台内容发布</div>
                </div>
            </div>
        </div>

        <div class="right-panel">
            <div class="login-content-container">
                <div class="login-heading">
                    <p class="welcome-label">WELCOME BACK</p>
                    <h1>欢迎登录</h1>
                    <p>登录多平台发布授权工具</p>
                </div>

                <div class="version-bar">
                    <div class="version-info">
                        <span class="status-dot" :class="{ checking: updateStatus === 'checking' }"></span>
                        <span>当前版本 <strong>v{{ currentVersion || '--' }}</strong></span>
                    </div>
                    <el-button link type="primary" :loading="updateStatus === 'checking'" @click="checkUpdate">
                        检查更新
                    </el-button>
                </div>

                <el-alert v-if="updateStatus === 'error'" class="update-alert" type="error" :closable="false"
                    title="更新检查失败，完成检查前暂不能登录" />

                <el-form ref="ruleFormRef" :model="ruleForm" status-icon label-position="top" class="login-form">
                    <el-form-item label="用户名" prop="account">
                        <el-input v-model="ruleForm.account" size="large" autocomplete="off"
                            placeholder="请输入用户名" clearable />
                    </el-form-item>
                    <el-form-item label="密码" prop="pass">
                        <el-input v-model="ruleForm.password" size="large" type="password" autocomplete="off"
                            placeholder="请输入密码" show-password clearable />
                    </el-form-item>

                    <el-form-item class="submit-item">
                        <el-button class="login-button" type="primary" size="large"
                            :loading="updateStatus === 'checking'" :disabled="updateStatus !== 'ready'"
                            @click="submitForm(ruleFormRef)">登录</el-button>
                    </el-form-item>
                </el-form>

                <div class="login-footer">
                    <span class="shield-icon">✓</span>
                    授权信息加密传输，请放心使用
                </div>
            </div>
        </div>

        <el-dialog v-model="updateDialogVisible" width="480px" :show-close="false"
            :close-on-click-modal="false" :close-on-press-escape="false" :append-to-body="true"
            class="force-update-dialog">
            <template #header>
                <div class="dialog-title">{{ updateStatus === 'error' ? '无法检查更新' : '发现新版本' }}</div>
            </template>

            <template v-if="updateStatus === 'error'">
                <p class="error-text">{{ updateError }}</p>
                <p class="dialog-hint">为确保客户端版本可用，请连接更新服务后重试。</p>
            </template>
            <template v-else>
                <div class="version-change">
                    <span>v{{ currentVersion }}</span>
                    <span class="version-arrow">→</span>
                    <strong>v{{ updateInfo.latestVersion }}</strong>
                </div>
                <div v-if="updateInfo.releaseNotes" class="release-notes">{{ updateInfo.releaseNotes }}</div>
                <p v-if="updateInfo.fileSize" class="package-size">安装包大小：{{ formatBytes(updateInfo.fileSize) }}</p>

                <div v-if="updateStatus === 'downloading' || updateStatus === 'installing'" class="download-progress">
                    <div class="progress-label">
                        <span>{{ updateStatus === 'installing' ? '正在启动安装程序…' : '正在下载安装包…' }}</span>
                        <span v-if="updateStatus === 'downloading'">{{ downloadProgress.percent }}%</span>
                    </div>
                    <el-progress :percentage="downloadProgress.percent" :stroke-width="10" :show-text="false"
                        :status="updateStatus === 'installing' ? 'success' : undefined" />
                </div>
                <el-alert v-if="downloadError" class="download-error" type="error" :closable="false"
                    :title="downloadError" />
                <p class="dialog-hint">此版本为强制更新，安装新版本后才能继续使用。</p>
            </template>

            <template #footer>
                <el-button v-if="updateStatus === 'error'" type="primary" :loading="checkingFromDialog"
                    @click="checkUpdate(true)">重新检查</el-button>
                <el-button v-else type="primary" :loading="updateStatus === 'downloading'"
                    :disabled="updateStatus === 'installing'" @click="startDownload">
                    {{ downloadError ? '重新下载' : '下载并安装' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import request from '@utils/request.ts'
import router from '@renderer/router'
import CryptoJS from 'crypto-js';
import { useLoginStore } from '../../store/login'
const useStore = useLoginStore()

const ruleFormRef = ref()
const currentVersion = ref('')
const updateStatus = ref('checking')
const updateDialogVisible = ref(false)
const updateError = ref('')
const downloadError = ref('')
const checkingFromDialog = ref(false)
const updateInfo = reactive({
    latestVersion: '',
    releaseNotes: '',
    fileSize: 0
})
const downloadProgress = reactive({ percent: 0, transferred: 0, total: 0 })
let removeProgressListener
let removeStatusListener


const ruleForm = reactive({
    account: '17625328141',
    password: '123456'
})

const checkUpdate = async (fromDialog = false) => {
    updateStatus.value = 'checking'
    updateError.value = ''
    if (fromDialog) checkingFromDialog.value = true
    try {
        const result = await window.electronAPI.checkForUpdates()
        if (result.updateAvailable) {
            Object.assign(updateInfo, {
                latestVersion: result.latestVersion || '',
                releaseNotes: result.releaseNotes || '',
                fileSize: result.fileSize || 0
            })
            updateStatus.value = 'available'
            updateDialogVisible.value = true
        } else {
            updateStatus.value = 'ready'
            updateDialogVisible.value = false
            if (fromDialog) ElMessage.success('当前已是最新版本')
        }
    } catch (error) {
        updateStatus.value = 'error'
        updateError.value = error?.message || '无法连接更新服务'
        updateDialogVisible.value = true
    } finally {
        checkingFromDialog.value = false
    }
}

const startDownload = async () => {
    updateStatus.value = 'downloading'
    downloadError.value = ''
    downloadProgress.percent = 0
    try {
        await window.electronAPI.downloadUpdate()
    } catch (error) {
        updateStatus.value = 'available'
        downloadError.value = error?.message || '下载更新失败，请重试'
    }
}

const formatBytes = (bytes) => {
    if (!bytes) return '未知'
    const units = ['B', 'KB', 'MB', 'GB']
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

onMounted(async () => {
    currentVersion.value = await window.electronAPI.getAppVersion()
    removeProgressListener = window.electronAPI.onUpdateProgress((progress) => {
        Object.assign(downloadProgress, progress)
    })
    removeStatusListener = window.electronAPI.onUpdateStatus(({ status }) => {
        if (status === 'installing') {
            updateStatus.value = 'installing'
            downloadProgress.percent = 100
        }
    })
    await checkUpdate()
})

onBeforeUnmount(() => {
    removeProgressListener?.()
    removeStatusListener?.()
})

const submitForm = async () => {
    console.log(ruleForm.account, ruleForm.password)
    if (!ruleForm.account || !ruleForm.password) {
        ElMessage.error('用户名密码不能为空');
        return
    }
    useStore.setLoginInfo({
        account: ruleForm.account,
        password: ruleForm.password
    })
    const encrypted = CryptoJS.MD5(ruleForm.password).toString();
    console.log("加密结果：", encrypted)
    let param = {
        "account": ruleForm.account,
        "password": encrypted
    }
    request.post('/pub/doLogin', param).then(res => {
        console.log('登录结果', res);
        if (res.result == 'success' && res.data.code == 0) {
            ElMessage.success("登录成功");
            setTimeout(() => {
                router.push({
                    name: 'Main'
                })
            }, 1000)
        } else {
            ElMessage.error(res.error);
        }
    })
        .catch(err => {
            console.error('登录失败', err);
        });


}


</script>

<style scoped>
.login-page-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    overflow: hidden;
    color: #172033;
    background: #f5f7fb;
}

.left-panel {
    position: relative;
    width: 44%;
    height: 100%;
    display: flex;
    align-items: center;
    overflow: hidden;
    color: #fff;
    background: linear-gradient(145deg, #142b58 0%, #2458bd 55%, #3378e8 100%);
}

.right-panel {
    width: 56%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 38px 56px;
    box-sizing: border-box;
    background:
        radial-gradient(circle at 95% 5%, rgba(68, 125, 232, 0.09), transparent 28%),
        #f7f9fc;
}

.login-content-container {
    width: 100%;
    max-width: 390px;
    display: flex;
    flex-direction: column;
}

.brand-content {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: 58px 52px;
    box-sizing: border-box;
}

.brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.6px;
}

.brand-mark {
    display: inline-flex;
    width: 38px;
    height: 38px;
    align-items: center;
    justify-content: center;
    color: #2458bd;
    font-size: 14px;
    letter-spacing: 0;
    background: #fff;
    border-radius: 11px;
    box-shadow: 0 8px 25px rgba(3, 19, 52, 0.25);
}

.hero-copy {
    margin-top: 86px;
}

.eyebrow,
.welcome-label {
    margin: 0 0 13px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
}

.eyebrow {
    color: rgba(255, 255, 255, 0.62);
}

.hero-copy h2 {
    margin: 0;
    font-size: 30px;
    line-height: 1.42;
    letter-spacing: -0.6px;
}

.hero-copy > p:last-child {
    max-width: 310px;
    margin: 21px 0 0;
    color: rgba(255, 255, 255, 0.72);
    font-size: 14px;
    line-height: 1.8;
}

.feature-list {
    display: grid;
    gap: 13px;
    margin-top: 46px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 13px;
}

.feature-list span {
    display: inline-flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
    margin-right: 9px;
    color: #fff;
    font-size: 11px;
    background: rgba(255, 255, 255, 0.17);
    border-radius: 50%;
}

.ambient {
    position: absolute;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 50%;
}

.ambient-one {
    width: 330px;
    height: 330px;
    right: -180px;
    top: -100px;
    box-shadow: 0 0 0 58px rgba(255, 255, 255, 0.025);
}

.ambient-two {
    width: 240px;
    height: 240px;
    left: -150px;
    bottom: -90px;
    box-shadow: 0 0 0 45px rgba(255, 255, 255, 0.025);
}

.login-heading {
    margin-bottom: 25px;
}

.welcome-label {
    color: #3972da;
}

.login-heading h1 {
    margin: 0;
    color: #172033;
    font-size: 30px;
    letter-spacing: -0.5px;
}

.login-heading > p:last-child {
    margin: 9px 0 0;
    color: #8a94a6;
    font-size: 14px;
}

.version-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 46px;
    padding: 6px 14px;
    box-sizing: border-box;
    color: #667085;
    font-size: 13px;
    background: #eef4ff;
    border: 1px solid #dce8ff;
    border-radius: 10px;
}

.version-info {
    display: flex;
    align-items: center;
    gap: 9px;
}

.version-info strong {
    color: #344054;
}

.status-dot {
    width: 8px;
    height: 8px;
    background: #27ae60;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(39, 174, 96, 0.12);
}

.status-dot.checking {
    background: #3972da;
    box-shadow: 0 0 0 4px rgba(57, 114, 218, 0.12);
}

.update-alert {
    margin-top: 12px;
}

.login-form {
    width: 100%;
    margin-top: 24px;
}

.login-form :deep(.el-form-item) {
    width: 100%;
    margin-bottom: 19px;
}

.login-form :deep(.el-form-item__label) {
    height: auto;
    margin-bottom: 8px;
    color: #344054;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
}

.login-form :deep(.el-form-item__content),
.login-form :deep(.el-input) {
    width: 100%;
}

.login-form :deep(.el-input__wrapper) {
    min-height: 46px;
    padding: 1px 14px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 0 0 1px #d9e0ea inset;
    transition: box-shadow 0.2s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px #aebbd0 inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #3972da inset, 0 0 0 3px rgba(57, 114, 218, 0.1);
}

.login-form :deep(.submit-item) {
    margin-top: 9px;
    margin-bottom: 0;
}

.login-button {
    width: 100%;
    min-height: 47px;
    font-weight: 600;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #2f67ce, #3979e8);
    border: none;
    border-radius: 10px;
    box-shadow: 0 10px 22px rgba(47, 103, 206, 0.22);
}

.login-button:hover {
    background: linear-gradient(90deg, #285fc4, #3271dc);
}

.login-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    margin-top: 24px;
    color: #98a2b3;
    font-size: 12px;
}

.shield-icon {
    display: inline-flex;
    width: 17px;
    height: 17px;
    align-items: center;
    justify-content: center;
    color: #3972da;
    font-size: 10px;
    background: #e9f1ff;
    border-radius: 50%;
}

.dialog-title {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}

.version-change {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 18px;
    font-size: 18px;
    color: #606266;
    background: #f5f7fa;
    border-radius: 10px;
}

.version-change strong {
    color: #409eff;
}

.version-arrow {
    color: #909399;
}

.release-notes {
    max-height: 140px;
    margin-top: 18px;
    padding: 12px 14px;
    overflow-y: auto;
    line-height: 1.7;
    white-space: pre-wrap;
    color: #303133;
    border-left: 3px solid #409eff;
    background: #f8faff;
}

.package-size,
.dialog-hint,
.error-text {
    color: #606266;
    line-height: 1.6;
}

.dialog-hint {
    margin-bottom: 0;
    font-size: 13px;
    color: #909399;
}

.download-progress {
    margin-top: 20px;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
    color: #606266;
}

.download-error {
    margin-top: 16px;
}

:global(.force-update-dialog) {
    overflow: hidden;
    border-radius: 14px;
    box-shadow: 0 22px 65px rgba(21, 42, 84, 0.22);
}

@media (max-width: 760px) {
    .left-panel {
        display: none;
    }

    .right-panel {
        width: 100%;
        padding: 32px;
    }
}
</style>
