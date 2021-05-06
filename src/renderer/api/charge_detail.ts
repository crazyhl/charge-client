import { AddChargetDetailFormStat, EditChargeDetailFormStat } from '../data/interface'
import request from '/@/request'

export function unRepayDetailList(accountId: number) {
  return request.get('/chargeDetail/unRepayList/' + accountId)
}

export function chargeDetailAdd(data: AddChargetDetailFormStat) {
  return request.post('/chargeDetail', data)
}

export function chargeDetailList(page: number, pageSize: number) {
  return request.get('/chargeDetail/list', {
    params: {
      page,
      pageSize
    }
  })
}

export function chargeDetailDelete(id: number) {
  return request.delete('chargeDetail/' + id)
}

export function chargeDetailEditDetail(id: string) {
  return request.get('/chargeDetail/' + id + '/edit')
}

export function chargeDetailEdit(data: EditChargeDetailFormStat) {
  return request.put('/chargeDetail/' + data.id, data)
}