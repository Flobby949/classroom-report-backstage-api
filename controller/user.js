const Router = require('koa-router')//引用koa-router
const router = new Router()//创建路由实例
const callCloudFn = require('../utils/callCloudFn.js')//引用访问小程序云函数文件
const callCloudDB = require('../utils/callCloudDB.js')//引用访问小程序云函数文件

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
        const query = `db.collection('admin').add({
            data: {
                job_number: '${params.job_number}',
                password: '${params.password}',
                phone: '${params.phone}',
                username: '${params.username}',
                create_time: db.serverDate(),
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
            code: -1,
            data: '账号已存在'
        }
    }
})

// 根据工号获取管理员信息
router.post('/loginByJN', async (ctx, next) => {
    const params = ctx.request.body
    console.log(params)
    const query = `db.collection('admin').where({
        job_number: '${params.job_number}'
    }).get()`
    const res = await callCloudDB(ctx, 'databasequery', query)
    // 判断账号是否存在
    if (res.data.length != 0) {
        // 序列化
        const info = JSON.parse(res.data)
        // 判断密码是否正确
        if (info.password === params.password) {
            ctx.body = {
                code: 20000,
                data: info
            }
        } else {
            ctx.body = {
                code: -1,
                data: "密码错误"
            }
        }
    } else {
        ctx.body = {
            code: -1,
            data: "用户不存在"
        }
    }
})

// 根据手机号获取管理员信息
router.post('/loginByPhone', async (ctx, next) => {
    const params = ctx.request.body
    console.log(params)
    const query = `db.collection('admin').where({
        phone: '${params.phone}'
    }).get()`
    const res = await callCloudDB(ctx, 'databasequery', query)

    // 判断账号是否存在
    if (res.data.length != 0) {
        // 序列化
        const info = JSON.parse(res.data)
        // 判断密码是否正确
        if (info.password === params.password) {
            ctx.body = {
                code: 20000,
                data: info
            }
        } else {
            ctx.body = {
                code: -1,
                data: "密码错误"
            }
        }
    } else {
        ctx.body = {
            code: -1,
            data: "用户不存在"
        }
    }
})

// 根据工号修改信息(手机号，密码)
router.post('/updateInfo', async (ctx, next) => {
    const params = ctx.request.body
    const query = `db.collection('admin').where({
        job_number: '${params.job_number}'
    }).update({
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
    const query = `db.collection('admin').where({
        job_number: '${params.job_number}'
    }).remove()`
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
        .orderBy('authority', 'desc')
        .orderBy('create_time', 'asc')
        .get()
        `
    const res = await callCloudDB(ctx, 'databasequery', query)
    console.log(res.data)
    // 序列化管理员对象数组
    let data = []
    for (let i = 0, len = res.data.length; i < len; i++) {
        data.push(
            JSON.parse(res.data[i])
        )
    }
    console.log(data)
    ctx.body = {
        data,
        code: 20000,
    }
})

module.exports = router