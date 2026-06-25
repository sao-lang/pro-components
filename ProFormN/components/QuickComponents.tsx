import React, { FC, useState, useCallback } from 'react';
import {
  Input,
  InputNumber,
  Select,
  Radio,
  Button,
  Image,
  DatePicker,
  TimePicker,
} from '@arco-design/web-react';
import { IconEye, IconEyeInvisible } from '@arco-design/web-react/icon';
import { registerComponent } from '../registry/componentRegistry';

interface QuickInputWithSuffixProps {
  value?: any;
  onChange?: (value: any) => void;
  suffix?: string;
  prefix?: string;
  [key: string]: any;
}

const QuickInputWithSuffix: FC<QuickInputWithSuffixProps> = ({
  value,
  onChange,
  suffix,
  prefix,
  ...props
}) => {
  const { style, ...restProps } = props;
  return (
    <Input
      {...restProps}
      value={value}
      onChange={onChange}
      prefix={prefix}
      suffix={suffix}
      style={{ width: '100%', ...style }}
    />
  );
};

const QuickInputNumberWithSuffix: FC<QuickInputWithSuffixProps> = ({
  value,
  onChange,
  suffix,
  prefix,
  ...props
}) => {
  const { style, ...restProps } = props;
  return (
    <InputNumber
      {...restProps}
      value={value}
      onChange={onChange}
      prefix={prefix}
      suffix={suffix}
      style={{ width: '100%', ...style }}
    />
  );
};

interface PasswordInputProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: any;
}

const PasswordInput: FC<PasswordInputProps> = ({
  value,
  onChange,
  ...props
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      suffix={
        <span
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <IconEyeInvisible /> : <IconEye />}
        </span>
      }
    />
  );
};

interface YesNoSelectProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  [key: string]: any;
}

const YesNoSelect: FC<YesNoSelectProps> = ({ value, onChange, ...props }) => (
  <Select
    {...props}
    value={value}
    onChange={onChange}
    options={[
      { label: '是', value: 'yes' },
      { label: '否', value: 'no' },
    ]}
  />
);

const MaleFemaleSelect: FC<YesNoSelectProps> = ({
  value,
  onChange,
  ...props
}) => (
  <Radio.Group {...props} value={value} onChange={onChange}>
    <Radio value="male">男</Radio>
    <Radio value="female">女</Radio>
  </Radio.Group>
);

const EnableDisableSelect: FC<YesNoSelectProps> = ({
  value,
  onChange,
  ...props
}) => (
  <Select
    {...props}
    value={value}
    onChange={onChange}
    options={[
      { label: '启用', value: 'enable' },
      { label: '禁用', value: 'disable' },
    ]}
  />
);

const StatusSelect: FC<YesNoSelectProps> = ({ value, onChange, ...props }) => (
  <Select
    {...props}
    value={value}
    onChange={onChange}
    options={[
      { label: '草稿', value: 'draft' },
      { label: '待审核', value: 'pending' },
      { label: '已通过', value: 'approved' },
      { label: '已拒绝', value: 'rejected' },
    ]}
  />
);

const OpenCloseSelect: FC<YesNoSelectProps> = ({
  value,
  onChange,
  ...props
}) => (
  <Select
    {...props}
    value={value}
    onChange={onChange}
    options={[
      { label: '开启', value: 'open' },
      { label: '关闭', value: 'close' },
    ]}
  />
);

interface VerificationCodeProps {
  value?: string;
  onChange?: (value: string) => void;
  onSendCode?: () => Promise<void>;
  countdown?: number;
  [key: string]: any;
}

