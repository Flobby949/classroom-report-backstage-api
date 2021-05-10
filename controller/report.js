const Router = require("koa-router"); //引用koa-router
const router = new Router(); //创建路由实例
const cloudStorage = require("../utils/callCloudStorage.js");
const callCloudDB = require("../utils/callCloudDB.js"); //引用访问小程序云函数文件

//查询正常报告数量
router.get("/nlistcount", async (ctx, next) => {
  const query = `
    db.collection('report').where({if: 1}).count()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.pager.Total,
  };
});

//查询异常报告数量
router.get("/alistcount", async (ctx, next) => {
  const query = `
    db.collection('report').where({if: 2}).count()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.pager.Total,
  };
});

//查询未评分报告数量
router.get("/unratedreport", async (ctx, next) => {
  const query = `
    db.collection('report').where({score: 0}).count()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.pager.Total,
  };
});

//查询未打扫报告数量
router.get("/ncreportcount", async (ctx, next) => {
  const query = `
    db.collection('report').where({if: 3}).count()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.pager.Total,
  };
});

//查询未处理报告数量
router.get("/unprocessedreport", async (ctx, next) => {
  const query = `
    db.collection('report').where({status: "未处理"}).count()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.pager.Total,
  };
});

//查询未处理报告列表
router.get("/uplist", async (ctx, next) => {
  const params = ctx.request.query;
  const query = `
    db.collection('report').where({status: '未处理'}).skip(${params.start}).limit(7).orderBy('time', 'desc').get()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.data,
  };
});

//查询未打扫报告列表
router.get("/nclist", async (ctx, next) => {
  const params = ctx.request.query;
  const query = `
    db.collection('report').where({status: '未打扫'}).skip(${params.start}).limit(5).orderBy('time', 'desc').get()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.data,
  };
});

//查询正常报告列表
router.get("/nlist", async (ctx, next) => {
  const params = ctx.request.query;
  const query = `
    db.collection('report').where({if: 1,status: '已处理'}).skip(${params.start}).limit(7).orderBy('time', 'desc').get()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.data,
  };
});

//查询异常报告列表
router.get("/alist", async (ctx, next) => {
  const params = ctx.request.query;
  const query = `
    db.collection('report').where({if: 2,status: '已处理'}).skip(${params.start}).limit(7).orderBy('time', 'desc').get()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.data,
  };
});

//报告详情
router.get("/detail", async (ctx, next) => {
  const params = ctx.request.query;
  console.log(params);
  console.log("#########################################");
  let query = `db.collection('report').aggregate().match({
    _id: '${params.reportId}'
  }).lookup({
    from: 'reportdetail',
    localField: '_id',
    foreignField: 'reportId',
    as: 'reportDetail'
  }).end()`

  const res = await callCloudDB(ctx, 'databaseaggregate', query)
  //解析出报告详情，建议挨个打印所有层级
  const detail = JSON.parse(res.data[0]);
  //请求报告图片下载链接
  let files = [];
  const reportDetail = detail.reportDetail;
  for (let i = 0, len = reportDetail.length; i < len; i++) {
    for (let j = 0, l = reportDetail[i].img.length; j < l; j++) {
      files.push({
        fileid: reportDetail[i].img[j],
        max_age: 7200,
      });
    }
  }

  const download = await cloudStorage.download(ctx, files);
  //报告图片数组
  let urls = [];
  for (let i = 0, len = download.file_list.length; i < len; i++) {
    urls.push(download.file_list[i].download_url);
  }

  detail.img = urls;
  console.log("---------------");
  console.log(detail.time);
  console.log(detail.time.$numberDouble > 100);
  console.log("---------------");
  ctx.body = {
    code: 20000,
    data: detail,
  };
});

//更新处理状态
router.post("/updatestatus", async (ctx, next) => {
  const params = ctx.request.body;
  const query = `db.collection('report').doc('${params._id}').update({
        data: {
            status: '已处理'
        }
        })`;
  const res = await callCloudDB(ctx, "databaseupdate", query);
  ctx.body = {
    code: 20000,
    data: res,
  };
});

//更新评分
router.post("/updatescore", async (ctx, next) => {
  const params = ctx.request.body;
  const query = `db.collection('report').doc('${params._id}').update({
        data: {
            score: ${params.value}

        }
        })`;
  const res = await callCloudDB(ctx, "databaseupdate", query);
  ctx.body = {
    code: 20000,
    data: res,
  };
});

//更新反馈
router.post("/updatefeedback", async (ctx, next) => {
  const params = ctx.request.body;
  console.log(params);
  const query = `db.collection('reportdetail').where({
    reportId: '${params.reportId}'
  }).update({
        data: {
            "feedback": '${params.feedback}',
            "handler": '${params.username}'
        }
        })`;
  const res = await callCloudDB(ctx, "databaseupdate", query);
  console.log(res);
  ctx.body = {
    code: 20000,
    data: res,
  };
});

//shaixuan
router.post("/filtertime", async (ctx, next) => {
  const params = ctx.request.body;
  const query = `db.collection('report').where({
    time: _.gte(${params.start}).and(_.lte(${params.end + 86400000})),
    if: ${params.if}
  }).get()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res,
  };
});

//shaixuan
router.post("/filter", async (ctx, next) => {
  const params = ctx.request.body;
  const query = `db.collection('report').where(
    ${JSON.stringify(params)}
  ).get()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res,
  };
});

// 添加未打扫记录
router.post('/addNotClean', async (ctx, next) => {
  const params = ctx.request.body
  const query = `db.collection('report').add({
            data: {
                classroom: '${params.classroom}',
                if: 3,
                score: 0,
                status: '未打扫',
                time: ${params.time},
                user_class: '${params.user_class}',
                _openid: ''
            }
        })`
  const res = await callCloudDB(ctx, 'databaseadd', query)
  ctx.body = {
    code: 20000,
    data: res
  }
})

module.exports = router;
