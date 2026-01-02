import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Constants
 */
const CONSTANTS = {
  GUI_WIDTH: 400,
  GUI_CLOSE: true,
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_INITIAL_POSITION: { x: 5, y: 5, z: 5 },
  SPHERE_SEGMENTS: 32,
  BLACK_HOLE_EFFECT_MAX_DISTANCE: 40.0,
  BLACK_HOLE_EFFECT_MULTIPLIER: 1.5,
  BLACK_HOLE_DISTANCE_MULTIPLIER: 2,
  TWIST_RANDOM_FACTOR: 0.3,
  Y_OFFSET_RANDOM_FACTOR: 0.4,
  PERPENDICULAR_ANGLE_OFFSET: Math.PI / 2,
  BULGE_RANDOM_POWER: 0.5,
  ARM_DISTANCE_FACTOR: 0.5,
  ALPHA_TEST_THRESHOLD: 0.01,
  BLACK_HOLE_ALPHA_TEST: 0.1,
}

/**
 * Scene Setup
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


const gui = new GUI({
  title: 'Spiral Galaxy Debugger (h to show/hide)',
  width: CONSTANTS.GUI_WIDTH,
  closeFolders: CONSTANTS.GUI_CLOSE,
})

window.addEventListener('keydown', (event) => {
  if (event.key === 'h') {
    gui.show(gui._hidden)
  // } else if (event.key === 'H') {
  //   gui.show()
  }
})

const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement

if (!canvas) {
  throw new Error('Canvas element not found. Make sure canvas.webgl exists in the DOM.')
}

const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

// 텍스처 로딩 카운터
let loadedTextureCount = 0
const totalTextureCount = 4

const checkAllTexturesLoaded = () => {
  loadedTextureCount++
  if (loadedTextureCount === totalTextureCount) {
    // 모든 텍스처 로딩 완료 후 로딩 화면 숨김
    hideLoading()
  }
}

// 텍스처 로딩
const blackHoleColorTexture = textureLoader.load(
  './spiral-galaxy/blackhole/blackhole_arm.webp',
  () => checkAllTexturesLoaded(),
  undefined,
  (error) => {
    console.error('블랙홀 컬러 텍스처 로딩 실패:', error)
    checkAllTexturesLoaded()
  }
)
const blackHoleNormalTexture = textureLoader.load(
  './spiral-galaxy/blackhole/blackhole_nor.webp',
  () => checkAllTexturesLoaded(),
  undefined,
  (error) => {
    console.error('블랙홀 노말 텍스처 로딩 실패:', error)
    checkAllTexturesLoaded()
  }
)
const blackHoleDisplacementTexture = textureLoader.load(
  './spiral-galaxy/blackhole/blackhole_disp.webp',
  () => checkAllTexturesLoaded(),
  undefined,
  (error) => {
    console.error('블랙홀 디스플레이스먼트 텍스처 로딩 실패:', error)
    checkAllTexturesLoaded()
  }
)
const starTexture = textureLoader.load(
  './spiral-galaxy/star/star.png',
  () => checkAllTexturesLoaded(),
  undefined,
  (error) => {
    console.error('별 텍스처 로딩 실패:', error)
    checkAllTexturesLoaded()
  }
)

// 텍스처 색공간 설정
blackHoleColorTexture.colorSpace = THREE.SRGBColorSpace
starTexture.colorSpace = THREE.SRGBColorSpace

/**
 * 블랙홀 텍스처 설정
 */
const configureBlackHoleTextures = () => {
  if (blackHoleColorTexture) {
    blackHoleColorTexture.wrapS = THREE.ClampToEdgeWrapping
    blackHoleColorTexture.wrapT = THREE.ClampToEdgeWrapping
    blackHoleColorTexture.generateMipmaps = true
  }
}

configureBlackHoleTextures()

/**
 * Galaxy Parameters
 */
