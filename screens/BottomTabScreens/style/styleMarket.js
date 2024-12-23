import { StyleSheet, Dimensions } from "react-native";
const { width: screenWidth } = Dimensions.get("window");
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    logo: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#0066ff",
    },
    headerIcons: {
      flexDirection: "row",
      alignItems: "center",
    },
    icon: {
      marginHorizontal: 5,
    },
    notificationIcon: {
      position: "relative",
    },
    notificationBadge: {
      position: "absolute",
      right: -5,
      top: -5,
      backgroundColor: "red",
      borderRadius: 10,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    notificationText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
    postInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    postInput: {
      flex: 1,
      height: 40,
      borderColor: "#ddd",
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 15,
    },
    cardContainer: {
      flexDirection: "row",
      paddingVertical: 15,
      paddingHorizontal: 10,
      right: 10,
    },
    card: {
      width: 100,
      alignItems: "center",
      marginHorizontal: 10,
    },
    cardImage: {
      width: 150, // Adjust this value
      height: 150, // Adjust this value
      borderRadius: 10,
      resizeMode: "contain",
    },
    cardText: {
      marginTop: 5,
    },
    menuContainer: {
      position: "absolute",
      right: 130,
      top: 20,
      backgroundColor: "white",
      borderRadius: 5,
      padding: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      elevation: 5,
    },
    menuItem: {
      padding: 10,
      borderBottomColor: "#ccc",
      borderBottomWidth: 1,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    grid: {
      justifyContent: "center",
      padding: 10,
    },
    card: {
      flex: 1,
      backgroundColor: "#fff",
      margin: 10,
      borderRadius: 8,
      alignItems: "center",
      padding: 15,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    image: {
      width: "100%",
      height: 150, // Set this height or adjust according to your needs
      resizeMode: "cover", // Make sure image fits properly
    },
    title: {
      fontSize: 16,
      color: "red",
      marginVertical: 10,
    },
    price: {
      fontSize: 14,
      color: "gray",
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    containerImage: {
      width: "100%",
      height: 150, // Match the height of the Swiper
    },
    wrapper: {
      height: 150,
    },
    slide: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    notFoundContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    notFoundText: {
      fontSize: 18,
      color: "gray",
      textAlign: "center",
    },
    textSort: {
      padding: 10,
      fontWeight: "bold",
      fontSize: 18,
    },
    containerSort: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    sortButton: {
      backgroundColor: "#ddd",
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "white",
    },
    searchInput: {
      height: 40,
      borderColor: "gray",
      borderWidth: 1,
      paddingLeft: 10,
      borderRadius:15
    },
    searchContainer: {
      paddingHorizontal:10,
      paddingVertical:5
    },
  });
  
  const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 2,
      borderColor: "gray",
      borderRadius: 10,
      color: "black",
      paddingRight: 30, // to ensure the text is never behind the icon
      marginBottom: 20,
    },
    inputAndroid: {
      flex: 0.8,
      fontSize: 16,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 5,
      borderColor: "black",
      borderRadius: 10,
      color: "black",
      paddingRight: 30, // to ensure the text is never behind the icon
      marginBottom: 20,
    },
  });
  export default {styles, pickerSelectStyles};