import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['swishstreak://', 'https://swishstreak.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Friends: {
            path: 'invite/:code',
            parse: { code: (c: string) => c.toUpperCase() },
          },
        },
      },
      Game: 'play',
    },
  },
};
