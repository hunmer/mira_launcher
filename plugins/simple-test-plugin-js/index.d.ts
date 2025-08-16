declare class SimpleTestPlugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  dependencies: any[]
  minAppVersion: string
  permissions: string[]

  constructor()

  get metadata(): any
  get state(): any

  initialize(api: any): void
  log(level: string, message: string, ...args: any[]): void
  sendNotification(type: string, options: any): void

  onLoad(): Promise<void>
  onActivate(): Promise<void>
  onDeactivate(): Promise<void>
  onUnload(): Promise<void>

  getMetadata(): any
}

export default SimpleTestPlugin
export { SimpleTestPlugin }
