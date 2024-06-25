
# 安装依赖前 请使用 node 版本为 v14+

npm install tnpm -g --registry=https://registry.anpm.alibaba-inc.com
# or
npm i -g npminstall --registry=https://registry.anpm.alibaba-inc.com
npminstall -g tnpm --registry=https://registry.anpm.alibaba-inc.com

tnpm install

# start

tnpm run dev

# build

tnpm run build

# 目录结构
├─c-build
│  └─config  // =================  webpack 配置
├─src
│  ├─assets  
│  │  ├─api  // ==============  接口api 
│  │  ├─js    // ============  常用 utils 
│  │  └─scss  //  ===========   基础样式
│  │      └─style
│  ├─component  // =============  公共组件
│  │  ├─AForm
│  │  ├─ASelect
│  │  ├─header
│  │  ├─menus
│  │  └─queryList
│  ├─layout  
│  ├─pages   //  ===========  需手动配置路由 页面目录 
│  │  ├─404
│  │  ├─abort
│  │  └─user
│  ├─RouterView
│  ├─routes  // =========== 路由守卫 : app.js ,  路由配置 ： index.js
│  └─views  // ==========  自动生成路由 页面目录
│      ├─index
│      │  ├─api
│      │  └─scss
│      └─pages
│          ├─api
│          └─scss
└─static   // ============  不加入编译的静态资源目录
