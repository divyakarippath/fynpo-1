(window.webpackJsonp=window.webpackJsonp||[]).push([[13],{83:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return a})),n.d(t,"metadata",(function(){return c})),n.d(t,"toc",(function(){return l})),n.d(t,"default",(function(){return m}));var r=n(3),o=n(7),i=(n(0),n(93)),a={id:"commitlint",title:"Versioning"},c={unversionedId:"getting-started/commitlint",id:"getting-started/commitlint",isDocsHomePage:!1,title:"Versioning",description:"The versioning of modules in fynpo mono repo are all automatically controlled by the commit messages. The default commitlint configuration supports commmit message in   format, where:",source:"@site/docs/getting-started/commitlint.md",sourceDirName:"getting-started",slug:"/getting-started/commitlint",permalink:"/fynpo/docs/getting-started/commitlint",editUrl:"https://github.com/electrode-io/fynpo/tree/master/docusaurus/docs/docs/getting-started/commitlint.md",version:"current",frontMatter:{id:"commitlint",title:"Versioning"},sidebar:"someSidebar",previous:{title:"Configuration",permalink:"/fynpo/docs/getting-started/configuration"},next:{title:"Publish Flow",permalink:"/fynpo/docs/getting-started/publish"}},l=[],p={toc:l};function m(e){var t=e.components,n=Object(o.a)(e,["components"]);return Object(i.b)("wrapper",Object(r.a)({},p,n,{components:t,mdxType:"MDXLayout"}),Object(i.b)("p",null,"The versioning of modules in fynpo mono repo are all automatically controlled by the commit messages. The default commitlint configuration supports commmit message in ",Object(i.b)("inlineCode",{parentName:"p"},"[<semver>][feat|bug|chore] <message>")," format, where:\n",Object(i.b)("inlineCode",{parentName:"p"},"<semver>")," can be:"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},Object(i.b)("inlineCode",{parentName:"li"},"major")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("inlineCode",{parentName:"li"},"minor")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("inlineCode",{parentName:"li"},"patch")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("inlineCode",{parentName:"li"},"chore"))),Object(i.b)("p",null,"The format of commit type can be modified by updating the below config:"),Object(i.b)("pre",null,Object(i.b)("code",{parentName:"pre",className:"language-javaScript"},'parserPreset: {\n    parserOpts: {\n        headerPattern: /^\\[([^\\]]+)\\] ?(\\[[^\\]]+\\])? +(.+)$/,\n        headerCorrespondence: ["type", "scope", "subject"],\n    },\n},\n')),Object(i.b)("p",null,"Refer ",Object(i.b)("a",{parentName:"p",href:"https://commitlint.js.org/#/reference-configuration"},"here")," to read more about the supported configurations for commitlint."),Object(i.b)("h4",{id:"commit-hooks"},"Commit hooks:"),Object(i.b)("p",null,"To add commit hook,"),Object(i.b)("pre",null,Object(i.b)("code",{parentName:"pre"},"# Install Husky\nnpm install husky --save-dev\n\n# Active hooks\nnpx husky install\n\n# Add hook\nnpx husky add .husky/commit-msg 'npx --no-install fynpo commitlint --edit $1'\n")),Object(i.b)("p",null,Object(i.b)("strong",{parentName:"p"},"Note"),": fynpo repo initialized using ",Object(i.b)("inlineCode",{parentName:"p"},"create-fynpo")," will alreday have ",Object(i.b)("inlineCode",{parentName:"p"},"husky")," added in ",Object(i.b)("inlineCode",{parentName:"p"},"devDependencies")," and also ",Object(i.b)("inlineCode",{parentName:"p"},"husky install")," added to the ",Object(i.b)("inlineCode",{parentName:"p"},"prepare")," script."),Object(i.b)("h4",{id:"test"},"Test:"),Object(i.b)("p",null,"To test the simple usage,"),Object(i.b)("pre",null,Object(i.b)("code",{parentName:"pre"},"echo '[test] msg' | npx fynpo commitlint\n")),Object(i.b)("p",null,"To test the hook,"),Object(i.b)("pre",null,Object(i.b)("code",{parentName:"pre"},'git commit -m "[patch] message"\n')))}m.isMDXComponent=!0},93:function(e,t,n){"use strict";n.d(t,"a",(function(){return s})),n.d(t,"b",(function(){return d}));var r=n(0),o=n.n(r);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var p=o.a.createContext({}),m=function(e){var t=o.a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},s=function(e){var t=m(e.components);return o.a.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return o.a.createElement(o.a.Fragment,{},t)}},b=o.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,a=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),s=m(n),b=r,d=s["".concat(a,".").concat(b)]||s[b]||u[b]||i;return n?o.a.createElement(d,c(c({ref:t},p),{},{components:n})):o.a.createElement(d,c({ref:t},p))}));function d(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,a=new Array(i);a[0]=b;var c={};for(var l in t)hasOwnProperty.call(t,l)&&(c[l]=t[l]);c.originalType=e,c.mdxType="string"==typeof e?e:r,a[1]=c;for(var p=2;p<i;p++)a[p]=n[p];return o.a.createElement.apply(null,a)}return o.a.createElement.apply(null,n)}b.displayName="MDXCreateElement"}}]);