const parameters = {
  // Stars
  count: 100000,
  size: 0.02,
  insideColor: '#ff4747',
  outsideColor: '#0571ff',
    
  // Spiral Galaxy
  radius: 20,
  branches: 3,
  spin: 0.1,
  randomness: 0.6,
  randomnessPower: 4.5,
  twist: 1.2,
  branchTwist: 0.1,
  armThickness: 20,
    
  // Bulge
  bulgeSize: 0.05,
  bulgeDensity: 6.2,
  bulgeSpread: 0.15,
  bulgeRandomness: 2.2,
    
  // Black Hole
  blackHoleRadius: 0.06,
    
  // Rotation
  rotationSpeed: 0.0125,
  isRotating: true,
}

/**
 * Galaxy State
 */
let geometry: THREE.BufferGeometry | null = null
let material: THREE.PointsMaterial | null = null
let points: THREE.Points | null = null

let blackHoleGeometry: THREE.SphereGeometry | null = null
let blackHoleMaterial: THREE.MeshStandardMaterial | null = null
let blackHoleMesh: THREE.Mesh | null = null

/**
 * Galaxy Calculation Functions
 */

/**
 * 반경 계산 (bulge, 나선팔, 블랙홀 제외 처리)
 */
const calculateRadius = () => {
  const randomValue = Math.random()
  let radius
  let isBulge = false
    
  // 중심부 bulge 영역
  if (randomValue < parameters.bulgeSize) {
    isBulge = true
    const densityPower = 1 / parameters.bulgeDensity
    radius = Math.pow(Math.random(), densityPower) * parameters.radius * parameters.bulgeSpread
  } else {
    // 나선팔 영역
    radius = Math.sqrt(Math.random()) * parameters.radius
  }
    
  // 블랙홀 영역 제외
  const blackHoleRadiusThreshold = parameters.blackHoleRadius * parameters.radius
  if (radius < blackHoleRadiusThreshold) {
    radius = blackHoleRadiusThreshold + Math.random() * parameters.radius * 0.1
  }
    
  return { radius, isBulge }
}

/**
 * Spin 각도 계산
 */
const calculateSpinAngle = (radius: number, normalizedRadius: number, branchIndex: number) => {
  const spinDirection = parameters.rotationSpeed >= 0 ? 1 : -1
  const effectiveSpin = parameters.spin * spinDirection
  const branchAngle = (branchIndex / parameters.branches) * Math.PI * 2
  const branchTwistRandom = (Math.random() - 0.5) * parameters.branchTwist * normalizedRadius
  const spinAngle = radius * effectiveSpin + branchTwistRandom
    
  return { branchAngle, spinAngle, effectiveSpin }
}

/**
 * 나선팔 오프셋 계산
 */
const calculateArmOffset = (normalizedRadius: number) => {
  const angleFromArm = (Math.random() - 0.5) * Math.PI * 2
  const armDistance = Math.abs(Math.random() - 0.5) * 2 * parameters.armThickness
  const armOffset = Math.cos(angleFromArm) * armDistance * normalizedRadius
    
  return { armOffset, armDistance }
}

/**
 * 기본 랜덤 오프셋 계산 (구형 분포)
 */
const calculateRandomOffset = (normalizedRadius: number, armDistance: number) => {
  const randomValue = Math.pow(Math.random(), parameters.randomnessPower) * normalizedRadius
  const randomAngle1 = Math.random() * Math.PI * 2
  const randomAngle2 = Math.acos(2 * Math.random() - 1)
  const armDistanceFactor = Math.min(armDistance, 1.0)
  const randomnessFactor = parameters.randomness * (1 - armDistanceFactor * CONSTANTS.ARM_DISTANCE_FACTOR)
    
  return {
    x: Math.sin(randomAngle2) * Math.cos(randomAngle1) * randomValue * randomnessFactor,
    y: Math.sin(randomAngle2) * Math.sin(randomAngle1) * randomValue * randomnessFactor,
    z: Math.cos(randomAngle2) * randomValue * randomnessFactor
  }
}

/**
 * 중심부 bulge 랜덤 오프셋 계산
 */
