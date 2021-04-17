import { AddCategoryFormStat } from '../data/interface'
import request from '/@/request'

export function categoryList() {
  return request.get('/category/list')
}

export function categoryAdd(data: AddCategoryFormStat) {
  return request.post('/category', data)
}

export function categoryDelete(id: number) {
  return request.delete('/category/' + id)
}