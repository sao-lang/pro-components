import { deepMerge } from './utils';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Modal } from '@arco-design/web-react';
import {
  IconInfoCircle,
  IconCheckCircle,
  IconExclamationCircle,
  IconCloseCircle,
} from '@arco-design/web-react/icon';
import type {
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  ProDialogInstance,
} from './types';
import { ProDialog } from './index';

/**
 * 命令式弹窗容器
 * 用于 ProDialog.open() 等方法
 */
interface DialogHolderProps<TValues, T> {
  config: OpenDialogConfig<TValues, T>;
  onClose: () => void;
}

function DialogHolder<TValues, T>({
  config,
  onClose,
}: DialogHolderProps<TValues, T>) {
  const [visible, setVisible] = useState(true);
  const [currentConfig, setCurrentConfig] =
    useState<OpenDialogConfig<TValues, T>>(config);
  const dialogRef = useRef<ProDialogInstance<TValues, T>>(null);

  const handleClose = useCallback(() => {
    setVisible(false);
    currentConfig.onCancel?.();
    onClose();
  }, [currentConfig, onClose]);

  const handleOk = useCallback(async () => {
    if (currentConfig.onSubmit || currentConfig.onOk) {
      // 如果是 ProDialog 内部处理 onSubmit，我们需要同步 loading 状态
      // 但由于 DialogHolder 只是一个壳，真正的提交逻辑在 ProDialog 内部
      // 这里 handleOk 实际上是由 ProDialog 的 onOk 触发的（如果是 Modal 模式）
      // 或者是由 ProDialog 内部按钮触发的（如果是自定义 Footer）
    }
  }, [currentConfig]);

  const handleUpdate = useCallback(
    (newConfig: Partial<import('./types').ProDialogProps>) => {
      setCurrentConfig(prev => deepMerge(prev, newConfig as any));
    },
    [],
  );

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.update = handleUpdate;
    }
  }, [handleUpdate]);

  const { content, ...restConfig } = currentConfig as OpenDialogConfig<
    TValues,
    T
  >;

  return (
    <ProDialog
      {...(restConfig as any)}
      ref={dialogRef as any}
      visible={visible}
      onVisibleChange={v => {
        setVisible(v);
        if (!v) {
          onClose();
        }
      }}
      onOk={handleOk}
      onCancel={handleClose}
    >
      {typeof content === 'function'
        ? (content as any)(dialogRef.current!)
        : content}
    </ProDialog>
  );
}

/**
 * 创建命令式弹窗
 */
export function createDialogHolder<TValues, T>(
  config: OpenDialogConfig<TValues, T>,
): DialogReturnProps {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  const close = () => {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const update: DialogReturnProps['update'] = newConfig => {
    root.render(
      <DialogHolder<TValues, T>
        config={
          { ...(config as any), ...(newConfig as any) } as OpenDialogConfig<
            TValues,
            T
          >
        }
        onClose={close}
      />,
    );
  };

  const destroy = () => {
    close();
  };

  root.render(<DialogHolder<TValues, T> config={config} onClose={close} />);

  return {
    update,
    close,
    destroy,
  };
}

/**
 * 渲染确认对话框
 */
export function renderConfirmDialog(
  config: ConfirmDialogConfig,
): DialogReturnProps {
  const {
    type = 'confirm',
    title,
    content,
    icon,
    okText = '确认',
    cancelText = '取消',
    onConfirm,
    autoClose = true,
    ...restConfig
  } = config;

  // 获取默认图标
  const getDefaultIcon = () => {
    switch (type) {
      case 'info':
        return <IconInfoCircle style={{ color: 'var(--color-primary)' }} />;
      case 'success':
        return <IconCheckCircle style={{ color: 'var(--color-success)' }} />;
      case 'warning':
        return (
          <IconExclamationCircle style={{ color: 'var(--color-warning)' }} />
        );
      case 'error':
        return <IconCloseCircle style={{ color: 'var(--color-danger)' }} />;
      default:
        return (
          <IconExclamationCircle style={{ color: 'var(--color-primary)' }} />
        );
    }
  };

  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);

  const close = () => {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    if (autoClose) {
      close();
    }
  };

  const modalConfig: any = {
    title,
    content: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 24,
        }}
      >
        <div
          style={{
            fontSize: 20,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon || getDefaultIcon()}
        </div>
        <div style={{ lineHeight: 1.5, display: 'flex', alignItems: 'center' }}>
          {content}
        </div>
      </div>
    ),
    okText,
    cancelText,
    onOk: handleConfirm,
    onCancel: close,
    ...restConfig,
  };

  // 根据类型调用不同的 Modal 方法
  let modalResult: { update: Function; close: Function };

  switch (type) {
    case 'info':
      modalResult = Modal.info(modalConfig);
      break;
    case 'success':
      modalResult = Modal.success(modalConfig);
      break;
    case 'warning':
      modalResult = Modal.warning(modalConfig);
      break;
    case 'error':
      modalResult = Modal.error(modalConfig);
      break;
    default:
      modalResult = Modal.confirm(modalConfig);
  }

  return {
    update: (newConfig: Partial<import('./types').OpenDialogConfig>) => {
      const merged = deepMerge(modalConfig, newConfig as any);
      modalResult.update({
        ...merged,
        content:
          (newConfig as any).content !== undefined ||
          (newConfig as any).icon !== undefined ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 24,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {(newConfig as any).icon ||
                  modalConfig.icon ||
                  getDefaultIcon()}
              </div>
              <div
                style={{
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {(newConfig as any).content !== undefined
                  ? (newConfig as any).content
                  : modalConfig.content}
              </div>
            </div>
          ) : (
            modalConfig.content
          ),
      });
    },
    close: () => {
      modalResult.close();
      close();
    },
    destroy: () => {
      modalResult.close();
      close();
    },
  };
}
