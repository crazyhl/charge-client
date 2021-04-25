<template>
    <a-typography-title :level="3">新增记账{{typeof categoryMap}}</a-typography-title>
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item label="账户">
        <a-select
          v-model:value="formState.account_id"
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
      <a-form-item label="分类" v-if="categoryMap !== undefined && categoryMap.hasOwnProperty(formState.type) && categoryMap[formState.type] !== undefined">
        <a-select
          v-model:value="formState.category_id"
          ref="select"
        >
          <a-select-option :value="category.id" v-for="category in categoryMap[formState.type]"
            :key="category.id"
          >
            {{category.name}}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="金额">
        <a-input v-model:value.number="formState.money" :precision="3" type="number" />
      </a-form-item>
      <a-form-item label="说明">
        <a-textarea
          v-model:value="formState.description"
          placeholder=""
          auto-size
        />
      </a-form-item>
      <template v-if="formState.type === 3">
        <a-form-item label="还款账户">
          <a-select
            v-model:value="formState.repay_account_id"
            ref="select"
            @change="handleRepayAccountChange"
          >
            <a-select-option :value="account.id" v-for="account in accounts" :key="account.id">{{account.name}}</a-select-option>
          </a-select>
          <a-form-item label="Activity type">
            <a-checkbox-group v-model:value="formState.repay_detail_ids">
              <a-checkbox value="1" name="type">Online</a-checkbox>
              <a-checkbox value="2" name="type">Promotion</a-checkbox>
              <a-checkbox value="3" name="type">Offline</a-checkbox>
            </a-checkbox-group>
          </a-form-item>
        </a-form-item>
      </template>
      <template v-if="formState.type === 4">
        <a-form-item label="转账账户">
          <a-select
            v-model:value="formState.transfer_account_id"
            ref="select"
          >
            <a-select-option :value="account.id" v-for="account in accounts" :key="account.id">{{account.name}}</a-select-option>
          </a-select>
        </a-form-item>
      </template>
      <a-form-item :wrapper-col="{ span: 14, offset: 2 }">
        <a-button type="primary" @click="onSubmit">保存</a-button>
      </a-form-item>
    </a-form>
</template>

<script lang=ts>
import { defineComponent, reactive, ref, toRaw, UnwrapRef } from 'vue'
import { AccountDetail, AddChargetDetailFormStat, unpaidChargeDetail } from '/@/data/interface'
import { accountList } from '/@/api/account'
import { categoryList } from '/@/api/category'
import { unRepayDetailList } from '../api/charge_detail'

export default defineComponent({
  setup() {
    // 获取账户列表
    const accounts = ref<AccountDetail[]>([])
    accountList().then(response => {
      const data = response.data
      if (data.status === 0) {
        if (data.data !== null) {
          accounts.value = data.data
          formState.account_id = accounts.value[0].id
        }
      }
    })

    // 类型改变后重置分类
    const setCategoryInitValue = () => {
      if (categoryMap.value != undefined) {
        if (categoryMap.value[formState.type.toString()] !== undefined) {
          formState.category_id = categoryMap.value[formState.type][0].id
        } else {
          formState.category_id = 0
        }
      }
    }
    // 类型改变后需要重置一些数据
    const typeChange = () => {
      setCategoryInitValue()
      formState.repay_account_id = 0
      formState.transfer_account_id = 0
      formState.repay_detail_ids = []
      switch (formState.type) {
        case 3:
          formState.repay_account_id = accounts.value[0].id
          handleRepayAccountChange()
          break
        case 4:
          formState.transfer_account_id = accounts.value[0].id
          break
      }
    }
    // 为换账单详情列表
    const unRepaidDetialList = ref<unpaidChargeDetail[]>([])
    // 还款账户的值改变后
    const handleRepayAccountChange = () => {
      // 获取该账户的未还列表
      unRepayDetailList(formState.repay_account_id).then(resp => {
        unRepaidDetialList.value = resp.data.data
      })
    }

    interface CategoryMap {
      [key: string]: any;
      [index: number]: any;
    }

    // 获取分类列表
    const categoryMap = ref <CategoryMap>()
    categoryList().then(response => {
      categoryMap.value = response.data.data
      setCategoryInitValue()
    })
    // 表单
    const formState: UnwrapRef<AddChargetDetailFormStat> = reactive({
      account_id: 0,
      type: 0,
      category_id: 0,
      money: 0,
      description: '',
      repay_account_id: 0,
      transfer_account_id: 0,
      repay_detail_ids: []
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
      typeChange,
      handleRepayAccountChange,
      unRepaidDetialList
    }
  }
})

</script>
