import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {
  Expand,
  Fold,
  User,
  Calendar,
  Setting,
  Close,
  Clock,
  TrendCharts,
  Menu,
  UserFilled,
  Avatar,
  SwitchButton,
  Box,
} from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/global.scss'

const app = createApp(App)

app.component('Expand', Expand)
app.component('Fold', Fold)
app.component('User', User)
app.component('Calendar', Calendar)
app.component('Setting', Setting)
app.component('Close', Close)
app.component('Clock', Clock)
app.component('TrendCharts', TrendCharts)
app.component('Menu', Menu)
app.component('UserFilled', UserFilled)
app.component('Avatar', Avatar)
app.component('SwitchButton', SwitchButton)
app.component('Box', Box)

app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.mount('#app')
