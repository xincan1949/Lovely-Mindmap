import {App, KeymapEventHandler, Modifier, Plugin, PluginManifest} from 'obsidian'
import {Debounce} from './decorator'
import {filter} from 'builtin-modules'
import {Node} from './feature/Node'
import {calcDistance, findClosestNodeByBbox} from './tool'


interface MyPluginSettings {
  mySetting: string
  autoFocus: boolean
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: 'default',
  autoFocus: false,
}

type NewNodeSize = 'inherit' | { width: number, height: number }

interface Shortcut {
  modifiers: Modifier
  key: string
  vkey: string
}


const directionMap = {
  'up': 'arrowUp',
  'down': 'arrowDown',
  'left': 'arrowLeft',
  'right': 'arrowRight',
}

function mixin(target: Function, ...sources: Function[]) {
  sources.forEach(source => {
    Object.getOwnPropertyNames(source.prototype).forEach(name => {
      target.prototype[name] = source.prototype[name];
    });
  });
}


const random = (e: number) => {
  let t = []
  for (let n = 0; n < e; n++) {
    t.push((16 * Math.random() | 0).toString(16))
  }
  return t.join('')
}

const MACRO_TASK_DELAY = 50

const EPSILON = 1

const OFFSET_WEIGHT = 1.1

export default class LovelyMindmap extends Plugin implements Node{
  settings: MyPluginSettings
  canvas: any = null
  hotkeys: KeymapEventHandler[] = []
  intervalTimer = new Map()
  getSingleSelection: () => M.Node | null
  getFromNodes: (node: M.Node) => M.Node[]
  getToNodes: (node: M.Node) => M.Node[]

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    mixin(LovelyMindmap, Node)
  }


  // sibNodes must have x,y,height,width attributes
  reflow(parentNode, sibNodes) {
    const ROW_GAP = 20
    const COLUMN_GAP = 200

    const bbox = sibNodes.reduce((prev, node, idx) => {
      return idx > 0
        ? {
          height: prev.height + node.height + ROW_GAP,
          heightNodes: prev.heightNodes.concat(node.height),
        }
        : {
          height: prev.height + node.height,
          heightNodes: prev.heightNodes.concat(node.height),
        }
    }, {
      height: 0,
      heightNodes: [],
    })

    const top = parentNode.y + parentNode.height * 0.5 - bbox.height * 0.5

    const getSum = (arr: number[]) => arr.reduce((sum, cur) => sum + cur, 0)

    sibNodes.sort((a, b) => a.y - b.y).forEach((node, i) => {
      node.moveTo({
        x: parentNode.width + parentNode.x + COLUMN_GAP,
        y: top + ROW_GAP * i + getSum(bbox.heightNodes.slice(0, i))
      })
    })
  }

  editToNode(node: M.Node) {
    setTimeout(() => node.startEditing(), MACRO_TASK_DELAY)
  }

  zoomToNode(node: M.Node) {
    this.canvas.selectOnly(node)
    this.canvas.zoomToSelection()

    // 魔法打败魔法
    if (DEFAULT_SETTINGS.autoFocus) {
      this.editToNode(node)
    }
  }

  view2Focus() {
    if (this.getSingleSelection() !== null) {
      return
    }

    const viewportBBox = this.canvas.getViewportBBox()
    const centerPoint: M.Position = [
      (viewportBBox.minX + viewportBBox.maxX) / 2,
      (viewportBBox.minY + viewportBBox.maxY) / 2,
    ]

    const viewportNodes = this.canvas.getViewportNodes()
    const res = findClosestNodeByBbox(centerPoint, viewportNodes)
    this.zoomToNode(res.node)
  }

  focus2Edit() {
    const selection = this.getSingleSelection()
    if (!selection || !selection.isFocused || selection.isEditing) {
      return
    }

    this.editToNode(selection)
  }

  edit2Focus() {
    const selection = this.getSingleSelection()
    if (!selection || !selection.isEditing) {
      return
    }

    selection.blur()
    // hack: blur will lose selection style
    selection.focus()
  }

  focus2View() {
    const selection = this.getSingleSelection()
    if (!selection) {
      return
    }

    this.canvas.deselectAll()
  }

  focusNode() {
    return this.app.scope.register([], 'f', () => {
      const selection = this.getSingleSelection()

      const isView = !selection
      if (isView) {
        this.view2Focus()
        return
      }

      const isFocus = selection.isFocused === true
      if (isFocus) {
        this.focus2Edit()
        return
      }
    })
  }

  blurNode() {

    return this.app.scope.register(['Meta'], 'Escape', (e) => {
      console.log('Escape pressed')

      const selection = this.getSingleSelection()
      if (!selection) return

      if (selection.isEditing) {
        this.edit2Focus()
        return
      }

      if (selection.isFocused) {
        this.focus2View()
        return
      }
    })
  }

  @Debounce()
  createChildren() {
    const selectionNode = this.getSingleSelection()
    if (!selectionNode || selectionNode.isEditing) return

    const {
      x,
      y,
      width,
      height,
    } = selectionNode

    // node with from and to attrs we called `Edge`
    // node without from and to but has x,y,width,height attrs we called `Node`
    const rightSideNodeFilter = (node: M.Edge) => node?.to?.side === 'left' && selectionNode.id !== node?.to?.node?.id

    const sibNodes = this.canvas
      .getEdgesForNode(selectionNode)
      .filter(rightSideNodeFilter)
      .map((node: M.Edge) => node.to.node)

    const nextNodeY = Math.max(...sibNodes.map((node: M.Node) => node.y)) + EPSILON

    const childNode = this.canvas.createTextNode({
      pos: {
        x: x + width + 200,
        y: nextNodeY,
      },
      size: {
        height: height,
        width: width
      },
      text: '',
      focus: false,
      save: true,
    })

    const data = this.canvas.getData()

    this.canvas.importData({
      'edges': [
        ...data.edges,
        {
          'id': random(6),
          'fromNode': selectionNode.id,
          'fromSide': 'right',
          'toNode': childNode.id,
          'toSide': 'left',
        }
      ],
      'nodes': data.nodes,
    })

    this.reflow(selectionNode, sibNodes.concat(childNode))

    this.zoomToNode(childNode)
  }

  @Debounce()
  createSibNode(_: unknown, shortcut: Shortcut) {
    const selectionNode = this.getSingleSelection()
    if (!selectionNode || selectionNode.isEditing) return

    const {
      x,
      y,
      width,
      height,
    } = selectionNode

    const isPressedShift = shortcut.modifiers === 'Shift'

    const fromNode = this.getFromNodes(selectionNode)[0]
    const toNodes = this.getToNodes(fromNode)

    const willInsertedNode = this.canvas.createTextNode({
      pos: {
        x: x,
        y: isPressedShift ? y - EPSILON : y + EPSILON,
      },
      size: {
        height,
        width,
      },
      text: '',
      focus: false,
      save: true,
    })

    const data = this.canvas.getData()

    this.canvas.importData({
      'edges': [
        ...data.edges,
        {
          'id': random(6),
          'fromNode': fromNode.id,
          'fromSide': 'right',
          'toNode': willInsertedNode.id,
          'toSide': 'left',
        }
      ],
      'nodes': data.nodes,
    })


    this.reflow(fromNode, toNodes.concat(willInsertedNode))
    this.zoomToNode(willInsertedNode)
  }

  nodeNavigation(direction: keyof typeof directionMap) {
    return app.scope.register(['Alt'], directionMap[direction], () => {
      const selection = this.getSingleSelection()
      if (!selection || selection.isEditing) {
        // const notice = new Notice('')
        // notice.setMessage('Press `cmd + Esc` to exit creating view')
        return
      }

      const data = this.canvas.getViewportNodes()


      const offsetX = (a: M.Node, b: M.Node) => Math.abs(b.x - a.x)
      const offsetY = (a: M.Node, b: M.Node) => Math.abs(b.y - a.y)
      // fixed: 复数的非整次方为 NaN
      // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow#return_value:~:text=base%20%3C%200%20and%20exponent%20is%20not%20an%20integer.
      const endpointOffset = (a: M.Node, b: M.Node) => Math.min(
        Math.abs(b.y - a.y + 2 / a.height),
        Math.abs(b.y + b.height - a.y - 2 / a.height),
        Math.abs(b.x - a.x + 2 / a.width),
        Math.abs(b.x + b.width - a.x + 2 / a.width),
      )
      const calcDistance = (a: M.Node, b: M.Node) => (direction === 'left' || direction === 'right')
        ? offsetX(a, b) + endpointOffset(a, b) ** OFFSET_WEIGHT
        : offsetY(a, b) + endpointOffset(a, b) ** OFFSET_WEIGHT
      const isSameDirection = (node: M.Node) => {
        const notSelf = node.id !== selection.id
        const strategies = {
          right: notSelf && node.x > selection.x + selection.width,
          left: notSelf && node.x + node.width < selection.x,
          up: notSelf && node.y + node.height < selection.y,
          down: notSelf && node.y > selection.y + selection.height,
        }
        return strategies[direction]
      }

      const midpoints = data
        .filter(isSameDirection)
        .map((node: M.Node) => ({
          node,
          offsetX: offsetX(selection, node),
          offsetY: offsetY(selection, node),
          endpointOffset: endpointOffset(selection, node),
          distance: calcDistance(selection, node)
        }))
        .sort((a: M.Node, b: M.Node) => a.distance - b.distance)

      if (midpoints.length > 0) {
        this.zoomToNode(midpoints[0].node)
      }
    })
  }

  @Debounce()
  help() {
    console.log('this:\n', this)

    console.log('app:\n', this.app)

    console.log('canvas:\n', this.canvas)

    console.log('selections:\n', this.getSingleSelection())
  }

  createCanvas() {
    const timer = setInterval(() => {
      this.canvas = app.workspace.getLeavesOfType('canvas').first()?.view?.canvas
      if (!!this.canvas) {
        clearInterval(this.intervalTimer.get('canvasInitial'))
      }
    }, 1000)

    if (!this.intervalTimer.get('canvasInitial')) {
      this.intervalTimer.set('canvasInitial', timer)
    }
  }

  async onload() {
    await this.loadSettings()

    this.createCanvas()

    this.hotkeys.push(this.focusNode())
    this.hotkeys.push(this.blurNode())

    this.hotkeys.push(this.app.scope.register([], 'Tab', this.createChildren.bind(this)))

    this.hotkeys.push(this.app.scope.register([], 'enter', this.createSibNode.bind(this)))

    this.hotkeys.push(this.app.scope.register(['Shift'], 'enter', this.createSibNode.bind(this)))

    this.hotkeys.push(this.nodeNavigation('right'))
    this.hotkeys.push(this.nodeNavigation('left'))
    this.hotkeys.push(this.nodeNavigation('up'))
    this.hotkeys.push(this.nodeNavigation('down'))

    this.hotkeys.push(this.app.scope.register([], 'h', this.help.bind(this)))
  }

  onunload() {
    this.hotkeys.forEach(key => this.app.scope.unregister(key))
    this.intervalTimer.forEach(clearInterval)
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}