var fs = require('fs'),
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

	task('test', [], function() {
		// todo: auto discovery
		var files = ('test/loop/tween.js test/state/machine.js test/application.js test/loop.js').split(' '),
			output = path.join(__dirname, 'test/browser/all-tests.js');

		if (fs.existsSync(output)) fs.unlinkSync(output);
		files.forEach(function(filename) {
			var content = fs.readFileSync(path.join(__dirname, filename));
			fs.appendFileSync(output, content);
		});
	});
});

task('build', ['build:dev']);

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
