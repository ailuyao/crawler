const fs = require('fs')
const path = require('path')
const ora = require('ora')
const chalk = require('chalk')

const request = require('superagent')
const cheerio = require('cheerio')
const async = require('async')

const spinner = ora({
  color: 'yellow'
})

// http://www.sina.lt/
const target = 'http://t.cn/ReXt7LQ'

async function getTrending(target) {
  spinner.start(chalk.blue('开始抓取排行榜数据....'))

  const resp = await request.get(target)
  const $ = cheerio.load(resp.text)
  const domList = Array.from($('.item'))
  // console.log(window.__INITIAL_STATE__)
  const list = []
  domList.forEach(el => {
    const $el = $(el)
    const item = {
      title: $el.find('.bangumi').text(),
      summary: $el.find('.role').text(),
      // avatar: $el.find('.avatar img').attr('src')
      avatar: 'https://picsum.photos/200/300/?random'
    }

    item.title && list.push(item)
  })

  fs.writeFileSync(
    path.resolve(__dirname, 'trending.js'),
    `module.exports=${JSON.stringify(list, null, 2)}`
  )
  spinner.succeed(chalk.green('抓取排行榜数据完毕....'))
  downloadImg(list)
}

function downloadImg(albumList) {
  let downloadCount = 0
  let q = async.queue(async (image, callback) => {
    spinner.text = chalk.blue(`正在下载${image.title}`)
    const resp = await request.get(image.url)
    downloadCount++

    const fileExt = path.extname(image.url.split('?')[0]) || '.jpeg'

    // 二进制数据
    fs.writeFileSync(
      path.resolve(__dirname, `imgs/${image.title}-${downloadCount}${fileExt}`),
      resp.body
      // `${JSON.stringify(resp.body, null, 2)}`
    )

    callback(null)
  }, 3)

  q.drain = function() {
    spinner.succeed(chalk.green('下载图片完毕....'))
  }

  let imgList = []
  albumList.forEach(album => {
    imgList.push({ title: album.title, url: album.avatar })
  })
  q.push(imgList)
  spinner.start(chalk.blue('开始下载图片....'))
}

getTrending(target)

process.on('unhandledRejection', err => {
  console.log('\n', chalk.red(`抓取数据失败 \n`), err.message)
  process.exit(1)
})
