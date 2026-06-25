# ProFormN

Schema 驱动的企业级表单组件，基于自研响应式系统实现高性能表单状态管理。

## 架构设计

### 整体架构

```
ProFormN
├── Schema 层（配置定义）
│   └── ProFormSchema - 字段配置描述
│
├── Core 层（核心引擎）
│   ├── FormStore      - 表单状态管理中心（基于 Proxy 响应式）
│   ├── FieldNode      - 字段运行时实例（响应的值/状态/行为）
│   └── ValidationEngine - 验证引擎（规则校验 + 自定义校验）
│
├── Context 层（数据传递）
│   ├── RootContext     - 全局状态（表单状态、实例、布局）
│   ├── LayoutContext   - 布局配置（列数、间距、折叠状态）
│   ├── SchemaContext   - 字段配置上下文
│   ├── FieldContext    - 单个字段运行时上下文
│   ├── FormConfigContext - 表单配置（Schema 处理选项）
│   └── ExtensionContext - 扩展上下文（组件注册表）
│
├── Hooks 层（逻辑复用）
│   ├── useProForm      - 核心 Hook（表单实例创建与管理）
│   ├── useArcoForm     - Arco Form 兼容适配层
│   ├── useFieldNavigation - 键盘导航（Tab/上下键切换字段）
│   ├── useVirtualScroll   - 虚拟滚动（大数据量表单优化）
│   └── useLazyField       - 懒加载（优先级加载 + 分组加载）
│
├── Registry 层（扩展注册）
│   ├── componentRegistry  - 组件注册表（自定义组件注册）
│   ├── readonlyRegistry   - 只读渲染器注册表
│   └── instanceRegistry   - 实例注册表（全局管理）
│
└── Component 层（渲染组件）
    ├── ProForm            - 主组件（组装所有子模块）
    ├── FormField          - 字段渲染器（根据 Schema 渲染字段）
    ├── ProFormProvider    - 上下文提供者
    ├── FormPerformanceMonitor - 性能监控面板
    ├── ProFormList        - 动态表单列表
    ├── ProFormSteps       - 分步表单
    └── QuickComponents    - 快捷组件
```

### 数据流

```
用户交互 → FieldNode.setValue()
    ↓
FormStore 响应式更新
    ↓
├── 触发字段联动（Reactions）
├── 触发字段行为计算（Behavior → visible/disabled/readonly）
├── 触发生命周期回调（onValueChange/onStatusChange）
├── 触发 onValuesChange 回调
└── 触发 UI 重新渲染
```

### 响应式系统

自研的轻量级响应式系统（`utils/reactive.ts`），不依赖外部库：

- **`reactive()`**：基于 Proxy 创建响应式对象
- **`ref()`**：创建响应式引用
- **`computed()`**：创建计算属性，自动追踪依赖
- **`watch()`**：监听响应式值变化
- **`effect()`**：创建副作用函数
- **`batchUpdate()`**：批量更新，合并多次变更

## API 文档

### ProFormSchema（字段配置）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | `string \| string[]` | - | 字段名称（必填），支持嵌套路径如 `['user', 'name']` |
| label | `string` | - | 字段标签 |
| component | `string` | - | 组件类型，如 `'Input'`、`'Select'`、`'DatePicker'` |
| componentProps | `Record<string, any>` | - | 组件属性，透传给渲染组件 |
| required | `boolean` | `false` | 是否必填 |
| requiredMessage | `string` | - | 必填项错误提示 |
| rules | `ValidationRule[]` | - | 验证规则数组 |
| validate | `(value, values) => string \| undefined \| Promise` | - | 自定义验证函数 |
| initialValue | `unknown` | - | 初始值 |
| col | `number` | - | 在 Grid 布局中占用的列数 |
| labelCol / wrapperCol | `ColProps` | - | 标签/内容列配置 |
| tooltip | `string` | - | 标签提示信息 |
| extra | `ReactNode` | - | 表单项额外提示 |
| placeholder | `string` | - | 占位符文本 |
| options | `Array<{ label, value }>` | - | 选项数据（适用于 Select/Radio/Checkbox） |
| format | `string` | - | 日期/时间格式化字符串 |
| prefix / suffix | `string` | - | 前缀/后缀文本 |
| transform | `{ input?, output? }` | - | 值转换函数（input: 显示前转换, output: 保存前转换） |
| dependencies | `string[]` | - | 依赖的字段名列表 |
| behavior | `FieldBehavior` | - | 字段行为配置（可见性/禁用/只读/预览） |
| reactions | `FieldReaction[]` | - | 字段联动规则 |
| lifecycle | `FieldLifecycle` | - | 字段生命周期回调 |
| readonlyMode | `string` | - | 只读/预览渲染模式 |
| readonlyConfig | `ReadonlyRenderConfig` | - | 只读/预览渲染配置 |
| readonlyComponent | `string` | - | 只读/预览时使用的渲染器名称 |
| children | `ProFormSchema[]` | - | 子字段配置 |
| onFieldChange | `(value, allValues) => void` | - | 字段值变化回调 |

