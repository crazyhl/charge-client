<template>
  <div>
    <a-typography-title :level="3">分类管理</a-typography-title>
    <a-button type="primary" size="large">
      <router-link class="clickable" replace to="/category/add">添加分类</router-link>
    </a-button>
    <a-card v-for="(item, index) in type" :title="item" style="width: 100%; margin-top:16px;">
      <a-tag v-if="index+'' in categoryMap" v-for="category in categoryMap[index]" closable  @close.prevent
        style="font-size:1.4em;"
      >
        {{category.name}}
      </a-tag>
      <a-empty :image="simpleImage" v-else />
    </a-card>
  </div>
</template>

<script lang=ts>
import { Empty } from 'ant-design-vue'
import { defineComponent, ref } from 'vue'
import { categoryList } from '/@/api/category'

export default defineComponent({
  setup() {
    const categoryMap = ref({})
    const type = ['收入', '支出', '借', '还', '转']

    categoryList().then(response => {
      categoryMap.value = response.data.data
      console.log(categoryMap)
      console.log(typeof categoryMap)
    })

    return {
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      categoryMap,
      type
    }
  }
})
</script>
