import { createRouter, createMemoryHistory } from 'vue-router'
import Home from '/@/components/Home.vue'
import About from '/@/components/About.vue'
import AccountList from '/@/components/AccountList.vue'
import AccountAdd from '/@/components/AccountAdd.vue'
import AccountEdit from '/@/components/AccountEdit.vue'

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
    }
  ]
})

export default router
