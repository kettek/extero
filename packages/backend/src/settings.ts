import yaml from 'yaml'
import fs from 'fs'

export interface SettingsI {
  http: {
    port: number
    tls?: {
      key: string
      cert: string
    }
  }
  roomManager: {
    port: number
    tls?: {
      key: string
      cert: string
    }
  }
}

export const DefaultSettings: SettingsI = {
  http: {
    port: 3000,
    tls: {
      key: 'localhost.key',
      cert: 'localhost.cert',
    }
  },
  roomManager: {
    port: 3001,
    tls: {
      key: 'localhost.key',
      cert: 'localhost.cert',
    }
  },
}

function copy<T>(source: T): T {
  if (Array.isArray(source)) {
    return source.map(v => copy(v)) as unknown as T
  } else if (source instanceof Date) {
    return (new Date(source.getTime())) as unknown as T
  } else if (source && typeof source === 'object') {
    return Object.getOwnPropertyNames(source).reduce((o, prop) => {
      Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop)!)
      o[prop] = copy((source as { [key: string]: any })[prop])
      return o
    }, Object.create(Object.getPrototypeOf(source)))
  } else {
    return source
  }
}

export async function from(file: string = 'settings.yml', create: boolean = true): Promise<SettingsI> {
  let doc: any
  let failed = false
  try {
    doc = yaml.parse(
      await fs.promises.readFile(file, 'utf8')
    )
  } catch(err: any) {
    if (err.code === 'ENOENT') {
      failed = true
      doc = {}
    } else {
      throw err
    }
  }
  let settings: SettingsI = {
    ...copy(DefaultSettings),
    ...doc,
  }

  if (failed && create) {
    console.log("creating new settings file: " + file)
    await fs.promises.writeFile(
      file,
      yaml.stringify(settings),
    )
  }

  return settings
}