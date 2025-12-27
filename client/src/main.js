import { createApp } from 'vue'
import App from './App.vue'
import router from './router/routes'
import store from './store/authStore'
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)

app.use(router)
app.use(store)
app.use(vuetify)

app.mount('#app')
