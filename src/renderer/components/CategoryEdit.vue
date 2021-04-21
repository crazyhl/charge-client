<template>
    <a-typography-title :level="3">添加分类</a-typography-title>
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item label="名称">
        <a-input v-model:value="formState.name" />
      </a-form-item>
      <a-form-item label="类型">
        <a-radio-group v-model:value="formState.type">
          <a-radio :value="0">收入</a-radio>
          <a-radio :value="1">支出</a-radio>
          <a-radio :value="2">借</a-radio>
          <a-radio :value="3">还</a-radio>
          <a-radio :value="4">转</a-radio>
        </a-radio-group>
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
import { EditCategoryFormStat } from '/@/data/interface'
import { categoryEdit, categoryEditDetail } from '/@/api/category'
import { notification } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const formState: UnwrapRef<EditCategoryFormStat> = reactive({
      id: 0,
      name: '',
      type: 0,
      sort: 0
    })
    const router = useRouter()
    const route = useRoute()

    categoryEditDetail(route.params.id.toString()).then(response => {
      console.log(response.data.data)
      formState.id = response.data.data.id
      formState.name = response.data.data.name
      formState.type = response.data.data.type
      formState.sort = response.data.data.sort
    }).catch(() => {
      router.push({ name: 'CategoryList' })
    })

    const onSubmit = () => {
      console.log('values', formState, toRaw(formState))
      categoryEdit(toRaw<EditCategoryFormStat>(formState))
        .then(response => {
          notification.open({
            message: '编辑成功',
            description: '编辑成功，正在跳转',
            duration: 3,
            onClose: () => {
              // 跳转
              router.push({ name: 'CategoryList' })
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