### FieldBehavior（字段行为）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | `boolean \| ((values) => boolean)` | `true` | 是否可见（隐藏时从 DOM 移除） |
| display | `boolean \| ((values) => boolean)` | `true` | 是否显示（隐藏时保留占位但不可见） |
| disabled | `boolean \| ((values) => boolean)` | `false` | 是否禁用 |
| readonly | `boolean \| ((values) => boolean)` | `false` | 是否只读 |
| preview | `boolean \| ((values) => boolean)` | `false` | 是否预览模式 |
| required | `boolean \| ((values) => boolean)` | - | 是否必填（动态计算） |

### FieldReaction（字段联动）

```typescript
interface FieldReaction {
  dependencies: string[];  // 依赖的字段名列表
  run: (field: FieldNodeAPI, form: FormStoreAPI) => void;  // 联动逻辑
}
```

### FieldLifecycle（字段生命周期）

| 回调 | 触发时机 |
|------|----------|
| `onInit` | 字段初始化时 |
| `onMount / onUnmount` | 字段挂载/卸载时 |
| `onValueChange` | 字段值变化时 |
| `onStatusChange` | 字段状态变化时 |
| `onFocus / onBlur` | 字段获得/失去焦点时 |
| `onBeforeValidate / onAfterValidate` | 验证前/后 |
| `onReset` | 字段重置时 |
| `onDestroy` | 字段销毁时 |

### ProFormProps（组件属性）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| schemas | `ProFormSchema[]` | `[]` | 表单字段配置数组 |
| layout | `'horizontal' \| 'vertical' \| 'inline' \| 'compact'` | `'vertical'` | 表单布局模式 |
| columns | `number` | `1` | Grid 列数 |
| gutter | `number` | `16` | 列间距 |
| disabled | `boolean` | `false` | 是否禁用所有字段 |
| readonly | `boolean` | `false` | 是否只读所有字段 |
| draft | `boolean` | - | 草稿模式 |
| preview | `boolean` | - | 预览模式 |
| initialValues | `Partial<TValues>` | - | 表单初始值 |
| onFinish | `(values) => void \| Promise` | - | 提交成功回调 |
| onFinishFailed | `(errorInfo) => void` | - | 提交失败回调 |
| onValuesChange | `(changed, all) => void` | - | 字段值变化回调 |
| showButton | `boolean` | `true` | 是否显示按钮组 |
| submitText | `string` | `'确认'` | 提交按钮文本 |
| resetText | `string` | `'取消'` | 重置按钮文本 |
| buttonPosition | `'left' \| 'center' \| 'right'` | `'right'` | 按钮组位置 |
| collapsible | `boolean` | `false` | 是否启用展开/收起 |
| collapsedRows | `number` | `1` | 折叠时展示的行数 |
| buttonList | `ButtonConfig[]` | - | 自定义按钮列表 |
| performance | `ProFormPerformanceConfig` | - | 性能优化配置 |
| keyboardNavigation | `KeyboardNavigationConfig` | - | 键盘导航配置 |
| cardContainer | `boolean` | - | 是否使用 Card 包裹 |

### ProFormInstance（表单实例方法）

| 方法 | 说明 |
|------|------|
| `getFieldsValue()` | 获取所有字段值 |
| `setFieldsValue(values)` | 设置字段值 |
| `getFieldValue(name)` | 获取单个字段值 |
| `setFieldValue(name, value)` | 设置单个字段值 |
| `resetFields()` | 重置所有字段 |
| `validate()` | 验证所有字段 |
| `validateField(name)` | 验证单个字段 |
| `getFieldStatus(name)` | 获取字段状态 |
| `setFieldStatus(name, status)` | 设置字段状态 |
| `getFormStore()` | 获取 FormStore 实例 |
| `setDraft(draft)` | 设置草稿模式 |
| `setPreview(preview)` | 设置预览模式 |
| `submit()` | 手动提交表单 |

## 核心设计

