import { createRouter, createWebHashHistory } from "vue-router";

import Login from '@views/login/Login.vue'
import Main from '@views/main/Main.vue'
import Publish from "@views/publish/publish.vue";

export default createRouter({
    history: createWebHashHistory(),//hash模式
    routes: [
        { path: "/", name: "Login", component: Login },
        { path: "/", name: "Main", component: Main },
        { path: "/", name: "Publish", component: Publish },
    ]
})