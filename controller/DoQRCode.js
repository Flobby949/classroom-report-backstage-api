const Router = require('koa-router')//引用koa-router
const router = new Router()//创建路由实例
const cloudStorage = require('../utils/callCloudStorage.js')
const callCloudDB = require('../utils/callCloudDB.js')//引用访问小程序云数据库文件
const QRCode = require('../utils/getQRCode.js');
const fs = require('fs')

router.post('/addCode', async (ctx, next) => {
    const params = ctx.request.body
    console.log(params);
    const vaild = `db.collection('qrcode').where({
        class_number: '${params.scene}'
    }).get()`
    const vaildRes = await callCloudDB(ctx, 'databasequery', vaild)
    console.log(vaildRes);
    if (vaildRes.data.length == 0) {
        const newQR = await QRCode(ctx, params)
        let imgName = `QRCode-${params.scene}.png`;
        let fileName = `upload-${params.scene}`;
        let path = `/usr/deploy/classroom-report-backstage-api/QrCode`
        fs.writeFile(path + '/' + imgName, newQR, err => console.log(err))
        fs.writeFile(path + '/' + fileName, newQR, err => console.log(err))
        let file = {
            name: fileName,
            path: `${path}/${fileName}`
        }
        const fileId = await cloudStorage.uploadCode(file)
        console.log(fileId);

        const query = `db.collection('qrcode').add({
        data: {
            class_number: '${params.scene}',
            fileId: '${fileId}'
        }
    })`

        const res = await callCloudDB(ctx, 'databaseadd', query)
        console.log(res);
        ctx.body = {
            code: 20000,
            data: fileId
        }
    }else {
        ctx.body = {
            code: 20000,
            data: '',
            message: '该教室二维码已存在'
        }
    }
})

router.get('/list', async (ctx, next) => {
    const params = ctx.request.query
    console.log(params);
    const query = `db.collection('qrcode')
            .skip(${params.start})
            .limit(${params.count})
            .orderBy('class_number','desc')
            .get()`
    const res = await callCloudDB(ctx, 'databasequery', query)
    const data = res.data
    console.log(data);
    if (data.length == 0) {
        ctx.body = {
            code: 20000,
            data: "没有教室"
        }
    } else {
        let files = []
        for (let i = 0, len = data.length; i < len; i++) {
            files.push({
                fileid: JSON.parse(data[i]).fileId,
                max_age: 7200,
            })
        }
        const download = await cloudStorage.download(ctx, files)
        // console.log(download);
        let returnData = []
        for (let i = 0, len = download.file_list.length; i < len; i++) {
            returnData.push({
                download_url: download.file_list[i].download_url,
                class_number: JSON.parse(data[i]).class_number,
                fileid: download.file_list[i].fileid,
                _id: JSON.parse(data[i])._id
            })
        }
        console.log(returnData);
        ctx.body = {
            code: 20000,
            data: returnData
        }
    }
})

router.get('/delete', async (ctx, next) => {
    const params = ctx.request.query
    // 删除数据库记录
    const query = `db.collection('qrcode').doc('${params._id}').remove()`
    const delDBRes = await callCloudDB(ctx, 'databasedelete', query)

    // 删除云存储文件
    const delStorageRes = await cloudStorage.delete(ctx, [params.fileid])
    ctx.body = {
        code: 20000,
        data: {
            delDBRes,
            delStorageRes
        }
    }
})

router.get('/length', async(ctx, next) => {
    const query = `db.collection('qrcode').count()`
    const res = await callCloudDB(ctx, 'databasequery', query)
    console.log(res);
    let length = res.pager.Total
    ctx.body = {
        code: 20000,
        data: length
    }
})

module.exports = router