### FormStore（表单状态管理）

基于 Proxy 响应式系统的表单状态管理中心：

- 管理所有字段值（`values`）、字段实例（`fields`）、错误信息（`errors`）
- 字段注册/注销时自动建立响应式依赖
- 字段值变化时自动触发联动规则和生命周期
- 支持批量更新（`batchUpdate`），合并多次变更减少渲染

### FieldNode（字段运行时实例）

每个字段对应一个 FieldNode 实例，管理字段的完整运行时状态：

- 使用 `ref` 包装字段值和错误，实现细粒度响应式
- 使用 `computed` 计算字段行为（visible/disabled/readonly 等），自动追踪依赖
- 使用 `watch` 监听行为变化，自动更新字段状态
- 支持输入/输出转换（`transform`）

### ValidationEngine（验证引擎）

集中管理表单验证逻辑：

- 支持 `required` 检查
- 支持 `rules` 规则数组（min/max/minLength/maxLength/pattern/validator）
- 支持自定义 `validate` 函数
- 验证时自动跳过不可见/禁用字段
- 支持异步验证

### 性能优化

三重优化策略，通过 `performance` 配置启用：

| 策略 | 配置 | 适用场景 |
|------|------|----------|
| 虚拟滚动 | `virtualScroll` | 字段数 > 20 时，只渲染可视区域内的字段 |
| 懒加载 | `lazyLoad` | 字段数 > 10 时，分批/按优先级渲染字段 |
| 批量更新 | `batchUpdate` | 合并多次状态变更，减少渲染次数 |

## 原理深入

### 自研响应式系统：从零理解依赖收集与触发更新

这是整个 ProFormN 最核心的底层设施，也是面试中最容易被问到的亮点。我们用 **约 200 行代码**实现了一套类 Vue 3 的 `reactive/ref/computed/watch/effect/batchUpdate` API，不依赖任何外部库。

#### 1. 整体架构：Dep + WeakMap + Proxy

```
┌─────────────────────────────────────────────────────────┐
│                    reactive(obj)                         │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Proxy   │───→│  targetMap   │───→│     Dep      │  │
│  │  get/set │    │ WeakMap<     │    │ subscribers  │  │
│  │ 拦截器   │    │  obj → Map<  │    │  Set<effect> │  │
│  └──────────┘    │  key → Dep>  │    └──────────────┘  │
│       │          └──────────────┘           │          │
│       │                              ┌──────┴──────┐   │
│  get 时：dep.depend()               │  depend()   │   │
│       │  将 activeEffect 加入       │  notify()   │   │
│       │  Dep 的 subscribers          │  remove()   │   │
│       │                              └─────────────┘   │
│  set 时：dep.notify()                                   │
│       遍历 subscribers 执行所有 effect                   │
└─────────────────────────────────────────────────────────┘
```

**三个核心数据结构：**

| 结构 | 作用 | 类比 |
|------|------|------|
| `Dep` | 每个响应式属性对应一个 Dep，内部维护一个 `Set<effect>`，负责"谁依赖了我" | 发布者 |
| `targetMap`（WeakMap） | `obj → Map<key → Dep>`，存储"哪个对象的哪个属性"对应哪个 Dep | 全局索引 |
| `activeEffect` | 全局变量，指向当前正在执行的 effect 函数，用于依赖收集 | 当前上下文 |

#### 2. 依赖收集（Track）：get 拦截器中的"自动记账"

```typescript
// 源码核心逻辑（简化）
const targetMap = new WeakMap<object, Map<string, Dep>>();

function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      const dep = getDep(target, key);  // ① 找到/创建这个属性的 Dep
      dep.depend();                      // ② 把当前正在执行的 effect 注册进去
      return Reflect.get(target, key);   // ③ 返回原始值
    }
  });
}

class Dep {
  subscribers = new Set();
  depend() {
    if (activeEffect) {                  // 只有 effect 执行期间才收集
      this.subscribers.add(activeEffect);
    }
  }
}
```

**关键点：** `activeEffect` 是一个全局变量，当 `effect(fn)` 执行时，会先把 `activeEffect` 设为当前函数，然后执行 `fn()`。`fn()` 内部如果访问了响应式对象的属性，就会触发 `get` 拦截器，自动把当前 effect 注册到 Dep 中。这就实现了**自动依赖收集**——你不需要手动声明依赖关系。

#### 3. 触发更新（Trigger）：set 拦截器中的"通知所有人"

