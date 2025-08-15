declare class MinimalTestPlugin {
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

    onLoad(): Promise<void>
    onActivate(): Promise<void>
    onDeactivate(): Promise<void>
    onUnload(): Promise<void>

    getMetadata(): any
    _setAPI(api: any): void
}

export default MinimalTestPlugin
export { MinimalTestPlugin }

