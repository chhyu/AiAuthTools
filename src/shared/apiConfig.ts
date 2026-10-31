/**
 * 全局接口地址配置 —— 主进程（src/main）与渲染进程（src/renderer）共用的唯一配置处。
 *
 * 约定：其它文件一律从这里导入 API_BASE_URL / apiUrl()，不要再自己写死 IP 或端口。
 *
 * ===========================================================================
 * 一、切换环境：只改下面 CURRENT_ENV 这一行
 * ===========================================================================
 *   'auto' → 跟随运行模式：`npm run dev` 用测试环境，`npm run build` / 打包后用正式环境
 *   'test' → 强制测试环境（API_BASE_URLS.test）
 *   'prod' → 强制正式环境（API_BASE_URLS.prod）
 *
 * 注意：CURRENT_ENV 的值和 `import.meta.env.DEV` 都在构建时被 Vite 静态内联进产物，
 * 所以改完必须重新执行 `npm run dev` 或重新打包才会生效，运行期不会二次判断。
 *
 * ===========================================================================
 * 二、临时覆盖地址：不改代码
 * ===========================================================================
 * 在项目根目录新建 .env.local（不入库），写入：
 *   VITE_API_BASE_URL=http://localhost:5555
 * 该变量优先级最高，会同时覆盖主进程和渲染进程使用的地址，
 * 适合“用一个正式包去连测试服”这类临时验证；用完记得删除该文件。
 *
 * ===========================================================================
 * 三、为什么以前总是不稳（不要改回去）
 * ===========================================================================
 * 这个文件反复出问题，是两层原因叠加：
 *   1) CURRENT_ENV 的类型曾被写成 `'prod' | ApiEnv`（等价于 `'test' | 'prod'`），
 *      类型上已经排除 'auto'，但 ACTIVE_ENV 里还留着 `CURRENT_ENV === 'auto'` 的分支；
 *   2) 更隐蔽的是 TypeScript 的控制流收窄：以字面量初始化的 const 会被当成字面量类型，
 *      即使写成 `const CURRENT_ENV: ApiEnvMode = 'prod'`，在模块顶层比较 'auto' 仍报错。
 * 两层都是同一个报错 TS2367，导致 `pnpm build:win` 在 typecheck 阶段中断。
 *
 * 现在的做法：类型上由 ApiEnvMode 合法包含 'auto'（三种取值可任意切换），
 * 运行上把比较收进 resolveEnv() 的形参里，绕开 const 收窄，从根上避免再次复发。
 */

/** 具体环境标识：与 API_BASE_URLS 的 key 一一对应 */
export type ApiEnv = 'test' | 'prod'

/** CURRENT_ENV 允许的取值：具体环境 + 'auto'（自动模式） */
export type ApiEnvMode = 'auto' | ApiEnv

/** 各环境的接口根地址：新增环境时先扩展 ApiEnv，再在这里补一条 */
export const API_BASE_URLS: Record<ApiEnv, string> = {
  /** 测试环境 */
  test: 'http://localhost:5555',
  /** 正式环境 */
  prod: 'http://124.222.45.42:24433'
}

/**
 * 当前使用的环境，日常只需要改这一行
 * - 'auto'：跟随运行模式自动判断（见文件头说明）
 * - 'test'：强制测试环境
 * - 'prod'：强制正式环境（当前取值）
 */
export const CURRENT_ENV: ApiEnvMode = 'prod'

/**
 * 把 CURRENT_ENV（可能为 'auto'）解析成具体环境。
 *
 * 必须写成函数：TypeScript 会把「字面量初始化的 const」按初始值收窄成字面量类型，
 * 即便写了 `const CURRENT_ENV: ApiEnvMode = 'prod'`，在模块顶层直接比较
 * `CURRENT_ENV === 'auto'` 仍会报 TS2367；而函数形参的联合类型不会被这样收窄。
 *
 * @param mode CURRENT_ENV 的取值
 * @param isDev 是否为开发模式（由 import.meta.env.DEV 在构建时内联）
 */
function resolveEnv(mode: ApiEnvMode, isDev: boolean): ApiEnv {
  if (mode === 'auto') return isDev ? 'test' : 'prod'
  return mode
}

/**
 * 实际生效的环境：'auto' 下依据 import.meta.env.DEV 判断——
 * 开发模式（electron-vite dev）为 test，构建产物（electron-vite build / 打包）为 prod；
 * 'test' / 'prod' 则原样透传。
 */
export const ACTIVE_ENV: ApiEnv = resolveEnv(CURRENT_ENV, import.meta.env.DEV)

/**
 * 最终生效的接口根地址：主进程、渲染进程共用。
 * 优先级：.env.local 中的 VITE_API_BASE_URL > API_BASE_URLS[ACTIVE_ENV]
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || API_BASE_URLS[ACTIVE_ENV]

/**
 * 拼接完整接口地址
 * @param path 以 / 开头的接口路径，例如 '/pub/appUpdate/check'
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

declare global {
  interface ImportMetaEnv {
    /** 本地覆盖接口地址，见文件顶部说明 */
    readonly VITE_API_BASE_URL?: string
  }
}
