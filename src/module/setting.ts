import { Notice, Setting as ObsidianSetting, PluginSettingTab } from 'obsidian';
import LovelyMindmap from '../main';
import { convertHotkey2Array } from '../tool';

interface PluginSettings {
  autoFocus: boolean;
  hotkeys: {
    Focus: string
    CreateChild: string
    CreateBeforeSib: string
    CreateAfterSib: string
    ArrowUp: string
    ArrowDown: string
    ArrowLeft: string
    ArrowRight: string
  },
  ROW_GAP: number
  COLUMN_GAP: number
  EPSILON: number
  OFFSET_WEIGHT: number
  MACRO_TASK_DELAY: number
}

const DEFAULT_SETTINGS: PluginSettings = {
  autoFocus: false,
  hotkeys: {
    CreateChild: 'Tab',
    CreateBeforeSib: 'Shift + Enter',
    CreateAfterSib: 'Enter',
    Focus: 'F',
    ArrowUp: 'Alt + ArrowUp',
    ArrowDown: 'Alt + ArrowDown',
    ArrowLeft: 'Alt + ArrowLeft',
    ArrowRight: 'Alt + ArrowRight',
  },
  ROW_GAP: 20,
  COLUMN_GAP: 200,
  EPSILON: 1,
  OFFSET_WEIGHT: 1.1,
  MACRO_TASK_DELAY: 50,
};


class Setting extends PluginSettingTab {
  main: LovelyMindmap

  autoFocus: boolean
  hotkeys: PluginSettings['hotkeys']
  ROW_GAP: number
  COLUMN_GAP: number
  EPSILON: number
  OFFSET_WEIGHT: number
  MACRO_TASK_DELAY: number

  constructor(main: LovelyMindmap) {
    super(main.app, main)
    this.main = main
  }

  display() {
    const { containerEl } = this

    containerEl.empty();
    containerEl.createEl('h3', { text: '🤗 Lovely Mindmap Settings' })
    this.addAutoFocus()
    this.addCreateChildHotkey()
    this.addCreateBeforeSibHotKey()
    this.addCreateAfterSibHotKey()
  }

  addAutoFocus() {
    new ObsidianSetting(this.containerEl)
      .setName('Auto Focus')
      .setDesc('auto focus node when create new node')
      .addToggle(component => component
        .setValue(this.main.setting.autoFocus)
        .onChange(async (open) => {
          this.main.setting.autoFocus = open
          await this.main.saveData(this.main.setting)
        })
      )
  }

  addCreateChildHotkey() {
    let _hotKey = this.main.setting.hotkeys.CreateChild
    let errorText = ''

    new ObsidianSetting(this.containerEl)
      .setName('Create Child Node')
      .setDesc(`Custom your hotkey to create a child node, default is Tab. 
        You can use any letter, number, or modifier combined with 
        a letter or number, e.g., 「C」or「cmd + C」to create a child node.
        Use「+」to separate modifiers and alphanumeric characters.`)
      .addText(text => text
        .setPlaceholder('Enter hotkey')
        .setValue(_hotKey)
        .onChange(async (value) => {
          _hotKey = value
          errorText = ''
        }))
      .addButton(button => button
        .setButtonText('Save')
        .setCta()
        .onClick(async () => {
          if (errorText) {
            new Notice(errorText)
            return
          }
          try {
            const [modifier, key] = convertHotkey2Array(_hotKey)
            this.main.setting.hotkeys.CreateChild = _hotKey
            await this.main.saveData(this.main.setting)

            this.main.keymap.unregisterAll()
            this.main.keymap.registerAll({
              CreateChild: () => this.main.keymap.register(modifier, key, this.main.node.createChildren)
            })
            new Notice('Save successfully!')

          } catch (error) {
            new Notice(error.message)
          }
        })
      )
  }

  addCreateBeforeSibHotKey() {
    let _hotKey = this.main.setting.hotkeys.CreateBeforeSib || 'Shift+Enter'
    let errorText = ''

    new ObsidianSetting(this.containerEl)
      .setName('Create Sibling Node Before')
      .setDesc(`Custom your hotkey to create a sibling node before the current node. Default is Shift+Enter. Same as 'Create Child Node'.`)
      .addText(text => text
        .setPlaceholder('Enter hotkey')
        .setValue(_hotKey)
        .onChange(async (value) => {
          _hotKey = value
          errorText = ''
        }))
      .addButton(button => button
        .setButtonText('Save')
        .setCta()
        .onClick(async () => {
          if (errorText) {
            new Notice(errorText)
            return
          }
          try {
            const [modifier, key] = convertHotkey2Array(_hotKey)
            this.main.setting.hotkeys.CreateBeforeSib = _hotKey
            await this.main.saveData(this.main.setting)

            this.main.keymap.unregisterAll()
            this.main.keymap.registerAll({
              CreateBeforeSib: () => this.main.keymap.register(modifier, key, this.main.node.createBeforeSibNode)
            })
            new Notice('Save successfully!')

          } catch (error) {
            new Notice(error.message)
          }
        })
      )
  }

  addCreateAfterSibHotKey() {
    let _hotKey = this.main.setting.hotkeys.CreateAfterSib || 'Enter'
    let errorText = ''

    new ObsidianSetting(this.containerEl)
      .setName('Create Sibling Node After')
      .setDesc(`Custom your hotkey to create a sibling node after the current node. Default is Enter. Same as 'Create Child Node'.`)
      .addText(text => text
        .setPlaceholder('Enter hotkey')
        .setValue(_hotKey)
        .onChange(async (value) => {
          _hotKey = value
          errorText = ''
        }))
      .addButton(button => button
        .setButtonText('Save')
        .setCta()
        .onClick(async () => {
          if (errorText) {
            new Notice(errorText)
            return
          }
          try {
            const [modifier, key] = convertHotkey2Array(_hotKey)
            this.main.setting.hotkeys.CreateAfterSib = _hotKey
            await this.main.saveData(this.main.setting)

            this.main.keymap.unregisterAll()
            this.main.keymap.registerAll({
              CreateAfterSib: () => this.main.keymap.register(modifier, key, this.main.node.createAfterSibNode)
            })
            new Notice('Save successfully!')

          } catch (error) {
            new Notice(error.message)
          }
        })
      )
  }

  async loadSettings() {
    this.main.setting = { ...DEFAULT_SETTINGS, ...await this.main.loadData() }
  }
}

export { Setting };

