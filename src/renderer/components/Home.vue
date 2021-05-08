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
  </div>
</template>

<script lang=ts>
import { defineComponent, ref } from 'vue'
import { summaryMonthList } from '../api/statistics'
import moment from 'moment'
import 'moment/dist/locale/zh-cn';

export default defineComponent({
  components: {
  },
  setup(props, context) {
    const currentMonth = moment().format("YYYYMM")
    const monthList = ref<string[]>([currentMonth])
    const selectMonth = ref(currentMonth)
    summaryMonthList().then(response => {
      const responseMonthList = response.data.data
      responseMonthList.forEach((date: string) => {
        if(monthList.value.indexOf(date) === -1) {
          monthList.value.push(date)
        }
      });
    })

    const monthSelectorHandleChange = (value: string) => {
      console.log(`selected ${value}`);
    };

    return {
      monthList,
      selectMonth,
      monthSelectorHandleChange,
    }
  }
})
</script>
