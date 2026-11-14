function Mt(d){return d&&d.__esModule&&Object.prototype.hasOwnProperty.call(d,"default")?d.default:d}var ce={exports:{}},y={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var me;function gt(){if(me)return y;me=1;var d=Symbol.for("react.transitional.element"),s=Symbol.for("react.portal"),_=Symbol.for("react.fragment"),k=Symbol.for("react.strict_mode"),E=Symbol.for("react.profiler"),A=Symbol.for("react.consumer"),D=Symbol.for("react.context"),L=Symbol.for("react.forward_ref"),z=Symbol.for("react.suspense"),$=Symbol.for("react.memo"),P=Symbol.for("react.lazy"),H=Symbol.for("react.activity"),q=Symbol.for("react.view_transition"),j=Symbol.iterator;function C(e){return e===null||typeof e!="object"?null:(e=j&&e[j]||e["@@iterator"],typeof e=="function"?e:null)}var T={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},M=Object.assign,O={};function x(e,a,o){this.props=e,this.context=a,this.refs=O,this.updater=o||T}x.prototype.isReactComponent={},x.prototype.setState=function(e,a){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,a,"setState")},x.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function B(){}B.prototype=x.prototype;function W(e,a,o){this.props=e,this.context=a,this.refs=O,this.updater=o||T}var U=W.prototype=new B;U.constructor=W,M(U,x.prototype),U.isPureReactComponent=!0;var J=Array.isArray;function Y(){}var g={H:null,A:null,T:null,S:null},ne=Object.prototype.hasOwnProperty;function X(e,a,o){var r=o.ref;return{$$typeof:d,type:e,key:a,ref:r!==void 0?r:null,props:o}}function re(e,a){return X(e.type,a,e.props)}function ee(e){return typeof e=="object"&&e!==null&&e.$$typeof===d}function oe(e){var a={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(o){return a[o]})}var te=/\/+/g;function Z(e,a){return typeof e=="object"&&e!==null&&e.key!=null?oe(""+e.key):a.toString(36)}function ae(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(Y,Y):(e.status="pending",e.then(function(a){e.status==="pending"&&(e.status="fulfilled",e.value=a)},function(a){e.status==="pending"&&(e.status="rejected",e.reason=a)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function F(e,a,o,r,i){var u=typeof e;(u==="undefined"||u==="boolean")&&(e=null);var l=!1;if(e===null)l=!0;else switch(u){case"bigint":case"string":case"number":l=!0;break;case"object":switch(e.$$typeof){case d:case s:l=!0;break;case P:return l=e._init,F(l(e._payload),a,o,r,i)}}if(l)return i=i(e),l=r===""?"."+Z(e,0):r,J(i)?(o="",l!=null&&(o=l.replace(te,"$&/")+"/"),F(i,a,o,"",function(w){return w})):i!=null&&(ee(i)&&(i=re(i,o+(i.key==null||e&&e.key===i.key?"":(""+i.key).replace(te,"$&/")+"/")+l)),a.push(i)),1;l=0;var m=r===""?".":r+":";if(J(e))for(var p=0;p<e.length;p++)r=e[p],u=m+Z(r,p),l+=F(r,a,o,u,i);else if(p=C(e),typeof p=="function")for(e=p.call(e),p=0;!(r=e.next()).done;)r=r.value,u=m+Z(r,p++),l+=F(r,a,o,u,i);else if(u==="object"){if(typeof e.then=="function")return F(ae(e),a,o,r,i);throw a=String(e),Error("Objects are not valid as a React child (found: "+(a==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":a)+"). If you meant to render a collection of children, use an array instead.")}return l}function Q(e,a,o){if(e==null)return e;var r=[],i=0;return F(e,r,"","",function(u){return a.call(o,u,i++)}),r}function se(e){if(e._status===-1){var a=e._result,o=a();o.then(function(r){(e._status===0||e._status===-1)&&(e._status=1,e._result=r,o.status===void 0&&(o.status="fulfilled",o.value=r))},function(r){(e._status===0||e._status===-1)&&(e._status=2,e._result=r,o.status===void 0&&(o.status="rejected",o.reason=r))}),e._status===-1&&(e._status=0,e._result=o)}if(e._status===1)return e._result.default;throw e._result}var n=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var a=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(a))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function t(e){var a=g.T,o={};o.types=a!==null?a.types:null,g.T=o;try{var r=e(),i=g.S;i!==null&&i(o,r),typeof r=="object"&&r!==null&&typeof r.then=="function"&&r.then(Y,n)}catch(u){n(u)}finally{a!==null&&o.types!==null&&(a.types=o.types),g.T=a}}function c(e){var a=g.T;if(a!==null){var o=a.types;o===null?a.types=[e]:o.indexOf(e)===-1&&o.push(e)}else t(c.bind(null,e))}var h={map:Q,forEach:function(e,a,o){Q(e,function(){a.apply(this,arguments)},o)},count:function(e){var a=0;return Q(e,function(){a++}),a},toArray:function(e){return Q(e,function(a){return a})||[]},only:function(e){if(!ee(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};return y.Activity=H,y.Children=h,y.Component=x,y.Fragment=_,y.Profiler=E,y.PureComponent=W,y.StrictMode=k,y.Suspense=z,y.ViewTransition=q,y.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=g,y.__COMPILER_RUNTIME={__proto__:null,c:function(e){return g.H.useMemoCache(e)}},y.addTransitionType=c,y.cache=function(e){return function(){return e.apply(null,arguments)}},y.cacheSignal=function(){return null},y.cloneElement=function(e,a,o){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var r=M({},e.props),i=e.key;if(a!=null)for(u in a.key!==void 0&&(i=""+a.key),a)!ne.call(a,u)||u==="key"||u==="__self"||u==="__source"||u==="ref"&&a.ref===void 0||(r[u]=a[u]);var u=arguments.length-2;if(u===1)r.children=o;else if(1<u){for(var l=Array(u),m=0;m<u;m++)l[m]=arguments[m+2];r.children=l}return X(e.type,i,r)},y.createContext=function(e){return e={$$typeof:D,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:A,_context:e},e},y.createElement=function(e,a,o){var r,i={},u=null;if(a!=null)for(r in a.key!==void 0&&(u=""+a.key),a)ne.call(a,r)&&r!=="key"&&r!=="__self"&&r!=="__source"&&(i[r]=a[r]);var l=arguments.length-2;if(l===1)i.children=o;else if(1<l){for(var m=Array(l),p=0;p<l;p++)m[p]=arguments[p+2];i.children=m}if(e&&e.defaultProps)for(r in l=e.defaultProps,l)i[r]===void 0&&(i[r]=l[r]);return X(e,u,i)},y.createRef=function(){return{current:null}},y.forwardRef=function(e){return{$$typeof:L,render:e}},y.isValidElement=ee,y.lazy=function(e){return{$$typeof:P,_payload:{_status:-1,_result:e},_init:se}},y.memo=function(e,a){return{$$typeof:$,type:e,compare:a===void 0?null:a}},y.startTransition=t,y.unstable_useCacheRefresh=function(){return g.H.useCacheRefresh()},y.use=function(e){return g.H.use(e)},y.useActionState=function(e,a,o){return g.H.useActionState(e,a,o)},y.useCallback=function(e,a){return g.H.useCallback(e,a)},y.useContext=function(e){return g.H.useContext(e)},y.useDebugValue=function(){},y.useDeferredValue=function(e,a){return g.H.useDeferredValue(e,a)},y.useEffect=function(e,a){return g.H.useEffect(e,a)},y.useEffectEvent=function(e){return g.H.useEffectEvent(e)},y.useId=function(){return g.H.useId()},y.useImperativeHandle=function(e,a,o){return g.H.useImperativeHandle(e,a,o)},y.useInsertionEffect=function(e,a){return g.H.useInsertionEffect(e,a)},y.useLayoutEffect=function(e,a){return g.H.useLayoutEffect(e,a)},y.useMemo=function(e,a){return g.H.useMemo(e,a)},y.useOptimistic=function(e,a){return g.H.useOptimistic(e,a)},y.useReducer=function(e,a,o){return g.H.useReducer(e,a,o)},y.useRef=function(e){return g.H.useRef(e)},y.useState=function(e){return g.H.useState(e)},y.useSyncExternalStore=function(e,a,o){return g.H.useSyncExternalStore(e,a,o)},y.useTransition=function(){return g.H.useTransition()},y.version="19.3.0",y}var ve;function _t(){return ve||(ve=1,ce.exports=gt()),ce.exports}var V=_t();const Dt=Mt(V);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wt=d=>d==null?void 0:d.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function Ct(d,s,_=[]){if(s==null)throw new Error("[lucide]: iconNode is required when icon name is used");return{name:wt(d),size:24,node:s,..._.length>0?{aliases:_}:{}}}/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bt=d=>{let s="",_=!1;for(const k of d){if(k==="-"||k==="_"||k<=" "){_=s.length>0;continue}s.length===0?s+=k.toLowerCase():s+=_?k.toUpperCase():k,_=!1}return s};/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Et=d=>{const s=bt(d);return s.charAt(0).toUpperCase()+s.slice(1)};/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le=(...d)=>d.filter((s,_,k)=>!!s&&s.trim()!==""&&k.indexOf(s)===_).join(" ").trim();/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function ue(d){return d!=null}function xt(d,s={}){var q,j;const _=s.attributeNames??{},k=C=>_[C]??C,E=d.size??d.width??G.width,A=d.size??d.height??G.height,D=((q=d.aliases)==null?void 0:q.filter(C=>typeof C=="string"&&C.trim()!=="").map(C=>`lucide-${C}`))??[],L=[...d.name?[`lucide-${d.name}`]:[],...D],z=((j=s.className)==null?void 0:j.split(" ").filter(Boolean))??[],$=s.includeDefaultClasses===!1?le(...z):le("lucide",...L,...z),P=s.absoluteStrokeWidth?Number(s.strokeWidth??G["stroke-width"])*Number(d.size??d.width??G.width)/Number(s.size??s.width??G.width):s.strokeWidth??G["stroke-width"];return["svg",{...Object.entries(G).reduce((C,[T,M])=>(C[k(T)]=M,C),{}),..."color"in s&&s.color&&{[k("stroke")]:s.color},..."size"in s&&ue(s.size)&&{[k("width")]:s.size,[k("height")]:s.size},..."width"in s&&ue(s.width)&&{[k("width")]:s.width},..."height"in s&&ue(s.height)&&{[k("height")]:s.height},[k("stroke-width")]:P,...$&&{[k("class")]:$},[k("viewBox")]:`0 0 ${E} ${A}`,...s.hasA11yProp===!1?{[k("aria-hidden")]:"true"}:{},..."attributes"in s&&s.attributes},d.node.map(C=>{const[T,M,O]=C,x=s.nonScalingStroke?{[k("vector-effect")]:"non-scaling-stroke",...M}:M;return O?[T,x,O]:[T,x]})]}/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function zt(d,s={}){return xt(d,{...s,attributeNames:{...s.attributeNames,class:"className","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","vector-effect":"vectorEffect"}})}/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=d=>{for(const s in d)if(s.startsWith("aria-")||s==="role"||s==="title")return!0;return!1},Rt=V.createContext({}),St=()=>V.useContext(Rt),At=V.forwardRef(({color:d,size:s,width:_,height:k,strokeWidth:E,absoluteStrokeWidth:A,nonScalingStroke:D,className:L="",children:z,iconNode:$=[],icon:P={node:$,aliases:[],size:24},...H},q)=>{const{size:j=24,strokeWidth:C=2,absoluteStrokeWidth:T=!1,nonScalingStroke:M=!1,color:O="currentColor",className:x=""}=St()??{},B=!!z||Tt(H),[W,U,J=[]]=zt(P,{color:d??O,width:_??s??j,height:k??s??j,strokeWidth:E??C,absoluteStrokeWidth:A??T,nonScalingStroke:D??M,className:le(x,L),hasA11yProp:B,attributes:H});return V.createElement(W,{ref:q,...U},[...J.map(([Y,g])=>V.createElement(Y,g)),...Array.isArray(z)?z:[z]])});/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function f(d,s=[],_=[]){const k=typeof d=="string"?Ct(d,s,_):d,E=V.forwardRef(({className:A,...D},L)=>V.createElement(At,{ref:L,icon:k,className:A,...D}));return k.name&&(E.displayName=Et(k.name)),E}/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke={name:"arrow-left",size:24,node:[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]};ke.node;const $t=f(ke);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me={name:"book-open",size:24,node:[["path",{d:"M12 5v16",key:"1f6ucr"}],["path",{d:"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z",key:"1fyvmf"}]]};Me.node;const Pt=f(Me);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge={name:"bot",size:24,node:[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]};ge.node;const jt=f(ge);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e={name:"check",size:24,node:[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]};_e.node;const It=f(_e);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we={name:"chevron-down",size:24,node:[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]};we.node;const Lt=f(we);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce={name:"chevron-left",size:24,node:[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]};Ce.node;const Ht=f(Ce);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be={name:"chevron-right",size:24,node:[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]};be.node;const Ot=f(be);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ee={name:"chevron-up",size:24,node:[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]};Ee.node;const Nt=f(Ee);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe={name:"circle-check",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m16 9-5.5 5.5L8 12",key:"xofnsj"}]],aliases:["check-circle-2"]};xe.node;const qt=f(xe);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze={name:"clock",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]]};ze.node;const Bt=f(ze);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te={name:"copy",size:24,node:[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]};Te.node;const Ft=f(Te);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Re={name:"crown",size:24,node:[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]]};Re.node;const Vt=f(Re);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se={name:"dices",size:24,node:[["rect",{width:"12",height:"12",x:"2",y:"10",rx:"2",ry:"2",key:"6agr2n"}],["path",{d:"m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6",key:"1o487t"}],["path",{d:"M6 18h.01",key:"uhywen"}],["path",{d:"M10 14h.01",key:"ssrbsk"}],["path",{d:"M15 6h.01",key:"cblpky"}],["path",{d:"M18 9h.01",key:"2061c0"}]]};Se.node;const Wt=f(Se);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae={name:"eraser",size:24,node:[["path",{d:"M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21",key:"g5wo59"}],["path",{d:"m5.082 11.09 8.828 8.828",key:"1wx5vj"}]]};Ae.node;const Ut=f(Ae);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De={name:"eye",size:24,node:[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]};De.node;const Yt=f(De);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e={name:"face-slightly-smiling",size:24,node:[["path",{d:"M15 10V9",key:"4dkmfx"}],["path",{d:"M16.472 15a6 6 0 01-8.943 0",key:"7qomzy"}],["path",{d:"M9 10V9",key:"1lazqi"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],aliases:["smile"]};$e.node;const Zt=f($e);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe={name:"flame",size:24,node:[["path",{d:"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",key:"1slcih"}]]};Pe.node;const Kt=f(Pe);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je={name:"flask-conical",size:24,node:[["path",{d:"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2",key:"18mbvz"}],["path",{d:"M6.453 15h11.094",key:"3shlmq"}],["path",{d:"M8.5 2h7",key:"csnxdl"}]]};je.node;const Gt=f(je);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie={name:"link-2",size:24,node:[["path",{d:"M9 17H7A5 5 0 0 1 7 7h2",key:"8i5ue5"}],["path",{d:"M15 7h2a5 5 0 1 1 0 10h-2",key:"1b9ql8"}],["line",{x1:"8",x2:"16",y1:"12",y2:"12",key:"1jonct"}]]};Ie.node;const Jt=f(Ie);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le={name:"log-in",size:24,node:[["path",{d:"m10 17 5-5-5-5",key:"1bsop3"}],["path",{d:"M15 12H3",key:"6jk70r"}],["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}]]};Le.node;const Qt=f(Le);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He={name:"log-out",size:24,node:[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]]};He.node;const Xt=f(He);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe={name:"maximize-2",size:24,node:[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"m21 3-7 7",key:"1l2asr"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M9 21H3v-6",key:"wtvkvv"}]]};Oe.node;const en=f(Oe);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ne={name:"message-square",size:24,node:[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}]]};Ne.node;const tn=f(Ne);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qe={name:"minimize-2",size:24,node:[["path",{d:"m14 10 7-7",key:"oa77jy"}],["path",{d:"M20 10h-6V4",key:"mjg0md"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M4 14h6v6",key:"rmj7iw"}]]};qe.node;const nn=f(qe);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be={name:"palette",size:24,node:[["path",{d:"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",key:"e79jfc"}],["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}]]};Be.node;const an=f(Be);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe={name:"play",size:24,node:[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]};Fe.node;const rn=f(Fe);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve={name:"plus",size:24,node:[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]};Ve.node;const on=f(Ve);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We={name:"redo-2",size:24,node:[["path",{d:"m15 14 5-5-5-5",key:"12vg1m"}],["path",{d:"M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13",key:"6uklza"}]]};We.node;const sn=f(We);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue={name:"refresh-cw",size:24,node:[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]};Ue.node;const cn=f(Ue);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye={name:"rotate-ccw",size:24,node:[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]};Ye.node;const un=f(Ye);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze={name:"scale",size:24,node:[["path",{d:"M12 3v18",key:"108xh3"}],["path",{d:"m19 8 3 8a5 5 0 0 1-6 0zV7",key:"zcdpyk"}],["path",{d:"M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1",key:"1yorad"}],["path",{d:"m5 8 3 8a5 5 0 0 1-6 0zV7",key:"eua70x"}],["path",{d:"M7 21h10",key:"1b0cd5"}]]};Ze.node;const ln=f(Ze);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke={name:"scroll",size:24,node:[["path",{d:"M19 17V5a2 2 0 0 0-2-2H4",key:"zz82l3"}],["path",{d:"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",key:"1ph1d7"}]]};Ke.node;const dn=f(Ke);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge={name:"send",size:24,node:[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]};Ge.node;const hn=f(Ge);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Je={name:"settings-2",size:24,node:[["path",{d:"M14 17H5",key:"gfn3mx"}],["path",{d:"M19 7h-9",key:"6i9tg"}],["circle",{cx:"17",cy:"17",r:"3",key:"18b49y"}],["circle",{cx:"7",cy:"7",r:"3",key:"dfmy0x"}]]};Je.node;const fn=f(Je);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe={name:"shield",size:24,node:[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]};Qe.node;const yn=f(Qe);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe={name:"sliders-horizontal",size:24,node:[["path",{d:"M10 5H3",key:"1qgfaw"}],["path",{d:"M12 19H3",key:"yhmn1j"}],["path",{d:"M14 3v4",key:"1sua03"}],["path",{d:"M16 17v4",key:"1q0r14"}],["path",{d:"M21 12h-9",key:"1o4lsq"}],["path",{d:"M21 19h-5",key:"1rlt1p"}],["path",{d:"M21 5h-7",key:"1oszz2"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M8 12H3",key:"a7s4jb"}]]};Xe.node;const pn=f(Xe);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const et={name:"snowflake",size:24,node:[["path",{d:"m10 20-1.25-2.5L6 18",key:"18frcb"}],["path",{d:"M10 4 8.75 6.5 6 6",key:"7mghy3"}],["path",{d:"m14 20 1.25-2.5L18 18",key:"1chtki"}],["path",{d:"m14 4 1.25 2.5L18 6",key:"1b4wsy"}],["path",{d:"m17 21-3-6h-4",key:"15hhxa"}],["path",{d:"m17 3-3 6 1.5 3",key:"11697g"}],["path",{d:"M2 12h6.5L10 9",key:"kv9z4n"}],["path",{d:"m20 10-1.5 2 1.5 2",key:"1swlpi"}],["path",{d:"M22 12h-6.5L14 15",key:"1mxi28"}],["path",{d:"m4 10 1.5 2L4 14",key:"k9enpj"}],["path",{d:"m7 21 3-6-1.5-3",key:"j8hb9u"}],["path",{d:"m7 3 3 6h4",key:"1otusx"}]]};et.node;const mn=f(et);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tt={name:"sparkles",size:24,node:[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],aliases:["stars"]};tt.node;const vn=f(tt);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nt={name:"trash",size:24,node:[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],aliases:["trash-2"]};nt.node;const kn=f(nt);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const at={name:"trophy",size:24,node:[["path",{d:"M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2",key:"pwuv1l"}],["path",{d:"M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2",key:"1y54w1"}],["path",{d:"M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3",key:"e30mpu"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z",key:"1mhfuq"}],["path",{d:"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3",key:"i0yafy"}]]};at.node;const Mn=f(at);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rt={name:"undo-2",size:24,node:[["path",{d:"M9 14 4 9l5-5",key:"102s5s"}],["path",{d:"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",key:"f3b9sd"}]]};rt.node;const gn=f(rt);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ot={name:"users",size:24,node:[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]]};ot.node;const _n=f(ot);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const st={name:"volume-2",size:24,node:[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["path",{d:"M16 9a5 5 0 0 1 0 6",key:"1q6k2b"}],["path",{d:"M19.364 18.364a9 9 0 0 0 0-12.728",key:"ijwkga"}]]};st.node;const wn=f(st);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const it={name:"volume-x",size:24,node:[["path",{d:"M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z",key:"1p7khw"}],["path",{d:"m16.5 14.5 5-5",key:"cul3yw"}],["path",{d:"m16.5 9.5 5 5",key:"1akey5"}]]};it.node;const Cn=f(it);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ct={name:"wand-sparkles",size:24,node:[["path",{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",key:"ul74o6"}],["path",{d:"m14 7 3 3",key:"1r5n42"}],["path",{d:"M5 6v4",key:"ilb8ba"}],["path",{d:"M19 14v4",key:"blhpug"}],["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M7 8H3",key:"zfb6yr"}],["path",{d:"M21 16h-4",key:"1cnmox"}],["path",{d:"M11 3H9",key:"1obp7u"}]],aliases:["wand-2"]};ct.node;const bn=f(ct);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ut={name:"x",size:24,node:[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]};ut.node;const En=f(ut);/**
 * @license lucide-react v1.47.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lt={name:"zoom-in",size:24,node:[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]]};lt.node;const xn=f(lt);var de={};(function d(s,_,k,E){var A=!!(s.Worker&&s.Blob&&s.Promise&&s.OffscreenCanvas&&s.OffscreenCanvasRenderingContext2D&&s.HTMLCanvasElement&&s.HTMLCanvasElement.prototype.transferControlToOffscreen&&s.URL&&s.URL.createObjectURL),D=typeof Path2D=="function"&&typeof DOMMatrix=="function",L=(function(){if(!s.OffscreenCanvas)return!1;try{var n=new OffscreenCanvas(1,1),t=n.getContext("2d");t.fillRect(0,0,1,1);var c=n.transferToImageBitmap();t.createPattern(c,"no-repeat")}catch{return!1}return!0})();function z(){}function $(n){var t=_.exports.Promise,c=t!==void 0?t:s.Promise;return typeof c=="function"?new c(n):(n(z,z),null)}var P=(function(n,t){return{transform:function(c){if(n)return c;if(t.has(c))return t.get(c);var h=new OffscreenCanvas(c.width,c.height),e=h.getContext("2d");return e.drawImage(c,0,0),t.set(c,h),h},clear:function(){t.clear()}}})(L,new Map),H=(function(){var n=Math.floor(16.666666666666668),t,c,h={},e=0;return typeof requestAnimationFrame=="function"&&typeof cancelAnimationFrame=="function"?(t=function(a){var o=Math.random();return h[o]=requestAnimationFrame(function r(i){e===i||e+n-1<i?(e=i,delete h[o],a()):h[o]=requestAnimationFrame(r)}),o},c=function(a){h[a]&&cancelAnimationFrame(h[a])}):(t=function(a){return setTimeout(a,n)},c=function(a){return clearTimeout(a)}),{frame:t,cancel:c}})(),q=(function(){var n,t,c={};function h(e){function a(o,r){e.postMessage({options:o||{},callback:r})}e.init=function(r){var i=r.transferControlToOffscreen();e.postMessage({canvas:i},[i])},e.fire=function(r,i,u){if(t)return a(r,null),t;var l=Math.random().toString(36).slice(2);return t=$(function(m){function p(w){w.data.callback===l&&(delete c[l],e.removeEventListener("message",p),t=null,P.clear(),u(),m())}e.addEventListener("message",p),a(r,l),c[l]=p.bind(null,{data:{callback:l}})}),t},e.reset=function(){e.postMessage({reset:!0});for(var r in c)c[r](),delete c[r]}}return function(){if(n)return n;if(!k&&A){var e=["var CONFETTI, SIZE = {}, module = {};","("+d.toString()+")(this, module, true, SIZE);","onmessage = function(msg) {","  if (msg.data.options) {","    CONFETTI(msg.data.options).then(function () {","      if (msg.data.callback) {","        postMessage({ callback: msg.data.callback });","      }","    });","  } else if (msg.data.reset) {","    CONFETTI && CONFETTI.reset();","  } else if (msg.data.resize) {","    SIZE.width = msg.data.resize.width;","    SIZE.height = msg.data.resize.height;","  } else if (msg.data.canvas) {","    SIZE.width = msg.data.canvas.width;","    SIZE.height = msg.data.canvas.height;","    CONFETTI = module.exports.create(msg.data.canvas);","  }","}"].join(`
`);try{n=new Worker(URL.createObjectURL(new Blob([e])))}catch(a){return typeof console<"u"&&typeof console.warn=="function"&&console.warn("🎊 Could not load worker",a),null}h(n)}return n}})(),j={particleCount:50,angle:90,spread:45,startVelocity:45,decay:.9,gravity:1,drift:0,ticks:200,x:.5,y:.5,shapes:["square","circle"],zIndex:100,colors:["#26ccff","#a25afd","#ff5e7e","#88ff5a","#fcff42","#ffa62d","#ff36ff"],disableForReducedMotion:!1,scalar:1};function C(n,t){return t?t(n):n}function T(n){return n!=null}function M(n,t,c){return C(n&&T(n[t])?n[t]:j[t],c)}function O(n){return n<0?0:Math.floor(n)}function x(n,t){return Math.floor(Math.random()*(t-n))+n}function B(n){return parseInt(n,16)}function W(n){return n.map(U)}function U(n){var t=String(n).replace(/[^0-9a-f]/gi,"");return t.length<6&&(t=t[0]+t[0]+t[1]+t[1]+t[2]+t[2]),{r:B(t.substring(0,2)),g:B(t.substring(2,4)),b:B(t.substring(4,6))}}function J(n){var t=M(n,"origin",Object);return t.x=M(t,"x",Number),t.y=M(t,"y",Number),t}function Y(n){n.width=document.documentElement.clientWidth,n.height=document.documentElement.clientHeight}function g(n){var t=n.getBoundingClientRect();n.width=t.width,n.height=t.height}function ne(n){var t=document.createElement("canvas");return t.style.position="fixed",t.style.top="0px",t.style.left="0px",t.style.pointerEvents="none",t.style.zIndex=n,t}function X(n,t,c,h,e,a,o,r,i){n.save(),n.translate(t,c),n.rotate(a),n.scale(h,e),n.arc(0,0,1,o,r,i),n.restore()}function re(n){var t=n.angle*(Math.PI/180),c=n.spread*(Math.PI/180);return{x:n.x,y:n.y,wobble:Math.random()*10,wobbleSpeed:Math.min(.11,Math.random()*.1+.05),velocity:n.startVelocity*.5+Math.random()*n.startVelocity,angle2D:-t+(.5*c-Math.random()*c),tiltAngle:(Math.random()*(.75-.25)+.25)*Math.PI,color:n.color,shape:n.shape,tick:0,totalTicks:n.ticks,decay:n.decay,drift:n.drift,random:Math.random()+2,tiltSin:0,tiltCos:0,wobbleX:0,wobbleY:0,gravity:n.gravity*3,ovalScalar:.6,scalar:n.scalar,flat:n.flat}}function ee(n,t){t.x+=Math.cos(t.angle2D)*t.velocity+t.drift,t.y+=Math.sin(t.angle2D)*t.velocity+t.gravity,t.velocity*=t.decay,t.flat?(t.wobble=0,t.wobbleX=t.x+10*t.scalar,t.wobbleY=t.y+10*t.scalar,t.tiltSin=0,t.tiltCos=0,t.random=1):(t.wobble+=t.wobbleSpeed,t.wobbleX=t.x+10*t.scalar*Math.cos(t.wobble),t.wobbleY=t.y+10*t.scalar*Math.sin(t.wobble),t.tiltAngle+=.1,t.tiltSin=Math.sin(t.tiltAngle),t.tiltCos=Math.cos(t.tiltAngle),t.random=Math.random()+2);var c=t.tick++/t.totalTicks,h=t.x+t.random*t.tiltCos,e=t.y+t.random*t.tiltSin,a=t.wobbleX+t.random*t.tiltCos,o=t.wobbleY+t.random*t.tiltSin;if(n.fillStyle="rgba("+t.color.r+", "+t.color.g+", "+t.color.b+", "+(1-c)+")",n.beginPath(),D&&t.shape.type==="path"&&typeof t.shape.path=="string"&&Array.isArray(t.shape.matrix))n.fill(F(t.shape.path,t.shape.matrix,t.x,t.y,Math.abs(a-h)*.1,Math.abs(o-e)*.1,Math.PI/10*t.wobble));else if(t.shape.type==="bitmap"){var r=Math.PI/10*t.wobble,i=Math.abs(a-h)*.1,u=Math.abs(o-e)*.1,l=t.shape.bitmap.width*t.scalar,m=t.shape.bitmap.height*t.scalar,p=new DOMMatrix([Math.cos(r)*i,Math.sin(r)*i,-Math.sin(r)*u,Math.cos(r)*u,t.x,t.y]);p.multiplySelf(new DOMMatrix(t.shape.matrix));var w=n.createPattern(P.transform(t.shape.bitmap),"no-repeat");w.setTransform(p),n.globalAlpha=1-c,n.fillStyle=w,n.fillRect(t.x-l/2,t.y-m/2,l,m),n.globalAlpha=1}else if(t.shape==="circle")n.ellipse?n.ellipse(t.x,t.y,Math.abs(a-h)*t.ovalScalar,Math.abs(o-e)*t.ovalScalar,Math.PI/10*t.wobble,0,2*Math.PI):X(n,t.x,t.y,Math.abs(a-h)*t.ovalScalar,Math.abs(o-e)*t.ovalScalar,Math.PI/10*t.wobble,0,2*Math.PI);else if(t.shape==="star")for(var v=Math.PI/2*3,b=4*t.scalar,R=8*t.scalar,S=t.x,N=t.y,K=5,I=Math.PI/K;K--;)S=t.x+Math.cos(v)*R,N=t.y+Math.sin(v)*R,n.lineTo(S,N),v+=I,S=t.x+Math.cos(v)*b,N=t.y+Math.sin(v)*b,n.lineTo(S,N),v+=I;else n.moveTo(Math.floor(t.x),Math.floor(t.y)),n.lineTo(Math.floor(t.wobbleX),Math.floor(e)),n.lineTo(Math.floor(a),Math.floor(o)),n.lineTo(Math.floor(h),Math.floor(t.wobbleY));return n.closePath(),n.fill(),t.tick<t.totalTicks}function oe(n,t,c,h,e){var a=t.slice(),o=n.getContext("2d"),r,i,u=$(function(l){function m(){r=i=null,o.clearRect(0,0,h.width,h.height),P.clear(),e(),l()}function p(){k&&!(h.width===E.width&&h.height===E.height)&&(h.width=n.width=E.width,h.height=n.height=E.height),!h.width&&!h.height&&(c(n),h.width=n.width,h.height=n.height),o.clearRect(0,0,h.width,h.height),a=a.filter(function(w){return ee(o,w)}),a.length?r=H.frame(p):m()}r=H.frame(p),i=m});return{addFettis:function(l){return a=a.concat(l),u},canvas:n,promise:u,reset:function(){r&&H.cancel(r),i&&i()}}}function te(n,t){var c=!n,h=!!M(t||{},"resize"),e=!1,a=M(t,"disableForReducedMotion",Boolean),o=A&&!!M(t||{},"useWorker"),r=o?q():null,i=c?Y:g,u=n&&r?!!n.__confetti_initialized:!1,l=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion)").matches,m;function p(v,b,R){for(var S=M(v,"particleCount",O),N=M(v,"angle",Number),K=M(v,"spread",Number),I=M(v,"startVelocity",Number),dt=M(v,"decay",Number),ht=M(v,"gravity",Number),ft=M(v,"drift",Number),he=M(v,"colors",W),yt=M(v,"ticks",Number),fe=M(v,"shapes"),pt=M(v,"scalar"),mt=!!M(v,"flat"),ye=J(v),pe=S,ie=[],vt=n.width*ye.x,kt=n.height*ye.y;pe--;)ie.push(re({x:vt,y:kt,angle:N,spread:K,startVelocity:I,color:he[pe%he.length],shape:fe[x(0,fe.length)],ticks:yt,decay:dt,gravity:ht,drift:ft,scalar:pt,flat:mt}));return m?m.addFettis(ie):(m=oe(n,ie,i,b,R),m.promise)}function w(v){var b=a||M(v,"disableForReducedMotion",Boolean),R=M(v,"zIndex",Number);if(b&&l)return $(function(I){I()});c&&m?n=m.canvas:c&&!n&&(n=ne(R),document.body.appendChild(n)),h&&!u&&i(n);var S={width:n.width,height:n.height};r&&!u&&r.init(n),u=!0,r&&(n.__confetti_initialized=!0);function N(){if(r){var I={getBoundingClientRect:function(){if(!c)return n.getBoundingClientRect()}};i(I),r.postMessage({resize:{width:I.width,height:I.height}});return}S.width=S.height=null}function K(){m=null,h&&(e=!1,s.removeEventListener("resize",N)),c&&n&&(document.body.contains(n)&&document.body.removeChild(n),n=null,u=!1)}return h&&!e&&(e=!0,s.addEventListener("resize",N,!1)),r?r.fire(v,S,K):p(v,S,K)}return w.reset=function(){r&&r.reset(),m&&m.reset()},w}var Z;function ae(){return Z||(Z=te(null,{useWorker:!0,resize:!0})),Z}function F(n,t,c,h,e,a,o){var r=new Path2D(n),i=new Path2D;i.addPath(r,new DOMMatrix(t));var u=new Path2D;return u.addPath(i,new DOMMatrix([Math.cos(o)*e,Math.sin(o)*e,-Math.sin(o)*a,Math.cos(o)*a,c,h])),u}function Q(n){if(!D)throw new Error("path confetti are not supported in this browser");var t,c;typeof n=="string"?t=n:(t=n.path,c=n.matrix);var h=new Path2D(t),e=document.createElement("canvas"),a=e.getContext("2d");if(!c){for(var o=1e3,r=o,i=o,u=0,l=0,m,p,w=0;w<o;w+=2)for(var v=0;v<o;v+=2)a.isPointInPath(h,w,v,"nonzero")&&(r=Math.min(r,w),i=Math.min(i,v),u=Math.max(u,w),l=Math.max(l,v));m=u-r,p=l-i;var b=10,R=Math.min(b/m,b/p);c=[R,0,0,R,-Math.round(m/2+r)*R,-Math.round(p/2+i)*R]}return{type:"path",path:t,matrix:c}}function se(n){var t,c=1,h="#000000",e='"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';typeof n=="string"?t=n:(t=n.text,c="scalar"in n?n.scalar:c,e="fontFamily"in n?n.fontFamily:e,h="color"in n?n.color:h);var a=10*c,o=""+a+"px "+e,r=new OffscreenCanvas(a,a),i=r.getContext("2d");i.font=o;var u=i.measureText(t),l=Math.ceil(u.actualBoundingBoxRight+u.actualBoundingBoxLeft),m=Math.ceil(u.actualBoundingBoxAscent+u.actualBoundingBoxDescent),p=2,w=u.actualBoundingBoxLeft+p,v=u.actualBoundingBoxAscent+p;l+=p+p,m+=p+p,r=new OffscreenCanvas(l,m),i=r.getContext("2d"),i.font=o,i.fillStyle=h,i.fillText(t,w,v);var b=1/c;return{type:"bitmap",bitmap:r.transferToImageBitmap(),matrix:[b,0,0,b,-l*b/2,-m*b/2]}}_.exports=function(){return ae().apply(this,arguments)},_.exports.reset=function(){ae().reset()},_.exports.create=te,_.exports.shapeFromPath=Q,_.exports.shapeFromText=se})((function(){return typeof window<"u"?window:typeof self<"u"?self:this||{}})(),de,!1);const zn=de.exports;de.exports.create;export{$t as A,jt as B,Lt as C,Mn as D,Yt as E,Kt as F,zn as G,un as H,Xt as I,Nt as J,Ht as K,Qt as L,nn as M,Pt as N,Ot as O,rn as P,Wt as Q,Dt as R,fn as S,kn as T,_n as U,Cn as V,bn as W,En as X,ln as Y,xn as Z,cn as a,V as b,wn as c,vn as d,on as e,dn as f,Mt as g,pn as h,It as i,Ft as j,Jt as k,Vt as l,yn as m,Bt as n,en as o,mn as p,Gt as q,_t as r,Ut as s,gn as t,sn as u,qt as v,Zt as w,hn as x,an as y,tn as z};
