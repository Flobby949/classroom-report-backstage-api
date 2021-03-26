const Router = require('koa-router')//引用koa-router
const router = new Router()//创建路由实例
const jsonwebtoken = require('jsonwebtoken'); // 引入jwt插件
const callCloudDB = require('../utils/callCloudDB.js')//引用访问小程序云数据库文件
//导入加密模块
const crypto = require("crypto");
// jwt SECRET
const SECRET = 'flobby529'

// 添加管理员
router.post('/addAdmin', async (ctx, next) => {
    const params = ctx.request.body
    console.log(params)
    // 验证数据库中是否有该工号
    const valid = `db.collection('admin').where({
        job_number: '${params.job_number}'
    }).get()`
    const validRes = await callCloudDB(ctx, 'databasequery', valid)
    console.log(validRes)
    if (validRes.data.length == 0) {
        // 工号不存在, 添加记录
        const dt = new Date()
        let md5 = crypto.createHash("md5");
        let newPas = md5.update(params.password).digest("hex");
        const query = `db.collection('admin').add({
            data: {
                job_number: '${params.job_number}',
                password: '${newPas}',
                phone: '${params.phone}',
                username: '${params.username}',
                create_time: '${dt}',
                authority: '0',
                wx_openid: ''
            }
        })`
        const res = await callCloudDB(ctx, 'databaseadd', query)
        ctx.body = {
            code: 20000,
            data: res
        }
    } else {
        ctx.body = {
            code: 20000,
            data: '账号已存在'
        }
    }
})

// 根据工号登录
router.post('/loginByJN', async (ctx, next) => {
    const params = ctx.request.body
    console.log(params)
    const query = `db.collection('admin').where({
        job_number: '${params.job_number}'
    }).get()`
    const res = await callCloudDB(ctx, 'databasequery', query)
    // 判断账号是否存在
    if (res.data != '') {
        // 序列化
        const info = JSON.parse(res.data)
        let md5 = crypto.createHash("md5");
        let newPas = md5.update(params.password).digest("hex");
        // 判断密码是否正确
        if (info.password === newPas) {
            const token = jsonwebtoken.sign(
                { authority: info.authority, id: info._id },  // 加密userToken
                SECRET,
                { expiresIn: '2h' }
            )
            ctx.body = {
                token,
                code: 20000,
            }
        } else {
            ctx.body = {
                code: 20000,
                data: "密码错误"
            }
        }
    } else {
        ctx.body = {
            code: 20000,
            data: "用户不存在"
        }
    }
})

// 根据手机号登录
router.post('/loginByPhone', async (ctx, next) => {
    const params = ctx.request.body
    console.log(params)
    const query = `db.collection('admin').where({
        phone: '${params.phone}'
    }).get()`
    const res = await callCloudDB(ctx, 'databasequery', query)
    // 判断账号是否存在
    if (res.data != '') {
        // 序列化
        const info = JSON.parse(res.data)
        let md5 = crypto.createHash("md5");
        let newPas = md5.update(params.password).digest("hex");
        // 判断密码是否正确
        if (info.password === newPas) {
            const token = jsonwebtoken.sign(
                { authority: info.authority, id: info._id },  // 加密userToken
                SECRET,
                { expiresIn: '2h' }
            )
            ctx.body = {
                token,
                code: 20000,
            }
        } else {
            ctx.body = {
                code: 20000,
                data: "密码错误"
            }
        }
    } else {
        ctx.body = {
            code: 20000,
            data: "用户不存在"
        }
    }
})

// 获取管理员信息
router.get('/getInfo', async (ctx, next) => {
    const token = ctx.request.query.token
    let params = jsonwebtoken.verify(token, SECRET)
    const query = `db.collection('admin').doc('${params.id}').get()`
    const res = await callCloudDB(ctx, 'databasequery', query)
    console.log(res.data)
    if (res.data != '') {
        const data = JSON.parse(res.data)
        console.log(data)
        ctx.body = {
            data,
            code: 20000,
        }
    }
})

// 修改信息(手机号，密码)
router.post('/updateInfo', async (ctx, next) => {
    let params = ctx.request.body
    const getOri = `db.collection('admin').doc('${params.id}').get()`
    const oriInfo = await callCloudDB(ctx, 'databasequery', getOri)
    console.log(oriInfo)
    const oriRes = JSON.parse(oriInfo.data)
    if (params.password.trim() != '') {
        let md5 = crypto.createHash("md5");
        let newPas = md5.update(params.password).digest("hex");
        params.password = newPas
    }
    if (params.phone == '') {
        params = {
            id:params.id,
            phone: oriRes.phone,
            password: params.password
        }
    }
    if (params.password == '') {
        params = {
            id:params.id,
            phone: params.phone,
            password: oriRes.password
        }
    }
    console.log(params)
    const query = `db.collection('admin').doc('${params.id}').update({
        data: {
            phone: '${params.phone}',
            password: '${params.password}'
        }
    })`
    const res = await callCloudDB(ctx, 'databaseupdate', query)
    ctx.body = {
        code: 20000,
        data: res
    }
})

// 根据工号修改权限
router.post('/updateAuth', async (ctx, next) => {
    const params = ctx.request.body
    const query = `db.collection('admin').where({
        job_number: '${params.job_number}'
    }).update({
        data: {
            authority: '${params.authority}'
        }
    })`
    const res = await callCloudDB(ctx, 'databaseupdate', query)
    ctx.body = {
        code: 20000,
        data: res
    }
})

// 注销
router.post('/delete', async (ctx, next) => {
    const params = ctx.request.query
    console.log(params)
    const query = `db.collection('admin').doc('${params.id}').remove()`
    const res = await callCloudDB(ctx, 'databasedelete', query)
    ctx.body = {
        code: 20000,
        data: res
    }
})

// 查询所有管理员
router.get('/list', async (ctx, next) => {
    const params = ctx.request.query
    const query = `db.collection('admin')
            .skip(${params.start})
            .limit(${params.count})
            .orderBy('authority','desc')
            .orderBy('create_time','asc')
            .get()
            `
    const res = await callCloudDB(ctx, 'databasequery', query)
    console.log(res);
    // 序列化管理员对象数组
    let data = []
    for (let i = 0, len = res.data.length; i < len; i++) {
        data.push(
            JSON.parse(res.data[i])
        )
    }
    ctx.body = {
        data,
        code: 20000,
    }
})

module.exports = router