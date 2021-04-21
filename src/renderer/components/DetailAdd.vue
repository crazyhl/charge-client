<template>
    <a-typography-title :level="3">新增记账</a-typography-title>
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item label="账户">
        <a-select
          v-model:value="formState.accountId"
          style="width: 120px"
          ref="select"
        >
          <a-select-option :value="account.id" v-for="account in accounts" :key="account.id">{{account.name}}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="类型">
        <a-radio-group v-model:value="formState.type" @change="typeChange">
          <a-radio :value="0">收入</a-radio>
          <a-radio :value="1">支出</a-radio>
          <a-radio :value="2">借</a-radio>
          <a-radio :value="3">还</a-radio>
          <a-radio :value="4">转</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="分类" v-if="categoryMap[formState.type] !== undefined">
        <a-select
          v-model:value="formState.categoryId"
          style="width: 120px"
          ref="select"
        >
          <a-select-option :value="category.id" v-for="category in categoryMap[formState.type]"
            :key="category.id"
          >
            {{category.name}}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="排序">
        <a-input v-model:value.number="formState.sort"   :precision="0" type="number" />
      </a-form-item>
      <a-form-item :wrapper-col="{ span: 14, offset: 2 }">
        <a-button type="primary" @click="onSubmit">保存</a-button>
      </a-form-item>
    </a-form>
</template>

<script lang=ts>
import { defineComponent, reactive, ref, toRaw, UnwrapRef } from 'vue'
import { AddChargetDetailFormStat } from '/@/data/interface'
import { accountList } from '/@/api/account'
import { categoryList } from '/@/api/category'

export default defineComponent({
  setup() {
    // 获取账户列表
    const accounts = ref([])
    accountList().then(response => {
      const data = response.data
      if (data.status === 0) {
        if (data.data !== null) {
          accounts.value = data.data
          formState.accountId = accounts.value[0].id
        }
      }
    })

    // 类型改变后重置分类
    const typeChange = () => {
      if (categoryMap.value[formState.type] !== undefined) {
        formState.categoryId = categoryMap.value[formState.type][0].id
      } else {
        formState.categoryId = 0
      }
    }
    // 获取分类列表
    const categoryMap = ref({})
    categoryList().then(response => {
      categoryMap.value = response.data.data
      typeChange()
    })
    // 表单
    const formState: UnwrapRef<AddChargetDetailFormStat> = reactive({
      accountId: 0,
      type: 0,
      categoryId: 0
    })
    // 提交事件
    const onSubmit = () => {
      console.log('values', formState, toRaw(formState))
    }

    return {
      labelCol: { span: 2 },
      wrapperCol: { span: 14 },
      formState,
      onSubmit,
      accounts,
      categoryMap,
      typeChange
    }
  }
})


</script>
