const { jest } = require('@jest/globals');

// AsyncStorage는 네이티브 모듈을 찾지 못하면 import 시점에 던짐. 패키지가 함께 내는 테스트용 구현으로 바꿈
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
