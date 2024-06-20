import { App, Plugin, PluginManifest } from 'obsidian'
import { Keymap, Layout, Node, Setting, View } from './module'


export default class LovelyMindmap extends Plugin{
  canvas: any = null
  intervalTimer = new Map()
  node: Node
  keymap: Keymap
  view: View
  setting: Setting
  layout: Layout
  // todo: move to setting
  config: Record<keyof Setting, any>

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    this.node = new Node(this)
    this.keymap = new Keymap(this)
    this.view = new View(this)
    this.setting = new Setting(this)
    this.layout = new Layout(this)
  }

  createCanvasInstance() {
    const timer = setInterval(() => {
      // @ts-ignore
      this.canvas = app.workspace.getLeavesOfType('canvas').first()?.view?.canvas
      if (!!this.canvas) {
        clearInterval(this.intervalTimer.get('canvas'))
      }
    }, 100)

    if (!this.intervalTimer.get('canvas')) {
      this.intervalTimer.set('canvas', timer)
    }
  }

	onActiveLeafChange() {
		this.app.workspace.on('active-leaf-change', async (leaf) => {
			// @ts-ignore
			const extension = leaf?.view?.file?.extension
			if (extension === 'canvas') {
				this.onKeymap()
				return
			}
				this.onunload()
		})
	}

	/**
	 * A series of events for canvas initialization
	 *
	 * - When switching away from the canvas viewport, remove the keyboard shortcuts and canvas instance.
	 * - When switching back to the canvas viewport, re-register the keyboard shortcuts and canvas instance.
	 */
	onKeymap() {
		this.createCanvasInstance()
		this.keymap.registerAll()

		// fixed: blur node doesn't work
		// @see https://github.com/xincan1949/lovely-mindmap/issues/1#issue-1868166056
		this.addCommand({
			id: 'blurNode',
			name: 'Blur node',
			hotkeys: [
				{
					modifiers: ['Mod'],
					key: 'Escape',
				},
			],
			checkCallback: () => this.keymap.blurNode(),
		});
	}

  async onload() {
    await this.setting.loadSettings()
    this.addSettingTab(new Setting(this))
		this.onActiveLeafChange()
		this.onKeymap()
  }

  onunload() {
    this.keymap.unregisterAll()
    this.intervalTimer.forEach(clearInterval)
  }
}
