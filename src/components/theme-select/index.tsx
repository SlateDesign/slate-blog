import { useMemo, useState, useEffect, type ReactNode } from 'react';
import DesktopOutlined from '@/assets/images/desktop-outlined.svg?react';
import SunOutlined from '@/assets/images/sun-outlined.svg?react';
import MoonOutlined from '@/assets/images/moon-outlined.svg?react';
import slateConfig from '~@/slate.config';
import { setThemeMode } from '@/helpers/utils';
import type { ThemeOptions } from '@/typings/config';
import { ThemeValue } from '@/typings/global';

const THEME_LIST: Array<{ icon: ReactNode; value: ThemeValue }> = [
  {
    icon: <DesktopOutlined className="h-4 w-4" />,
    value: ThemeValue.Auto,
  },
  {
    icon: <SunOutlined className="h-4 w-4" />,
    value: ThemeValue.Light,
  },
  {
    icon: <MoonOutlined className="h-4 w-4" />,
    value: ThemeValue.Dark,
  },
];

const ThemeSelect = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeValue>();

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (
      theme === ThemeValue.Light ||
      theme === ThemeValue.Dark ||
      theme === ThemeValue.Auto
    ) {
      setCurrentTheme(theme);
      return;
    }
    const presetTheme = (slateConfig.theme as ThemeOptions).mode;
    setCurrentTheme(presetTheme as ThemeValue);
  }, []);

  const themeSelectClasses = useMemo(() => {
    if (currentTheme === ThemeValue.Dark) {
      return 'left-[58px]';
    } else if (currentTheme === ThemeValue.Light) {
      return 'left-[30px]';
    } else {
      return 'left-0.5';
    }
  }, [currentTheme]);

  const handleThemeChange = (value: ThemeValue) => {
    setCurrentTheme(value);

    let mode = value;
    if (value === ThemeValue.Auto) {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? ThemeValue.Dark
        : ThemeValue.Light;
    }
    localStorage.setItem('theme', value);
    setThemeMode(mode);
  };

  return (
    <div
      className="bg-slate3 text-slate8 relative flex items-center rounded-full p-0.5"
      role="radiogroup"
    >
      <div
        className={`bg-slate1 transition-left absolute top-0.5 h-7 w-7 rounded-full ${themeSelectClasses}`}
      ></div>
      {THEME_LIST.map((item) => (
        <div
          className={`relative inline-flex h-7 w-7 cursor-pointer items-center justify-center transition-colors ${item.value === currentTheme ? 'text-slate12' : 'text-slate10 hover:text-slate11'}`}
          key={item.value}
          onClick={() => handleThemeChange(item.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleThemeChange(item.value);
            }
          }}
          tabIndex={0}
          role="radio"
          aria-label={item.value}
          aria-checked={item.value === currentTheme}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
};

export default ThemeSelect;
