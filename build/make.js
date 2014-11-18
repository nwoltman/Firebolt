/**
 * Firebolt Makfile
 *
 * Creates a minified version and a source map and moves those along with the
 * original Firebolt source to the dist folder, then creates a zip of those
 * three files and saves that to the dist folder as well.
 */

var fs = require('fs');
var UglifyJS = require("uglify-js");
var admZip = require('adm-zip')

const fireboltPath = '../src/firebolt.js';
const distPath = '../dist';
const distFirebolt = distPath + '/firebolt.js';
const distMinified = distPath + '/firebolt.min.js';
const distSourceMap = distPath + '/firebolt.min.map';
const distZip = distPath + '/Firebolt.zip';

var code = fs.readFileSync(fireboltPath, {encoding: 'utf8'});
var version = /@version\s+([0-9.]+)/.exec(code)[1];
var copyright = /@copyright\s+(.*)/.exec(code)[1];
var preamble = '/*! Firebolt ' + version + ' | (c)' + copyright + ' | fireboltjs.com/license */\n';

var result = UglifyJS.minify(fireboltPath, {
  outSourceMap: 'firebolt.min.map'
});

result.code = preamble + result.code.replace(/\r?\n\/\/#.*/, ''); // Remove source map comment

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath);
}
fs.writeFileSync(distFirebolt, code);
fs.writeFileSync(distMinified, result.code);
fs.writeFileSync(distSourceMap, result.map);

var zip = new admZip();
zip.addLocalFile(distFirebolt);
zip.addLocalFile(distMinified);
zip.addLocalFile(distSourceMap);
zip.writeZip(distZip);
