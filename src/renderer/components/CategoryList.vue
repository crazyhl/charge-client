<template>
  <div>
    <a-typography-title :level="3">分类管理</a-typography-title>
    <a-button type="primary" size="large">
      <router-link class="clickable" replace to="/category/add">添加分类</router-link>
    </a-button>
    <a-card size="small" v-for="(item, index) in type" :title="item" style="width: 100%; margin-top:16px;">
       <a-list size="small" v-if="index+'' in categoryMap" :data-source="categoryMap[index]">
        <template #renderItem="{ item, index }">
          <a-list-item>
            <template #actions>
              <a-button  size="small" type="default">
                <router-link class="clickable" replace :to="{ name: 'CategoryEdit', params: { id: item.id }}">编辑</router-link>
              </a-button>
              <a-button size="small" type="danger" @click="deleteCategoryFunc(item, index)">
                  删除
              </a-button>
            </template>
            {{ item.name }}
          </a-list-item>
        </template>
        
      </a-list>
      <a-empty :image="simpleImage" v-else />
    </a-card>
  </div>
</template>

<script lang=ts>
import { Empty, message } from 'ant-design-vue'
import { defineComponent, ref } from 'vue'
import { Category } from '../data/interface'
import { categoryDelete, categoryList } from '/@/api/category'

export default defineComponent({
  setup() {
    const categoryMap = ref({})
    const type = ['收入', '支出', '借', '还', '转']

    categoryList().then(response => {
      categoryMap.value = response.data.data
      console.log(categoryMap)
      console.log(typeof categoryMap)
    })

    const deleteCategoryFunc = (item:Category, index:number) => {
      console.log(item)
      console.log(index)
      categoryDelete(item.id).then(response => {
        console.log(response.data)
        // 显示 message 移除数据
        categoryMap.value[item.type+""].splice(index, 1)
        message.success(response.data.message)
      })
    }

    return {
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
      categoryMap,
      type,
      deleteCategoryFunc
    }
  }
})
</script>
