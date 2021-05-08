import request from '/@/request'

export function summaryMonthList() {
  return request.get('/statistics/summaryMonthList')
}