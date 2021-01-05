import React from "react";
import { ActivityIndicator, ScrollView, SafeAreaView, View, Alert, Picker, StyleSheet, Text } from "react-native";
import { format } from "date-fns";
import * as Location from "expo-location";
import * as Permissions from "expo-permissions";

import { weatherApi } from "../util/weatherApi";
import { Container } from "../components/Container";
import { WeatherIcon } from "../components/WeatherIcon";
import { BasicRow } from "../components/List";
import { H1, H2, P } from "../components/Text";
import { addRecentSearch, getRecentSearch } from "../util/recentSearch";

const styles = StyleSheet.create({
  picker: {
    width: 50,
    ...Platform.select({
      android: {
        color: '#fff',
        backgroundColor: '#07121B',
        marginLeft: 10,
      },
    }),
  },
  pickerItem: {
    color: '#fff',
    fontSize: 15,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const groupForecastByDay = (list) => {
  const data = {};

  list.forEach((item) => {
    const [day] = item.dt_txt.split(" ");
    if (data[day]) {
      if (data[day].temp_max < item.main.temp_max) {
        data[day].temp_max = item.main.temp_max;
      }

      if (data[day].temp_min > item.main.temp_min) {
        data[day].temp_min = item.main.temp_min;
      }
    } else {
      data[day] = {
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
      };
    }
  });

  const formattedList = Object.keys(data).map((key) => ({
    day: key,
    ...data[key],
  }));

  return formattedList;
};

export default class Details extends React.Component {
  state = {
    currentWeather: {},
    loadingCurrentWeather: true,
    forecast: [],
    loadingForecast: true,
    units: 'imperial',
  };

  componentDidMount() {
    getRecentSearch()
      .then(recentSearches => {
        recentSearches.length > 0 ? this.useLastSearch(recentSearches[0]) : this.useCurrentLocation();
      });
  }

  useLastSearch(lastSearch) {
    this.getCurrentWeather({ coords: { latitude: lastSearch.lat, longitude: lastSearch.lon } });
    this.getForecast({ coords: { latitude: lastSearch.lat, longitude: lastSearch.lon } });
  }

  useCurrentLocation() {
    Permissions.askAsync(Permissions.LOCATION)
      .then(({ status }) => {
        if (status !== "granted") {
          throw new Error("Permission to access location was denied");
        }
        return Location.getCurrentPositionAsync();
      })
      .then((position) => {
        this.getCurrentWeather({ coords: position.coords });
        this.getForecast({ coords: position.coords });
      });
  }

  componentDidUpdate(prevProps) {
    const oldLat = prevProps.navigation.getParam("lat");
    const lat = this.props.navigation.getParam("lat");

    const oldLon = prevProps.navigation.getParam("lon");
    const lon = this.props.navigation.getParam("lon");

    const oldZipcode = prevProps.navigation.getParam("zipcode");
    const zipcode = this.props.navigation.getParam("zipcode");

    if (lat && oldLat !== lat && lon && oldLon !== lon) {
      this.getCurrentWeather({ coords: { latitude: lat, longitude: lon } });
      this.getForecast({ coords: { latitude: lat, longitude: lon } });
    } else if (zipcode && oldZipcode !== zipcode) {
      this.getCurrentWeather({ zipcode });
      this.getForecast({ zipcode });
    }
  }

  handleError = () => {
    Alert.alert("No location data found!", "Please try again", [
      {
        text: "Okay",
        onPress: () => this.props.navigation.navigate("Search"),
      },
    ]);
  };

  getCurrentWeather = ({ zipcode, coords }) =>
    weatherApi("/weather", { zipcode, coords }, this.state.units)
      .then((response) => {
        if (response.code === "404") {
          this.handleError();
        } else {
          this.props.navigation.setParams({ title: response.name });
          this.setState({
            currentWeather: response,
            loadingCurrentWeather: false,
          });
          addRecentSearch({
            id: response.id,
            name: response.name,
            lat: response.coord.lat,
            lon: response.coord.lon,
          });
        }
      })
      .catch((err) => {
        console.log("current error", err);
        this.handleError();
      });

  getForecast = ({ zipcode, coords }) =>
    weatherApi("/forecast", { zipcode, coords }, this.state.units)
      .then((response) => {
        if (response.cod !== "404") {
          this.setState({
            loadingForecast: false,
            forecast: groupForecastByDay(response.list),
          });
        }
      })
      .catch((err) => {
        console.log("forecast error", err);
      });

  updateTemperature = (units) => {
    this.setState({
      units,
      loadingCurrentWeather: true,
      loadingForecast: true
    });

    getRecentSearch().then(history => {
      this.getCurrentWeather({ coords: { latitude: history[0].lat, longitude: history[0].lon } });
      this.getForecast({ coords: { latitude: history[0].lat, longitude: history[0].lon } });
    })
  }

  getTempType = () => {
    switch (this.state.units) {
      case 'imperial':
        return '°F';
      case 'metric':
        return '°C';
      default:
        return ' K';
    }
  }

  render() {
    if (this.state.loadingCurrentWeather || this.state.loadingForecast) {
      return (
        <Container>
          <ActivityIndicator color="#fff" size="large" />
        </Container>
      );
    }

    const { weather, main } = this.state.currentWeather;

    return (
      <Container>
        <ScrollView>
          <SafeAreaView>
            <WeatherIcon icon={weather[0].icon} />
            <H1>{`${Math.round(main.temp)}${this.getTempType()}`}</H1>
            <BasicRow>
              <H2>{`Humidity: ${main.humidity}%`}</H2>
            </BasicRow>
            <BasicRow>
              <H2>{`Low: ${Math.round(main.temp_min)}${this.getTempType()}`}</H2>
              <H2>{`High: ${Math.round(main.temp_max)}${this.getTempType()}`}</H2>
            </BasicRow>

            <View style={{ paddingHorizontal: 10, marginTop: 20 }}>
              {this.state.forecast.map((day) => (
                <BasicRow
                  key={day.day}
                  style={{ justifyContent: "space-between" }}
                >
                  <P>{format(new Date(day.day), "EEEE, MMM d")}</P>
                  <View style={{ flexDirection: "row" }}>
                    <P style={{ fontWeight: "700", marginRight: 10 }}>
                      {Math.round(day.temp_max)}
                    </P>
                    <P>{Math.round(day.temp_min)}</P>
                  </View>
                </BasicRow>
              ))}
            </View>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerItem}>Units:</Text>
              <Picker
                style={styles.picker}
                itemStyle={styles.pickerItem}
                selectedValue={this.state.units}
                onValueChange={itemValue => {
                  this.updateTemperature(itemValue);
                }}
                mode="dropdown"
              >
                <Picker.Item key='F' label='°F' value='imperial' />
                <Picker.Item key='C' label='°C' value='metric' />
                <Picker.Item key='K' label='K' value='' />
              </Picker>
            </View>
          </SafeAreaView>
        </ScrollView>
      </Container>
    );
  }
}


