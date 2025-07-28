import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'


const alias = {
    '@renderer': resolve(__dirname, './src/renderer/'),
    '@common': resolve(__dirname, './src/common/'),
    '@main': resolve(__dirname, './src/main/'),
}


export default defineConfig({
    main: {
        resolve: {
            alias
        },
        plugins: [externalizeDepsPlugin()]
    },
    
    preload: {
        resolve: {
            alias
        },
        plugins: [externalizeDepsPlugin()]
    },

    renderer: {
        resolve: {
            alias
        },
        plugins: [react()]
    },
})
