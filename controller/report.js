const Router = require("koa-router"); //引用koa-router
const router = new Router(); //创建路由实例
const cloudStorage = require("../utils/callCloudStorage.js");
const callCloudDB = require("../utils/callCloudDB.js"); //引用访问小程序云函数文件

// 数据库添加字段
// router.post("/addColumn", async (ctx, next) => {
//   const query = `db.collection('report').where({classroom: _.neq('')}).update({
//         data: {
//             college: 1
//         }
//         })`;
//   const res = await callCloudDB(ctx, "databaseupdate", query);
//   ctx.body = {
//     code: 20000,
//     data: res,
//   };
// });

//查询正常报告数量
router.get("/nlistcount", async (ctx, next) => {
  const query = `
    db.collection('report').where({if: 1,status: '已处理'}).count()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res.pager.Total,
  };
});

//查询异常报告数量
router.get("/alistcount", async (ctx, next) => {
  const query = `
    db.collection('report').where({if: 2,status: '已处理'}).count()`;
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
  const query = `db.collection('reportdetail').where({
    reportId: '${params.reportId}'
  }).update({
        data: {
            "feedback": '${params.feedback}',
            "handler": '${params.username}'
        }
        })`;
  const res = await callCloudDB(ctx, "databaseupdate", query);
  ctx.body = {
    code: 20000,
    data: res,
  };
});

//时间筛选
router.post("/filtertime", async (ctx, next) => {
  const params = ctx.request.body;
  const query = `db.collection('report').where({
    time: _.gte(${params.start}).and(_.lte(${params.end + 86400000})),
    if: ${params.if}
  }).orderBy('time', 'desc').get()`;
  const res = await callCloudDB(ctx, "databasequery", query);
  ctx.body = {
    code: 20000,
    data: res,
  };
});

//其他条件筛选
router.post("/filter", async (ctx, next) => {
  const params = ctx.request.body;
  let start = params.start;
  let timeFlag = params.timeFlag;
  delete params['start'];
  delete params['timeFlag'];
  if (timeFlag === 1) {
    let timeStart = params.timeStart
    let timeEnd = params.timeEnd
    delete params['timeStart'];
    delete params['timeEnd'];
    let paramStr = JSON.stringify(params)
    let condition = `${paramStr.substring(0, paramStr.length - 1)},time:_.gte(${timeStart}).and(_.lte(${timeEnd + 86400000}))}`
    const query = `db.collection('report').where(
      ${condition}
    ).skip(${start}).limit(7).orderBy('time', 'desc').get()`;
    const res = await callCloudDB(ctx, "databasequery", query);
    ctx.body = {
      code: 20000,
      data: res,
    };
  } else {
    const query = `db.collection('report').where(
      ${JSON.stringify(params)}
    ).skip(${start}).limit(7).orderBy('time', 'desc').get()`;
    const res = await callCloudDB(ctx, "databasequery", query);
    ctx.body = {
      code: 20000,
      data: res,
    };
  }
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
                college: ${params.college},
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

// 记录导出Excel表格
router.post('/exportData', async (ctx, next) => {
  const params = ctx.request.body
  let timeFlag = params.timeFlag;
  let timeStart
  let timeEnd
  delete params['start'];
  delete params['timeFlag'];
  let countQuery = `db.collection('report').where(
    ${JSON.stringify(params)}
  ).count()`;
  if (timeFlag === 1) {
    timeStart = params.timeStart
    timeEnd = params.timeEnd
    delete params['timeStart'];
    delete params['timeEnd'];
    let paramStr = JSON.stringify(params)
    let condition = `${paramStr.substring(0, paramStr.length - 1)},time:_.gte(${timeStart}).and(_.lte(${timeEnd + 86400000}))}`
    countQuery = `db.collection('report').where(
      ${condition}
    ).count()`;
  }
  const countRes = await callCloudDB(ctx, "databasequery", countQuery);
  const totalRecord = countRes.pager.Total
  const limitNumber = 10
  let resultList = []
  for (let startIndex = 0; startIndex < totalRecord; startIndex += limitNumber) {
    let resultQuery = `db.collection('report').where(
      ${JSON.stringify(params)}
    ).skip(${startIndex}).limit(${limitNumber}).orderBy('time', 'desc').get()`;
    if (timeFlag === 1) {
      delete params['timeStart'];
      delete params['timeEnd'];
      let paramStr = JSON.stringify(params)
      let condition = `${paramStr.substring(0, paramStr.length - 1)},time:_.gte(${timeStart}).and(_.lte(${timeEnd + 86400000}))}`
      resultQuery = `db.collection('report').where(
        ${condition}
      ).skip(${startIndex}).limit(${limitNumber}).orderBy('time', 'desc').get()`;
    }
    const resultRes = await callCloudDB(ctx, "databasequery", resultQuery);
    let resultResList = resultRes.data
    let detailResList = []
    for (let i = 0; i < resultResList.length; i++) {
      let resultBody = JSON.parse(resultResList[i])
      let detailQuery = `db.collection('report').aggregate().match({
          _id: '${resultBody._id}'
        }).lookup({
          from: 'reportdetail',
          localField: '_id',
          foreignField: 'reportId',
          as: 'reportDetail'
        }).end()`
      const detailRes = await callCloudDB(ctx, "databaseaggregate", detailQuery);
      //解析出报告详情，建议挨个打印所有层级
      const detail = JSON.parse(detailRes.data[0]);
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
      detailResList = detailResList.concat(detail)
    }
    resultList = resultList.concat(detailResList)
  }
  ctx.body = {
    code: 20000,
    data: resultList
  }
})

module.exports = router;
