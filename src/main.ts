import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { router } from './router';
import App from './App.vue';

// Vuetify
import 'vuetify/styles';
import { md3 } from 'vuetify/blueprints';
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify({
  blueprint: md3,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#777C6D',
          secondary: '#d4d5c8ff',
          error: '#d24c4cff',
          info: '#2196f3',
          success: '#5ea250ff',
          warning: '#f0c542ff',
          grey: '#7d7d7dff',
          surface: '#f0f0f0ff'
        }
      }
    }
  }
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);

app.mount('#app');