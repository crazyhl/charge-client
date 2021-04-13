<template>
    <a-typography-title :level="3">添加账户</a-typography-title>
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
import { AddAccountFormState } from '/@/data/interface'
import { accountAdd } from '/@/api/account'
import { notification } from 'ant-design-vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const formState: UnwrapRef<AddAccountFormState> = reactive({
      name: '',
      hasCredit: false,
      cash: 0,
      credit: 0,
      sort: 0
    })
    const router = useRouter()

    const onSubmit = () => {
      console.log('values', formState, toRaw(formState))
      accountAdd(toRaw<AddAccountFormState>(formState))
        .then(response => {
          if (response.data.status === 0) {
            notification.open({
              message: '添加成功',
              description: '添加成功，正在跳转',
              duration: 3,
              onClose: () => {
                // 跳转
                console.log(router)
                router.push({ name: 'accountList' })
              }
            })
          }
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
