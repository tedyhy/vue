declare type VNodeChildren = Array<?VNode | string | VNodeChildren> | string

declare type VNodeComponentOptions = {
  Ctor: Class<Component>;
  propsData: ?Object;
  listeners: ?Object;
  children: ?Array<VNode>;
  tag?: string;
}

declare type MountedComponentVNode = {
  componentOptions: VNodeComponentOptions;
  componentInstance: Component;
  parent: VNode;
  data: VNodeData;
}

// interface for vnodes in update modules
// 声明 VNodeWithData 类型，即：VNode 包含 data
declare type VNodeWithData = {
  tag: string;
  data: VNodeData;
  children: ?Array<VNode>;
  text: void;
  elm: any;
  ns: string | void;
  context: Component;
  key: string | number | void;
  parent?: VNodeWithData;
  componentInstance?: Component;
  isRootInsert: boolean;
}

// 声明接口 VNodeData，即：VNode.data 类型
declare interface VNodeData {
  key?: string | number;
  slot?: string;
  ref?: string;
  pre?: boolean;
  tag?: string;
  staticClass?: string;
  class?: any;
  staticStyle?: { [key: string]: any };
  style?: Array<Object> | Object;
  props?: { [key: string]: any };
  attrs?: { [key: string]: string };
  domProps?: { [key: string]: any };
  hook?: { [key: string]: Function };
  on?: ?{ [key: string]: Function | Array<Function> };
  nativeOn?: { [key: string]: Function | Array<Function> };
  transition?: Object;
  show?: boolean; // marker for v-show
  inlineTemplate?: {
    render: Function;
    staticRenderFns: Array<Function>;
  };
  directives?: Array<VNodeDirective>; // 当前 vnode 上的指令集
  keepAlive?: boolean;
  scopedSlots?: { [key: string]: Function };
  model?: {
    value: any;
    callback: Function;
  };
}

// 声明 VNodeDirective 类型，规范指令节点
declare type VNodeDirective = {
  name: string;
  rawName: string;
  value?: any;
  oldValue?: any;
  arg?: string;
  modifiers?: ASTModifiers; // 对指令的修饰符，如：<form v-on:submit.prevent="onSubmit"></form>
  def?: Object; // 当前指令的钩子
}