const calculateBulgeRandomOffset = () => {
  const bulgeRandomValue = Math.pow(Math.random(), CONSTANTS.BULGE_RANDOM_POWER) * 
                             parameters.bulgeRandomness * parameters.bulgeSpread
  const bulgeRandomAngle1 = Math.random() * Math.PI * 2
  const bulgeRandomAngle2 = Math.acos(2 * Math.random() - 1)
    
  return {
    x: Math.sin(bulgeRandomAngle2) * Math.cos(bulgeRandomAngle1) * bulgeRandomValue * parameters.radius,
    y: Math.sin(bulgeRandomAngle2) * Math.sin(bulgeRandomAngle1) * bulgeRandomValue * parameters.radius,
    z: Math.cos(bulgeRandomAngle2) * bulgeRandomValue * parameters.radius
  }
}

/**
 * Twist 효과 계산 및 최종 위치 계산
 */
const calculatePosition = (radius: number, normalizedRadius: number, branchAngle: number, spinAngle: number, armOffset: number, effectiveSpin: number, randomOffset: { x: number, y: number, z: number }) => {
  // 3D twist 효과
  const baseTwistAngle = radius * effectiveSpin * parameters.twist * normalizedRadius
  const twistRandomOffset = (Math.random() - 0.5) * CONSTANTS.TWIST_RANDOM_FACTOR * parameters.twist * normalizedRadius
  const twistAngle = baseTwistAngle + twistRandomOffset
    
  // 나선팔 중심 위치
  const baseX = Math.cos(branchAngle + spinAngle) * radius
  const baseZ = Math.sin(branchAngle + spinAngle) * radius
    
  // 나선팔 수직 방향 오프셋
  const perpendicularAngle = branchAngle + spinAngle + CONSTANTS.PERPENDICULAR_ANGLE_OFFSET
  const armOffsetX = Math.cos(perpendicularAngle) * armOffset
  const armOffsetZ = Math.sin(perpendicularAngle) * armOffset
    
  // Y축 주위 twist 적용
  const twistedX = (baseX + armOffsetX) * Math.cos(twistAngle) - (baseZ + armOffsetZ) * Math.sin(twistAngle)
  const twistedZ = (baseX + armOffsetX) * Math.sin(twistAngle) + (baseZ + armOffsetZ) * Math.cos(twistAngle)
    
  // Y축 변위
  const yOffsetRandom = (Math.random() - 0.5) * CONSTANTS.Y_OFFSET_RANDOM_FACTOR * parameters.twist * normalizedRadius
  const twistedY = radius * parameters.branchTwist * Math.sin(twistAngle) * normalizedRadius + yOffsetRandom
    
  return {
    x: twistedX + randomOffset.x,
    y: twistedY + randomOffset.y,
    z: twistedZ + randomOffset.z
  }
}

/**
 * 색상 계산
 */
const calculateColor = (radius: number, normalizedRadius: number, colorInside: THREE.Color, colorOutside: THREE.Color) => {
  const mixedColor = colorInside.clone()
    
  // 블랙홀 근처 밝기 효과
  const blackHoleRadiusThreshold = parameters.blackHoleRadius * parameters.radius
  const blackHoleDistance = CONSTANTS.BLACK_HOLE_DISTANCE_MULTIPLIER * radius / blackHoleRadiusThreshold
  const blackHoleEffect = Math.min(blackHoleDistance, CONSTANTS.BLACK_HOLE_EFFECT_MAX_DISTANCE)
    
  // 색상 그라데이션
  mixedColor.lerp(colorOutside, normalizedRadius)
  mixedColor.multiplyScalar(CONSTANTS.BLACK_HOLE_EFFECT_MULTIPLIER * blackHoleEffect)
    
  return {
    r: mixedColor.r,
    g: mixedColor.g,
    b: mixedColor.b
  }
}

/**
 * Material Creation
 */

/**
 * 별 Material 생성
 */
const createStarMaterial = () => {
  const mat = new THREE.PointsMaterial()
  mat.map = starTexture
  mat.size = parameters.size
  mat.sizeAttenuation = true
  mat.depthWrite = false
  mat.alphaTest = CONSTANTS.ALPHA_TEST_THRESHOLD
  mat.vertexColors = true
  return mat
}

