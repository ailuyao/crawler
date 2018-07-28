const puppeteer = require('puppeteer')

async function autoScroll(page) {
  // evaluate 作用于浏览器运行的上下文环境
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0
      const distance = 100
      const scrollHeight = document.body.scrollHeight

      const timer = setInterval(() => {
        window.scrollBy(0, distance)
        totalHeight += distance

        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })
}

;(async () => {
  const browser = await puppeteer.launch({
    // headless: false, // 前台运行
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  })

  const page = await browser.newPage() // 新tab页
  // 页面宽高默认 800 * 600
  await page.setViewport({
    width: 1280,
    height: 960
  })
  // 本tab跳转
  await page.goto('https://www.bilibili.com/', { waitUntil: 'networkidle2' })

  // 懒加载机制, 某些楼层图片没有截取出来
  await autoScroll(page)
  await page.screenshot({
    path: 'static/bili_index.png'
    // 指定区域截图, clip和fullPage 设置其一
    // fullPage: true
    // clip: {
    //   x: 0,
    //   y: 0,
    //   width: 1000,
    //   height: 400
    // }
  })

  // 保存路径相对 process.cwd(); `headless: false` does not support PDFs
  await page.pdf({ path: 'static/bili_page.pdf', format: 'A4' })

  await browser.close()
})()

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason)
})
