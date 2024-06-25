var glob = require('glob');
var path = require('path')
function upperToLine(name) {
  if (typeof name !== 'string') return name;
  return name
    .replace(/(?:[A-Z])/g, function ($1, $2) {
      return '-' + $1.toLocaleLowerCase();
    })
    .replace(/^\-/, '');
}
module.exports = {
  "presets": [
    [
      "@babel/preset-env", {
        "useBuiltIns": "usage",
        "corejs": 3.22
      }
    ],
    "@babel/preset-react",
    "@babel/preset-flow"
  ],
  "plugins": [
    [
      'import',
      {
        "libraryName": "@/component",
        "customName": (name, file) => {
          var pathName = []
          glob.sync(path.join(__dirname, './src/component/**/index.js')).forEach(function (entry){
            var fileName = entry.split('/component/')[1].replace('index.js', '').split('/')[0]
            fileName && pathName.push(fileName)
          })
          const componentName = pathName.find(n => {
            return (upperToLine(n).toLowerCase()) === name.toLowerCase()
          })
          return `@/component/${componentName}`
        },
        "style": false
      },
      '@/component'
    ],
  ]
}
