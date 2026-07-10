import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('./pages/HomePage.vue') },
    { path: '/brands', name: 'brands', component: () => import('./pages/BrandsPage.vue') },
    { path: '/brands/:id', name: 'brand-detail', component: () => import('./pages/BrandDetailPage.vue'), props: true },
    { path: '/collections', name: 'collections', component: () => import('./pages/CollectionsPage.vue') },
    { path: '/cart', name: 'cart', component: () => import('./pages/CartPage.vue') },
    { path: '/docs', name: 'docs', component: () => import('./pages/DocsPage.vue') },
    { path: '/playground', name: 'playground', component: () => import('./pages/PlaygroundPage.vue') },
    { path: '/contribute', name: 'contribute', component: () => import('./pages/ContributePage.vue') },
    { path: '/quality', name: 'quality', component: () => import('./pages/QualityPage.vue') },
    { path: '/legal', name: 'legal', component: () => import('./pages/LegalPage.vue') },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
