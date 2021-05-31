<template>
  <div>
    选择月份: <a-select
      v-model:value="selectMonth"
      style="width: 120px"
      ref="select"
      @change="monthSelectorHandleChange"
    >
      <a-select-option :value="month" v-for="month in monthList" :key="month">{{month}}</a-select-option>
    </a-select>
    <a-typography-title :level="5" style="margin-top:8px;">统计信息</a-typography-title>
    <a-descriptions v-for="(monthData, index) in monthDataList" :key="index">
      <a-descriptions-item label="账户">{{monthData.account.name}}</a-descriptions-item>
      <a-descriptions-item label="收入">{{monthData.cash_in}}</a-descriptions-item>
      <a-descriptions-item label="支出">{{monthData.cash_out}}</a-descriptions-item>
    </a-descriptions>
    <a-typography-title :level="5" style="margin-top:8px;">欠款信息</a-typography-title>
    <a-descriptions>
      <a-descriptions-item label="未还">{{totalUnRepaidData.total_un_repaid}}</a-descriptions-item>
      <a-descriptions-item label="欠款">{{totalUnRepaidData.credit_out}}</a-descriptions-item>
      <a-descriptions-item label="还款">{{totalUnRepaidData.credit_in}}</a-descriptions-item>
    </a-descriptions>
    <a-typography-title :level="5" style="margin-top:8px;">分类统计</a-typography-title>
    <a-descriptions v-for="(categoryData, index) in monthCategoryDetailList" :key="index">
      <a-descriptions-item label="分类名称">
        <a-button type="link"><router-link class="clickable" replace :to="{ name: 'ChargeDetailWithCategoryMonthList', params: { category: categoryData.category.id, month: selectMonth }}">{{categoryData.category.name}}</router-link></a-button>
        （
        <span style="color:#f1939c">
          <template v-if="categoryData.type == 1">
            支出
          </template>
          <template v-else-if="categoryData.type == 2">
            借
          </template>
        </span>
        ）
      </a-descriptions-item>
      <a-descriptions-item label="金额" :cols="2">{{categoryData.money}}</a-descriptions-item>
    </a-descriptions>
  </div>
</template>

<script lang=ts>
import { defineComponent, ref } from 'vue'
import { expensesCategory, summaryMonthData, summaryMonthList,summaryUnRepaidData } from '../api/statistics'
import moment from 'moment'
import 'moment/dist/locale/zh-cn';

export default defineComponent({
  components: {
  },
  setup(props, context) {
    const currentMonth = moment().format("YYYYMM")
    const monthList = ref<string[]>([currentMonth])
    const selectMonth = ref(currentMonth)
    const monthDataList = ref([])
    const monthCategoryDetailList = ref([])
    const totalUnRepaidData = ref({
      'credit_in': 0,
      'credit_out': 0,
      'total_un_repaid': 0,
    })
    summaryMonthList().then(response => {
      const responseMonthList = response.data.data
      responseMonthList.forEach((date: string) => {
        if(monthList.value.indexOf(date) === -1) {
          monthList.value.push(date)
        }
      });
    })

    const monthSelectorHandleChange = (value: string) => {
      summaryMonthData(value).then(response => {
        monthDataList.value = response.data.data
        console.log(monthDataList.value)
      })
      expensesCategory(value).then(response => {
        console.log(response)
        monthCategoryDetailList.value = response.data.data
      })
    };

    monthSelectorHandleChange(currentMonth)

    summaryUnRepaidData().then(response => {
      console.log("summaryUnRepaidData", response.data.data)
      totalUnRepaidData.value = response.data.data
    })

    return {
      monthList,
      selectMonth,
      monthSelectorHandleChange,
      monthDataList,
      monthCategoryDetailList,
      totalUnRepaidData,
    }
  }
})
</script>
