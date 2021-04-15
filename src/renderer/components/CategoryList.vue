<template>
  <div>
    <a-typography-title :level="3">分类管理</a-typography-title>
    <a-button type="primary" size="large">
      <router-link class="clickable" replace to="/category/add">添加分类</router-link>
    </a-button>
    <div>
    <img alt="Vue logo" src="../assets/logo.png" />
    </div>
    <div>Electron Version: {{ version }} </div>
    <div>Appdata Path: {{ path }} </div>
    <div>Running Platform: {{ platform }} </div>
  </div>
</template>

<script lang=ts>
import { defineComponent, reactive, toRefs } from 'vue'
import { useService } from '../hooks'
import { categoryList } from '/@/api/category'

export default defineComponent({
  setup() {
    const { getBasicInformation } = useService('BaseService')
    const data = reactive({
      version: '',
      path: '',
      platform: ''
    })
    getBasicInformation().then(({ version, platform, root }) => {
      data.version = version
      data.path = root
      data.platform = platform
    })

    categoryList().then(response => {
      console.log(response)
    })

    return {
      ...toRefs(data)
    }
  }
})
</script>
