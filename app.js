const Koa = require('koa')
const app = new Koa()
const Router = require('koa-router')
const router = new Router()
const cors = require('koa2-cors')
const koaBody = require('koa-body')
// const ENV = 'jinhuiqian-8gi1cox44dde5a5a'

const ENV = 'class-report-3g3uav0pccd26f10'

// 跨域
app.use(
    cors({
        origin: ['http://localhost:9528'],
        credentials: true,
    })
)

// 接收post参数解析
app.use(
    koaBody({
        multipart: true,
    })
)

// 全局中间件， ctx，body即向客户端返回的内容
app.use(async (ctx, next) => {
    ctx.state.env = ENV
    // ctx.body = "后台管理系统api"
    await next()
})

// 通过require引入xxxxx模块
const user = require('./controller/user.js')
const report = require('./controller/report.js')
const QRCode = require('./controller/DoQRCode.js')


// 给student模块使用定义根路由为 '/xxxxx'
router.use('/user', user.routes())
router.use('/report', report.routes())
router.use('/QR', QRCode.routes())

// 使用路由
app.use(router.routes())
app.use(router.allowedMethods())

// 对3000端口监听，这是nodejs的默认端口，如果被占用，可以停止相应进程或换端口
app.listen(3000, () => {
    console.log('服务开启在3000端口')
    console.log('http://localhost:3000/')
})
