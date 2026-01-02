import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distDir = join(__dirname, '../dist')

// HTML 파일을 디렉토리 구조로 변경
const htmlFiles = ['spiral-galaxy.html', '3d-world.html']

htmlFiles.forEach((htmlFile) => {
  const htmlPath = join(distDir, htmlFile)
  
  if (!existsSync(htmlPath)) {
    console.warn(`File not found: ${htmlFile}`)
    return
  }
  
  // 디렉토리명 (확장자 제거)
  const dirName = htmlFile.replace('.html', '')
  const dirPath = join(distDir, dirName)
  const indexHtmlPath = join(dirPath, 'index.html')
  
  // 디렉토리 생성
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
  
  // HTML 파일 읽기
  const htmlContent = readFileSync(htmlPath, 'utf-8')
  
  // 상대 경로 수정 (./assets -> ../assets, ./fonts -> ../fonts 등)
  // 단, ./spiral-galaxy/, ./3d-world/ 같은 다른 페이지 링크는 그대로 유지
  let modifiedContent = htmlContent
  
  // assets, fonts, static 리소스 경로 수정
  modifiedContent = modifiedContent
    .replace(/href="\.\/assets\//g, 'href="../assets/')
    .replace(/src="\.\/assets\//g, 'src="../assets/')
    .replace(/href="\.\/fonts\//g, 'href="../fonts/')
    .replace(/src="\.\/fonts\//g, 'src="../fonts/')
    .replace(/href="\.\/3d-world\//g, 'href="../3d-world/')
    .replace(/src="\.\/3d-world\//g, 'src="../3d-world/')
    .replace(/href="\.\/spiral-galaxy\//g, 'href="../spiral-galaxy/')
    .replace(/src="\.\/spiral-galaxy\//g, 'src="../spiral-galaxy/')
  
  // 스크립트와 스타일 경로 수정 (./index.ts -> ../index.ts 등)
  modifiedContent = modifiedContent
    .replace(/src="\.\/([^"]+\.(ts|js|css))"/g, 'src="../$1"')
    .replace(/href="\.\/([^"]+\.css)"/g, 'href="../$1"')
  
  // 컨트롤러 경로 수정
  modifiedContent = modifiedContent
    .replace(/src="\.\/controller\//g, 'src="../controller/')
  
  // index.html로 저장
  writeFileSync(indexHtmlPath, modifiedContent, 'utf-8')
  
  // 원본 HTML 파일 삭제
  unlinkSync(htmlPath)
  
  console.log(`✓ Converted ${htmlFile} → ${dirName}/index.html`)
})

console.log('✓ Post-build script completed')

