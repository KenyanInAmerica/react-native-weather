import React from "react";
import { FlatList, Text, View, TouchableOpacity, SafeAreaView, StyleSheet } from "react-native";
import { SearchBar } from "../components/SearchBar";
import { SearchItem } from "../components/List";
import { getRecentSearch, clearSearch } from "../util/recentSearch";
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  button: {
    backgroundColor: '#808080',
    flex: 1,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    margin: 5,
  },
  text: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center"
  }
});
class Search extends React.Component {
  state = {
    query: "",
    recentSearch: []
  };
  componentDidMount() {
    getRecentSearch().then(recentSearch => {
      this.setState({ recentSearch });
    });
  }
  clearRecentSearches = () => {
    this.setState({ recentSearch: [] })
    clearSearch();
  }
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={this.state.recentSearch}
          renderItem={({ item }) => (
            <SearchItem
              name={item.name}
              onPress={() =>
                this.props.navigation.navigate("Details", {
                  lat: item.lat,
                  lon: item.lon
                })
              }
            />
          )}
          keyExtractor={item => item.id.toString()}
          ListHeaderComponent={(
            <View>
              <SearchBar
                onSearch={() => {
                  this.props.navigation.navigate("Details", {
                    zipcode: this.state.query
                  });
                }}
                searchButtonEnabled={this.state.query.length >= 5}
                placeholder="Zipcode"
                onChangeText={query => this.setState({ query })}
              />
              <Text
                style={{
                  marginHorizontal: 10,
                  fontSize: 16,
                  color: "#aaa",
                  marginTop: 10,
                  marginBottom: 5
                }}
              >
                Recents
                            </Text>
            </View>
          )}
          ListFooterComponent=
          {(
            <TouchableOpacity style={styles.button} onPress={() => this.clearRecentSearches()}>
              <Text style={styles.text}>Clear Recent Searches</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }
}
export default Search;
