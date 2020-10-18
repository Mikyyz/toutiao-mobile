import Vue from 'vue'
import VueRouter from 'vue-router';

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login')
  },
  {
    path: '/',
    component: () => import('@/views/layout'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/home')
      },
      {
        path: '/qa',
        name: 'qa',
        component: () => import('@/views/qa')
      },
      {
        path: '/video',
        name: 'video',
        component: () => import('@/views/video')
      },
      {
        path: '/my',
        name: 'my',
        component: () => import('@/views/my')
      }
    ]
  }, 
  {
    path: '/user_agreement',
    name: 'user_agreement',
    component: () => import('@/views/login/userAgreement')
  },
  {
    path: '/privacy_protection',
    name: 'privacy_protection',
    component: () => import('@/views/login/privacyProtection')
  },
  {
    path: '/login-question',
    name: 'login-question',
    component: () => import('@/views/login/loginQuestion')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router