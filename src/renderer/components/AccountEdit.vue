<template>
    <a-typography-title :level="3">编辑账户: {{ formState.name }}</a-typography-title>
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item label="名称">
        <a-input v-model:value="formState.name" />
      </a-form-item>
      <a-form-item label="现金">
        <a-input v-model:value.number="formState.cash" :precision="3" type="number" />
      </a-form-item>
      <a-form-item label="包含信用">
        <a-switch v-model:checked="formState.hasCredit" />
      </a-form-item>
      <a-form-item v-if="formState.hasCredit" label="信用">
        <a-input v-model:value.number="formState.credit"  :precision="3"  type="number" />
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
import { defineComponent, reactive, toRaw, UnwrapRef } from 'vue'
import { EditAccountFormState } from '/@/data/interface'
import { accountEdit, accountEditDetail } from '/@/api/account'
import { notification } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const formState: UnwrapRef<EditAccountFormState> = reactive({
      id: 0,
      name: '',
      hasCredit: false,
      cash: 0,
      credit: 0,
      sort: 0
    })

    const route = useRoute()
    const router = useRouter()

    console.log(route.params)
    accountEditDetail(route.params.id.toString()).then(response => {
      formState.id = response.data.data.id
      formState.name = response.data.data.name
      formState.hasCredit = response.data.data.has_credit
      formState.cash = response.data.data.cash
      formState.credit = response.data.data.credit
      formState.sort = response.data.data.sort
    }).catch(() => {
      router.push({ name: 'accountList' })
    })

    const onSubmit = () => {
      console.log('values', formState, toRaw(formState))
      accountEdit(toRaw<EditAccountFormState>(formState))
        .then(response => {
          notification.open({
            message: response.data.message,
            description: response.data.message + '，正在跳转',
            duration: 3,
            onClose: () => {
              // 跳转
              console.log(router)
              router.push({ name: 'accountList' })
            }
          })
        })
    }

    return {
      labelCol: { span: 2 },
      wrapperCol: { span: 14 },
      formState,
      onSubmit
    }
  }
})
</script>
