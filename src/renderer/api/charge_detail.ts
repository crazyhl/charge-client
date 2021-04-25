import { AddChargetDetailFormStat } from '../data/interface'
import request from '/@/request'

export function unRepayDetailList(accountId: number) {
  return request.get('/chargeDetail/unRepayList/' + accountId)
}

export function chargeDetailAdd(data: AddChargetDetailFormStat) {
  return request.post('/chargeDetail', data)
}
