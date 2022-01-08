import escapeHtml from 'escape-html'
import markdown from 'markdown-it'

const md = markdown({
  linkify: true,
})

let defaultRender = md.renderer.rules.link_open || ((tokens: any[], idx: number, options: markdown.Options, env: any, self: any): string => {
  return self.renderToken(tokens, idx, options)
})

md.renderer.rules.link_open = (tokens: any[], idx: number, options: markdown.Options, env: any, self: any): string => {
  let aIndex = tokens[idx].attrIndex('target')

  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']) // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = '_blank'    // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self)
}

export function toMarkdown(text: string): string {
  return md.renderInline(escapeHtml(text))
}