import { useEffect, useRef } from 'react'
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import type { PointerEvent as ReactPointerEvent, RefObject, WheelEvent } from 'react'
import type { DrainConfig } from '../domain/config'
import { createDrainModel, disposeGroup } from '../domain/geometry'

interface CameraState {
  distance: number
  zoom: number
  rotationX: number
  rotationY: number
  targetX: number
  targetY: number
  autoRotate: boolean
  pointerX: number
  pointerY: number
  dragging: boolean
}

interface SceneRuntime {
  scene: Scene
  topMaterial: MeshStandardMaterial
  bottomMaterial: MeshStandardMaterial
  floor: Mesh<PlaneGeometry, MeshStandardMaterial>
}

export interface SceneControls {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void
  onWheel: (event: WheelEvent<HTMLCanvasElement>) => void
}

export function useDrainScene(config: DrainConfig): SceneControls {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<ReturnType<typeof createDrainModel> | null>(null)
  const runtimeRef = useRef<SceneRuntime | null>(null)
  const cameraState = useRef<CameraState>({
    distance: 22,
    zoom: 1,
    rotationX: 0.5,
    rotationY: 0.58,
    targetX: 0.5,
    targetY: 0.58,
    autoRotate: true,
    pointerX: 0,
    pointerY: 0,
    dragging: false,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25

    const scene = new Scene()
    scene.background = new Color(0x0b0e13)
    const camera = new PerspectiveCamera(38, 1, 0.1, 600)
    const topMaterial = new MeshStandardMaterial({
      color: new Color(0.8, 0.8, 0.83),
      metalness: 0.93,
      roughness: 0.13,
    })
    const bottomMaterial = new MeshStandardMaterial({
      color: new Color(0.52, 0.53, 0.56),
      metalness: 0.88,
      roughness: 0.3,
    })
    const floorMaterial = new MeshStandardMaterial({
      color: 0x11151d,
      roughness: 0.97,
      metalness: 0,
    })
    const floor = new Mesh(new PlaneGeometry(400, 400), floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    scene.add(new AmbientLight(0x8090b0, 0.3))
    const key = new DirectionalLight(0xffffff, 1.3)
    key.position.set(14, 26, 14)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    Object.assign(key.shadow.camera, {
      left: -20,
      right: 20,
      top: 20,
      bottom: -20,
      near: 0.5,
      far: 80,
    })
    scene.add(key)
    const fill = new DirectionalLight(0x6080ff, 0.42)
    fill.position.set(-12, 7, -9)
    scene.add(fill)
    const rim = new DirectionalLight(0xffe4b0, 0.38)
    rim.position.set(3, 3, -16)
    scene.add(rim)
    const top = new DirectionalLight(0xffffff, 0.5)
    top.position.set(1, 30, 4)
    scene.add(top)
    runtimeRef.current = {
      scene,
      topMaterial,
      bottomMaterial,
      floor,
    }

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      const state = cameraState.current
      if (state.autoRotate) state.targetY += 0.004
      state.rotationX += (state.targetX - state.rotationX) * 0.08
      state.rotationY += (state.targetY - state.rotationY) * 0.08
      const distance = state.distance / state.zoom
      camera.position.set(
        Math.sin(state.rotationY) * Math.cos(state.rotationX) * distance,
        Math.sin(state.rotationX) * distance,
        Math.cos(state.rotationY) * Math.cos(state.rotationX) * distance,
      )
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      if (sceneRef.current) disposeGroup(sceneRef.current.group)
      sceneRef.current = null
      runtimeRef.current = null
      floor.geometry.dispose()
      floorMaterial.dispose()
      topMaterial.dispose()
      bottomMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return

    const previous = sceneRef.current
    if (previous) {
      runtime.scene.remove(previous.group)
      disposeGroup(previous.group)
    }

    const model = createDrainModel(
      config,
      runtime.topMaterial,
      runtime.bottomMaterial,
    )
    sceneRef.current = model
    cameraState.current.distance = model.cameraDistance
    runtime.floor.position.y = -model.visualHeight / 2 - 0.02
    runtime.scene.add(model.group)
  }, [config])

  return {
    canvasRef,
    onPointerDown(event) {
      const state = cameraState.current
      state.dragging = true
      state.autoRotate = false
      state.pointerX = event.clientX
      state.pointerY = event.clientY
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove(event) {
      const state = cameraState.current
      if (!state.dragging) return
      state.targetY += (event.clientX - state.pointerX) * 0.013
      state.targetX -= (event.clientY - state.pointerY) * 0.013
      state.targetX = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, state.targetX))
      state.pointerX = event.clientX
      state.pointerY = event.clientY
    },
    onPointerUp(event) {
      cameraState.current.dragging = false
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    },
    onWheel(event) {
      const state = cameraState.current
      state.zoom *= 1 - event.deltaY * 0.001
      state.zoom = Math.max(0.3, Math.min(3.2, state.zoom))
    },
  }
}
