import axios from 'axios'
import { message } from 'ant-design-vue'

const instance = axios.create({
  baseURL: 'http://127.0.0.1:8898/',
  timeout: 1000,
  headers: {}
})

instance.interceptors.response.use(function (response) {
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  const data = response.data
  if (data.status !== 0) {
    message.warn(data.message)
    return Promise.reject(response)
  }
  return Promise.resolve(response)
}, function (error) {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  message.error(error)
  return Promise.reject(error)
})

export default instance
