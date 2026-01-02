import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { Timer } from 'three/addons/misc/Timer.js'

/**
 * Base
 */

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


// Debug
const gui = new GUI({
  title: '3D Dewdew World Debugger',
  width: 340,
  closeFolders: true,
})
gui.hide()

window.addEventListener('keydown', (event) => {
  if (event.key === 'h') {
    gui.show(gui._hidden)
  // } else if (event.key === 'H') {
  //   gui.show()
  }
})

// Canvas
const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const matcapTexture = textureLoader.load('./3d-world/textures/matcaps/3.png')

const star1Texture = textureLoader.load('./3d-world/particles/star_01.png')
const star2Texture = textureLoader.load('./3d-world/particles/star_02.png')
const star3Texture = textureLoader.load('./3d-world/particles/star_03.png')
const star4Texture = textureLoader.load('./3d-world/particles/star_04.png')
const star5Texture = textureLoader.load('./3d-world/particles/star_05.png')
const star6Texture = textureLoader.load('./3d-world/particles/star_06.png')
const star7Texture = textureLoader.load('./3d-world/particles/star_07.png')
const star8Texture = textureLoader.load('./3d-world/particles/star_08.png')
const star9Texture = textureLoader.load('./3d-world/particles/star_09.png')

matcapTexture.colorSpace = THREE.SRGBColorSpace

// 별 텍스처들도 SRGB 색공간 설정
star1Texture.colorSpace = THREE.SRGBColorSpace
star2Texture.colorSpace = THREE.SRGBColorSpace
star3Texture.colorSpace = THREE.SRGBColorSpace
star4Texture.colorSpace = THREE.SRGBColorSpace
star5Texture.colorSpace = THREE.SRGBColorSpace
star6Texture.colorSpace = THREE.SRGBColorSpace
star7Texture.colorSpace = THREE.SRGBColorSpace
star8Texture.colorSpace = THREE.SRGBColorSpace
star9Texture.colorSpace = THREE.SRGBColorSpace

/**
 * Object
 * 
 * 도넛 메시 생성 함수
 * @param scene - 씬
 * @param count - 도넛 개수
 * @param matcapTexture - 매택 텍스처
 * @returns 도넛 메시 배열
 */
// const createDonuts = ( scene: THREE.Scene, count: number = 1000, matcapTexture: THREE.Texture): THREE.Mesh[] => {
//   const donuts: THREE.Mesh[] = []
//   const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45)
//   const donutMaterial = new THREE.MeshMatcapMaterial()

//   donutMaterial.matcap = matcapTexture

//   console.time('donuts')
  
//   for (let i = 0; i < count; i++) {
//     const donut = new THREE.Mesh(donutGeometry, donutMaterial)
//     donut.position.x = (Math.random() - 0.5) * 140
//     donut.position.y = (Math.random() - 0.5) * 140
//     donut.position.z = (Math.random() - 0.5) * 140

//     donut.rotation.x = Math.random() * Math.PI * 2
//     donut.rotation.y = Math.random() * Math.PI * 2

//     const scale = Math.random() * 0.5 + 0.2
//     donut.scale.set(scale, scale, scale)

//     scene.add(donut)
//     donuts.push(donut)
//   }

//   console.timeEnd('donuts')
//   return donuts
// }

/**
 * 텍스처별로 파티클 인덱스를 그룹화
 */
const groupParticlesByTexture = (
  count: number,
  textureCount: number
): number[][] => {
  const textureGroups: number[][] = Array.from({ length: textureCount }, () => [])
  
  for (let i = 0; i < count; i++) {
    const textureIndex = Math.floor(Math.random() * textureCount)
    textureGroups[textureIndex].push(i)
  }
  
  return textureGroups
}

/**
 * 파티클의 초기 위치와 속도 생성
 */
const initializeParticleData = (
  count: number,
  spreadRange: number
): { positions: Float32Array; velocities: Float32Array } => {
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    // 초기 위치
    positions[i * 3] = (Math.random() - 0.5) * spreadRange
    positions[i * 3 + 1] = (Math.random() - 0.5) * spreadRange
    positions[i * 3 + 2] = (Math.random() - 0.5) * spreadRange

    // 초기 속도
    velocities[i * 3] = (Math.random() - 0.5) * 0.0002
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0002
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0002
  }
  
  return { positions, velocities }
}

