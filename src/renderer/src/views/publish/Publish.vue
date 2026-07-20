<template>
    <div class="container">
        <webview style="width: 100%;height: 100%;" ref="webviewRef" :src="selectedUrl" class="web-viewer"
            partition="persist:github" @did-finish-load="handleLoadComplete" @dom-ready="onWebviewReady"
            :useragent="customUserAgent" @did-fail-load="handleLoadError">
        </webview>
    </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
const { electronAPI } = window
const selectedUrl = ref("https://mp.toutiao.com/")
const customUserAgent = ref("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36");

const webviewRef = ref(null)
const handleLoadComplete = async (e) => {
    console.log("handleLoadComplete")

}
const onWebviewReady = () => { }
const handleLoadError = (e) => { }

const loadTargetUrl = ()=>{
    const webContentsId = webviewRef.value.getWebContentsId();
        const safeCookies = JSON.parse(JSON.stringify(cookieList.value || []));
        window.electronAPI.setWebviewCookies(webContentsId, safeCookies).then(res => {
            console.log("setWebviewCookies", res)
            if (webviewRef.value) {
                const wv = webviewRef.value;
                if (wv && typeof wv.reload === 'function') wv.reload();
            }
        })
}

onMounted(()=>{
    setTimeout(() => {
        loadTargetUrl()
    }, 10000);
})

