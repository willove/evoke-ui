/**
 * 菜单与路由同源配置（单一事实源）
 * 顶级项 root：一级导航锚点（double-sidebar / mixed / mixed-double 的第一级），
 * 有 children 时 path 指向首个子页（路由 redirect 自动落地）。
 * title 为 i18n 键（src/locales 两个字典同名）。
 */
import DashboardPage from './pages/Dashboard.vue'
import MembersPage from './pages/Members.vue'
import OrdersPage from './pages/Orders.vue'
import ProfileFormPage from './pages/ProfileForm.vue'
import AboutPage from './pages/About.vue'

export const MENU = [
  {
    key: 'dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    title: 'menu.dashboard',
  },
  {
    key: 'list',
    path: '/list/members',
    icon: 'file-list',
    title: 'menu.list',
    children: [
      { key: 'members', path: '/list/members', icon: 'user', title: 'menu.members' },
      { key: 'orders', path: '/list/orders', icon: 'file', title: 'menu.orders' },
    ],
  },
  {
    key: 'form',
    path: '/form/profile',
    icon: 'edit',
    title: 'menu.form',
    children: [{ key: 'profile', path: '/form/profile', icon: 'profile', title: 'menu.profile' }],
  },
  {
    key: 'system',
    path: '/system/about',
    icon: 'database',
    title: 'menu.system',
    children: [{ key: 'about', path: '/system/about', icon: 'info', title: 'menu.about' }],
  },
]

export const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    component: DashboardPage,
    meta: { titleKey: 'menu.dashboard', root: '/dashboard' },
  },
  { path: '/list', redirect: '/list/members' },
  {
    path: '/list/members',
    component: MembersPage,
    meta: { titleKey: 'menu.members', root: '/list' },
  },
  {
    path: '/list/orders',
    component: OrdersPage,
    meta: { titleKey: 'menu.orders', root: '/list' },
  },
  { path: '/form', redirect: '/form/profile' },
  {
    path: '/form/profile',
    component: ProfileFormPage,
    meta: { titleKey: 'menu.profile', root: '/form' },
  },
  { path: '/system', redirect: '/system/about' },
  {
    path: '/system/about',
    component: AboutPage,
    meta: { titleKey: 'menu.about', root: '/system' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]
