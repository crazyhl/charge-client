<template>
    <a-typography-title :level="3">添加分类</a-typography-title>
    <a-form :model="formState" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-form-item label="名称">
        <a-input v-model:value="formState.name" />
      </a-form-item>
      <a-form-item label="类型">
        <a-checkbox-group v-model:value="formState.type">
          <a-checkbox :value="0" name="type">收入</a-checkbox>
          <a-checkbox :value="1" name="type">支出</a-checkbox>
          <a-checkbox :value="2" name="type">借</a-checkbox>
          <a-checkbox :value="3" name="type">还</a-checkbox>
          <a-checkbox :value="4" name="type">转</a-checkbox>
        </a-checkbox-group>
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
import { AddCategoryFormStat } from '/@/data/interface'
import { categoryAdd } from '/@/api/category'
import { notification } from 'ant-design-vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const formState: UnwrapRef<AddCategoryFormStat> = reactive({
      name: '',
      type: [1, 2],
      sort: 0
    })
    const router = useRouter()

    const onSubmit = () => {
      console.log('values', formState, toRaw(formState))
      categoryAdd(toRaw<AddCategoryFormStat>(formState))
        .then(response => {
          notification.open({
            message: '添加成功',
            description: '添加成功，正在跳转',
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
