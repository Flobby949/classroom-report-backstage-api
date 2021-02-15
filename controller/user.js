const Router = require('koa-router')
const router = new Router()
router.get('/list', async(ctx, next) => {
    let data = [
       {
        name: '张三',
        age: 19,
       },
       {
        name: '李四',
        age: 18,
       },
       {
        name: '王五',
        age: 21,
       }
    ]
    ctx.body = {
        data,
        code: 20000,
    }
})

module.exports = router