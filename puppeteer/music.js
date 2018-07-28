const fs = require('fs')
const puppeteer = require('puppeteer')
;(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 前台运行
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    // '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
  })

  const page = await browser.newPage() // 新tab页
  await page.emulate({
    viewport: {
      width: 375,
      height: 812,
      isMobile: true
    },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
  })
  // 本tab跳转
  await page.goto('https://music.163.com/m/', { waitUntil: 'networkidle2' })

  // https://github.com/GoogleChrome/puppeteer/issues/2833
  // const searchTab = await page.$('nav > li:nth-child(3)')
  // await searchTab.click() // Node is either not visible or not an HTMLElement
  await page.evaluate(() => {
    document.querySelector('li.tabtitle:nth-child(3)').click()
  })

  // 模拟用户输入和点击
  const searchInput = 'form input.input'
  const search_text = '面筋哥'
  await page.type(searchInput, search_text, { delay: 10 })
  await page.keyboard.press('Enter')
  await page.waitFor(1000)

  const songListHandle = await page.$('.m-songlist > .m-sglst')
  // await ==> Error: Protocol error (Runtime.callFunctionOn): Target closed.
  const selectedSongHref = await page.evaluate(el => {
    // el 原生dom元素
    const songList = Array.from(el.childNodes)
    return songList[0].href
  }, songListHandle)

  await page.goto(selectedSongHref)

  // https://developers.google.com/web/tools/chrome-devtools/console/command-line-reference
  const songInfo = await page.evaluate(selector => {
    // $仅适用于在控制台本身, 无法脚本访问命令行API
    return document.querySelector(selector).innerHTML // string
  }, 'script[type="application/ld+json"]')
  const jsonStream = fs.createWriteStream('static/music_info.json')
  jsonStream.write(JSON.stringify(JSON.parse(songInfo), null, 2), 'utf8')
  jsonStream.end()

  // page.$eval
  const lyricInfo = await page.$$eval('.m-song-lritem', elements => {
    return elements
      .map(v => {
        return v.innerText.replace(/\s/g, '')
      })
      .join('\n')
  })
  const lyricStream = fs.createWriteStream('static/music_lyric.txt')
  lyricStream.write(lyricInfo, 'utf8')
  lyricStream.end()

  await browser.close()
})()

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason)
})
