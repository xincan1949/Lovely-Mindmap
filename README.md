# Lovely-Mindmap

Obsidian canvas plugin to build your own knowledge graph with smiles : )

It is named mindmap, but not only mindmap.
We will continue to introduce new features!
**Your unique and innovative idea has a good chance of being adopted by us.**

# 📕 Feature

As a plugin of mindmap, you can find basic mindmap feature in this plugin.

- `Tab` create child node and zoom to fit
- `Enter` create sibling node and zoom to fit
- `Shift + Enter` create sibling before and zoom to fit
- `cmd + Esc` blur selection node and start navigating. [Why not `Esc`](#why-not-esc) ?
- `opt + ↑↓←→` move around nodes with smart intention

# 🐮 Advanced

## 🕹 View

First of all, we declare three views in Lovely-Mindmap, they look similar, but have different interactions.  

> Touch: No nodes are selected

> Navigation: One _or more_ nodes are selected, you can do something

In the current scene, we just find the need to create and change the selection of a node.

We believe that in the feature, there will be various needs for multiple node interactions, such as layout.

> Creation: One node is selected, and you can find the cursor inside the node

When you are creating, we don't want your thoughts and inspiration to be interrupted.

So at the plugin level, we only provide `cmd + Esc` to exit.

That means the modifier will do its original job,
`Enter` can wrap lines,
`cmd + ←→` can move the cursor to the beginning/end of the line. 

## Dive into

As an accessibility enthusiast, I don't want to take my hands off the keyboard.

The keyboard `f` may be the first step to start your creation.

In touch view, `f` select the node closest to the center of the viewport.

In Navigation view, `f` activate selection node and start editing.

_Uncertainty: ._


## 🚧 TODO

- [ ] Double `f` create node in the middle if no node in viewport

Not sure

- [ ] Automatically expand node while creating

Not sure

- [ ] Find node by keyword and zoom to fit

Woah!

- [ ] Import file like lark, XMind, and so on

Woah!

- [ ] Export obsidian mindmap to specified file format

Woah!

- [ ] Organize graph in a neat manner

Woah!

- [ ] Auto layout avoid collapse

Woah!

- [ ] `opt + ↑↓←→` will move to next node out of the viewport if you confirm

Woah!

- [ ] 🥰 User suggestion 

As mentioned at the beginning, **Your unique and innovative idea has a good chance of being adopted by us.**

# ✨ Change Log

- 07/06/2023 Debounce is support when nodes are created by `Enter` or `Tab`
- 07/05/2023 Fix the first time you enter the editor canvas instance may be undefined 
- 07/04/2023 Fix keyboard F fail to focus the nearest central node in viewport
- 07/04/2023 Fix node generated by Tab shortcut position error


# 📜 Source

We will open the source code after the star exceeds 300.

# 🤔 Q&A

> Why do I need press `cmd + Esc` instead of `Esc` to exit creating view?

For two reasons:

1. Individual `Esc` keyboard events cannot be listened
2. Focus mode should be hard to interrupt

If needed, we'll consider putting it in the setting as a switch.


# ☕️ Donate

handsome guy: May I offer you a cup of coffee?

Me: Thanks.
I prefer Lycium Barbarum in a thermos.
But you can give the repo a star which will keep me up all afternoons, too : )
