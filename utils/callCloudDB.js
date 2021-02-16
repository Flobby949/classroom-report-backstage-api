const rp = require('request-promise')//先引用request-promise请求小程序后端
const getAccessToken = require('./getAccessToken.js');//引用之前写的获取accesstoken

// ctx，object类型， 为访问全局变量ctx.state.env//小程序云函数环境名
// Name，string类型，为查询还是更新还是
// query，string类型，传入的sql语句

const callCloudDB = async (ctx, fnName, query = {}) => {
    const ACCESS_TOKEN = await getAccessToken()//调用accesstoken获取到accesstoken
    const options = {
        //定义使用request-promise传入的对象
        method: 'POST',//小程序规定需要用post传输
        uri: `https://api.weixin.qq.com/tcb/${fnName}?access_token=${ACCESS_TOKEN}`,
        body: {//向小程序云函数传入的数据
            env: ctx.state.env, // 小程序云环境名
            query // 写入传入来的sql语句
        },
        json: true // 自动将正文字符串为JSON
    };
    //ctx.body是返回值
    return await rp(options)
        .then((res) => {
            //rp是返回promise对象所以用then获取结果，因为是异步所以要加await才能进行返回或赋值
            return res
        }).catch(err => {
            console.log(err)
        })
}

module.exports = callCloudDB//最后把方法暴露出去