```typescript
new Proxy(obj, {
  set(target, key, value) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, value);
    if (oldValue !== value) {            // ① 值真的变了才通知
      const dep = getDep(target, key);
      dep.notify();                       // ② 遍历所有订阅者执行
    }
    return result;
  }
});

class Dep {
  notify() {
    if (isBatching) {
      batchQueue.add(effect);             // 批量模式下先收集
    } else {
      this.subscribers.forEach(fn => fn()); // 正常模式直接执行
    }
  }
}
```

#### 4. effect：响应式的"发动机"

```typescript
function effect(fn) {
  const effectFn = () => {
    activeEffect = effectFn;    // ① 设置当前 effect
    effectStack.push(effectFn); // ② 入栈（处理嵌套 effect）
    fn();                       // ③ 执行 fn → 触发 get → 依赖收集
    effectStack.pop();          // ④ 出栈
    activeEffect = effectStack[effectStack.length - 1] || null; // ⑤ 恢复外层 effect
  };
  effectFn();                   // 首次立即执行
  return () => { /* 清理函数 */ };
}
```

**嵌套 effect 的处理：** `effectStack` 用于处理嵌套场景（比如 computed 内部又用了 effect），确保每次 fn 执行完毕后，`activeEffect` 能正确恢复到外层的 effect。

#### 5. computed：惰性计算 + 缓存

```typescript
function computed(getter) {
  let dirty = true;             // 脏标记：是否需要重新计算
  let cachedValue;

  const effectFn = effect(() => {
    cachedValue = getter();     // 执行 getter → 自动追踪依赖
    dirty = false;              // 计算完成，标记为干净
  }, { immediate: false });     // 不立即执行！

  return {
    get value() {
      if (dirty) effectFn();    // 脏了才重新计算（惰性求值）
      return cachedValue;       // 返回缓存值
    }
  };
}
```

**关键设计：** `computed` 不会立即执行 getter，而是等第一次访问 `.value` 时才执行。之后如果依赖没变，直接返回缓存值。只有当依赖的值发生变化时，`dirty` 被重新标记为 `true`，下次访问 `.value` 时才重新计算。

#### 6. batchUpdate：批量更新，合并渲染

```typescript
function batchUpdate(fn) {
  isBatching = true;            // ① 开启批量模式
  fn();                         // ② 执行所有变更
  isBatching = false;           // ③ 关闭批量模式
  batchQueue.forEach(fn => fn()); // ④ 统一执行所有攒下的 effect
  batchQueue.clear();
}
```

**为什么需要 batchUpdate？** 如果不批量处理，每次 `setValue` 都会触发一次 React 重新渲染。通过 `batchUpdate`，我们把多次变更"攒"起来，最后一次性通知所有订阅者，减少渲染次数。

#### 7. 完整链路：用户输入一个字符，发生了什么？

```
用户输入 "a"
    ↓
FormField onChange → field.setValue("a")
    ↓
    ├── _value.value = "a"           （ref 的 set → reactive 的 set → Dep.notify()）
    ├── store.setValue(name, "a")    （FormStore 同步更新）
    │     └── batchUpdate 内：
    │           ├── state.values[name] = "a"    （触发 reactive set → Dep.notify()）
    │           └── state.touched[name] = true  （触发 reactive set → Dep.notify()）
    │
    ├── 当前字段的 watch 回调触发
    │     └── runReactions() → 遍历所有注册的联动规则
    │           └── 如果联动规则依赖了这个字段 → reaction.run(field, store)
    │                 └── field.setValue(...) / field.setStatus(...) 等
    │
    ├── 依赖字段的 watch 回调触发
    │     └── field.updateComputedBehavior(values)
    │           └── computedBehavior 重新计算
    │                 └── visible/disabled/readonly 等重新求值
    │                       └── updateStatusFromBehavior()
    │                             └── setStatus() → 通知 React 重新渲染
    │
    └── onValuesChange 回调触发
          └── 用户自定义的 onValuesChange 被调用
```

### FormStore 与 FieldNode 的协作关系

