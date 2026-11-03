/**
 * 最小 Cordis Context 与 DSH 服务声明（上游 vendored 类型子集）。
 *
 * 仅覆盖本插件使用的接口，用于自包含的类型检查与声明输出。
 * 本地兼容版另用实际 DSH 0.1.7-rc.2 和 0.2.0-rc.2 SDK 验证运行行为。
 * type-only import 在构建时被擦除；本文件不代表完整 SDK 类型声明。
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

/** dsh-host-webserver 的 webServer 服务（仅声明本插件用到的面）。 */
export interface WebServer {
  readonly port: number
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/** ui-slots 槽位注册选项（本插件用到的子集）。 */
export interface SlotRegisterOptions {
  name: string
  id?: string
  order?: number
  priority?: number
  registrant?: string
  locale?: string
}

/** ui-slots 的 SlotRegistry 服务（register 返回卸载函数）。 */
export interface SlotRegistry {
  register(options: SlotRegisterOptions, component: unknown): () => void
  /** 等待某个槽位声明出现后注册（声明生命周期内生效，随调用方 fiber 卸载）。 */
  inject(key: string, callback: () => (() => void) | void): () => void
}

/** dsh-client-locale 的 locale 服务（本插件用到的面：订阅活动语言）。 */
export interface LocaleService {
  /** 当前语言快照（active = 'zh' | 'en'；语言切换或字典注册都会通知订阅者）。 */
  getLocale(): { active: string; locales: readonly { id: string }[]; revision: number }
  /** 订阅快照变化（监听器无参调用，自行重读 getLocale；返回退订函数）。 */
  subscribe(listener: () => void): () => void
}

/** 会话日志事件的最小形状（assistant/chunk 与 assistant/message 携带 turn/step/usage）。 */
export interface SessionEventLike {
  type: string
  seq: number
  /** Unix epoch 毫秒。 */
  time: number
  data: {
    turn?: number
    step?: number
    usage?: unknown
    chunk?: { type?: string; usage?: unknown }
  }
}

/** dsh-session 的 SessionStore 服务（仅声明本插件用到的面）。 */
export interface SessionHandle {
  id: string
  /** 旧版 dsh-session（< 0.1.2-rc.1）的公开事件数组；新版已移除，改为 snapshotEvents()。 */
  events?: readonly SessionEventLike[]
  /** 新版 dsh-session（>= 0.1.2-rc.1）的公开事件快照方法。 */
  snapshotEvents?: () => readonly SessionEventLike[]
}
export interface SessionStoreService {
  /** 按 id 查实时会话；不存在返回 undefined。 */
  get(id: string): SessionHandle | undefined
  /** 所有实时会话（创建顺序）。 */
  list(): SessionHandle[]
}

/** dsh-credentials 的凭据服务（本插件用到的面：按引用解析密钥值）。 */
export interface CredentialsService {
  /** 解析一个凭据引用（如 'DEEPSEEK_API_KEY'）为当前值；未配置返回 undefined。 */
  resolve(ref: string): Promise<{ value: string; source?: string } | undefined>
}

/** cordis Context（本插件用到的面：effect + get + webServer + slots + sessions + locale）。 */
export interface Context {
  /** 注册一个资源释放器，插件卸载时执行。 */
  effect(disposer: () => (() => void) | void, label?: string): void
  /** 读取服务（反射层）：不要求 inject 声明；服务不存在返回 undefined。 */
  get(name: string, strict?: boolean): unknown
  webServer: WebServer
  slots: SlotRegistry
  sessions: SessionStoreService
  locale: LocaleService
  /** 可选服务（如 credentials）一律经 ctx.get 读取——未 inject 的服务属性访问会抛错。 */
  [key: string]: unknown
}
