var fs = require('fs');

task('default', ['']);

task('build', [], function() {
	process.argv[2] = 'lib/index.js';
	process.argv[3] = '--outfile=dist/loop.js';
	process.argv[4] = '--exports=require';
	require('browserify/bin/cmd');
});

task('build-min', [], function() {
	process.argv[2] = 'lib/index.js';
	process.argv[3] = '--outfile=dist/loop.min.js';
	process.argv[4] = '--exports=require';
	require('browserify/bin/cmd');


});

task('concat', [], function () {
	var files = ('test/loop/tween.js test/state/machine.js test/application.js test/loop.js').split(' '),
		output = 'test/browser/all-tests.js';

	if (fs.existsSync(output)) fs.unlinkSync(output);
	files.forEach(function(filename) {
		var content = fs.readFileSync(filename);
		fs.appendFileSync(output, content);
	});
});
