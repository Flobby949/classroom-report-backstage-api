const Router = require('koa-router')//引用koa-router
const router = new Router()//创建路由实例
const callCloudFn = require('../utils/callCloudFn.js')//引用访问小程序云函数文件
const cloudStorage = require('../utils/callCloudStorage.js')
const callCloudDB = require('../utils/callCloudDB.js')//引用访问小程序云函数文件


//查询正常报告
router.get('/nlist', async (ctx, next) => {
    const params = ctx.request.query
    const query = `
    db.collection('report').where({if: 1}).skip(${params.start}).limit(${params.count}).orderBy('time', 'desc').get()`
    const res = await callCloudDB(ctx, 'databasequery', query)
    ctx.body = {
        code: 20000,
        data: res.data,
    }
})

//查询异常报告
router.get('/alist', async (ctx, next) => {
    const params = ctx.request.query
    const query = `
    db.collection('report').where({if: 2}).skip(${params.start}).limit(${params.count}).orderBy('time', 'desc').get()`
    const res = await callCloudDB(ctx, 'databasequery', query)
    ctx.body = {
        code: 20000,
        data: res.data,
    }
})

//报告详情
router.get('/detail', async (ctx, next) => {
    const params = ctx.request.query

    const res = await callCloudFn(ctx, 'report', {
        $url: 'detail',
        reportId: params.reportId,
    })
//解析出报告详情，建议挨个打印所有层级
const detail = JSON.parse(res.resp_data).list[0]

//请求报告图片下载链接
let files = []
const reportDetail = detail.reportDetail

for(let i = 0,len = reportDetail.length;i < len;i++) {
for (let j = 0, l = reportDetail[i].imgs.length;j < l;j++) {
    files.push({
        fileid: reportDetail[i].imgs[j],
        max_age: 7200,
    })
}
}

const download = await cloudStorage.download(ctx, files)

//报告图片数组
let urls = []
for (let i = 0,len = download.file_list.length;i < len;i++) {
    urls.push(download.file_list[i].download_url)
}

detail.imgs = urls
console.log(detail)

ctx.body = {
    code: 20000,
    data: detail,
}
})

router.post('/updatestatus', async (ctx, next) => {
    const params = ctx.request.body
    const query = `db.collection('report').doc('${params._id}').update({
        data: {
            zt: '已处理'
        }
        })`
    const res = await callCloudDB(ctx, 'databaseupdate', query)
    ctx.body = {
        code: 20000,
        data: res,
    }
})

router.post('/updatescore', async (ctx, next) => {
    const params = ctx.request.body
    const query = `db.collection('report').doc('${params._id}').update({
        data: {
            pf: '${params.value}'
        }
        })`
    const res = await callCloudDB(ctx, 'databaseupdate', query)
    console.log(42343)
    console.log(params)
    ctx.body = {
        code: 20000,
        data: res,
    }
})

module.exports = router