```
FormStore（全局状态中心）
    │
    ├── state.values     ←── reactive() 响应式
    ├── state.fields     ←── reactive() 响应式
    ├── state.errors     ←── reactive() 响应式
    ├── state.reactions  ←── 存储每个字段的联动规则
    │
    └── registerField(field)
          │
          ├── 将 field 存入 state.fields[name]
          ├── 初始化值（如果 schema.initialValue 存在）
          ├── setupFieldValueWatch(field, name)  ← 建立响应式监听
          │     ├── watch current field value → runReactions()
          │     └── watch dependencies → updateComputedBehavior()
          └── 触发 field.schema.lifecycle.onInit

FieldNode（字段运行时实例）
    │
    ├── _value    ← ref() 响应式    → 字段值
    ├── _error    ← ref() 响应式    → 错误信息
    ├── _status   ← ref() 响应式    → 当前状态
    │
    └── _computedBehavior ← computed()  ← 自动追踪 store.values
          ├── visible:  (values) => boolean
          ├── disabled: (values) => boolean
          ├── readonly: (values) => boolean
          └── required: (values) => boolean
```

### 为什么自研而不是用 zustand/mobx？

| 对比维度 | 自研响应式 | zustand | mobx |
|----------|-----------|---------|------|
| 包体积 | ~200 行代码，0 依赖 | ~2KB gzip | ~16KB gzip |
| 学习成本 | 类 Vue 3 API，团队熟悉 | 独立 API | 装饰器 + 类 |
| 字段级细粒度更新 | ✅ 原生支持（ref） | ❌ 需手动 selector | ✅ 但概念重 |
| 与 Arco Form 集成 | ✅ 完全可控 | ⚠️ 需要适配层 | ⚠️ 需要适配层 |
| Tree Shaking | ✅ 按需引用 | ✅ | ⚠️ 部分 |

核心原因：ProFormN 需要**字段级别的细粒度响应式**——字段 A 的值变化，只触发依赖 A 的字段 B 重新渲染，而不是整个表单重新渲染。zustand 的 selector 模式也能做到，但需要手动编写选择器；而我们通过 `computed` 自动追踪依赖，开发者只需声明 `behavior.visible: (values) => values.type === 'person'`，框架自动知道"这个字段依赖 `type` 字段"。

## 使用示例

### 基础表单

```tsx
import { ProForm } from '@/pro-components/ProFormN';

<ProForm
  schemas={[
    { name: 'username', label: '用户名', component: 'Input', required: true },
    { name: 'email', label: '邮箱', component: 'Input', rules: [{ pattern: /^\S+@\S+$/, message: '邮箱格式不正确' }] },
    { name: 'gender', label: '性别', component: 'Radio.Group', options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ]},
    { name: 'birthday', label: '生日', component: 'DatePicker' },
  ]}
  onFinish={async (values) => {
    await saveUser(values);
    Message.success('保存成功');
  }}
/>
```

### 字段联动

```tsx
<ProForm
  schemas={[
    { name: 'type', label: '类型', component: 'Select', options: [
      { label: '个人', value: 'person' },
      { label: '企业', value: 'company' },
    ]},
    { name: 'companyName', label: '企业名称', component: 'Input',
      behavior: {
        visible: (values) => values.type === 'company',
        required: (values) => values.type === 'company',
      },
      dependencies: ['type'],
    },
    { name: 'idCard', label: '身份证号', component: 'Input',
      behavior: {
        visible: (values) => values.type === 'person',
      },
      dependencies: ['type'],
    },
  ]}
/>
```

### 使用 Hook 模式

```tsx
import { useProForm, ProFormContext } from '@/pro-components/ProFormN';

const MyForm = () => {
  const { formInstance, formStore, fieldNavigation, Provider } = useProForm({
    schemas: [
      { name: 'username', label: '用户名', component: 'Input', required: true },
      { name: 'email', label: '邮箱', component: 'Input', required: true },
    ],
    onFinish: async (values) => {
      console.log(values);
    },
  });

  return (
    <Provider>
      <ProFormContext.Provider value={{ formStore, formInstance, arcoForm: null }}>
        {/* 自定义表单布局 */}
        <div>
          <FormField schema={schemas[0]} formStore={formStore} />
          <FormField schema={schemas[1]} formStore={formStore} />
        </div>
      </ProFormContext.Provider>
    </Provider>
  );
};
```

### 草稿/预览模式

```tsx
const [draft, setDraft] = useState(false);
const [preview, setPreview] = useState(false);

<ProForm
  draft={draft}
  preview={preview}
  schemas={[...]}
  onDraftChange={setDraft}
  onPreviewChange={setPreview}
/>
```

### 自定义组件注册

```tsx
import { componentRegistry } from '@/pro-components/ProFormN/registry';

componentRegistry.register('RichText', MyRichTextEditor);
componentRegistry.register('MapPicker', MyMapPicker);

// 然后在 Schema 中使用
{ name: 'content', label: '内容', component: 'RichText' }
{ name: 'location', label: '位置', component: 'MapPicker' }
```