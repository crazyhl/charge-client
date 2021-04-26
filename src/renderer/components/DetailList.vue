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
    </a-table>
  </div>
</template>

<script lang=ts>
import { defineComponent, ref, computed } from 'vue'
import { TableState, TableStateFilters } from 'ant-design-vue/es/table/interface';
import { chargeDetailList } from '../api/charge_detail';

type Pagination = TableState['pagination'];
export default defineComponent({
  setup() {
    const page = ref(1)
    const pageSize = 2
    const total = ref(0)
    const loading = ref(false)
    const columns = [
      {
        title: 'Id',
        dataIndex: 'id',
      },
    ];
    const dataSource = ref([])
    const handleTableChange = (pagination : Pagination, filters :TableStateFilters, sorter : any) => {
      console.log("params", pagination, filters, sorter)
      page.value = pagination?.current ? pagination?.current : 1
    }

    chargeDetailList(page.value, pageSize).then(response => {
      console.log("response", response)
      const data = response.data.data
      dataSource.value = data.data
      total.value = 11 //data.total
      console.log(total.value)
    })
    

    const pagination = computed(() => ({
      total: total.value,
      current: page.value,
      pageSize: pageSize,
    }));

    return {
      columns,
      loading,
      dataSource,
      handleTableChange,
      pagination,
    }
  }
})
</script>
