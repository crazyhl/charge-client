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
  },
  {
    title: '现金余额',
    dataIndex: 'cash'
  },
  {
    title: '信用账户',
    dataIndex: 'has_credit',
    customRender: (val: { text: boolean }) => {
      return val.text === true ? '是' : '否'
    }
  },
  {
    title: '信用余额',
    dataIndex: 'credit'
  },
  {
    title: '排序',
    dataIndex: 'sort'
  },
  {
    title: '创建',
    dataIndex: 'create_at'
  },
  {
    title: '修改',
    dataIndex: 'update_at'
  },
  {
    title: '上次记账',
    dataIndex: 'change_at'
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
