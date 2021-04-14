<template>
  <a-button type="primary" size="large">
      <router-link class="clickable" replace to="/account/add">添加账户</router-link>
  </a-button>
  <a-table
    :columns="columns"
    :row-key="record => record.id"
    :data-source="accounts"
    :loading="loading"
    style="margin-top:8px;"
    :pagination="false"
  >
    <template #time="{ record }">
      <span style="font-size:12px;">
        创建: {{record.create_at}}
        <br />
        编辑: {{record.update_at}}
      </span>
    </template>
    <template #action="{ record, index }">
      <a-button type="default">
          <router-link class="clickable" replace :to="{ name: 'AccountEdit', params: { id: record.id }}">编辑</router-link>
      </a-button>
      &nbsp;
      <a-button type="danger" @click="deleteAccountFunc(record.id, index)">
          删除
      </a-button>
    </template>
  </a-table>
</template>

<script lang=ts>
import { message } from 'ant-design-vue'
import { defineComponent, ref } from 'vue'
import { accountDelete, accountList } from '/@/api/account'

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
    title: '时间',
    key: 'time',
    slots: { customRender: 'time' }
  },
  {
    title: '上次记账',
    dataIndex: 'change_at'
  },
  {
    title: '操作',
    key: 'action',
    slots: { customRender: 'action' }
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

    const deleteAccountFunc = (id: number, index: number) => {
      accountDelete(id).then(response => {
        console.log(response.data)
        // 显示 message 移除数据
        accounts.value.splice(index, 1)
        message.success(response.data.message)
      })
    }

    return {
      accounts,
      columns,
      loading,
      deleteAccountFunc
    }
  }
})
</script>
