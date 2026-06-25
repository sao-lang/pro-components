import type { ReactNode, CSSProperties } from 'react';
import type { ButtonProps } from '@arco-design/web-react';
import type { ProFormSchema, ProFormProps } from '../ProFormN/types';
import type { ProDialogProps } from '../ProDialog/types';

/**
 * 按钮基础配置
 */
export interface ActionButtonBaseProps
  extends Omit<ButtonProps, 'onClick' | 'onSubmit' | 'onError'> {
  /** 按钮文本，不传则使用默认文本 */
  text?: string;
  /** 是否显示按钮 */
  visible?: boolean;
  /** 自定义样式 */
  style?: CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 表单弹窗按钮配置
 */
export interface FormButtonProps extends ActionButtonBaseProps {
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 表单字段配置 */
  schemas: ProFormSchema[];
  /** 表单初始值 */
  initialValues?: Record<string, unknown>;
  /** 表单属性 */
  formProps?: Omit<ProFormProps, 'schemas' | 'onFinish'>;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'schemas' | 'formProps' | 'initialValues'>;
  /** 提交回调，返回 true 关闭弹窗 */
  onSubmit: (
    values: Record<string, unknown>,
  ) => Promise<boolean | void> | boolean | void;
  /** 弹窗打开前的回调，返回 false 阻止打开 */
  onBeforeOpen?: () => boolean | void | Promise<boolean | void>;
  /** 弹窗关闭后的回调 */
  onAfterClose?: () => void;
}

/**
 * 新增按钮配置
 */
export interface AddButtonProps extends FormButtonProps {
  /** 按钮文本，默认"新增" */
  text?: string;
}

/**
 * 编辑按钮配置
 */
export interface EditButtonProps extends FormButtonProps {
  /** 按钮文本，默认"编辑" */
  text?: string;
  /** 获取表单初始数据 */
  getInitialValues: () =>
    | Record<string, unknown>
    | Promise<Record<string, unknown>>;
}

/**
 * 查看按钮配置
 */
export interface ViewButtonProps extends ActionButtonBaseProps {
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'children'>;
  /** 自定义内容渲染 */
  renderContent: () => ReactNode;
  /** 查看的数据 */
  record?: unknown;
}

/**
 * 删除按钮配置
 */
export interface DeleteButtonProps extends ActionButtonBaseProps {
  /** 按钮文本，默认"删除" */
  text?: string;
  /** 确认弹窗标题 */
  confirmTitle?: string;
  /** 确认弹窗内容 */
  confirmContent?: ReactNode | (() => ReactNode);
  /** 确认按钮文本 */
  okText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮属性 */
  okButtonProps?: ButtonProps;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'onOk' | 'onCancel'>;
  /** 删除回调，返回 true 关闭弹窗 */
  onDelete: () => Promise<boolean | void> | boolean | void;
}

/**
 * 导出按钮配置
 */
export interface ExportButtonProps extends ActionButtonBaseProps {
  /** 按钮文本，默认"导出" */
  text?: string;
  /** 导出接口地址 */
  exportUrl?: string;
  /** 导出参数 */
  params?: Record<string, unknown>;
  /** 文件名 */
  fileName?: string;
  /** 自定义导出方法 */
  onExport?: () => Promise<void> | void;
  /** 导出前的回调 */
  onBeforeExport?: () => boolean | Promise<boolean>;
  /** 超时时间（毫秒），默认 60000 */
  timeout?: number;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

/**
 * 导入按钮配置
 */
export interface ImportButtonProps extends ActionButtonBaseProps {
  /** 按钮文本，默认"导入" */
  text?: string;
  /** 上传接口地址 */
  uploadUrl?: string;
  /** 上传参数 */
  uploadParams?: Record<string, unknown>;
  /** 接受的文件类型 */
  accept?: string;
  /** 是否多选 */
  multiple?: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: number | string;
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'onOk'>;
  /** 自定义上传内容 */
  renderUpload?: () => ReactNode;
  /** 上传成功回调 */
  onSuccess?: (result: unknown) => void;
  /** 上传失败回调 */
  onImportError?: (error: Error) => void;
}

/**
 * 跳转按钮配置
 */
export interface JumpButtonProps extends ActionButtonBaseProps {
  /** 按钮文本 */
  text?: string;
  /** 跳转路径 */
  to: string;
  /** 是否在新窗口打开 */
  target?: '_blank' | '_self';
  /** 跳转前的回调，返回 false 阻止跳转 */
  onBeforeJump?: () => boolean | Promise<boolean>;
}

/**
 * 批量操作按钮配置
 */
export interface BatchButtonProps extends ActionButtonBaseProps {
  /** 按钮文本 */
  text?: string;
  /** 选中的数据 */
  selectedRows: unknown[];
  /** 选中的 keys */
  selectedKeys: (string | number)[];
  /** 是否需要选中才能操作 */
  needSelection?: boolean;
  /** 最少选中数量 */
  minSelection?: number;
  /** 最多选中数量 */
  maxSelection?: number;
  /** 未选中的提示文本 */
  selectionWarning?: string;
  /** 是否需要二次确认 */
  needConfirm?: boolean;
  /** 确认弹窗标题 */
  confirmTitle?: string;
  /** 确认弹窗内容 */
  confirmContent?: ReactNode | ((rows: unknown[]) => ReactNode);
  /** 弹窗属性 */
  dialogProps?: Omit<ProDialogProps, 'onOk'>;
  /** 操作回调，返回 true 表示操作成功 */
  onAction: (
    rows: unknown[],
    keys: (string | number)[],
  ) => Promise<boolean | void> | boolean | void;
}
