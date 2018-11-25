const puppeteer = require('puppeteer');

const url = `https://movie.douban.com/tag/#/?sort=U&range=0,10`;

const sleep = time =>
	new Promise(resolve => {
		setTimeout(resolve, time);
	});

(async () => {
	console.log('Start visit the target page');

	const browser = await puppeteer.launch({
		args: ['--no-sandbox'],
		dumpio: false
	});

	const page = await browser.newPage();
	await page.goto(url, {
		waitUntil: 'networkidle2'
	});

	await sleep(2000);

	await page.waitForSelector('.more');

	for (let i = 0; i <= 2; i++) {
		await sleep(2000);
		await page.click('.more');
	}

	const result = await page.evaluate(() => {
		const $ = window.$;

		var items = $('.list-wp a');
		var lists = [];

		if (items.length >= 1) {
			items.each((index, item) => {
				let it = $(item);
				let doubanId = it.find('div').data('id');
				let title = it.find('.title').text();
				let rate = Number(it.find('.rate').text());
				let poster = it
					.find('img')
					.attr('src')
					.replace('s_ratio', 'l_ratio');

				lists.push({
					doubanId,
					title,
					rate,
					poster
				});
			});
		}
		return lists;
	});

	browser.close();

	process.send({ result });
	await sleep(100);
	process.exit(0);
})();
