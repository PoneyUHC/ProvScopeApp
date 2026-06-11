import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const root = resolve(__dirname, '..')

const alias = {
    '@renderer': resolve(root, 'src/renderer/'),
    '@common': resolve(root, 'src/common/'),
    '@main': resolve(root, 'src/main/'),
}

export default defineConfig({
    main: {
        resolve: { alias },
        plugins: [externalizeDepsPlugin()]
    },

    preload: {
        resolve: { alias },
        plugins: [externalizeDepsPlugin()]
    },

    renderer: {
        resolve: { alias },
        plugins: [react()],
        css: {
            postcss: __dirname
        }
    },
})
