import request from '/@/request'
import { AddAccountFormState, EditAccountFormState } from '/@/data/interface'

export function accountAdd(data: AddAccountFormState) {
  return request.post('/account', data)
}

export function accountList() {
  return request.get('/account/list')
}

export function accountDelete(id: number) {
  return request.delete('account/' + id)
}

export function accountEditDetail(id: string) {
  return request.get('/account/' + id + '/edit')
}

export function accountEdit(data: EditAccountFormState) {
  return request.put('/account/' + data.id, data)
}
