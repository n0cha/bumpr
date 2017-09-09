desc('Run Selenium tests');
task('test', (complete) => {
  console.log('Integration testing project:');
  jake.exec('node node_modules/mocha/bin/mocha test/**/*.test.js', { interactive: true }, complete);
}, { async: true });

desc('Package client');
packageTask('package', 'v0.0.1', function () {
  console.log('Packaging client into /pkg:');
  this.name = 'bumpr';
  this.packageFiles.include('icon/**/*');
  this.packageFiles.include('plugins/**/*');
  this.packageFiles.include('www/**/*');
  this.packageFiles.include('config.xml');
  this.needZip = true;
});