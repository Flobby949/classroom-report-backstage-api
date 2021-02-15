// 引入封装的accesstoken凭证模块
const getAccessToken = require('./getAccessToken.js');
// 引入异步请求模块
const rp = require('request-promise');

// 定义一个异步函数callCloudFn，参数为上下文、云函数名称、参数数组
const callCloudFn = async (ctx, fnName, params) => {
    // 获得token
    const ACCESS_TOKEN = await getAccessToken()
    // 封装一个对象，包含请求方法(默认post)、官方文档调用云函数的uri、请求体参数
    const options = {
        method: 'POST',
        uri: `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${ACCESS_TOKEN}&env=${ctx.state.env}&name=${fnName}`,
        body: {
            ...params,
        },
        json: true, // 设置为true，返回值自动序列化为json对象
    }

    // 发起异步请求，并在回调函数中返回结果或作出错误处理
    return await rp(options)
        .then((res) => {
            return res
        })
        .catch(function (err) {
            console.log(err)
        })
}


module.exports = callCloudFn