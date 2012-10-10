var fs = require('fs'),
	exec = require('child_process').exec,
	path = require('path'),
	browserify = require('browserify'),
	uglify = require("uglify-js");

namespace('build', function() {
	task('dev', [], function() {
		var bundle = browserify({
			watch: false,
			cache: true,
			debug: false,
			exports: 'require'
		});

		quiet();
		bundle.addEntry(path.join(__dirname, 'lib/index.js'));
		var src = bundle.bundle();
		unquiet();

		if (!bundle.ok) return;

		fs.writeFile(path.join(__dirname, 'dist/loop.js'), src, complete);
	}, { async: true });

	task('dist', ['build:dev'], function() {
		var src = fs.readFileSync(path.join(__dirname, 'dist/loop.js'), 'utf-8');
		src = uglify.parser.parse(src);
		src = uglify.uglify.ast_mangle(src);
		src = uglify.uglify.ast_squeeze(src);
		src = uglify.uglify.gen_code(src)

		fs.appendFileSync(path.join(__dirname, 'dist/loop.min.js'), src);
	});

	task('test', ['build:dev'], function() {
		// todo: auto discovery, use of index.js?
		var files = ('test/loop/tween.js test/state/machine.js test/application.js test/loop.js test/util.js').split(' '),
			output = path.join(__dirname, 'test/browser/all-tests.js');

		if (fs.existsSync(output)) fs.unlinkSync(output);
		files.forEach(function(filename) {
			var content = fs.readFileSync(path.join(__dirname, filename));
			fs.appendFileSync(output, content);
		});
	});

	task('all', ['build:dist', 'build:test']);
});

task('build', ['build:dev', 'build:test']);

namespace('test', function() {
	task('browser', ['build:test'], function() {
		// todo: for *nix and mac
		// http://stackoverflow.com/questions/3124556/clean-way-to-launch-the-web-browser-from-shell-script
		exec('start ' + path.join(__dirname, 'test/browser/index.html'));
	});
});

task('test', function() {
	console.log('please run "npm test" instead.');
});

task('watch', ['build:all'], function() {
	var build = (function() {
		var timerId, running = false;

		function onBuildComplete() {
			this.removeAllListeners('complete');
			this.reenable(true);
			running = false;
		}

		return function(event, filename) {
			if (running) return;
			if (!filename || /^(Jakefile|\.)/.test(filename)) return;

			// ensure we launch this once per flow of events
			clearTimeout(timerId);
			timerId = setTimeout(function() {
				running = true;

				var buildTask = jake.Task['build'];
				buildTask.addListener('complete', onBuildComplete);
				buildTask.invoke();
			}, 500);
		};
	})();

	fs.watch(__dirname, build);
});

task('default', ['build']);

function quiet() {
	console._log = console.log;
	console._error = console.error;
	console.log = function() {};
	console.error = function() {};
}

function unquiet() {
	console.log = console._log;
	console.error = console._error;
	delete console._log;
	delete console._error;
}
