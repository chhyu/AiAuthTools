import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, bytecodePlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  main: {
    
    plugins: [externalizeDepsPlugin(), bytecodePlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@store': resolve('src/renderer/src/store'),
        '@utils': resolve('src/renderer/src/utils'),
        '@api': resolve('src/renderer/src/api'),
        '@views': resolve('src/renderer/src/views'),
      }
    },
    plugins: [
      vue({
      template: {
        compilerOptions: {
          // 将 webview 标记为自定义元素
          isCustomElement: (tag) => tag === 'webview'
        }
      }
    }),
      AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    // 自动导入Element Plus组件
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    ]
  }
})
