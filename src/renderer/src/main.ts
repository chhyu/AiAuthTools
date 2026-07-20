import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
const pinia = createPinia()
import 'element-plus/dist/index.css'
createApp(App).use(router).use(ElementPlus).use(pinia).mount('#app')
