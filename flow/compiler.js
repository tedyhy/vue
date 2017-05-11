declare type CompilerOptions = {
  warn?: Function; // allow customizing warning in different environments; e.g. node
  expectHTML?: boolean; // only false for non-web builds
  modules?: Array<ModuleOptions>; // platform specific modules; e.g. style; class
  staticKeys?: string; // a list of AST properties to be considered static; for optimization
  directives?: { [key: string]: Function }; // platform specific directives
  isUnaryTag?: (tag: string) => ?boolean; // check if a tag is unary for the platform
  canBeLeftOpenTag?: (tag: string) => ?boolean; // check if a tag can be left opened
  isReservedTag?: (tag: string) => ?boolean; // check if a tag is a native for the platform
  mustUseProp?: (tag: string, type: ?string, name: string) => boolean; // check if an attribute should be bound as a property
  isPreTag?: (attr: string) => ?boolean; // check if a tag needs to preserve whitespace
  getTagNamespace?: (tag: string) => ?string; // check the namespace for a tag
  transforms?: Array<Function>; // a list of transforms on parsed AST before codegen
  preserveWhitespace?: boolean;
  isFromDOM?: boolean;
  shouldDecodeTags?: boolean;
  shouldDecodeNewlines?: boolean;

  // runtime user-configurable
  delimiters?: [string, string]; // template delimiters
}

declare type CompiledResult = {
  ast: ?ASTElement;
  render: string;
  staticRenderFns: Array<string>;
  errors?: Array<string>;
  tips?: Array<string>;
}

declare type CompiledFunctionResult = {
  render: Function;
  staticRenderFns: Array<Function>;
}

// 声明 ModuleOptions 类型
declare type ModuleOptions = {
  preTransformNode: (el: ASTElement) => void;
  transformNode: (el: ASTElement) => void; // transform an element's AST node
  postTransformNode: (el: ASTElement) => void;
  genData: (el: ASTElement) => string; // generate extra data string for an element
  transformCode?: (el: ASTElement, code: string) => string; // further transform generated code for an element
  staticKeys?: Array<string>; // AST properties to be considered static
}

// 声明 ASTModifiers 类型，规范指令修饰符
declare type ASTModifiers = { [key: string]: boolean }
declare type ASTIfConditions = Array<{ exp: ?string; block: ASTElement }>

declare type ASTElementHandler = {
  value: string;
  modifiers: ?ASTModifiers;
}

declare type ASTElementHandlers = {
  [key: string]: ASTElementHandler | Array<ASTElementHandler>;
}

declare type ASTDirective = {
  name: string;
  rawName: string;
  value: string;
  arg: ?string;
  modifiers: ?ASTModifiers;
}

declare type ASTNode = ASTElement | ASTText | ASTExpression

declare type ASTElement = {
  type: 1;
  tag: string;
  attrsList: Array<{ name: string; value: string }>;
  attrsMap: { [key: string]: string | null };
  parent: ASTElement | void;
  children: Array<ASTNode>;

  static?: boolean;
  staticRoot?: boolean;
  staticInFor?: boolean;
  staticProcessed?: boolean;
  hasBindings?: boolean;

  text?: string;
  attrs?: Array<{ name: string; value: string }>;
  props?: Array<{ name: string; value: string }>;
  plain?: boolean;
  pre?: true;
  ns?: string;

  component?: string;
  inlineTemplate?: true;
  transitionMode?: string | null;
  slotName?: ?string;
  slotTarget?: ?string;
  slotScope?: ?string;
  scopedSlots?: { [name: string]: ASTElement };

  ref?: string;
  refInFor?: boolean;

  if?: string;
  ifProcessed?: boolean;
  elseif?: string;
  else?: true;
  ifConditions?: ASTIfConditions;

  for?: string;
  forProcessed?: boolean;
  key?: string;
  alias?: string;
  iterator1?: string;
  iterator2?: string;

  staticClass?: string;
  classBinding?: string;
  staticStyle?: string;
  styleBinding?: string;
  events?: ASTElementHandlers;
  nativeEvents?: ASTElementHandlers;

  transition?: string | true;
  transitionOnAppear?: boolean;

  model?: {
    value: string;
    callback: string;
    expression: string;
  };

  directives?: Array<ASTDirective>;

  forbidden?: true;
  once?: true;
  onceProcessed?: boolean;
  wrapData?: (code: string) => string;

  // weex specific
  appendAsTree?: boolean;
}

declare type ASTExpression = {
  type: 2;
  expression: string;
  text: string;
  static?: boolean;
}

declare type ASTText = {
  type: 3;
  text: string;
  static?: boolean;
}

// SFC-parser related declarations
// SFC-parser 相关声明

// an object format describing a single-file component.
// 声明 SFCDescriptor 类型，用于描述 single-file component（单个文件组件）的对象格式
declare type SFCDescriptor = {
  template: ?SFCBlock;
  script: ?SFCBlock;
  styles: Array<SFCBlock>;
  customBlocks: Array<SFCCustomBlock>;
}

// 声明 SFCCustomBlock 类型（自定义元素块）
declare type SFCCustomBlock = {
  type: string;
  content: string;
  start?: number;
  end?: number;
  src?: string;
  attrs: {[attribute:string]: string}; // 如：[{name: 'lang', value: ''}, ...]，规定 key 类型为 string
}

// 声明 SFCBlock 类型（元素块）
declare type SFCBlock = {
  type: string;
  content: string;
  start?: number;
  end?: number;
  lang?: string;
  src?: string;
  scoped?: boolean;
  module?: string | boolean;
}
