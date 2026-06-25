import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Select, Spin, Empty, Tag, Checkbox } from '@arco-design/web-react';
import type {
  ProSelectProps,
  ProSelectInstance,
  ProSelectOption,
  ProSelectRequestResult,
  LabeledValue,
} from './types';

const { Option } = Select;
const { OptGroup } = Select;

/**
 * ProSelect 组件 - 增强版选择器
 *
 * 特性：
 * - 支持远程数据加载
 * - 支持搜索防抖
 * - 支持分页加载
 * - 支持自定义选项渲染
 * - 支持字段映射
 * - 支持标签模式
 * - 支持全选功能
 * - 支持虚拟滚动
 * - 支持创建条目
 * - 支持选项分组
 *
 * @example
 * ```tsx
 * // 基础用法
 * <ProSelect
 *   options={[
 *     { label: '选项1', value: 1 },
 *     { label: '选项2', value: 2 },
 *   ]}
 * />
 *
 * // 标签模式 + 全选
 * <ProSelect
 *   mode="multiple"
 *   tagMode
 *   showSelectAll
 *   options={[...]}
 * />
 * ```
 */
const ProSelectComponent = forwardRef<ProSelectInstance, ProSelectProps>(
  (
    {
      options: initialOptions = [],
      request,
      search = false,
      debounceTime = 300,
      pagination = false,
      pageSize = 20,
      showLoading = true,
      optionRender,
      emptyRender,
      formatOptions,
      fieldNames = {
        label: 'label',
        value: 'value',
        disabled: 'disabled',
        group: 'group',
      },
      tagMode = false,
      tagProps,
      tagRender,
      showSelectAll = false,
      selectAllText = '全选',
      unselectAllText = '取消全选',
      virtual = false,
      virtualHeight = 256,
      virtualItemHeight = 32,
      showOptionIcon = false,
      optionIconRender,
      clearSearchOnSelect = false,
      maxTagCount,
      allowCreate = false,
      validateCreate,
      formatCreateOption,
      dropdownHeader,
      dropdownFooter,
      mode,
      value,
      defaultValue,
      onChange,
      onVisibleChange,
      ...restProps
    },
    ref,
  ) => {
    const [options, setOptions] = useState<ProSelectOption[]>(initialOptions);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [innerValue, setInnerValue] = useState<
      string | number | (string | number | LabeledValue)[]
    >(
      (defaultValue as string | number | (string | number | LabeledValue)[]) ||
        (mode === 'multiple' ? [] : ''),
    );
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstLoadRef = useRef(true);
    const selectRef = useRef<typeof Select>(null);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : innerValue;

    // 格式化选项数据
    const formatOptionData = useCallback(
      (data: unknown[]): ProSelectOption[] => {
        if (formatOptions) {
          return formatOptions(data);
        }
        return data.map(item => {
          const record = item as Record<string, unknown>;
          return {
            label: record[fieldNames.label!] as React.ReactNode,
            value: record[fieldNames.value!] as string | number,
            disabled: record[fieldNames.disabled!] as boolean | undefined,
            group: record[fieldNames.group!] as string | undefined,
            ...record,
          };
        });
      },
      [formatOptions, fieldNames],
    );

    // 获取数据
    const fetchData = useCallback(
      async (params: {
        keyword?: string;
        page?: number;
        isLoadMore?: boolean;
      }) => {
        if (!request) {
          return;
        }

        setLoading(true);
        try {
          const result = await request({
            keyword: params.keyword || '',
            page: params.page || 1,
            pageSize,
          });

          let newOptions: ProSelectOption[] = [];
          let hasMoreData = false;

          if (Array.isArray(result)) {
            newOptions = formatOptionData(result);
            hasMoreData = result.length === pageSize;
          } else {
            newOptions = formatOptionData(result.data || []);
            hasMoreData =
              result.hasMore ??
              (result.total ? newOptions.length < result.total : false);
          }

          if (params.isLoadMore) {
            setOptions(prev => [...prev, ...newOptions]);
          } else {
            setOptions(newOptions);
          }

          setHasMore(hasMoreData);
        } catch (error) {
          console.error('ProSelect fetch data error:', error);
        } finally {
          setLoading(false);
        }
      },
      [request, pageSize, formatOptionData],
    );

    // 刷新数据
    const refresh = useCallback(() => {
      setPage(1);
      setKeyword('');
      fetchData({ keyword: '', page: 1 });
    }, [fetchData]);

    // 加载更多
    const loadMore = useCallback(() => {
      if (!hasMore || loading) {
        return;
      }
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData({ keyword, page: nextPage, isLoadMore: true });
    }, [hasMore, loading, page, keyword, fetchData]);

    // 清空选项
    const clearOptions = useCallback(() => {
      setOptions([]);
      setPage(1);
      setHasMore(true);
    }, []);

    // 获取当前选项
    const getOptions = useCallback(() => options, [options]);

    // 设置选项
    const setOptionsData = useCallback((newOptions: ProSelectOption[]) => {
      setOptions(newOptions);
    }, []);

    // 获取已选项
    const getSelectedOptions = useCallback((): ProSelectOption[] => {
      const selectedValues = Array.isArray(currentValue)
        ? currentValue
        : [currentValue];
      return options.filter(opt => selectedValues.includes(opt.value));
    }, [currentValue, options]);

    // 全选
    const selectAll = useCallback(() => {
      if (mode !== 'multiple') {
        return;
      }
      const allValues = options
        .filter(opt => !opt.disabled)
        .map(opt => opt.value);
      handleChange(allValues);
    }, [mode, options]);

    // 取消全选
    const unselectAll = useCallback(() => {
      if (mode !== 'multiple') {
        return;
      }
      handleChange([]);
    }, [mode]);

    // 聚焦
    const focus = useCallback(() => {
      (selectRef.current as any)?.focus?.();
    }, []);

    // 失焦
    const blur = useCallback(() => {
      (selectRef.current as any)?.blur?.();
    }, []);

    // 暴露实例方法
    useImperativeHandle(ref, () => ({
      refresh,
      loadMore,
      clearOptions,
      getOptions,
      setOptions: setOptionsData,
      selectAll,
      unselectAll,
      getSelectedOptions,
      focus,
      blur,
    }));

    // 处理值变化
    const handleChange = useCallback(
      (
        newValue: string | number | (string | number | LabeledValue)[],
        option?: unknown,
      ) => {
        // 检查是否是创建的新选项（且该选项还不存在于列表中）
        if (
          allowCreate &&
          keyword.trim() &&
          !options.some(opt => opt.value === keyword.trim())
        ) {
          // 如果选择的值等于搜索关键字，说明是要创建新选项
          const selectedValue = Array.isArray(newValue)
            ? newValue[newValue.length - 1]
            : newValue;
          if (selectedValue === keyword.trim()) {
            // 直接创建新选项并选中，避免循环调用
            (async () => {
              const trimmedValue = keyword.trim();

              // 校验
              if (validateCreate) {
                const isValid = await validateCreate(trimmedValue);
                if (!isValid) {
                  return;
                }
              }

              // 创建新选项
              const newOption = formatCreateOption
                ? formatCreateOption(trimmedValue)
                : { label: trimmedValue, value: trimmedValue };

              // 添加到选项列表
              setOptions(prev => [...prev, newOption]);

              // 选中新建项
              let finalValue;
              if (mode === 'multiple') {
                const baseValues = Array.isArray(newValue)
                  ? newValue.filter(v => {
                      const valueToCheck =
                        typeof v === 'object' && v !== null && 'value' in v
                          ? (v as LabeledValue).value
                          : v;
                      return valueToCheck !== trimmedValue;
                    })
                  : [];
                finalValue = [...baseValues, newOption.value];
              } else {
                finalValue = newOption.value;
              }

              // 更新值
              if (!isControlled) {
                setInnerValue(finalValue);
              }
              onChange?.(finalValue, newOption as any);

              if (clearSearchOnSelect) {
                setKeyword('');
              }
            })();
            return;
          }
        }

        if (!isControlled) {
          setInnerValue(newValue);
        }
        onChange?.(newValue, option as any);

        if (clearSearchOnSelect) {
          setKeyword('');
        }
      },
      [
        isControlled,
        onChange,
        clearSearchOnSelect,
        allowCreate,
        keyword,
        options,
        validateCreate,
        formatCreateOption,
        mode,
      ],
    );

    // 处理搜索
    const handleSearch = useCallback(
      (value: string) => {
        setKeyword(value);

        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
          setPage(1);
          fetchData({ keyword: value, page: 1 });
        }, debounceTime);
      },
      [debounceTime, fetchData],
    );

    // 处理创建条目（供外部调用）
    const handleCreate = useCallback(
      async (inputValue: string) => {
        if (!allowCreate || !inputValue.trim()) {
          return;
        }

        const trimmedValue = inputValue.trim();

        // 校验
        if (validateCreate) {
          const isValid = await validateCreate(trimmedValue);
          if (!isValid) {
            return;
          }
        }

        // 创建新选项
        const newOption = formatCreateOption
          ? formatCreateOption(trimmedValue)
          : { label: trimmedValue, value: trimmedValue };

        // 添加到选项列表
        setOptions(prev => [...prev, newOption]);

        // 选中新建项
        let finalValue;
        if (mode === 'multiple') {
          const newValues = Array.isArray(currentValue)
            ? [...currentValue, newOption.value]
            : [newOption.value];
          finalValue = newValues;
        } else {
          finalValue = newOption.value;
        }

        // 更新值
        if (!isControlled) {
          setInnerValue(finalValue);
        }
        onChange?.(finalValue, newOption as any);

        if (clearSearchOnSelect) {
          setKeyword('');
        }
      },
      [
        allowCreate,
        validateCreate,
        formatCreateOption,
        mode,
        currentValue,
        isControlled,
        onChange,
        clearSearchOnSelect,
      ],
    );

    // 处理下拉框显示变化
    const handleDropdownVisibleChange = useCallback(
      (visible: boolean) => {
        setDropdownOpen(visible);
        onVisibleChange?.(visible);

        if (
          visible &&
          request &&
          isFirstLoadRef.current &&
          options.length === 0
        ) {
          isFirstLoadRef.current = false;
          fetchData({ keyword: '', page: 1 });
        }
      },
      [request, options.length, fetchData, onVisibleChange],
    );

    // 处理滚动加载更多
    const handlePopupScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        if (!pagination) {
          return;
        }

        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50) {
          loadMore();
        }
      },
      [pagination, loadMore],
    );

    // 清理定时器
    useEffect(
      () => () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      },
      [],
    );

    // 同步初始选项
    useEffect(() => {
      if (!request) {
        setOptions(initialOptions);
      }
    }, [initialOptions, request]);

    // 按分组组织选项
    const groupedOptions = useMemo(() => {
      const groups: Record<string, ProSelectOption[]> = {};
      const ungrouped: ProSelectOption[] = [];

      options.forEach(option => {
        if (option.group) {
          if (!groups[option.group]) {
            groups[option.group] = [];
          }
          groups[option.group].push(option);
        } else {
          ungrouped.push(option);
        }
      });

      return { groups, ungrouped };
    }, [options]);

    // 渲染选项
    const renderOptions = useMemo(() => {
      const renderOptionItem = (option: ProSelectOption) => (
        <Option key={option.value} disabled={option.disabled} {...option}>
          {optionRender ? (
            optionRender(option)
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {showOptionIcon && optionIconRender && optionIconRender(option)}
              {option.label}
            </span>
          )}
        </Option>
      );

      const result: React.ReactNode[] = [];

      // 未分组选项
      if (groupedOptions.ungrouped.length > 0) {
        result.push(...groupedOptions.ungrouped.map(renderOptionItem));
      }

      // 分组选项
      Object.entries(groupedOptions.groups).forEach(
        ([groupName, groupOptions]) => {
          result.push(
            <OptGroup key={groupName} label={groupName}>
              {groupOptions.map(renderOptionItem)}
            </OptGroup>,
          );
        },
      );

      // 创建条目选项
      if (
        allowCreate &&
        keyword.trim() &&
        !options.some(opt => opt.value === keyword.trim())
      ) {
        result.push(
          <Option key="__create__" value={keyword.trim()}>
            <span style={{ color: '#165dff' }}>+ 创建 "{keyword.trim()}"</span>
          </Option>,
        );
      }

      return result;
    }, [
      groupedOptions,
      optionRender,
      showOptionIcon,
      optionIconRender,
      allowCreate,
      keyword,
      options,
    ]);

    // 自定义 Tag 渲染
    const renderTag = useCallback(
      (props: {
        label: React.ReactNode;
        value: unknown;
        onClose: () => void;
      }) => {
        const option = options.find(
          opt => opt.value === (props.value as string | number),
        );
        const color = option?.tagColor;

        if (tagRender) {
          return tagRender(
            option || {
              label: props.label,
              value: props.value as string | number,
            },
            props.onClose,
          );
        }

        return (
          <Tag
            closable
            onClose={props.onClose}
            color={color}
            {...tagProps}
            style={{ margin: '2px 4px 2px 0', ...tagProps?.style }}
          >
            {props.label}
          </Tag>
        );
      },
      [options, tagRender, tagProps],
    );

    // 自定义下拉框渲染
    const dropdownRender = useCallback(
      (menu: React.ReactNode) => (
        <div onScroll={handlePopupScroll}>
          {dropdownHeader}
          {showSelectAll && mode === 'multiple' && options.length > 0 && (
            <div
              style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}
            >
              <Checkbox
                checked={
                  Array.isArray(currentValue) &&
                  currentValue.length ===
                    options.filter(opt => !opt.disabled).length &&
                  currentValue.length > 0
                }
                indeterminate={
                  Array.isArray(currentValue) &&
                  currentValue.length > 0 &&
                  currentValue.length <
                    options.filter(opt => !opt.disabled).length
                }
                onChange={checked => {
                  if (checked) {
                    selectAll();
                  } else {
                    unselectAll();
                  }
                }}
              >
                {Array.isArray(currentValue) &&
                currentValue.length ===
                  options.filter(opt => !opt.disabled).length
                  ? unselectAllText
                  : selectAllText}
              </Checkbox>
            </div>
          )}
          {menu}
          {pagination && loading && dropdownOpen && (
            <div style={{ padding: '8px 0', textAlign: 'center' }}>
              <Spin size={14} />
            </div>
          )}
          {pagination && !hasMore && options.length > 0 && (
            <div
              style={{
                padding: '8px 0',
                textAlign: 'center',
                color: '#999',
                fontSize: 12,
              }}
            >
              没有更多数据了
            </div>
          )}
          {dropdownFooter}
        </div>
      ),
      [
        handlePopupScroll,
        dropdownHeader,
        showSelectAll,
        mode,
        options,
        currentValue,
        selectAll,
        unselectAll,
        selectAllText,
        unselectAllText,
        pagination,
        loading,
        hasMore,
        dropdownOpen,
        dropdownFooter,
      ],
    );

    // 自定义空状态
    const renderNotFoundContent = useMemo(() => {
      if (loading && showLoading) {
        return (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <Spin size={14} />
          </div>
        );
      }
      if (emptyRender) {
        return emptyRender;
      }
      return <Empty description="暂无数据" />;
    }, [loading, showLoading, emptyRender]);

    return (
      <Select
        ref={selectRef as any}
        {...restProps}
        mode={mode}
        value={currentValue as any}
        onChange={handleChange as any}
        showSearch={search}
        onSearch={search ? handleSearch : undefined}
        onVisibleChange={handleDropdownVisibleChange}
        dropdownRender={dropdownRender}
        notFoundContent={renderNotFoundContent}
        renderTag={
          tagMode && mode === 'multiple' ? (renderTag as any) : undefined
        }
        maxTagCount={maxTagCount}
        virtualListProps={
          virtual
            ? {
                height: virtualHeight,
                itemHeight: virtualItemHeight,
              }
            : undefined
        }
      >
        {renderOptions}
      </Select>
    );
  },
);

ProSelectComponent.displayName = 'ProSelect';

export const ProSelect = ProSelectComponent;
export type {
  ProSelectProps,
  ProSelectInstance,
  ProSelectOption,
  ProSelectRequestResult,
} from './types';
export default ProSelect;
