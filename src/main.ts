import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './app/router'
import './assets/styles/main.css'
import { initGlobalErrorTracking } from './shared/services/error-tracking.service'

const app = createApp(App)

initGlobalErrorTracking(app)

app.use(createPinia())
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})

