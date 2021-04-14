import request from '/@/request'
import { AddAccountFormState } from '/@/data/interface'

export function accountAdd(data: AddAccountFormState) {
  return request.post('/account', data)
}

export function accountList() {
  return request.get('/account/list')
}

export function accountDelete(id: number) {
  return request.delete('account/' + id)
}
