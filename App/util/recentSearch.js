import { AsyncStorage } from 'react-native';
const KEY = '@WeatherApp/searchHistory';
// CUSTOM EXPORTED METHOD TO READ PHONES STORAGE MEMORY
export const getRecentSearch = () =>
  AsyncStorage.getItem(KEY).then(str => {
    if (str) {
      return JSON.parse(str);
    }
    return [];
  });
// CUSTOM EXPORTED METHOD TO TAKE IN A NEW SEARCH ITEM AND UPDATE HISTORY
export const addRecentSearch = item =>
  getRecentSearch().then(history => {
    // FILTERS OUT CURRENT HISTORY MATCHING ITEMS ID
    const oldHistory = history.filter(
      existingItem => existingItem.id !== item.id
    );
    const newHistory = [item, ...oldHistory];
    // CONVERST HISTORY OBJECT TO A STRING TO WRITE TO STORAGE SYSTEM AT KEY LOCATION
    return AsyncStorage.setItem(KEY, JSON.stringify(newHistory));
  });
export const clearSearch = () =>
  AsyncStorage.clear();