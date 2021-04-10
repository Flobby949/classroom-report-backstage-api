// 引入封装的accesstoken凭证模块
const getAccessToken = require('./getAccessToken.js');
// 引入异步请求模块
const rp = require('request-promise');

const QRCode = async (ctx, params) => {
    // 获得token
    const ACCESS_TOKEN = await getAccessToken()
    const options = {
        //定义使用request-promise传入的对象
        method: 'POST',//小程序规定需要用post传输
        uri: `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${ACCESS_TOKEN}`,
        encoding: null,
        body: params,
        json: true
    }

    return await rp(options)
        .then((res) => {
            //rp是返回promise对象所以用then获取结果，因为是异步所以要加await才能进行返回或赋值
            return res
        }).catch(err => {
            console.log(err)
        })
}
module.exports = QRCode//最后把方法暴露出去