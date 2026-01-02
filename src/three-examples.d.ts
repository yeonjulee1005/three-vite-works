declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera } from 'three'
  import { EventDispatcher } from 'three'

  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement)
    object: Camera
    domElement: HTMLElement | HTMLDocument
    enabled: boolean
    target: { x: number; y: number; z: number }
    minDistance: number
    maxDistance: number
    minZoom: number
    maxZoom: number
    minPolarAngle: number
    maxPolarAngle: number
    minAzimuthAngle: number
    maxAzimuthAngle: number
    enableDamping: boolean
    dampingFactor: number
    enableZoom: boolean
    enableRotate: boolean
    enablePan: boolean
    autoRotate: boolean
    autoRotateSpeed: number
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string }
    mouseButtons: { LEFT: number; MIDDLE: number; RIGHT: number }
    touches: { ONE: number; TWO: number }
    update(): boolean
    reset(): void
    dispose(): void
    getPolarAngle(): number
    getAzimuthalAngle(): number
    getDistance(): number
    listenToKeyEvents(domElement: HTMLElement | Window): void
    saveState(): void
    resetToSavedState(): void
  }
}

declare module 'three/examples/jsm/loaders/FontLoader.js' {
  import { Loader } from 'three'

  export interface Font {
    data: any
    generateShapes(text: string, size: number): any[]
  }

  export class FontLoader extends Loader {
    load(
      url: string,
      onLoad?: (font: Font) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (error: Error) => void,
    ): void
    parse(json: any): Font
  }
}

declare module 'three/examples/jsm/geometries/TextGeometry.js' {
  import { BufferGeometry } from 'three'
  import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'

  export interface TextGeometryParameters {
    font?: Font
    size?: number
    height?: number
    depth?: number
    curveSegments?: number
    bevelEnabled?: boolean
    bevelThickness?: number
    bevelSize?: number
    bevelOffset?: number
    bevelSegments?: number
  }

  export class TextGeometry extends BufferGeometry {
    constructor(text: string, parameters?: TextGeometryParameters)
    parameters: {
      text: string
      parameters: TextGeometryParameters
    }
    center(): this
    dispose(): void
  }
}
