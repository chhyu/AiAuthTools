import { defineStore } from 'pinia'
import { ref } from 'vue'

const loginInfo = ref({
  account: '',
  password: ''
})
export const useLoginStore = defineStore('loginInfo',
  () => {
    const setLoginInfo = (val: any) => {
      loginInfo.value = val
    }
    const clearLoginInfo = () => {
      loginInfo.value = {
        account: '',
        password: ''
      }
    }
    return {
      loginInfo,
      setLoginInfo,
      clearLoginInfo
    }
  }
)
