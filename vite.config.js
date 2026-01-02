import restart from 'vite-plugin-restart'
import { dirname, resolve } from 'path'

export default {
    root: 'src/', // Sources files (typically where index.html is)
    publicDir: '../static/', // Path from "root" to static assets (files that are served as they are)
    server:
    {
        host: true, // Open to local network and display URL
        port: 4141,
        // open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
    },
    build:
    {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap,
        rollupOptions: {
            input: {
                main: resolve(__dirname, './src/index.html'),
                '3d-world': resolve(__dirname, './src/3d-world.html'),
            }
        }
    },
    plugins:
    [
        restart({ restart: [ '../static/**', ] }) // Restart server on static file change
    ],
}