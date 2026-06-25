import React, {
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react';
import { Form } from '@arco-design/web-react';
import type { ProFormSchema, FieldStatus, FieldNodeAPI } from './types';
import {
  getComponent,
  parseQuickComponent,
  getReadonlyRenderer,
  getRendererByMode,
} from './registry';
import {
  useRootContext,
  useLayoutContext,
  SchemaContextProvider,
  FieldContextProvider,
  LayoutContextProvider,
} from './context';
import { createFieldNode } from './core/FieldNode';
import type { FormStore } from './core/FormStore';
import type { ArcoFormInstance } from './hooks/useArcoForm';

const { Item } = Form;

/**
 * 组件引用类型
 */
type ComponentRef = React.RefObject<HTMLElement> | null;

/**
 * FormField 组件属性
 */
interface FormFieldProps {
  schema: ProFormSchema;
  formStore: FormStore;
  arcoForm: ArcoFormInstance;
  setComponentRef?: (name: string, ref: ComponentRef) => void;
  onFieldChange?: (value: unknown, allValues: Record<string, unknown>) => void;
}

/**
 * 内部 FormField 组件属性
 */
interface FormFieldInnerProps {
  fieldNode: FieldNodeAPI;
  arcoForm: ArcoFormInstance;
  setComponentRef?: (name: string, ref: ComponentRef) => void;
  onFieldChange?: (value: unknown, allValues: Record<string, unknown>) => void;
}

/**
 * 内部 FormField 组件
 */
const FormFieldInner: React.FC<FormFieldInnerProps> = ({
  fieldNode,
  arcoForm,
  setComponentRef,
  onFieldChange,
}) => {
  const rootContext = useRootContext();
  const layoutContext = useLayoutContext();
  const [value, setValueState] = useState<unknown>(fieldNode.value);
  const [status, setStatusState] = useState<FieldStatus>(fieldNode.status);
  const [error, setErrorState] = useState<string | undefined>(fieldNode.error);
  const [focused, setFocused] = useState<boolean>(fieldNode.focused || false);

  const componentRef = useRef<ComponentRef>(null);

  const handleFocus = useCallback(() => {
    fieldNode.setFocus();
    setFocused(true);
  }, [fieldNode]);

  const handleBlur = useCallback(() => {
    fieldNode.removeFocus();
    setFocused(false);
  }, [fieldNode]);

  // 检查是否是 RangePicker 数组字段名
  const rangePickerNames = (fieldNode.schema as any)._rangePickerNames as
    | [string, string]
    | undefined;
  const isRangePickerArray = !!rangePickerNames;

  // 获取用于 DOM 和 Arco Form 的字段名（数组类型使用第一个字段名）
  const fieldName = Array.isArray(fieldNode.name)
    ? fieldNode.name[0]
    : fieldNode.name;

  // 获取组件值（处理 RangePicker 数组字段名的情况）
  const getComponentValue = useCallback(() => {
    if (isRangePickerArray) {
      const [startName, endName] = rangePickerNames;
      const startValue = rootContext.formInstance.getFieldValue(startName);
      const endValue = rootContext.formInstance.getFieldValue(endName);
      if (startValue || endValue) {
        return [startValue, endValue];
      }
      return undefined;
    }
    return value;
  }, [isRangePickerArray, rangePickerNames, value, rootContext.formInstance]);

  // 订阅字段变化
  useEffect(() => {
    // 先同步一次当前值
    setValueState(fieldNode.value);
    setStatusState(fieldNode.status);

    const unsubscribeValue = fieldNode.subscribeToValueChange(newValue => {
      setValueState(newValue);
      // 同步到 Arco Form
      arcoForm.setFieldValue(fieldName, newValue);
    });

    const unsubscribeStatus = fieldNode.subscribeToStatusChange(newStatus => {
      setStatusState(newStatus);
    });

    return () => {
      unsubscribeValue();
      unsubscribeStatus();
    };
  }, [fieldNode, arcoForm, fieldName]);

  // 设置组件引用
  useEffect(() => {
    if (setComponentRef && componentRef.current) {
      setComponentRef(fieldName, componentRef.current);
    }
  }, [fieldName, setComponentRef]);

  // 处理值变化
  const handleChange = useCallback(
    (newValue: unknown, ...rest: unknown[]) => {
      // 调用原始 onChange
      const { onChange: originalOnChange } =
        fieldNode.schema.componentProps || {};
      if (typeof originalOnChange === 'function') {
        originalOnChange(newValue, ...rest);
      }

      // 处理 RangePicker 数组字段名的情况
      if (isRangePickerArray && Array.isArray(newValue)) {
        const [startName, endName] = rangePickerNames;
        const [startValue, endValue] = newValue;

        // 设置开始字段值
        fieldNode.setValue(startValue);
        arcoForm.setFieldValue(startName, startValue);

        // 设置结束字段值
        arcoForm.setFieldValue(endName, endValue);

        // 触发字段变化回调
        onFieldChange?.(newValue, rootContext.formInstance.getFieldsValue());

        // 触发表单值变化
        rootContext.onValuesChange?.(
          { [startName]: startValue, [endName]: endValue },
          rootContext.formInstance.getFieldsValue(),
        );
      } else {
        // 设置字段值
        fieldNode.setValue(newValue);

        // 同步到 Arco Form
        arcoForm.setFieldValue(fieldName, newValue);

        // 触发字段变化回调
        onFieldChange?.(newValue, rootContext.formInstance.getFieldsValue());

        // 触发表单值变化
        rootContext.onValuesChange?.(
          { [fieldName]: newValue },
          rootContext.formInstance.getFieldsValue(),
        );
      }
    },
    [
      fieldNode,
      arcoForm,
      rootContext,
      onFieldChange,
      isRangePickerArray,
      rangePickerNames,
      fieldName,
    ],
  );

  // 构建 FieldContext
  const fieldContextValue = useMemo(
    () => ({
      name: fieldName,
      label: fieldNode.schema.label,
      value,
      values: rootContext.formInstance.getFieldsValue(),
      status,
      focused,
      computedBehavior: fieldNode.computedBehavior,
      formState: rootContext.formState,
      error,
      setValue: (v: unknown) => {
        fieldNode.setValue(v);
        arcoForm.setFieldValue(fieldName, v);
      },
      getFieldValue: (name: string) => arcoForm.getFieldValue(name),
      getFieldsValue: () => arcoForm.getFieldsValue(),
      validate: async () => {
        const err = await fieldNode.validate();
        setErrorState(err);
        arcoForm.setFieldError(fieldName, err);
      },
      setError: (err?: string) => {
        fieldNode.setError(err);
        setErrorState(err);
        arcoForm.setFieldError(fieldName, err);
      },
      clearError: () => {
        fieldNode.setError(undefined);
        setErrorState(undefined);
        arcoForm.setFieldError(fieldName, undefined);
      },
      fieldNode,
    }),
    [
      fieldNode,
      value,
      status,
      focused,
      error,
      rootContext,
      arcoForm,
      fieldName,
    ],
  );

  // 如果隐藏，不渲染
  if (status === 'hidden') {
    return null;
  }

  const parsedQuickComponent = parseQuickComponent(
    fieldNode.schema.component || 'Input',
  );

  // 获取显示值，用 useMemo 避免重新计算
  const displayValue = useMemo(() => {
    if (isRangePickerArray) {
      const [startName, endName] = rangePickerNames;
      const startValue = rootContext.formInstance.getFieldValue(startName);
      const endValue = rootContext.formInstance.getFieldValue(endName);
      if (startValue || endValue) {
        return [startValue, endValue];
      }
      return undefined;
    }
    return rootContext.formInstance.getFieldValue(fieldName);
  }, [
    isRangePickerArray,
    rangePickerNames,
    fieldName,
    rootContext.formInstance,
  ]);

  /**
   * 渲染只读/预览内容
   */
  const renderReadonlyContent = useMemo(() => {
    const readonlyComponentName =
      fieldNode.schema.readonlyComponent ||
      (parsedQuickComponent.type === 'normal'
        ? parsedQuickComponent.name
        : fieldNode.schema.component);

    const readonlyConfig = {
      mode: fieldNode.schema.readonlyMode,
      format: fieldNode.schema.format,
      emptyText: '--',
      prefix:
        parsedQuickComponent.type === 'prefix'
          ? parsedQuickComponent.prefix
          : fieldNode.schema.prefix,
      suffix:
        parsedQuickComponent.type === 'unit'
          ? parsedQuickComponent.suffix
          : fieldNode.schema.suffix,
      ...fieldNode.schema.readonlyConfig,
    };

    // 如果有指定模式，使用模式对应的渲染器
    if (readonlyConfig.mode && readonlyConfig.mode !== 'custom') {
      const renderer = getRendererByMode(readonlyConfig.mode);
      return (
        <>
          {renderer(
            displayValue,
            fieldNode.schema.options,
            readonlyConfig,
            fieldNode.schema.componentProps,
          )}
        </>
      );
    }

    // 使用组件类型对应的渲染器
    const renderer = getReadonlyRenderer(readonlyComponentName || 'Input');
    return (
      <>
        {renderer(
          displayValue,
          fieldNode.schema.options,
          readonlyConfig,
          fieldNode.schema.componentProps,
        )}
      </>
    );
  }, [fieldNode.schema, parsedQuickComponent, displayValue]);

  /**
   * 渲染组件
   */
  const renderComponent = () => {
    // 如果是预览或只读模式
    if (status === 'preview' || status === 'readonly') {
      return renderReadonlyContent;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ComponentToRender: React.ComponentType<any> | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const additionalProps: Record<string, any> = {};

    if (parsedQuickComponent.type === 'unit') {
      ComponentToRender =
        parsedQuickComponent.baseComponent === 'InputNumber'
          ? getComponent('QuickInputNumberWithSuffix')
          : getComponent('QuickInputWithSuffix');
      additionalProps.suffix = parsedQuickComponent.suffix;
    } else if (parsedQuickComponent.type === 'prefix') {
      ComponentToRender =
        parsedQuickComponent.baseComponent === 'InputNumber'
          ? getComponent('QuickInputNumberWithSuffix')
          : getComponent('QuickInputWithSuffix');
      additionalProps.prefix = parsedQuickComponent.prefix;
    } else if (parsedQuickComponent.type === 'quick') {
      ComponentToRender = getComponent(parsedQuickComponent.name);
    } else {
      ComponentToRender = getComponent(fieldNode.schema.component || 'Input');
    }

    if (!ComponentToRender) {
      console.warn(`Component "${fieldNode.schema.component}" not found`);
      return null;
    }

    const { style: userStyle, ...restComponentProps } =
      fieldNode.schema.componentProps || {};

    // 获取组件显示值（处理 RangePicker 数组字段名）
    const componentValue = getComponentValue();

    return (
      <ComponentToRender
        ref={(el: ComponentRef) => {
          if (el) {
            componentRef.current = el;
          }
        }}
        placeholder={fieldNode.schema.placeholder}
        options={fieldNode.schema.options}
        disabled={status === 'disabled'}
        {...additionalProps}
        {...restComponentProps}
        style={{ width: '100%', ...userStyle }}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={componentValue}
        name={fieldName}
        label={fieldNode.schema.label}
        focused={focused}
        error={error}
        required={fieldNode.computedBehavior.required}
        visible={fieldNode.computedBehavior.visible}
        display={fieldNode.computedBehavior.display}
        readonly={fieldNode.computedBehavior.readonly}
        preview={fieldNode.computedBehavior.preview}
      />
    );
  };

  // 构建验证规则 - 转换为 Arco Form 的格式
  const finalRules = useMemo(() => {
    const rules: { required?: boolean; message?: string }[] = [];
    if (fieldNode.computedBehavior.required) {
      rules.push({
        required: true,
        message: `请输入${fieldNode.schema.label || fieldNode.name}`,
      });
    }
    return rules;
  }, [
    fieldNode.computedBehavior.required,
    fieldNode.schema.label,
    fieldNode.name,
  ]);

  // 获取验证状态
  const getValidateStatus = ():
    | 'success'
    | 'warning'
    | 'error'
    | 'validating'
    | undefined => {
    if (error) {
      return 'error';
    }
    return undefined;
  };

  return (
    <FieldContextProvider value={fieldContextValue}>
      <div
        data-field-name={fieldName}
        style={{
          display: fieldNode.computedBehavior.display ? undefined : 'none',
        }}
      >
        <Item
          field={fieldName}
          label={fieldNode.schema.label}
          labelCol={fieldNode.schema.labelCol || layoutContext.labelCol}
          wrapperCol={fieldNode.schema.wrapperCol || layoutContext.wrapperCol}
          rules={finalRules}
          initialValue={fieldNode.schema.initialValue}
          tooltip={fieldNode.schema.tooltip}
          extra={fieldNode.schema.extra}
          validateStatus={getValidateStatus()}
          help={error}
        >
          {renderComponent()}
        </Item>
      </div>
    </FieldContextProvider>
  );
};

/**
 * FormField 组件
 */
export const FormField: React.FC<FormFieldProps> = ({
  schema,
  formStore,
  arcoForm,
  setComponentRef,
  onFieldChange,
}) => {
  const layoutContext = useLayoutContext();

  // 创建或获取 FieldNode
  const fieldNode = useMemo(() => {
    const existingField = formStore.getField(schema.name);
    if (existingField) {
      return existingField;
    }
    const newField = createFieldNode(schema, formStore);
    formStore.registerField(newField);
    return newField;
  }, [schema, formStore]);

  // 组件卸载时注销字段
  useEffect(
    () => () => {
      formStore.unregisterField(schema.name);
    },
    [schema.name, formStore],
  );

  // 构建 SchemaContext
  const schemaContextValue = useMemo(
    () => ({
      name: schema.name,
      label: schema.label,
      component: schema.component || 'Input',
      componentProps: schema.componentProps,
      rules: schema.rules,
      dependencies: schema.dependencies,
      behavior: schema.behavior,
      reactions: schema.reactions,
      lifecycle: schema.lifecycle,
      initialValue: schema.initialValue,
      tooltip: schema.tooltip,
      extra: schema.extra,
      placeholder: schema.placeholder,
      options: schema.options,
      format: schema.format,
      prefix: schema.prefix,
      suffix: schema.suffix,
      required: schema.required,
      readonlyMode: schema.readonlyMode,
      readonlyConfig: schema.readonlyConfig,
      readonlyComponent: schema.readonlyComponent,
      rawSchema: schema,
    }),
    [schema],
  );

  // 布局配置
  const layoutContextValue = useMemo(
    () => ({
      ...layoutContext,
      col: schema.col,
      labelCol: schema.labelCol || layoutContext.labelCol,
      wrapperCol: schema.wrapperCol || layoutContext.wrapperCol,
    }),
    [layoutContext, schema],
  );

  return (
    <SchemaContextProvider value={schemaContextValue}>
      <LayoutContextProvider value={layoutContextValue}>
        <FormFieldInner
          fieldNode={fieldNode}
          arcoForm={arcoForm}
          setComponentRef={setComponentRef}
          onFieldChange={onFieldChange}
        />
      </LayoutContextProvider>
    </SchemaContextProvider>
  );
};