/**
 * 블랙홀 Material 생성
 */
const createBlackHoleMaterial = () => {
  return new THREE.MeshStandardMaterial({
    map: blackHoleColorTexture,
    normalMap: blackHoleNormalTexture,
    displacementMap: blackHoleDisplacementTexture,
    displacementScale: 0.2,
    roughness: 0.5,
    transparent: true,
    opacity: 1.0,
    alphaTest: CONSTANTS.BLACK_HOLE_ALPHA_TEST,
    depthWrite: true,
    side: THREE.DoubleSide,
  })
}

/**
 * Galaxy Generation
 */

/**
 * 갤럭시 생성
 */
const generateGalaxy = () => {
  // 기존 갤럭시 제거
  if (points !== null && geometry !== null && material !== null) {
    geometry.dispose()
    material.dispose()
    scene.remove(points)
  }

  // Geometry 생성
  geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(parameters.count * 3)
  const colors = new Float32Array(parameters.count * 3)

  const colorInside = new THREE.Color(parameters.insideColor)
  const colorOutside = new THREE.Color(parameters.outsideColor)

  // 각 별의 위치와 색상 계산
  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3

    // 반경 계산
    const { radius, isBulge } = calculateRadius()
    const normalizedRadius = radius / parameters.radius

    // Spin 각도 계산
    const branchIndex = i % parameters.branches
    const { branchAngle, spinAngle, effectiveSpin } = calculateSpinAngle(radius, normalizedRadius, branchIndex)

    // 나선팔 오프셋 계산
    const { armOffset, armDistance } = calculateArmOffset(normalizedRadius)

    // 기본 랜덤 오프셋 계산
    let randomOffset = calculateRandomOffset(normalizedRadius, armDistance)

    // 중심부 bulge 랜덤 오프셋 추가
    if (isBulge) {
      const bulgeOffset = calculateBulgeRandomOffset()
      randomOffset.x += bulgeOffset.x
      randomOffset.y += bulgeOffset.y
      randomOffset.z += bulgeOffset.z
    }

    // 최종 위치 계산
    const position = calculatePosition(radius, normalizedRadius, branchAngle, spinAngle, armOffset, effectiveSpin, randomOffset)
    positions[i3] = position.x
    positions[i3 + 1] = position.y
    positions[i3 + 2] = position.z

    // 색상 계산
    const color = calculateColor(radius, normalizedRadius, colorInside, colorOutside)
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  // Geometry 속성 설정
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  // Material 및 Points 생성
  material = createStarMaterial()
  points = new THREE.Points(geometry, material)
  scene.add(points)
    
  // 블랙홀 업데이트
  updateBlackHole()
}

/**
 * 블랙홀 업데이트
 */
const updateBlackHole = () => {
  // 기존 블랙홀 제거
  if (blackHoleMesh !== null && blackHoleGeometry !== null && blackHoleMaterial !== null) {
    blackHoleGeometry.dispose()
    blackHoleMaterial.dispose()
    scene.remove(blackHoleMesh)
  }
    
  // 블랙홀 크기 계산
  const blackHoleSize = parameters.blackHoleRadius * parameters.radius
    
  // 블랙홀이 너무 작으면 생성하지 않음
  if (blackHoleSize <= 0) {
    return
  }
    
  // 블랙홀 Geometry 생성
  blackHoleGeometry = new THREE.SphereGeometry(blackHoleSize, CONSTANTS.SPHERE_SEGMENTS, CONSTANTS.SPHERE_SEGMENTS)
    
  // 블랙홀 Material 생성
  blackHoleMaterial = createBlackHoleMaterial()
    
  // 블랙홀 Mesh 생성
  blackHoleMesh = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial)
  blackHoleMesh.position.set(0, 0, 0)
  scene.add(blackHoleMesh)
}

/**
 * GUI Setup
 */