const cookieList = ref([
    {
        "name": "gd_random",
        "value": "eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC41ODcyNDc4ODEwMDU5NTI5fQ==.hmFvbCzkCCx6QX82IMLCW4isjj1tha1AIW/S3oFQUV4=",
        "domain": "mp.toutiao.com",
        "hostOnly": true,
        "path": "/profile_v4/mp-sw.js",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1762743077.347858",
        "sameSite": "unspecified"
    },
    {
        "name": "gd_random",
        "value": "eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC41ODcyNDc4ODEwMDU5NTI5fQ==.hmFvbCzkCCx6QX82IMLCW4isjj1tha1AIW/S3oFQUV4=",
        "domain": "mp.toutiao.com",
        "hostOnly": true,
        "path": "/profile_v4",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1762743099.240807",
        "sameSite": "unspecified"
    },
    {
        "name": "x-jupiter-uuid",
        "value": "17621382718386880",
        "domain": "mp.toutiao.com",
        "hostOnly": true,
        "path": "/auth/page",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1762743076.204196",
        "sameSite": "unspecified"
    },
    {
        "name": "gfkadpd",
        "value": "1231,25897",
        "domain": "mp.toutiao.com",
        "hostOnly": true,
        "path": "/",
        "secure": true,
        "httpOnly": false,
        "session": false,
        "expirationDate": 1762397474,
        "sameSite": "no_restriction"
    },
    {
        "name": "csrf_session_id",
        "value": "71c9ca54ff4bdd43488a694f84bdf62b",
        "domain": "mp.toutiao.com",
        "hostOnly": true,
        "path": "/",
        "secure": true,
        "httpOnly": false,
        "session": true,
        "sameSite": "no_restriction"
    },
    {
        "name": "passport_csrf_token",
        "value": "eafbe552ae97b8a760fad02e4719dbc0",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": false,
        "session": false,
        "expirationDate": "1767322276.001952",
        "sameSite": "no_restriction"
    },
    {
        "name": "passport_csrf_token_default",
        "value": "eafbe552ae97b8a760fad02e4719dbc0",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": false,
        "session": false,
        "expirationDate": "1767322276.002032",
        "sameSite": "unspecified"
    },
    {
        "name": "s_v_web_id",
        "value": "verify_mhoojcok_rlzKqe4Y_h7EN_4pAr_Azv5_UqE8XjNpLrQL",
        "domain": "mp.toutiao.com",
        "hostOnly": true,
        "path": "/",
        "secure": false,
        "httpOnly": false,
        "session": false,
        "expirationDate": 1767322276,
        "sameSite": "unspecified"
    },
    {
        "name": "ttwid",
        "value": "1%7COxa7Wx6-_UVptAbV2zjTS_mpJLrmamspSu4KVT_Yhd0%7C1762509324%7Cc4c25447c20f15dc9b426e458f7dc3e9884b00ae61d682799352827579e5ecc9",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1793674276.991645",
        "sameSite": "no_restriction"
    },
    {
        "name": "passport_mfa_token",
        "value": "CjX7T7QBNhudeTYUwo0ZZS6z21ZffXrsCLHVcPZKajUc4Mit%2Bkhp4P4eUxFeT7mAMQMn01pifhpKCjwAAAAAAAAAAAAAT6savj8f1DrfqQ%2BaHvkPn0h1Or5AyPBijEHsNaf7VNsLCyUfok6zYx2l6hlfUhV48yMQ7MOADhj2sdFsIAIiAQPotZhX",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322298.315039",
        "sameSite": "unspecified"
    },
    {
        "name": "d_ticket",
        "value": "5e2cd70766be89ce886e2cc003ef84bffa7f7",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1793674298.315093",
        "sameSite": "unspecified"
    },
    {
        "name": "n_mh",
        "value": "_YYFAsdKF-atR-PKycJJCSJnkHK4DjqJLX3B91ypCU4",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1772506298.315114",
        "sameSite": "unspecified"
    },
    {
        "name": "sso_auth_status",
        "value": "2d51e328fd64afed19f42b1befe22d48",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1764730298.315141",
        "sameSite": "unspecified"
    },
    {
        "name": "sso_auth_status_ss",
        "value": "2d51e328fd64afed19f42b1befe22d48",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1764730298.315149",
        "sameSite": "no_restriction"
    },
    {
        "name": "sso_uid_tt",
        "value": "63617cc03b1ce40ef59621b3c2b8b8b9",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322298.315158",
        "sameSite": "unspecified"
    },
    {
        "name": "sso_uid_tt_ss",
        "value": "63617cc03b1ce40ef59621b3c2b8b8b9",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322298.315167",
        "sameSite": "no_restriction"
    },
    {
        "name": "toutiao_sso_user",
        "value": "9a4b7d7ba749bf1763faca7d241c140e",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322298.315176",
        "sameSite": "unspecified"
    },
    {
        "name": "toutiao_sso_user_ss",
        "value": "9a4b7d7ba749bf1763faca7d241c140e",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322298.315184",
        "sameSite": "no_restriction"
    },
    {
        "name": "sid_ucp_sso_v1",
        "value": "1.0.0-KDU1ZDcwZWVjYTYwOGE3YWJiNTNhZGQ0NDhiYTY5MDVjMDAwYTQyYzcKHQimyqXImAMQtbGgyAYYzwkgDDDntbHhBTgCQPEHGgJobCIgOWE0YjdkN2JhNzQ5YmYxNzYzZmFjYTdkMjQxYzE0MGU",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322298.315192",
        "sameSite": "unspecified"
    },
    {
        "name": "ssid_ucp_sso_v1",
        "value": "1.0.0-KDU1ZDcwZWVjYTYwOGE3YWJiNTNhZGQ0NDhiYTY5MDVjMDAwYTQyYzcKHQimyqXImAMQtbGgyAYYzwkgDDDntbHhBTgCQPEHGgJobCIgOWE0YjdkN2JhNzQ5YmYxNzYzZmFjYTdkMjQxYzE0MGU",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322298.315202",
        "sameSite": "no_restriction"
    },
    {
        "name": "odin_tt",
        "value": "32885d85a00e6b064ecc6bfe0f9ec9224db7f0ffdd9112c0c3bb54850f4e097c3f5bc9ceea60e16bf839774c17a39de2",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1793674298.684267",
        "sameSite": "unspecified"
    },
    {
        "name": "passport_auth_status",
        "value": "3a7d2ee4542307060228bf9a539796f7%2Ccce6a56e2e780eeea1824d4fa205c83b",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1764730298.684343",
        "sameSite": "unspecified"
    },
    {
        "name": "passport_auth_status_ss",
        "value": "3a7d2ee4542307060228bf9a539796f7%2Ccce6a56e2e780eeea1824d4fa205c83b",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1764730298.684362",
        "sameSite": "no_restriction"
    },
    {
        "name": "sid_guard",
        "value": "36fcf5ebf7d12c0d71c454f31a04c8cb%7C1762138294%7C5184001%7CFri%2C+02-Jan-2026+02%3A51%3A35+GMT",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1793242298.684382",
        "sameSite": "unspecified"
    },
    {
        "name": "uid_tt",
        "value": "e32ab09d41ac2d436267adc423f3382d",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684394",
        "sameSite": "unspecified"
    },
    {
        "name": "uid_tt_ss",
        "value": "e32ab09d41ac2d436267adc423f3382d",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684405",
        "sameSite": "no_restriction"
    },
    {
        "name": "sid_tt",
        "value": "36fcf5ebf7d12c0d71c454f31a04c8cb",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684414",
        "sameSite": "unspecified"
    },
    {
        "name": "sessionid",
        "value": "36fcf5ebf7d12c0d71c454f31a04c8cb",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684424",
        "sameSite": "unspecified"
    },
    {
        "name": "sessionid_ss",
        "value": "36fcf5ebf7d12c0d71c454f31a04c8cb",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684433",
        "sameSite": "no_restriction"
    },
    {
        "name": "session_tlb_tag",
        "value": "sttt%7C16%7CNvz16_fRLA1xxFTzGgTIy_________-sNTLZs0W_H6t3A4pLERdUM9WZxDZ_rxSKMf4B2bTlViA%3D",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684443",
        "sameSite": "no_restriction"
    },
    {
        "name": "is_staff_user",
        "value": "false",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": false,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684453",
        "sameSite": "unspecified"
    },
    {
        "name": "sid_ucp_v1",
        "value": "1.0.0-KGFjOGZlYzlmMDYzZWZkOTI0YTI4YzY2NjBlMWUyMjBiNjZiNDU0MTQKFwimyqXImAMQtrGgyAYYzwkgDDgCQPEHGgJsZiIgMzZmY2Y1ZWJmN2QxMmMwZDcxYzQ1NGYzMWEwNGM4Y2I",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684463",
        "sameSite": "unspecified"
    },
    {
        "name": "ssid_ucp_v1",
        "value": "1.0.0-KGFjOGZlYzlmMDYzZWZkOTI0YTI4YzY2NjBlMWUyMjBiNjZiNDU0MTQKFwimyqXImAMQtrGgyAYYzwkgDDgCQPEHGgJsZiIgMzZmY2Y1ZWJmN2QxMmMwZDcxYzQ1NGYzMWEwNGM4Y2I",
        "domain": ".toutiao.com",
        "hostOnly": false,
        "path": "/",
        "secure": true,
        "httpOnly": true,
        "session": false,
        "expirationDate": "1767322299.684473",
        "sameSite": "no_restriction"
    }
])

</script>
<style scoped>
/* 基础样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.container {
    width: 100vw;
    height: 100vh;
}
</style>