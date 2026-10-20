import { createApp }    from 'vue'
import { createPinia }  from 'pinia'
import App              from './App.vue'
import router           from './router'
import '@fontsource/russo-one/400.css'
import '@fontsource/chakra-petch/400.css'
import '@fontsource/chakra-petch/500.css'
import '@fontsource/chakra-petch/600.css'
import '@fontsource/chakra-petch/700.css'
import '@fontsource-variable/jetbrains-mono'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
