import { defineConfig } from 'vite'

// Allow preview to accept requests with these Host headers (used behind nginx)
export default defineConfig({
  preview: {
    allowedHosts: ['gae-jp.net', 'www.gae-jp.net', '127.0.0.1', 'localhost']
  }
})
