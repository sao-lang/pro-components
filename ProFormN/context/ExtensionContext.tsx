import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useRef,
  useCallback,
} from 'react';

/**
 * 扩展 Context 注册表
 * 用于管理各种扩展 Context（权限、审计、国际化等）
 */
export interface ExtensionRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * ExtensionContext 值类型
 */
export interface ExtensionContextValue {
  /** 扩展数据 */
  extensions: ExtensionRegistry;
  /** 注册扩展 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerExtension: (name: string, value: any) => void;
  /** 注销扩展 */
  unregisterExtension: (name: string) => void;
  /** 获取扩展 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getExtension: (name: string) => any;
}

/**
 * ExtensionContext - 扩展 Context
 */
export const ExtensionContext = createContext<ExtensionContextValue>({
  extensions: {},
  registerExtension: () => {},
  unregisterExtension: () => {},
  getExtension: () => undefined,
});

/**
 * ExtensionContext Provider 组件 Props
 */
export interface ExtensionContextProviderProps {
  children: ReactNode;
  initialExtensions?: ExtensionRegistry;
}

/**
 * ExtensionContext Provider 组件
 */
export const ExtensionContextProvider: React.FC<
  ExtensionContextProviderProps
> = ({ children, initialExtensions = {} }) => {
  const extensionsRef = useRef<ExtensionRegistry>(initialExtensions);

  const registerExtension = useCallback((name: string, value: unknown) => {
    extensionsRef.current[name] = value;
  }, []);

  const unregisterExtension = useCallback((name: string) => {
    delete extensionsRef.current[name];
  }, []);

  const getExtension = useCallback(
    (name: string) => extensionsRef.current[name],
    [],
  );

  const value = useMemo(
    () => ({
      extensions: extensionsRef.current,
      registerExtension,
      unregisterExtension,
      getExtension,
    }),
    [registerExtension, unregisterExtension, getExtension],
  );

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  );
};

/**
 * 使用 ExtensionContext 的 Hook
 */
export const useExtensionContext = (): ExtensionContextValue => {
  const context = useContext(ExtensionContext);
  if (!context) {
    throw new Error(
      'useExtensionContext must be used within ExtensionContextProvider',
    );
  }
  return context;
};

/**
 * 使用特定扩展的 Hook
 */
export const useExtension = <T = unknown,>(name: string): T | undefined => {
  const { getExtension } = useExtensionContext();
  return getExtension(name) as T;
};

// ========== 常用扩展类型定义 ==========

/**
 * 权限扩展 Context
 */
export interface PermissionExtension {
  /** 检查字段是否可见 */
  checkVisible: (fieldName: string) => boolean;
  /** 检查字段是否可编辑 */
  checkEditable: (fieldName: string) => boolean;
  /** 检查字段是否可查看 */
  checkReadable: (fieldName: string) => boolean;
  /** 权限数据 */
  permissions: Record<string, string>;
}

/**
 * 审计扩展 Context
 */
export interface AuditExtension {
  /** 记录操作日志 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (action: string, data: Record<string, any>) => void;
  /** 记录字段变更 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logFieldChange: (fieldName: string, oldValue: any, newValue: any) => void;
}

/**
 * 国际化扩展 Context
 */
export interface I18nExtension {
  /** 翻译函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, params?: Record<string, any>) => string;
  /** 当前语言 */
  locale: string;
}
