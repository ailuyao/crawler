const puppeteer = require('puppeteer')

const config = {
  userName: '',
  passWord: ''
}
;(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 前台运行
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  })

  // const page = (await browser.pages())[0]
  const page = await browser.newPage() // 新tab页

  // 打断图片请求
  await page.setRequestInterception(true)
  page.on('request', interceptedRequest => {
    let url = interceptedRequest.url()
    if (url.endsWith('.png') || url.endsWith('.jpeg') || url.endsWith('.gif')) {
      interceptedRequest.abort()
    } else {
      interceptedRequest.continue()
    }
  })
  page.on('response', response => {
    const req = response.request()
    console.log(req.method, response.status, req.url)
  })

  await page.goto('https://m.weibo.cn/')

  await Promise.all([
    page.evaluate(() => {
      document.querySelector('.lite-log-in').click()
    }),
    page.waitForNavigation({
      waitUntil: ['load'],
      timeout: 0
    })
  ])

  await page.waitFor(1000)
  await page.type('#loginName', config.userName, { delay: 10 })
  await page.waitFor(1000)
  await page.type('#loginPassword', config.passWord, { delay: 10 })

  await page.evaluate(() => {
    document.querySelector('#loginAction').click()
  })

  await page.waitForNavigation({
    waitUntil: ['load'],
    timeout: 0
  })

  await page.screenshot({
    path: 'static/weibo_index.png',
    clip: {
      x: 0,
      y: 0,
      width: 400,
      height: 100
    }
  })

  // 清除登录信息
  await page.deleteCookie({ name: 'SUB' })
  await browser.close()
})()

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason)
})
