import * as THREE from 'three'

/**
 * 로딩 화면 제어
 */
const hideLoading = () => {
  const loadingContainer = document.querySelector('.loading-container') as HTMLElement
  if (loadingContainer) {
    // 인라인 스타일 제거하여 transition이 작동하도록 함
    loadingContainer.style.removeProperty('opacity')
    loadingContainer.style.removeProperty('visibility')
    // 약간의 지연 후 hidden 클래스 추가하여 부드러운 전환
    requestAnimationFrame(() => {
      loadingContainer.classList.add('hidden')
    })
  }
}


/**
 * 프리뷰 캔버스 초기화 및 렌더링
 */

interface PreviewConfig {
  work: string
  canvas: HTMLCanvasElement
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  animationId: number | null
  geometry?: THREE.BufferGeometry
  material?: THREE.Material
  points?: THREE.Points
}

const previews: Map<string, PreviewConfig> = new Map()

/**
 * Spiral Galaxy 프리뷰 생성
 */
const createSpiralGalaxyPreview = (canvas: HTMLCanvasElement): PreviewConfig => {
  const scene = new THREE.Scene()
  
  // 카메라 설정
  const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
  camera.position.set(0, 0, 5)
  
  // 렌더러 설정
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  
  // 간단한 은하 프리뷰 생성 (파티클 수를 줄여서 성능 최적화)
  const particleCount = 5000
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  
  const colorInside = new THREE.Color('#ff4747')
  const colorOutside = new THREE.Color('#0571ff')
  const radius = 2
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    
    // 나선 은하 형태로 파티클 배치
    const branchIndex = i % 3
    const branchAngle = (branchIndex / 3) * Math.PI * 2
    const spinAngle = Math.sqrt(Math.random()) * Math.PI * 2
    const randomRadius = Math.sqrt(Math.random()) * radius
    
    const x = Math.cos(branchAngle + spinAngle) * randomRadius
    const y = (Math.random() - 0.5) * 0.5
    const z = Math.sin(branchAngle + spinAngle) * randomRadius
    
    positions[i3] = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z
    
    // 색상 그라데이션
    const normalizedRadius = randomRadius / radius
    const color = new THREE.Color()
    color.lerpColors(colorInside, colorOutside, normalizedRadius)
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.05,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  })
  
  const points = new THREE.Points(geometry, material)
  scene.add(points)
  
  // 애니메이션
  const clock = new THREE.Clock()
  let animationId: number | null = null
  
  const animate = () => {
    const elapsedTime = clock.getElapsedTime()
    points.rotation.y = elapsedTime * 0.1
    
    renderer.render(scene, camera)
    animationId = requestAnimationFrame(animate)
  }
  
  animate()
  
  return {
    work: 'spiral-galaxy',
    canvas,
    scene,
    camera,
    renderer,
    animationId,
    geometry,
    material,
    points,
  }
}

/**
 * 3D World 프리뷰 생성
 */
const create3DWorldPreview = (canvas: HTMLCanvasElement): PreviewConfig => {
  const scene = new THREE.Scene()
  
  // 카메라 설정
  const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
  camera.position.set(0, 0, 5)
  
  // 렌더러 설정
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  
  // 간단한 파티클 시스템 생성
  const particleCount = 3000
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    
    // 랜덤 위치
    positions[i3] = (Math.random() - 0.5) * 10
    positions[i3 + 1] = (Math.random() - 0.5) * 10
    positions[i3 + 2] = (Math.random() - 0.5) * 10
    
    // 랜덤 색상
    colors[i3] = Math.random()
    colors[i3 + 1] = Math.random()
    colors[i3 + 2] = Math.random()
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
  })
  
  const points = new THREE.Points(geometry, material)
  scene.add(points)
  
  // 애니메이션
  const clock = new THREE.Clock()
  let animationId: number | null = null
  
  const animate = () => {
    const elapsedTime = clock.getElapsedTime()
    
    // 파티클 회전
    points.rotation.x = elapsedTime * 0.1
    points.rotation.y = elapsedTime * 0.15
    
    renderer.render(scene, camera)
    animationId = requestAnimationFrame(animate)
  }
  
  animate()
  
  return {
    work: '3d-world',
    canvas,
    scene,
    camera,
    renderer,
    animationId,
    geometry,
    material,
    points,
  }
}

/**
 * 프리뷰 초기화
 */
const initPreviews = () => {
  const previewCanvases = document.querySelectorAll<HTMLCanvasElement>('.preview-canvas')
  
  previewCanvases.forEach((canvas) => {
    const workType = canvas.getAttribute('data-work')
    
    if (!workType) return
    
    let config: PreviewConfig | null = null
    
    switch (workType) {
    case 'spiral-galaxy':
      config = createSpiralGalaxyPreview(canvas)
      break
    case '3d-world':
      config = create3DWorldPreview(canvas)
      break
    default:
      console.warn(`Unknown work type: ${workType}`)
      return
    }
    
    if (config) {
      previews.set(workType, config)
      
      // 리사이즈 처리
      const resizeObserver = new ResizeObserver(() => {
        if (config) {
          const width = canvas.clientWidth
          const height = canvas.clientHeight
          config.camera.aspect = width / height
          config.camera.updateProjectionMatrix()
          config.renderer.setSize(width, height)
        }
      })
      
      resizeObserver.observe(canvas)
    }
  })
}

/**
 * 프리뷰 정리
 */
const cleanupPreviews = () => {
  previews.forEach((config) => {
    if (config.animationId !== null) {
      cancelAnimationFrame(config.animationId)
    }
    if (config.points) {
      config.scene.remove(config.points)
    }
    config.geometry?.dispose()
    if (config.material) {
      if (Array.isArray(config.material)) {
        config.material.forEach((mat) => mat.dispose())
      } else {
        config.material.dispose()
      }
    }
    config.renderer.dispose()
    config.scene.clear()
  })
  previews.clear()
}

// 페이지 로드 시 프리뷰 초기화
const initializePage = () => {
  initPreviews()
  // 프리뷰 초기화 완료 후 로딩 화면 숨김
  // 약간의 지연을 두어 프리뷰가 렌더링될 시간을 줌
  setTimeout(() => {
    hideLoading()
  }, 300)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage)
} else {
  initializePage()
}

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', cleanupPreviews)