const setupGUI = () => {
  const galaxyFolder = gui.addFolder('Galaxy')
    
  // Stars 폴더
  const starFolder = galaxyFolder.addFolder('Stars')
  starFolder.add(parameters, 'count').min(100).max(1000000).step(100).name('Stars Count').onFinishChange(generateGalaxy)
  starFolder.add(parameters, 'size').min(0.01).max(0.1).step(0.001).name('Stars Size').onFinishChange(generateGalaxy)
  starFolder.addColor(parameters, 'insideColor').name('Inside Color').onFinishChange(generateGalaxy)
  starFolder.addColor(parameters, 'outsideColor').name('Outside Color').onFinishChange(generateGalaxy)
    
  // Spiral Galaxy 폴더
  const spiralGalaxyFolder = galaxyFolder.addFolder('Spiral Galaxy')
  spiralGalaxyFolder.add(parameters, 'radius').min(0.01).max(40).step(0.1).name('Galaxy Radius').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'branches').min(2).max(20).step(1).name('Galaxy Branches').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'spin').min(-1).max(1).step(0.001).name('Spin').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'randomness').min(0).max(10).step(0.001).name('Randomness').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'randomnessPower').min(0).max(100).step(0.001).name('Randomness Power').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'twist').min(0).max(2).step(0.01).name('Twist').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'branchTwist').min(-1).max(1).step(0.01).name('Branch Twist').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'armThickness').min(0).max(100).step(0.01).name('Arm Thickness').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'bulgeSize').min(0).max(1).step(0.01).name('Bulge Size').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'bulgeDensity').min(1).max(10).step(0.1).name('Bulge Density').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'bulgeSpread').min(0.1).max(1.5).step(0.01).name('Bulge Spread').onFinishChange(generateGalaxy)
  spiralGalaxyFolder.add(parameters, 'bulgeRandomness').min(0).max(10).step(0.01).name('Bulge Randomness').onFinishChange(generateGalaxy)
    
  // Black Hole 폴더
  const blackHoleFolder = galaxyFolder.addFolder('Black Hole')
  blackHoleFolder.add(parameters, 'blackHoleRadius').min(0).max(0.2).step(0.01).name('Black Hole Radius').onFinishChange(() => {
    generateGalaxy()
    updateBlackHole()
  })
    
  // Rotation 폴더
  const rotationFolder = galaxyFolder.addFolder('Rotation')
  rotationFolder.add(parameters, 'rotationSpeed').min(-2).max(2).step(0.01).name('Rotation Speed').onFinishChange(generateGalaxy)
  rotationFolder.add(parameters, 'isRotating').name('Rotate Galaxy')
}

/**
 * Scene Setup
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
    
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
    
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  CONSTANTS.CAMERA_FOV,
  sizes.width / sizes.height,
  CONSTANTS.CAMERA_NEAR,
  CONSTANTS.CAMERA_FAR
)
camera.position.set(
  CONSTANTS.CAMERA_INITIAL_POSITION.x,
  CONSTANTS.CAMERA_INITIAL_POSITION.y,
  CONSTANTS.CAMERA_INITIAL_POSITION.z
)
scene.add(camera)

/**
 * Axes Helper
 */
const axesHelper = new THREE.AxesHelper()
axesHelper.scale.set(50, 50, 50)
axesHelper.visible = false
scene.add(axesHelper)

window.addEventListener('keydown', (event) => {
  if (event.key === 'o') {
    axesHelper.visible = !axesHelper.visible
  }
})

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas as HTMLElement)
controls.enableDamping = true

/**
 * Renderer
 */
if (!canvas) {
  throw new Error('Canvas element is required for WebGLRenderer')
}

const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Double Click Fullscreen
 */
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
 * Animation
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // 갤럭시 회전
  if (parameters.isRotating) {
    if (points !== null) {
      points.rotation.y = elapsedTime * parameters.rotationSpeed
    }
        
    if (blackHoleMesh !== null) {
      blackHoleMesh.rotation.y = elapsedTime * parameters.rotationSpeed
    }
  }

  // 컨트롤 업데이트
  controls.update()

  // 렌더링
  renderer.render(scene, camera)

  // 다음 프레임 요청
  window.requestAnimationFrame(tick)
}

/**
 * Initialization
 */
generateGalaxy()
setupGUI()
tick()