/**
 * 실제 별의 색상 톤 (빨주노초파남보 + 추가)
 * O형(파랑), B형(하양-파랑), A형(하양), F형(노랑-하양), G형(노랑), K형(주황), M형(빨강)
 */
const STAR_COLORS = [
  0xFF6B6B, // 빨강 (M형 별 - 차가운 빨간 별)
  0xFF8C42, // 주황 (K형 별 - 주황색 별)
  0xFFFF9E, // 노랑 (G형 별 - 태양 같은 노란 별)
  0x90EE90, // 초록 (실제로는 별이 초록색이 아니지만, 청록색 계열)
  0x87CEEB, // 파랑 (O/B형 별 - 뜨거운 파란 별)
  0x4169E1, // 남색 (B형 별 - 남색 별)
  0xDA70D6, // 보라 (A형 별 - 보라색 별)
  0xFFD700, // 금색 (F형 별 - 금색 별)
  0xFFE4B5, // 베이지 (F형 별 - 연한 노란 별)
]

/**
 * STAR_COLORS에 따라 크기를 0.1~0.5 범위에 배치
 */
const getStarSize = (textureIndex: number): number => {
  const index = textureIndex % STAR_COLORS.length
  // 0.1 ~ 0.5 범위를 STAR_COLORS 개수만큼 균등하게 분배
  const minSize = 0.1
  const maxSize = 0.5
  const sizeRange = maxSize - minSize
  const step = sizeRange / STAR_COLORS.length
  return minSize + (index * step) + (Math.random() * step * 0.5) // 약간의 랜덤성 추가
}

/**
 * 파티클 그룹 생성
 */
const createParticleGroup = (
  positions: Float32Array,
  velocities: Float32Array,
  texture: THREE.Texture,
  textureIndex: number
): THREE.Points => {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.userData.velocities = velocities
  
  // textureIndex에 따라 별의 색상 톤과 크기 적용
  const starColor = STAR_COLORS[textureIndex % STAR_COLORS.length]
  const starSize = getStarSize(textureIndex)
  
  const material = new THREE.PointsMaterial({
    size: starSize,
    color: starColor,
    sizeAttenuation: true,
    map: texture,
    alphaMap: texture,
    alphaTest: 0.001,
    transparent: true,
    depthWrite: false,
  })

  gui.addColor(material, 'color').name(`Star Color ${textureIndex + 1}`)
  gui.add(material, 'size').min(0.1).max(0.5).step(0.01).name(`Star Size ${textureIndex + 1}`)
  return new THREE.Points(geometry, material)
}

/**
 * 별 파티클 생성 함수
 * @param scene - 씬
 * @param count - 파티클 개수
 * @param starTextures - 별 텍스처 배열
 * @returns 파티클 객체 배열
 */
const createStarParticles = (
  scene: THREE.Scene,
  count: number = 5000,
  starTextures: THREE.Texture[]
): THREE.Points[] => {
  const spreadRange = 200
  const particles: THREE.Points[] = []
  const textureGroups = groupParticlesByTexture(count, starTextures.length)
  
  textureGroups.forEach((groupIndices, textureIndex) => {
    if (groupIndices.length === 0) return
    
    const { positions, velocities } = initializeParticleData(
      groupIndices.length,
      spreadRange
    )
    
    const particleGroup = createParticleGroup(
      positions,
      velocities,
      starTextures[textureIndex],
      textureIndex
    )
    
    scene.add(particleGroup)
    particles.push(particleGroup)
  })

  return particles
}

// 별 파티클 생성 (랜덤 텍스처 사용)
const starTextures = [
  star1Texture,
  star2Texture,
  star3Texture,
  star4Texture,
  star5Texture,
  star6Texture,
  star7Texture,
  star8Texture,
  star9Texture,
]

const starParticles = createStarParticles(scene, 50000, starTextures)

/**
 * Fonts
 */
const fontLoader = new FontLoader()
// const donuts: THREE.Mesh[] = []

