import request from '/@/request'

export function summaryMonthList() {
  return request.get('/statistics/summaryMonthList')
}

export function summaryMonthData(date: string) {
  return request.get('/statistics/summaryMonthData/' + date)
}

export function expensesCategory(date: string) {
  return request.get('/statistics/expensesCategory/' + date)
}

export function summaryUnRepaidData() {
  return request.get('/statistics/summaryUnRepaidData')
}