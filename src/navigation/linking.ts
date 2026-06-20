import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['swishstreak://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Friends: 'invite/:code',
        },
      },
    },
  },
};
