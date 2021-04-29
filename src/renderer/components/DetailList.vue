<template>
  <div>
    <a-typography-title :level="3">记账列表</a-typography-title>
    <a-button type="primary" size="large">
      <router-link class="clickable" replace to="/charge-details/add">记账</router-link>
    </a-button>
    <a-table
      :columns="columns"
      :row-key="record => record.id"
      :data-source="dataSource"
      :pagination="pagination"
      :loading="loading"
      @change="handleTableChange"
    >
      <template #type="{ text }">
        <template v-if="text == 0">
          收入
        </template>
        <template v-else-if="text == 1">
          支出
        </template>
        <template v-else-if="text == 2">
          借
        </template>
        <template v-else-if="text == 3">
          还
        </template>
        <template v-else>
          转
        </template>
      </template>

      <template #expandedRowRender="{ record }">
        <p v-if="record.description !=''">说明: {{record.description}}</p>
        <template v-if="record.type == 0">
          没有更多信息
        </template>
        <template v-else-if="record.type == 1">
          没有更多信息
        </template>
        <template v-else-if="record.type == 2">
          <template v-if="record.repaid_detail == undefined">
            <span style="color:#c04851">未还</span>
          </template>
          <template v-else>
            <span style="color:#346c9c">已还：时间: {{record.repaid_detail.create_at}}</span>
          </template>
        </template>
        <template v-else-if="record.type == 3">
          还款账户: {{record.repay_account.name}}
        </template>
        <template v-else>
          转入账户: {{record.transfer_account.name}}
        </template>
      </template>
      <template #action="{ record, index }">
        <a-button type="default">
            <router-link class="clickable" replace :to="{ name: 'AccountEdit', params: { id: record.id }}">编辑</router-link>
        </a-button>
        &nbsp;
        <a-button type="danger" @click="deleteDetailFunc(record.id, index)">
            删除
        </a-button>
      </template>
    </a-table>
  </div>
</template>

<script lang=ts>
import { defineComponent, ref, computed } from 'vue'
import { TableState, TableStateFilters } from 'ant-design-vue/es/table/interface'
import { chargeDetailDelete, chargeDetailList } from '../api/charge_detail'
import { chargeDetail } from '../data/interface'
import { accountDelete } from '../api/account';
import { message } from 'ant-design-vue';

type Pagination = TableState['pagination'];
export default defineComponent({
  setup() {
    const page = ref(1)
    const pageSize = 15
    const total = ref(0)
    const loading = ref(false)
    const columns = [
      {
        title: '账户',
        dataIndex: 'account.name'
      },
      {
        title: '类型',
        dataIndex: 'type',
        slots: { customRender: 'type' }
      },
      {
        title: '分类',
        dataIndex: 'category.name'
      },
      {
        title: '金额',
        dataIndex: 'money'
      },
      {
        title: '时间',
        dataIndex: 'create_at'
      },
      {
        title: '操作',
        key: 'action',
        slots: { customRender: 'action' }
      }
    ]
    const dataSource = ref<chargeDetail[]>([])
    const handleTableChange = (pagination : Pagination, filters :TableStateFilters, sorter : any) => {
      page.value = pagination?.current ? pagination?.current : 1
      chargeDetailList(page.value, pageSize).then(response => {
        const data = response.data.data
        dataSource.value = data.data
        total.value = data.total
      })
    }
    chargeDetailList(page.value, pageSize).then(response => {
      const data = response.data.data
      dataSource.value = data.data
      total.value = data.total
    })

    const pagination = computed(() => ({
      total: total.value,
      current: page.value,
      pageSize: pageSize
    }))

    // 删除详情方法
    const deleteDetailFunc = (id: number, index: number) => {
      chargeDetailDelete(id).then(response => {
        console.log(response.data)
        // 显示 message 移除数据
        dataSource.value.splice(index, 1)
        message.success(response.data.message)
      })
    }

    return {
      columns,
      loading,
      dataSource,
      handleTableChange,
      pagination,
      deleteDetailFunc
    }
  }
})
</script>