const VerificationCode: FC<VerificationCodeProps> = ({
  value,
  onChange,
  onSendCode,
  countdown = 60,
  ...props
}) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSendCode = useCallback(async () => {
    if (!onSendCode) {
      return;
    }
    try {
      setLoading(true);
      await onSendCode();
      setCount(countdown);
      const timer = setInterval(() => {
        setCount(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setLoading(false);
    }
  }, [onSendCode, countdown]);

  return (
    <Input.Search
      {...props}
      value={value}
      onChange={onChange}
      searchButton={
        <Button
          disabled={count > 0 || loading}
          loading={loading}
          onClick={handleSendCode}
          type="primary"
        >
          {count > 0 ? `${count}s` : '获取验证码'}
        </Button>
      }
    />
  );
};

interface ImageListProps {
  value?: any[];
  onChange?: (value: any[]) => void;
  [key: string]: any;
}

const ImageList: FC<ImageListProps> = ({ value = [], ..._props }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {value.map((item, index) => {
          const url = item.url || item;
          return (
            <div
              key={index}
              style={{
                width: 80,
                height: 80,
                borderRadius: 4,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => handlePreview(url)}
            >
              <img
                src={url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          );
        })}
      </div>
      {previewVisible && (
        <Image.Preview
          src={previewUrl}
          visible={previewVisible}
          onVisibleChange={setPreviewVisible}
        />
      )}
    </>
  );
};

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: any;
}

const PhoneInput: FC<PhoneInputProps> = ({ value, onChange, ...props }) => (
  <Input
    {...props}
    value={value}
    onChange={onChange}
    maxLength={11}
    placeholder="请输入手机号"
  />
);

interface EmailInputProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: any;
}

const EmailInput: FC<EmailInputProps> = ({ value, onChange, ...props }) => (
  <Input
    {...props}
    value={value}
    onChange={onChange}
    placeholder="请输入邮箱"
  />
);

interface IdCardInputProps {
  value?: string;
  onChange?: (value: string) => void;
  [key: string]: any;
}

const IdCardInput: FC<IdCardInputProps> = ({ value, onChange, ...props }) => (
  <Input
    {...props}
    value={value}
    onChange={onChange}
    maxLength={18}
    placeholder="请输入身份证号"
  />
);

interface AmountInputProps {
  value?: number;
  onChange?: (value: number) => void;
  [key: string]: any;
}

const AmountInput: FC<AmountInputProps> = ({ value, onChange, ...props }) => (
  <InputNumber
    {...props}
    value={value}
    onChange={onChange}
    min={0}
    precision={2}
    prefix="¥"
    placeholder="请输入金额"
  />
);

interface PercentageInputProps {
  value?: number;
  onChange?: (value: number) => void;
  [key: string]: any;
}

const PercentageInput: FC<PercentageInputProps> = ({
  value,
  onChange,
  ...props
}) => (
  <InputNumber
    {...props}
    value={value}
    onChange={onChange}
    min={0}
    max={100}
    precision={2}
    suffix="%"
    placeholder="请输入百分比"
  />
);

interface YearPickerProps {
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
}

const YearPicker: FC<YearPickerProps> = ({ value, onChange, ...props }) => (
  <DatePicker.YearPicker {...props} value={value} onChange={onChange} />
);

interface MonthPickerProps {
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
}

const MonthPicker: FC<MonthPickerProps> = ({ value, onChange, ...props }) => (
  <DatePicker.MonthPicker {...props} value={value} onChange={onChange} />
);

interface WeekPickerProps {
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
}

const WeekPicker: FC<WeekPickerProps> = ({ value, onChange, ...props }) => (
  <DatePicker.WeekPicker {...props} value={value} onChange={onChange} />
);

interface QuarterPickerProps {
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
}

const QuarterPicker: FC<QuarterPickerProps> = ({
  value,
  onChange,
  ...props
}) => <DatePicker.QuarterPicker {...props} value={value} onChange={onChange} />;

interface RangePickerProps {
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
}

const RangePicker: FC<RangePickerProps> = ({ value, onChange, ...props }) => {
  const { style, ...restProps } = props;
  return (
    <DatePicker.RangePicker
      {...restProps}
      value={value}
      onChange={onChange}
      style={{ width: '100%', ...style }}
    />
  );
};

interface TimeRangePickerProps {
  value?: any;
  onChange?: (value: any) => void;
  [key: string]: any;
}

const TimeRangePicker: FC<TimeRangePickerProps> = ({
  value,
  onChange,
  ...props
}) => <TimePicker.RangePicker {...props} value={value} onChange={onChange} />;

// 注册所有快速组件
registerComponent('Password', PasswordInput);
registerComponent('YesNo', YesNoSelect);
registerComponent('MaleFemale', MaleFemaleSelect);
registerComponent('EnableDisable', EnableDisableSelect);
registerComponent('Status', StatusSelect);
registerComponent('OpenClose', OpenCloseSelect);
registerComponent('VerificationCode', VerificationCode);
registerComponent('ImageList', ImageList);
registerComponent('Phone', PhoneInput);
registerComponent('Email', EmailInput);
registerComponent('IdCard', IdCardInput);
registerComponent('Amount', AmountInput);
registerComponent('Percentage', PercentageInput);
registerComponent('YearPicker', YearPicker);
registerComponent('MonthPicker', MonthPicker);
registerComponent('WeekPicker', WeekPicker);
registerComponent('QuarterPicker', QuarterPicker);
registerComponent('RangePicker', RangePicker);
registerComponent('TimeRangePicker', TimeRangePicker);
registerComponent('QuickInputWithSuffix', QuickInputWithSuffix);
registerComponent('QuickInputNumberWithSuffix', QuickInputNumberWithSuffix);

export {
  PasswordInput,
  YesNoSelect,
  MaleFemaleSelect,
  EnableDisableSelect,
  StatusSelect,
  OpenCloseSelect,
  VerificationCode,
  ImageList,
  PhoneInput,
  EmailInput,
  IdCardInput,
  AmountInput,
  PercentageInput,
  YearPicker,
  MonthPicker,
  WeekPicker,
  QuarterPicker,
  RangePicker,
  TimeRangePicker,
  QuickInputWithSuffix,
  QuickInputNumberWithSuffix,
};
