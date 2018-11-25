const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const JSONToFile = (obj, filename) => fs.writeFileSync(`${filename}.json`, JSON.stringify(obj, null, 2));

// 子进程跑爬虫
(async () => {
	const script = path.resolve(__dirname, './puppeteer/douban');
	const child = cp.fork(script, []);

	let invoked = false;

	child.on('error', err => {
		if (invoked) return;

		invoked = true;

		console.log(err);
	});

	child.on('exit', code => {
		if (invoked) return;

		invoked = true;

		let err = code === 0 ? null : new Error('exit code' + code);

		if (err) console.log(err);
	});

	child.on('message', data => {
		let result = data.result;

		JSONToFile(result, 'static/movie');
	});
})();
