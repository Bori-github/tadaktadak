import { useState, type JSX } from 'react';
import { type Meta, type StoryObj } from '@storybook/react-native-web-vite';

import { DotToggle } from './DotToggle';

const ToggleWithState = ({ dotSize }: { dotSize: number }): JSX.Element => {
  const [value, setValue] = useState(false);

  return <DotToggle dotSize={dotSize} value={value} onValueChange={setValue} />;
};

const meta: Meta<typeof ToggleWithState> = {
  component: ToggleWithState,
  args: { dotSize: 2 },
};

export default meta;

export const Interactive: StoryObj<typeof ToggleWithState> = {};
