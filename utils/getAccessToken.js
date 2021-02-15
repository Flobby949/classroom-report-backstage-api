// 引入异步请求库
const rp = require('request-promise')
// 微信小程序APPID和APPsecret
const APPID = 'wxd791822444dad921'
const APPSECRET = 'c1196088d8df3a6f629ba1faf6c10cb6'
// 请求accesstoken的URL
const URL = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`
// 引入node.js的文件操作模块(自带)
const fs = require('fs')
// 引入node.js的文件路径模块(自带)
const path = require('path');
// 定义accesstoken缓存路径和文件名
const fileName = path.resolve(__dirname, './access_token.json')

// 异步方法，请求更新accesstoken
const updateAccessToken = async () => {
    // 发起异步get请求，得到结果json字符串,和axios得到的json对象不同
    const resStr = await rp(URL)
    // 将json字符串反序列化成json对象
    const res = JSON.parse(resStr)
    console.log(res)
    // 返回结果如果有accesstoken，写入文件
    if (res.access_token) {
        // 文件模块的同步写方法，参数为 -> 完整路径文件名， 写入内容（字符串），所以这里将对象(accesstoken串和创建时间)序列化
        fs.writeFileSync(
            fileName,
            JSON.stringify({
                access_token: res.access_token,
                createTime: new Date()
            })
        )
    } else {
        // 否则继续请求
        await updateAccessToken()
    }
}

// 定义一个getAccessToken为异步执行函数
const getAccessToken = async () => {
    try {
        // 同步读取文件 (结果为字符串)
        const readRes = fs.readFileSync(fileName, 'utf-8')
        // 将结果转成对象
        const readObj = JSON.parse(readRes)
        // 得到创建时间 
        const createTime = new Date(readObj.createTime).getTime()
        // 计算和当前时间的差值，是否超过7200秒也就是2小时
        const nowTime = new Date().getTime()
        // token超时，重新请求
        if ((nowTime - createTime) / 1000 / 60 / 60 >= 2) {
            await updateAccessToken()
            await getAccessToken()
        }
        // 未超时，返回accesstoken
        return readObj.access_token
    } catch(error) {
        // 出错也继续请求
        await updateAccessToken()
        await getAccessToken()
    }
}

// 定时器，快到7200s就更新accesstoken
setInterval(async () => {
    await updateAccessToken()
}, (7200 -300) * 1000 )

updateAccessToken()

module.exports = getAccessToken