fontLoader.load(
  '/fonts/pretendard_variable_regular.json',
  (font) => {
    const textParameters = {
      size: 0.5,
      depth: 0.2,
      lineHeight: 0.7,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5,
    }

    const createTextGeometry = () => {
      return new TextGeometry(
        'Welcome To Dewdew World!',
        {
          font: font,
          ...textParameters,
        },
      )
    }

    let textGeometry = createTextGeometry()

    textGeometry.center()

    const commonMaterial = new THREE.MeshMatcapMaterial()

    commonMaterial.matcap = matcapTexture
    commonMaterial.wireframe = false
    const text = new THREE.Mesh(textGeometry, commonMaterial)

    const updateGeometry = () => {
      const oldGeometry = textGeometry
      textGeometry = createTextGeometry()
      textGeometry.center()

      text.geometry.dispose()
      text.geometry = textGeometry
      oldGeometry.dispose()
    }

    gui.add(textParameters, 'depth').min(0.01).max(0.5).step(0.01).name('Text Depth').onChange(updateGeometry)
    gui.add(textParameters, 'bevelEnabled').name('Bevel Enabled').onChange(updateGeometry)
    gui.add(textParameters, 'bevelThickness').min(0.01).max(0.5).step(0.01).name('Bevel Thickness').onChange(updateGeometry)
    gui.add(textParameters, 'bevelSize').min(0.01).max(0.5).step(0.01).name('Bevel Size').onChange(updateGeometry)
    gui.add(textParameters, 'bevelOffset').min(0.01).max(0.5).step(0.01).name('Bevel Offset').onChange(updateGeometry)
    gui.add(textParameters, 'bevelSegments').min(0).max(10).step(1).name('Bevel Segments').onChange(updateGeometry)
    gui.add(textParameters, 'curveSegments').min(0).max(10).step(1).name('Curve Segments').onChange(updateGeometry)
    gui.add(textParameters, 'size').min(0.01).max(1).step(0.01).name('Size').onChange(updateGeometry)
    gui.add(commonMaterial, 'wireframe').name('Wireframe')

    scene.add(text)

    // 도넛 생성
    // const createdDonuts = createDonuts(scene, 1000, matcapTexture)
    // donuts.push(...createdDonuts)
    
    // 폰트 로딩 완료 후 로딩 화면 숨김
    hideLoading()
  },
  undefined,
  () => {
    // 폰트 로딩 실패해도 씬은 로드되었으므로 로딩 화면 숨김
    hideLoading()
  }
)


/**
 * Axes Helper
 */
const axesHelper = new THREE.AxesHelper()
axesHelper.visible = false
scene.add(axesHelper)

window.addEventListener('keydown', (event) => {
  if (event.key === 'o') {
    axesHelper.visible = !axesHelper.visible
  }
})

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () =>
{
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// 더블클릭시 풀스크린 처리
window.addEventListener('dblclick', () => {
  const fullscreenElement = document.fullscreenElement || (document as any).webkitFullscreenElement

  if (!fullscreenElement) {

    if (canvas?.requestFullscreen) {
      canvas?.requestFullscreen()
    } else if ((canvas as any).webkitRequestFullscreen) {
      (canvas as any).webkitRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    }
  }
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas as HTMLElement)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const timer = new Timer()

const tick = () => {
  // Timer update
  timer.update()

  // Update donuts
  // donuts.forEach((donut) => {
  //   donut.rotation.x += 0.001
  //   donut.rotation.y += 0.001
  //   donut.position.y += Math.sin(elapsedTime + donut.position.x) * 0.0005
  // })

  // Update star particles (조금씩 이동)
  starParticles.forEach((particleGroup) => {
    const positions = particleGroup.geometry.attributes.position
    const positionArray = positions.array as Float32Array
    const velocities = particleGroup.geometry.userData.velocities as Float32Array
    
    for (let i = 0; i < positions.count; i++) {
      const index = i * 3
      
      // 속도에 따라 위치 업데이트
      positionArray[index] += velocities[index]
      positionArray[index + 1] += velocities[index + 1]
      positionArray[index + 2] += velocities[index + 2]

      // 경계를 벗어나면 반대편으로 이동 (분포 범위에 맞게 조정)
      const boundary = 100
      if (Math.abs(positionArray[index]) > boundary) velocities[index] *= -1
      if (Math.abs(positionArray[index + 1]) > boundary) velocities[index + 1] *= -1
      if (Math.abs(positionArray[index + 2]) > boundary) velocities[index + 2] *= -1
    }
    
    positions.needsUpdate = true
  })

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
