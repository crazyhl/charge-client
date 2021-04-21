import { createRouter, createMemoryHistory } from 'vue-router'
import Home from '/@/components/Home.vue'
import About from '/@/components/About.vue'
import AccountList from '/@/components/AccountList.vue'
import AccountAdd from '/@/components/AccountAdd.vue'
import AccountEdit from '/@/components/AccountEdit.vue'
import CategoryList from '/@/components/CategoryList.vue'
import CategoryAdd from '/@/components/CategoryAdd.vue'
import CategoryEdit from '/@/components/CategoryEdit.vue'
import DetailList from '/@/components/DetailList.vue'
import DetailAdd from '/@/components/DetailAdd.vue'

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
    },
    {
      path: '/category/:id/edit',
      name: 'CategoryEdit',
      component: CategoryEdit
    },
    {
      path: '/charge-details',
      name: 'ChargeDetailList',
      component: DetailList
    },
    {
      path: '/charge-details/add',
      name: 'ChargeDetailAdd',
      component: DetailAdd
    }
  ]
})

export default router
