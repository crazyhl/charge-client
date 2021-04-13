<template>
  <a-button type="primary" size="large">
      <router-link class="clickable" replace to="/account/add">添加账户</router-link>
  </a-button>
  <a-table
    :columns="columns"
    :row-key="record => record.id"
    :data-source="accounts"
    :loading="loading"
    style="margin-top:16px;"
  >
  </a-table>
</template>

<script lang=ts>
import { defineComponent, ref } from 'vue'
import { accountList } from '/@/api/account'

const columns = [
  {
    title: 'ID',
    dataIndex: 'id'
  },
  {
    title: '名称',
    dataIndex: 'name'
  }
]

export default defineComponent({
  setup() {
    const accounts = ref([])
    const loading = ref(true)
    accountList().then(response => {
      loading.value = false
      const data = response.data
      if (data.status === 0) {
        if (data.data !== null) {
          accounts.value = data.data
          console.log(accounts.value)
        }
      }
    })
    return {
      accounts,
      columns,
      loading
    }
  }
})
</script>
