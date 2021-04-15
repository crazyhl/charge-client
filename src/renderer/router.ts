import { createRouter, createMemoryHistory } from 'vue-router'
import Home from '/@/components/Home.vue'
import About from '/@/components/About.vue'
import AccountList from '/@/components/AccountList.vue'
import AccountAdd from '/@/components/AccountAdd.vue'
import AccountEdit from '/@/components/AccountEdit.vue'
import CategoryList from '/@/components/CategoryList.vue'
import CategoryAdd from '/@/components/CategoryAdd.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/about',
      component: About
    },
    {
      path: '/accounts',
      name: 'accountList',
      component: AccountList
    },
    {
      path: '/account/add',
      name: 'AccountAdd',
      component: AccountAdd
    },
    {
      path: '/account/:id/edit',
      name: 'AccountEdit',
      component: AccountEdit
    },
    {
      path: '/categories',
      name: 'CategoryList',
      component: CategoryList
    },
    {
      path: '/category/add',
      name: 'CategoryAdd',
      component: CategoryAdd
    }
  ]
})

export default router
