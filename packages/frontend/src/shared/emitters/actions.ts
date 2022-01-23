export type ActionName = string
export type Key = string
export type ActionDefinitions = Record<ActionName, Key[]|Key[][]>

export interface ActionEvent {
  which: ActionName
  keys: Key[]
  data?: any
}

export interface ActionHandler {
  (event: ActionEvent): boolean
}

export class Actions {
  keys: Set<string> = new Set()
  actionDefinitions: ActionDefinitions[] = []
  handlers: [ActionHandler, Set<ActionName>][] = []

  constructor() {
    this.keydown = this.keydown.bind(this)
    this.keyup = this.keyup.bind(this)
  }
  register(actionDefinitions: ActionDefinitions) {
    this.actionDefinitions.push(actionDefinitions)
  }
  unregister(actionDefinitions: ActionDefinitions) {
    this.actionDefinitions = this.actionDefinitions.filter(v=>!Object.is(v, actionDefinitions))
  }
  bind(actions: ActionName[], handler: ActionHandler) {
    let hI = this.handlers.findIndex(v=>Object.is(v[0], handler))
    if (hI < 0) {
      this.handlers.push([handler, new Set(actions)])
      return
    }
    for (let action of actions) {
      this.handlers[hI][1].add(action)
    }
  }
  unbind(actions: ActionName[], handler: ActionHandler) {
    let hI = this.handlers.findIndex(v=>Object.is(v[0], handler))
    if (hI < 0) {
      return
    }
    for (let action of actions) {
      this.handlers[hI][1].delete(action)
    }
    if (this.handlers[hI][1].size === 0) {
      this.handlers.splice(hI, 1)
    }
  }
  hook() {
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
  }
  unhook() {
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
  }
  keydown(e: KeyboardEvent) {
    if (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input') {
      return
    }
    this.keys.add(e.key)
  }
  keyup(e: KeyboardEvent) {
    if (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input') {
      return
    }
    for (let actionDefinition of this.actionDefinitions) {
      for (let [name, keys] of Object.entries(actionDefinition)) {
        let matches = []
        for (let keyOrKeys of keys) {
          if (Array.isArray(keyOrKeys)) {
            let match = true
            for (let aKey of keyOrKeys) {
              if (!this.keys.has(aKey)) {
                match = false
              }
            }
            if (match) {
              matches.push(keys)
            }
          } else {
            if (this.keys.has(keyOrKeys)) {
              matches.push(keyOrKeys)
            }
          }
        }
        for (let m of matches) {
          this.trigger(name, m, e)
        }
      }
    }
    this.keys.delete(e.key)
  }
  trigger(actionName: ActionName, keys: Key[], data?: any) {
    for (let [handler, actions] of this.handlers) {
      for (let handlerActionName of actions) {
        if (handlerActionName === actionName) {
          if (handler({
            which: actionName,
            keys,
            data,
          }) === false) {
            return
          }
        }
      }
    }
  }
}

export const globalActions = new Actions()